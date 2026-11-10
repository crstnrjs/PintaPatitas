import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createHmac } from "node:crypto";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { firmaValida, crearRouterWebhooks } = await import("./webhooks.js");
const { crearSupabaseFalso } = await import("../test-utils/mockSupabase.js");

const secret = "test-webhook-secret";
const paymentId = "987654321";
const requestId = "req-123";
const timestamp = "1700000000";

function makeReq({ id = paymentId, signatureId = id, sig = true, type = "payment", queryId = false } = {}) {
  const req = {
    query: queryId ? { id, type } : { "data.id": id, type },
    body: {},
    get(name) {
      if (name === "x-request-id") return requestId;
      if (name === "x-signature") {
        if (!sig) return "ts=1,v1=bad";
        const manifest = `id:${String(signatureId).toLowerCase()};request-id:${requestId};ts:${timestamp};`;
        const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
        return `ts=${timestamp},v1=${v1}`;
      }
    },
  };
  return req;
}

async function callWebhook({ payment, payments, orders, failOrderUpdate = false, request = makeReq(), getError, alertarPagoRechazado = async () => {} } = {}) {
  process.env.MP_WEBHOOK_SECRET = secret;
  const db = crearSupabaseFalso({
    payments: payments ?? [{ id: "pay-row-1", order_id: "order-1", type: "abono", amount: 1000, status: "pendiente", mp_payment_id: null }],
    orders: orders ?? [{ id: "order-1", status: "pendiente_abono" }],
    failOrderUpdate,
  });
  let calls = 0;
  const app = express();
  app.use(express.json());
  app.use("/webhooks", crearRouterWebhooks({
    db,
    webhookSecret: secret,
    alertarPagoRechazado,
    crearConsulta: () => ({ get: async () => { calls += 1; if (getError) throw getError; return payment; } }),
  }));
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const params = new URLSearchParams(request.query);
    const response = await fetch(`http://127.0.0.1:${port}/webhooks/mercadopago?${params}`, {
      method: "POST",
      headers: { "x-request-id": requestId, "x-signature": request.get("x-signature") },
    });
    return { status: response.status, body: await response.text(), db, calls };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const approved = {
  id: paymentId,
  status: "approved",
  currency_id: "CLP",
  transaction_amount: 1000,
  external_reference: "order-1",
  metadata: { payment_type: "abono" },
};

test("rechaza una firma inválida sin consultar Mercado Pago", async () => {
  process.env.MP_WEBHOOK_SECRET = secret;
  assert.equal(firmaValida(makeReq({ sig: false })), false);
  const result = await callWebhook({ payment: approved, request: makeReq({ sig: false }) });
  assert.equal(result.status, 401);
  assert.equal(result.calls, 0);
});

test("rechaza el caso sin ID de pago cubierto por la firma", async () => {
  process.env.MP_WEBHOOK_SECRET = secret;
  assert.equal(firmaValida(makeReq({ queryId: true })), false);
});

test("aprueba pago válido y transiciona la orden", async () => {
  const result = await callWebhook({ payment: approved });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.payments[0].status, "aprobado");
  assert.equal(result.db.state.payments[0].mp_payment_id, paymentId);
  assert.equal(result.db.state.orders[0].status, "en_proceso");
});

test("aprueba el pago de una reserva creada por el flujo real de cobro", async () => {
  // Regresión: antes completarReservaPago guardaba el ID de la preferencia en
  // mp_payment_id y el webhook respondía 409 a todo pago real.
  const { configurarDbPagos, restablecerDbPagos, reservarPago, completarReservaPago } = await import("./paymentIdempotency.js");
  const reservaDb = crearSupabaseFalso();
  configurarDbPagos(reservaDb);
  try {
    const id = await reservarPago({ orderId: "order-1", type: "abono", amount: 1000 });
    await completarReservaPago(id, { paymentUrl: "https://checkout.example/p/1" });
  } finally {
    restablecerDbPagos();
  }
  const result = await callWebhook({ payment: approved, payments: reservaDb.state.payments.map((p) => ({ ...p })) });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.payments[0].status, "aprobado");
  assert.equal(result.db.state.payments[0].mp_payment_id, paymentId);
  assert.equal(result.db.state.orders[0].status, "en_proceso");
});

test("rechaza discrepancia de ID firmado", async () => {
  const result = await callWebhook({ payment: approved, request: makeReq({ id: paymentId, signatureId: "otro-id" }) });
  assert.equal(result.status, 401);
  assert.equal(result.calls, 0);
});

test("responde error ante fallo al consultar Mercado Pago", async () => {
  const result = await callWebhook({ payment: approved, getError: new Error("MP no disponible") });
  assert.equal(result.status, 500);
  assert.equal(result.db.state.payments[0].status, "pendiente");
});

test("rechaza moneda o monto diferentes sin aprobar el pago", async (t) => {
  await t.test("moneda", async () => {
    const result = await callWebhook({ payment: { ...approved, currency_id: "USD" } });
    assert.equal(result.status, 422);
    assert.equal(result.db.state.payments[0].status, "pendiente");
  });
  await t.test("monto", async () => {
    const result = await callWebhook({ payment: { ...approved, transaction_amount: 999 } });
    assert.equal(result.status, 422);
    assert.equal(result.db.state.payments[0].status, "pendiente");
  });
});

test("webhook duplicado es idempotente", async () => {
  const payments = [{ id: "pay-row-1", order_id: "order-1", type: "abono", amount: 1000, status: "aprobado", mp_payment_id: paymentId }];
  const result = await callWebhook({ payment: approved, payments, orders: [{ id: "order-1", status: "en_proceso" }] });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.payments[0].status, "aprobado");
});

test("reintento actualiza la orden si falló en una notificación previa", async () => {
  const payments = [{ id: "pay-row-1", order_id: "order-1", type: "abono", amount: 1000, status: "aprobado", mp_payment_id: paymentId }];
  const result = await callWebhook({ payment: approved, payments, failOrderUpdate: true });
  assert.equal(result.status, 500);
  assert.equal(result.db.state.payments[0].status, "aprobado");
});

test("pago aprobado de un pedido rechazado: avisa, no cambia el pedido y responde 200", async () => {
  const alertas = [];
  const orders = [{ id: "order-1", status: "rechazado", order_number: 7, customer_name: "Ana", customer_email: "ana@example.com" }];
  const result = await callWebhook({ payment: approved, orders, alertarPagoRechazado: async (datos) => { alertas.push(datos); } });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.orders[0].status, "rechazado");
  assert.equal(result.db.state.payments[0].status, "aprobado");
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].pedido.order_number, 7);
  assert.equal(alertas[0].tipoPago, "abono");
  assert.equal(alertas[0].monto, 1000);
  assert.equal(alertas[0].mpPaymentId, paymentId);
});

test("si falla el aviso por correo, el webhook igual responde 200", async () => {
  const orders = [{ id: "order-1", status: "rechazado", order_number: 7, customer_name: "Ana", customer_email: "ana@example.com" }];
  const result = await callWebhook({ payment: approved, orders, alertarPagoRechazado: async () => { throw new Error("SMTP caído"); } });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.payments[0].status, "aprobado");
});

test("un pago normal no dispara la alerta de pedido rechazado", async () => {
  const alertas = [];
  const result = await callWebhook({ payment: approved, alertarPagoRechazado: async (d) => { alertas.push(d); } });
  assert.equal(result.status, 200);
  assert.equal(result.db.state.orders[0].status, "en_proceso");
  assert.equal(alertas.length, 0);
});
