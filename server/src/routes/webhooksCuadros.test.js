import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createHmac } from "node:crypto";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { crearRouterWebhooks } = await import("./webhooks.js");

const secret = "test-webhook-secret";

async function enviar({ payment, repoCuadros, notificarCuadro }) {
  const db = { from: () => { throw new Error("el flujo de cuadros no debe tocar orders/payments"); } };
  const app = express();
  app.use(express.json());
  app.use("/webhooks", crearRouterWebhooks({
    db,
    webhookSecret: secret,
    repoCuadros,
    notificarCuadro,
    crearConsulta: () => ({ get: async () => payment }),
  }));
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const ts = "1700000000";
    const v1 = createHmac("sha256", secret).update(`id:${payment.id};request-id:req-1;ts:${ts};`).digest("hex");
    const res = await fetch(`http://127.0.0.1:${port}/webhooks/mercadopago?data.id=${payment.id}&type=payment`, {
      method: "POST",
      headers: { "x-request-id": "req-1", "x-signature": `ts=${ts},v1=${v1}` },
    });
    return { status: res.status, body: await res.text() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("el webhook deriva los pagos de cuadros a su propia lógica", async () => {
  const venta = { id: "v1", numero: 3, cuadro_id: "c1", monto: 45000, estado: "pendiente", mp_payment_id: null };
  const cambios = [];
  const avisos = [];
  const repoCuadros = {
    obtenerVenta: async () => ({ ...venta }),
    aprobarVenta: async (id, mp) => { cambios.push(["venta", id, mp]); return "aprobada"; },
    marcarCuadroVendido: async (id) => { cambios.push(["cuadro", id]); return true; },
  };

  const r = await enviar({
    payment: { id: "555", status: "approved", currency_id: "CLP", transaction_amount: 45000, external_reference: "v1", metadata: { payment_type: "cuadro" } },
    repoCuadros,
    notificarCuadro: (a) => avisos.push(a.tipo),
  });

  assert.equal(r.status, 200);
  assert.deepEqual(cambios, [["venta", "v1", "555"], ["cuadro", "c1"]]);
  assert.deepEqual(avisos, ["venta"]);
});

test("el webhook rechaza un pago de cuadro en otra moneda antes de aprobarlo", async () => {
  const r = await enviar({
    payment: { id: "556", status: "approved", currency_id: "USD", transaction_amount: 45000, external_reference: "v1", metadata: { payment_type: "cuadro" } },
    repoCuadros: { obtenerVenta: async () => { throw new Error("no debería consultar"); } },
  });
  assert.equal(r.status, 422);
});
