import { Router } from "express";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  crearPreferenciaPlataforma,
  crearPreferenciaVendedor,
} from "../lib/mercadopago.js";
import { marketplaceSellerIsConnected } from "../lib/marketplaceCredentials.js";
import { enviarCorreoClienteAbono, enviarCorreoClienteSaldo } from "../lib/mailer.js";

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1. Aceptar una solicitud: solicitud → pendiente_abono
// Crea la preferencia de pago de abono en Mercado Pago, guarda en payments y avisa al cliente por correo
router.post("/:id/accept", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID.test(id)) return res.status(400).json({ error: "Identificador no válido." });

  // 1. Obtener los datos del pedido que esté en estado 'solicitud'
  const { data: order, error: errOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("status", "solicitud")
    .maybeSingle();

  if (errOrder) {
    console.error("Error consultando solicitud:", errOrder);
    return res.status(500).json({ error: "Error consultando la solicitud en la base de datos." });
  }

  if (!order) {
    return res.status(409).json({ error: "Esta solicitud ya fue procesada o no existe." });
  }

  // 2. Verificar si ya existe un pago de abono registrado previamente (evitar duplicar si se reintenta)
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .eq("type", "abono")
    .maybeSingle();

  let paymentUrl = existingPayment?.payment_url;

  if (!paymentUrl) {
    // 3. Crear la preferencia de pago en Mercado Pago
    try {
      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
      const preferenceBody = {
        items: [
          {
            id: `abono-${order.id}`,
            title: `Abono solicitud #PP-${order.order_number} (${order.style || "Retrato"})`,
            description: `Abono inicial para retrato de ${order.pet_name || "mascota"}`,
            quantity: 1,
            unit_price: Number(order.deposit_amount),
            currency_id: "CLP",
          },
        ],
        payer: {
          name: order.customer_name,
          email: order.customer_email,
        },
        external_reference: order.id,
        metadata: {
          order_id: order.id,
          payment_type: "abono",
        },
        back_urls: {
          success: `${frontendUrl}/pago-exitoso`,
          failure: `${frontendUrl}/pago-fallido`,
          pending: `${frontendUrl}/pago-pendiente`,
        },
      };

      if (process.env.PUBLIC_BASE_URL) {
        preferenceBody.notification_url = `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/webhooks/mercadopago`;
      }

      const platformPreference = crearPreferenciaPlataforma();
      const pref = await platformPreference.create({ body: preferenceBody });
      // Se utiliza sandbox_init_point para pruebas locales o init_point en producción
      paymentUrl = pref.sandbox_init_point || pref.init_point;

      // 4. Guardar registro en la tabla payments
      const { error: errPayment } = await supabase.from("payments").insert({
        order_id: order.id,
        type: "abono",
        status: "pendiente",
        amount: order.deposit_amount,
        payment_url: paymentUrl,
      });

      if (errPayment) {
        console.error("Error guardando pago en BD:", errPayment);
        return res.status(500).json({ error: "No se pudo registrar el pago de abono." });
      }
    } catch (errMP) {
      console.error("Error creando preferencia de abono en Mercado Pago:", {
        name: errMP?.name,
        status: errMP?.status ?? null,
        error: errMP?.error ?? null,
        message: errMP?.message ?? "Error desconocido",
        causes: Array.isArray(errMP?.causes)
          ? errMP.causes.map((cause) => ({
              code: cause.code ?? null,
              description: cause.description ?? null,
            }))
          : undefined,
      });
      return res.status(502).json({ error: "Error al comunicarse con Mercado Pago." });
    }
  }

  // 5. Actualizar el estado del pedido a 'pendiente_abono'
  const { data: updatedOrder, error: errUpdate } = await supabase
    .from("orders")
    .update({ status: "pendiente_abono" })
    .eq("id", id)
    .select("id, order_number, status")
    .single();

  if (errUpdate) {
    console.error("Error actualizando estado del pedido:", errUpdate);
    return res.status(500).json({ error: "No se pudo actualizar el estado de la solicitud." });
  }

  // 6. Enviar correo al cliente con el enlace de pago (en segundo plano)
  enviarCorreoClienteAbono({ pedido: order, paymentUrl }).catch((err) => {
    console.error("Error enviando correo de abono al cliente:", err);
  });

  res.json({
    ok: true,
    status: updatedOrder.status,
    payment_url: paymentUrl,
  });
});

