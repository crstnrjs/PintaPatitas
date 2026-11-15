import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { crearRouterCuadros } = await import("./cuadros.js");

const ID = "11111111-2222-3333-4444-555555555555";

// Supabase mínimo: update(...).eq(...)...select().maybeSingle() sobre una sola venta.
function dbFalsa(venta) {
  const llamadas = [];
  return {
    llamadas,
    from() {
      const filtros = {};
      let cambios = null;
      const q = {
        update(c) { cambios = c; return q; },
        eq(campo, valor) { filtros[campo] = valor; return q; },
        select() { return q; },
        async maybeSingle() {
          llamadas.push({ cambios, filtros });
          const coincide = venta && Object.entries(filtros).every(([k, v]) => venta[k] === v);
          if (!coincide) return { data: null, error: null };
          Object.assign(venta, cambios);
          return { data: { ...venta }, error: null };
        },
      };
      return q;
    },
  };
}

async function llamar(router, body, id = ID) {
  const app = express();
  app.use(express.json());
  app.use("/api/cuadros", router);
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/cuadros/ventas/${id}/enviado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
  } finally {
    server.close();
  }
}

const admin = (_req, _res, next) => next();

test("marcar enviado guarda el seguimiento y avisa al comprador", async () => {
  const venta = { id: ID, numero: 7, estado: "aprobado", estado_envio: "por_enviar" };
  const avisos = [];
  const router = crearRouterCuadros({ db: dbFalsa(venta), admin, avisarDespacho: async (v) => avisos.push(v) });

  const { status, json } = await llamar(router, { seguimiento: "  ST123456 " });
  assert.equal(status, 200);
  assert.equal(json.correo_enviado, true);
  assert.equal(venta.estado_envio, "enviado");
  assert.equal(venta.seguimiento_starken, "ST123456");
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].seguimiento_starken, "ST123456");
});

test("no marca ni avisa dos veces una venta ya enviada", async () => {
  const venta = { id: ID, numero: 7, estado: "aprobado", estado_envio: "enviado" };
  const avisos = [];
  const router = crearRouterCuadros({ db: dbFalsa(venta), admin, avisarDespacho: async (v) => avisos.push(v) });

  const { status } = await llamar(router, { seguimiento: "X" });
  assert.equal(status, 409);
  assert.equal(avisos.length, 0);
});

test("si falla el correo, la venta queda enviada y se informa al panel", async () => {
  const venta = { id: ID, numero: 7, estado: "aprobado", estado_envio: "por_enviar" };
  const router = crearRouterCuadros({
    db: dbFalsa(venta),
    admin,
    avisarDespacho: async () => { throw new Error("SMTP caído"); },
  });

  const { status, json } = await llamar(router, {});
  assert.equal(status, 200);
  assert.equal(json.correo_enviado, false);
  assert.equal(venta.estado_envio, "enviado");
  assert.equal(venta.seguimiento_starken, null);
});

test("rechaza identificadores no válidos", async () => {
  const router = crearRouterCuadros({ db: dbFalsa(null), admin, avisarDespacho: async () => {} });
  const { status } = await llamar(router, {}, "abc");
  assert.equal(status, 400);
});
