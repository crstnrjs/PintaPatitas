import { Router } from "express";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { crearPreferenciaVendedor } from "../lib/mercadopago.js";
import { getMarketplaceSellerStatus, urlDePago } from "../lib/marketplaceSeller.js";
import { enviarCorreoClienteAbono, enviarCorreoClienteSaldo } from "../lib/mailer.js";
import { enviarCorreosRechazo } from "../lib/soporte.js";
import { reservarPago, completarReservaPago, eliminarReservaPago } from "./paymentIdempotency.js";

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

  // El abono se cobra 100% a la cuenta vendedora vinculada por OAuth (sin comisión de plataforma).
  // Además del token, el modo de la credencial (live/test) debe coincidir con MP_OAUTH_TEST_TOKEN.
  const vendedora = getMarketplaceSellerStatus();
  if (!vendedora.ready) {
    return res.status(503).json({
      error: vendedora.modeMismatch
        ? "La cuenta de Mercado Pago vinculada no coincide con el modo configurado (live/prueba). Vuelve a vincularla en Ajustes → Mercado Pago. No se generó ningún cobro."
        : "Falta vincular la cuenta de Mercado Pago de la artista en Ajustes → Mercado Pago. No se generó ningún cobro.",
    });
  }

  // 2. Reservar atómicamente el pago antes de llamar al proveedor.
  let reservationId;
  try {
    reservationId = await reservarPago({ orderId: id, type: "abono", amount: order.deposit_amount });
  } catch (error) {
    console.error("Error reservando el pago de abono:", error);
    return res.status(500).json({ error: "No se pudo reservar el pago de abono." });
  }
  if (!reservationId) {
    const { data: existingPayment, error } = await supabase
      .from("payments").select("status, payment_url").eq("order_id", id).eq("type", "abono").maybeSingle();
    if (error) return res.status(500).json({ error: "No se pudo consultar el pago existente." });
    if (existingPayment?.status === "pendiente" && existingPayment.payment_url) {
      return res.json({ ok: true, status: "pendiente_abono", payment_url: existingPayment.payment_url });
    }
    return res.status(409).json({ error: "Ya existe una creación de pago en curso para esta solicitud." });
  }

  let paymentUrl;
  try {
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const preferenceBody = {
      items: [{
        id: `abono-${order.id}`,
        title: `Abono solicitud #PP-${order.order_number} (${order.style || "Retrato"})`,
        description: `Abono inicial para retrato de ${order.pet_name || "mascota"}`,
        quantity: 1,
        unit_price: Number(order.deposit_amount),
        currency_id: "CLP",
      }],
      payer: { name: order.customer_name, email: order.customer_email },
      external_reference: order.id,
      metadata: { order_id: order.id, payment_type: "abono" },
      back_urls: {
        success: `${frontendUrl}/pago-exitoso`,
        failure: `${frontendUrl}/pago-fallido`,
        pending: `${frontendUrl}/pago-pendiente`,
      },
    };
    if (process.env.PUBLIC_BASE_URL) {
      preferenceBody.notification_url = `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/webhooks/mercadopago`;
    }

    const pref = await crearPreferenciaVendedor().create({ body: preferenceBody });
    paymentUrl = urlDePago(pref, vendedora.sellerMode);
    if (!paymentUrl) throw new Error("Mercado Pago no devolvió una URL de pago.");

    await completarReservaPago(reservationId, { paymentUrl });
    const { data: updatedOrder, error: errUpdate } = await supabase
      .from("orders")
      .update({ status: "pendiente_abono" })
      .eq("id", id)
      .eq("status", "solicitud")
      .select("id, order_number, status")
      .maybeSingle();
    if (errUpdate) throw errUpdate;
    if (!updatedOrder) throw new Error("La solicitud cambió de estado durante la aceptación.");

    enviarCorreoClienteAbono({ pedido: order, paymentUrl }).catch((err) => {
      console.error("Error enviando correo de abono al cliente:", err);
    });
    return res.json({ ok: true, status: updatedOrder.status, payment_url: paymentUrl });
  } catch (error) {
    // Solo borrar la reserva si aún está en creación; una URL ya guardada permite recuperar el cobro.
    try { await eliminarReservaPago(reservationId); } catch (cleanupError) {
      console.error("No se pudo liberar la reserva de pago:", cleanupError);
    }
    console.error("Error creando preferencia de abono en Mercado Pago:", error);
    return res.status(502).json({ error: "No se pudo completar la creación del pago." });
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
  const vendedora = getMarketplaceSellerStatus();
  if (!vendedora.ready) {
    return res.status(503).json({
      error: vendedora.modeMismatch
        ? "La cuenta de Mercado Pago vinculada no coincide con el modo configurado (live/prueba). Vuelve a vincularla en Ajustes → Mercado Pago. No se generó ningún cobro."
        : "El Split 1:1 todavía no está habilitado: falta vincular la cuenta vendedora por OAuth. No se generó ningún cobro.",
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

      const reservationId = await reservarPago({
        orderId: id,
        type: "saldo",
        amount: saldoAmount,
        commissionRate: comisionPorcentaje,
        commissionAmount: fee,
      });
      if (!reservationId) {
        const { data: latest, error } = await supabase.from("payments")
          .select("status, payment_url").eq("order_id", id).eq("type", "saldo").maybeSingle();
        if (error) return res.status(500).json({ error: "No se pudo consultar el pago de saldo existente." });
        if (latest?.status === "pendiente" && latest.payment_url) {
          return res.json({ ok: true, payment_url: latest.payment_url, amount: saldoAmount,
            commission_rate: comisionPorcentaje, commission_amount: fee });
        }
        return res.status(409).json({ error: "Ya existe una creación del pago de saldo en curso." });
      }

      try {
        const sellerPreference = crearPreferenciaVendedor();
        const pref = await sellerPreference.create({ body: preferenceBody });
        paymentUrl = urlDePago(pref, vendedora.sellerMode);
        if (!paymentUrl) throw new Error("Mercado Pago no devolvió una URL de pago.");
        await completarReservaPago(reservationId, { paymentUrl });
      } catch (error) {
        try { await eliminarReservaPago(reservationId); } catch (cleanupError) {
          console.error("No se pudo liberar la reserva del saldo:", cleanupError);
        }
        throw error;
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

// 3. Rechazar una solicitud: solicitud / pendiente_abono → rechazado
// Solo si todavía no hay ningún pago aprobado (con un pago, el pedido ya está aceptado y en curso).
// Guarda el motivo y avisa por correo al cliente y al buzón interno de respaldo.
router.post("/:id/reject", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!UUID.test(id)) return res.status(400).json({ error: "Identificador no válido." });

  const motivo = typeof req.body?.rejection_reason === "string"
    ? req.body.rejection_reason.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";
  if (motivo.length < 10) {
    return res.status(400).json({ error: "Escribe el motivo del rechazo (mínimo 10 caracteres)." });
  }
  if (motivo.length > 1000) {
    return res.status(400).json({ error: "El motivo es demasiado largo (máximo 1000 caracteres)." });
  }

  const { data: order, error: errOrder } = await supabase
    .from("orders").select("*").eq("id", id).maybeSingle();
  if (errOrder) {
    console.error("Error consultando solicitud:", errOrder);
    return res.status(500).json({ error: "Error consultando la solicitud en la base de datos." });
  }
  if (!order) return res.status(404).json({ error: "La solicitud no existe." });
  if (!["solicitud", "pendiente_abono"].includes(order.status)) {
    return res.status(409).json({ error: "Esta solicitud ya no se puede rechazar." });
  }

  const { data: pagosAprobados, error: errPagos } = await supabase
    .from("payments").select("id").eq("order_id", id).eq("status", "aprobado").limit(1);
  if (errPagos) {
    console.error("Error consultando pagos antes de rechazar:", errPagos);
    return res.status(500).json({ error: "No se pudieron verificar los pagos de la solicitud." });
  }
  if (pagosAprobados?.length) {
    return res.status(409).json({ error: "Esta solicitud ya tiene un pago aprobado, por lo que ya no se puede rechazar." });
  }

  // La condición sobre el estado evita pisar un cambio simultáneo (p. ej. el webhook del abono).
  const { data: actualizado, error: errUpdate } = await supabase
    .from("orders")
    .update({ status: "rechazado", rejection_reason: motivo })
    .eq("id", id)
    .in("status", ["solicitud", "pendiente_abono"])
    .select("status")
    .maybeSingle();
  if (errUpdate) {
    console.error("Error rechazando solicitud:", errUpdate);
    return res.status(500).json({ error: "No se pudo rechazar la solicitud." });
  }
  if (!actualizado) return res.status(409).json({ error: "La solicitud cambió de estado. Recarga la página." });

  // En segundo plano: un fallo de correo no deshace el rechazo.
  enviarCorreosRechazo({ pedido: order, motivo, estadoPrevio: order.status }).catch((err) => {
    console.error("Error enviando correos de rechazo:", err);
  });

  return res.json({ ok: true, status: actualizado.status, rejection_reason: motivo });
});

export default router;