// 2. Cobrar el saldo: en_proceso (con pintura terminada)
// Crea el link de pago con split 1:1 (comisión de plataforma a Christian y neto a la dueña)
router.post("/:id/request-balance", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID.test(id)) return res.status(400).json({ error: "Identificador no válido." });

  // 1. Obtener pedido (debe estar en 'en_proceso')
  const { data: order, error: errOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("status", "en_proceso")
    .maybeSingle();

  if (errOrder) {
    console.error("Error consultando pedido:", errOrder);
    return res.status(500).json({ error: "Error consultando el pedido en la base de datos." });
  }

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado o no está en proceso." });
  }

  if (!order.painting_done_at) {
    return res.status(409).json({
      error: "Primero marca la pintura como terminada y vuelve a solicitar el cobro del saldo.",
    });
  }

  // 2. Calcular monto pendiente restando abonos ya aprobados
  const { data: payments, error: errPayments } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id);

  if (errPayments) {
    console.error("Error consultando pagos:", errPayments);
    return res.status(500).json({ error: "Error al verificar pagos previos." });
  }

  const abonoAprobado = (payments || [])
    .filter((p) => p.type === "abono" && p.status === "aprobado")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const saldoAmount = Math.max(Number(order.total_amount) - abonoAprobado, 0);

  if (saldoAmount <= 0) {
    return res.status(400).json({ error: "El pedido ya no tiene saldo pendiente por pagar." });
  }

  // Split 1:1 requiere el token OAuth del vendedor vinculado, no el token de la plataforma.
  if (!marketplaceSellerIsConnected()) {
    return res.status(503).json({
      error:
        "El Split 1:1 todavía no está habilitado: falta vincular la cuenta vendedora por OAuth. No se generó ningún cobro.",
    });
  }

  // Split 1:1 — comisión de plataforma sobre el valor total de la obra, cobrada del saldo.
  const comisionPorcentaje = Number(process.env.COMISION_PORCENTAJE || 7);
  if (!Number.isFinite(comisionPorcentaje) || comisionPorcentaje < 0 || comisionPorcentaje > 100) {
    return res.status(500).json({ error: "COMISION_PORCENTAJE debe ser un número entre 0 y 100." });
  }
  const comisionTotal = Math.round(Number(order.total_amount) * (comisionPorcentaje / 100));
  const fee = Math.min(comisionTotal, saldoAmount);

  // 3. Verificar si ya existe un link de saldo previo y si fue creado con el split esperado.
  const existingSaldo = (payments || []).find((p) => p.type === "saldo");
  if (existingSaldo?.status === "aprobado") {
    return res.status(409).json({ error: "El saldo de este pedido ya figura como pagado." });
  }
  if (
    existingSaldo &&
    (Number(existingSaldo.commission_rate) !== comisionPorcentaje ||
      Number(existingSaldo.commission_amount) !== fee)
  ) {
    return res.status(409).json({
      error:
        "Ya existe un link de saldo sin el split esperado o con otra comisión. No creé otro link para evitar cobros duplicados; revisa/elimina el pago pendiente anterior antes de reintentar.",
    });
  }
  let paymentUrl = existingSaldo?.payment_url;

  if (!paymentUrl) {
    try {
      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
      const preferenceBody = {
        items: [
          {
            id: `saldo-${order.id}`,
            title: `Saldo final pedido #PP-${order.order_number}`,
            description: `Saldo por finalización de retrato de ${order.pet_name || "mascota"}`,
            quantity: 1,
            unit_price: Number(saldoAmount),
            currency_id: "CLP",
          },
        ],
        payer: {
          name: order.customer_name,
          email: order.customer_email,
        },
        external_reference: order.id,
        metadata: {
          order_id: order.id,
          payment_type: "saldo",
        },
        marketplace_fee: fee > 0 ? fee : undefined,
        back_urls: {
          success: `${frontendUrl}/pago-exitoso`,
          failure: `${frontendUrl}/pago-fallido`,
          pending: `${frontendUrl}/pago-pendiente`,
        },
      };

      if (process.env.PUBLIC_BASE_URL) {
        preferenceBody.notification_url = `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/webhooks/mercadopago`;
      }

      const sellerPreference = crearPreferenciaVendedor();
      const pref = await sellerPreference.create({ body: preferenceBody });
      paymentUrl = pref.sandbox_init_point || pref.init_point;

      // Guardar registro en payments
      const { error: errInsert } = await supabase.from("payments").insert({
        order_id: order.id,
        type: "saldo",
        status: "pendiente",
        amount: saldoAmount,
        payment_url: paymentUrl,
        commission_rate: comisionPorcentaje,
        commission_amount: fee,
      });

      if (errInsert) {
        console.error("Error guardando pago de saldo en BD:", errInsert);
        return res.status(500).json({ error: "No se pudo registrar el cobro del saldo." });
      }
    } catch (errMP) {
      console.error("Error creando preferencia de saldo en Mercado Pago:", errMP);
      return res.status(502).json({ error: "Error al comunicarse con Mercado Pago." });
    }
  }

  // Enviar correo al cliente con el enlace de pago de saldo
  enviarCorreoClienteSaldo({ pedido: order, paymentUrl, saldoAmount }).catch((err) => {
    console.error("Error enviando correo de saldo al cliente:", err);
  });

  res.json({
    ok: true,
    payment_url: paymentUrl,
    amount: saldoAmount,
    commission_rate: comisionPorcentaje,
    commission_amount: fee,
  });
});

export default router;
