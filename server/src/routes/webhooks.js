import { Router } from "express";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { crearConsultaPagoVendedor } from "../lib/mercadopago.js";

const router = Router();

// Webhook de Mercado Pago: recibe notificaciones de eventos (ej. pago aprobado)
router.post("/mercadopago", async (req, res) => {
  // Confirmar recepción inmediatamente (código 200) para que Mercado Pago no reintente agresivamente
  res.status(200).send("OK");

  try {
    // Mercado Pago envía el ID de pago en query params o body
    const paymentId = req.query["data.id"] || req.body?.data?.id || req.query.id;
    const type = req.query.type || req.body?.type || req.body?.topic;

    if (!paymentId) return;

    // Solo nos interesa procesar eventos de pagos
    if (type && type !== "payment") return;

    console.log(`[Webhook MP] Recibida notificación de pago ID: ${paymentId}`);

    // Consultar el estado oficial del pago en la API de Mercado Pago
    const paymentClient = crearConsultaPagoVendedor();
    const paymentInfo = await paymentClient.get({ id: paymentId });
    if (!paymentInfo) return;

    const status = paymentInfo.status; // 'approved', 'rejected', 'in_process', etc.
    const orderId = paymentInfo.external_reference || paymentInfo.metadata?.order_id;
    const paymentType = paymentInfo.metadata?.payment_type; // 'abono' o 'saldo'

    console.log(`[Webhook MP] Pago ${paymentId}: status=${status}, orderId=${orderId}, type=${paymentType}`);

    if (!orderId) {
      console.warn(`[Webhook MP] Advertencia: El pago ${paymentId} no tiene asociado un orderId`);
      return;
    }

    if (status === "approved") {
      // 1. Actualizar el estado en la tabla payments
      let query = supabase.from("payments").update({
        status: "aprobado",
        mp_payment_id: String(paymentId),
      }).eq("order_id", orderId);

      if (paymentType) {
        query = query.eq("type", paymentType);
      } else {
        query = query.eq("status", "pendiente");
      }

      const { data: updatedPayment, error: errPayment } = await query.select().maybeSingle();

      if (errPayment) {
        console.error("[Webhook MP] Error actualizando pago en BD:", errPayment);
      }

      // 2. Si el pago corresponde al abono, mover la orden de 'pendiente_abono' a 'en_proceso'
      if (paymentType === "abono" || updatedPayment?.type === "abono") {
        const { error: errOrder } = await supabase
          .from("orders")
          .update({ status: "en_proceso" })
          .eq("id", orderId)
          .eq("status", "pendiente_abono");

        if (errOrder) {
          console.error("[Webhook MP] Error actualizando pedido a 'en_proceso':", errOrder);
        } else {
          console.log(`[Webhook MP] ¡Éxito! Pedido ${orderId} actualizado a 'en_proceso'`);
        }
      }
    }
  } catch (error) {
    console.error("[Webhook MP] Error procesando notificación:", error);
  }
});

export default router;
