import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { crearSupabaseFalso } = await import("../test-utils/mockSupabase.js");
const { configurarDbPagos, restablecerDbPagos, reservarPago, completarReservaPago, eliminarReservaPago } = await import("./paymentIdempotency.js");

test("reserva atómicamente el pago y rechaza una segunda reserva del mismo tipo", async () => {
  const db = crearSupabaseFalso();
  configurarDbPagos(db);
  const first = await reservarPago({ orderId: "order-1", type: "abono", amount: 5000 });
  const second = await reservarPago({ orderId: "order-1", type: "abono", amount: 5000 });
  assert.ok(first);
  assert.equal(second, null);
  assert.equal(db.state.payments.length, 1);
  assert.equal(db.state.payments[0].status, "creando");
  restablecerDbPagos();
});

test("completa la reserva y conserva la URL para reintentos", async () => {
  const db = crearSupabaseFalso();
  configurarDbPagos(db);
  const id = await reservarPago({ orderId: "order-2", type: "saldo", amount: 2500, commissionRate: 7, commissionAmount: 200 });
  await completarReservaPago(id, { paymentUrl: "https://checkout.example/p/1", mpPaymentId: "pref-1" });
  assert.deepEqual(db.state.payments[0], {
    id,
    order_id: "order-2",
    type: "saldo",
    status: "pendiente",
    amount: 2500,
    commission_rate: 7,
    commission_amount: 200,
    payment_url: "https://checkout.example/p/1",
    mp_payment_id: "pref-1",
  });
  restablecerDbPagos();
});

test("elimina solo reservas aún en creación", async () => {
  const db = crearSupabaseFalso();
  configurarDbPagos(db);
  const id = await reservarPago({ orderId: "order-3", type: "abono", amount: 1200 });
  await eliminarReservaPago(id);
  assert.equal(db.state.payments.length, 0);
  restablecerDbPagos();
});
