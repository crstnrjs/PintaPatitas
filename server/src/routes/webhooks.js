import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { crearConsultaPagoVendedor } from "../lib/mercadopago.js";
import { crearRepoVentas, procesarPagoCuadro } from "../lib/ventasCuadros.js";
import { notificarVentaCuadro } from "../lib/correosCuadros.js";
import { enviarAlertaPagoRechazado } from "../lib/soporte.js";

export function firmaValida(req, secretOverride = process.env.MP_WEBHOOK_SECRET) {
  const secret = secretOverride;
  const signature = req.get("x-signature");
  const requestId = req.get("x-request-id");
  const dataId = String(req.query["data.id"] || req.body?.data?.id || "").toLowerCase();
  if (!secret || !signature || !requestId || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const index = part.indexOf("=");
      return index < 0 ? ["", ""] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const received = Buffer.from(parts.v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

const dineroCoincide = (a, b) => Math.round(Number(a) * 100) === Math.round(Number(b) * 100);

export function crearRouterWebhooks({
  db = supabase,
  crearConsulta = crearConsultaPagoVendedor,
  webhookSecret,
  repoCuadros,
  notificarCuadro = notificarVentaCuadro,
  alertarPagoRechazado = enviarAlertaPagoRechazado,
} = {}) {
  const router = Router();

  // Si el abono se aprobó pero el pedido ya estaba rechazado (el cliente pagó con un enlace enviado
  // antes), el pedido no cambia de estado: se avisa al buzón interno para devolver el dinero.
  // Nunca lanza: un fallo aquí no debe alterar la respuesta al webhook ni el cobro.
  async function avisarSiPedidoRechazado({ orderId, paymentType, paymentInfo, paymentId }) {
    try {
      const { data: pedido, error } = await db
        .from("orders")
        .select("id, order_number, status, customer_name, customer_email")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (pedido?.status !== "rechazado") return;
      console.warn(`[Webhook MP] Pago ${paymentId} aprobado para el pedido rechazado ${orderId}: hay que devolverlo.`);
      alertarPagoRechazado({
        pedido,
        tipoPago: paymentType,
        monto: paymentInfo.transaction_amount,
        mpPaymentId: String(paymentId),
      }).catch((err) => console.error("[Webhook MP] No se pudo enviar la alerta de pago a pedido rechazado:", err));
    } catch (err) {
      console.error("[Webhook MP] No se pudo revisar si el pedido estaba rechazado:", err);
    }
  }

  // Webhook de Mercado Pago: recibe notificaciones de eventos (ej. pago aprobado)
  router.post("/mercadopago", async (req, res) => {
    if (!firmaValida(req, webhookSecret ?? process.env.MP_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: "Firma de webhook no válida." });
    }

    try {
    // Mercado Pago envía el ID de pago en query params o body
    const paymentId = req.query["data.id"] || req.body?.data?.id || req.query.id;
    const type = req.query.type || req.body?.type || req.body?.topic;
    const signedPaymentId = req.query["data.id"] || req.body?.data?.id;
    if (String(paymentId) !== String(signedPaymentId)) {
      return res.status(422).json({ error: "El identificador firmado no coincide con el pago." });
    }

    if (!paymentId) return res.status(400).json({ error: "Falta el identificador del pago." });

    // Solo nos interesa procesar eventos de pagos
    if (type && type !== "payment") return res.status(200).send("Evento ignorado.");

    console.log(`[Webhook MP] Recibida notificación de pago ID: ${paymentId}`);

    // Consultar el estado oficial del pago en la API de Mercado Pago
    const paymentClient = crearConsulta();
    const paymentInfo = await paymentClient.get({ id: paymentId });
    if (!paymentInfo) return res.status(404).json({ error: "Pago no encontrado en Mercado Pago." });

    const status = paymentInfo.status; // 'approved', 'rejected', 'in_process', etc.
    const orderId = paymentInfo.external_reference || paymentInfo.metadata?.order_id;
    const paymentType = paymentInfo.metadata?.payment_type; // 'abono' o 'saldo'
    if (paymentInfo.currency_id !== "CLP") {
      return res.status(422).json({ error: "La moneda del pago no coincide." });
    }

    // Venta de cuadros listos: tiene su propia tabla y lógica (lib/ventasCuadros.js).
    if (paymentType === "cuadro") {
      const resultado = await procesarPagoCuadro({
        paymentInfo,
        paymentId,
        repo: repoCuadros ?? crearRepoVentas(db),
        notificar: notificarCuadro,
      });
      console.log(`[Webhook MP] Pago de cuadro ${paymentId}: status=${status} → ${resultado.status}`);
      return typeof resultado.body === "string"
        ? res.status(resultado.status).send(resultado.body)
        : res.status(resultado.status).json(resultado.body);
    }

    console.log(`[Webhook MP] Pago ${paymentId}: status=${status}, orderId=${orderId}, type=${paymentType}`);

    if (!orderId) {
      return res.status(422).json({ error: "El pago no está asociado a una orden." });
    }

    if (status === "approved") {
      if (!["abono", "saldo"].includes(paymentType)) {
        return res.status(422).json({ error: "Tipo de pago no válido." });
      }

      const { data: expectedPayment, error: lookupError } = await db
        .from("payments")
        .select("id, order_id, type, amount, status, mp_payment_id")
        .eq("order_id", orderId)
        .eq("type", paymentType)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!expectedPayment) {
        return res.status(404).json({ error: "No existe un pago esperado para esta orden." });
      }
      if (!dineroCoincide(paymentInfo.transaction_amount, expectedPayment.amount)) {
        return res.status(422).json({ error: "El monto del pago no coincide con el monto esperado." });
      }
      if (expectedPayment.mp_payment_id && expectedPayment.mp_payment_id !== String(paymentId)) {
        return res.status(409).json({ error: "La orden ya está asociada a otro pago de Mercado Pago." });
      }
      if (expectedPayment.status !== "aprobado") {
        // Actualización condicional: un evento duplicado no puede volver a procesar el pago.
        const { data: updatedPayment, error: errPayment } = await db.from("payments").update({
          status: "aprobado",
          mp_payment_id: String(paymentId),
        }).eq("id", expectedPayment.id).eq("status", "pendiente").select().maybeSingle();

        if (errPayment) throw errPayment;
        if (!updatedPayment) {
          const { data: currentPayment, error: currentError } = await db
            .from("payments")
            .select("status, mp_payment_id")
            .eq("id", expectedPayment.id)
            .maybeSingle();
          if (currentError) throw currentError;
          if (currentPayment?.status !== "aprobado" || currentPayment.mp_payment_id !== String(paymentId)) {
            return res.status(409).json({ error: "El pago cambió de estado durante el procesamiento." });
          }
        }
      }

      // Reintentar siempre la transición del pedido: un fallo previo no debe dejarlo atascado.
      if (paymentType === "abono") {
        const { data: transicionado, error: errOrder } = await db
          .from("orders")
          .update({ status: "en_proceso" })
          .eq("id", orderId)
          .eq("status", "pendiente_abono")
          .select("id")
          .maybeSingle();

        if (errOrder) throw errOrder;
        if (transicionado) {
          console.log(`[Webhook MP] ¡Éxito! Pedido ${orderId} actualizado a 'en_proceso'`);
        } else {
          await avisarSiPedidoRechazado({ orderId, paymentType, paymentInfo, paymentId });
        }
      }
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Webhook MP] Error procesando notificación:", error);
    return res.status(500).json({ error: "Error procesando la notificación." });
  }
  });

  return router;
}

export default crearRouterWebhooks();
