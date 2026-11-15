import test from "node:test";
import assert from "node:assert/strict";
import { moverAPapelera, restaurarDePapelera } from "./papelera.js";

// Supabase falso con los filtros que usa la papelera (eq, in, is, not is null).
function dbFalsa(orders) {
  const state = structuredClone(orders);
  return {
    state,
    from() {
      const filtros = [];
      let cambios = null;
      const q = {
        select() { return q; },
        update(values) { cambios = values; return q; },
        eq(k, v) { filtros.push((r) => r[k] === v); return q; },
        in(k, vs) { filtros.push((r) => vs.includes(r[k])); return q; },
        is(k, v) { filtros.push((r) => (r[k] ?? null) === v); return q; },
        not(k, op, v) { filtros.push((r) => (r[k] ?? null) !== v); return q; },
        async maybeSingle() {
          const fila = state.find((r) => filtros.every((f) => f(r))) ?? null;
          if (fila && cambios) Object.assign(fila, cambios);
          return { data: fila && { ...fila }, error: null };
        },
      };
      return q;
    },
  };
}

const ID = "11111111-1111-1111-1111-111111111111";

test("mueve a la papelera un pedido finalizado o rechazado sin cambiar su estado", async () => {
  for (const status of ["finalizado", "rechazado"]) {
    const db = dbFalsa([{ id: ID, status, deleted_at: null }]);
    const r = await moverAPapelera(db, ID, new Date("2026-11-14T12:00:00Z"));
    assert.equal(r.status, 200);
    assert.equal(db.state[0].status, status);
    assert.equal(db.state[0].deleted_at, "2026-11-14T12:00:00.000Z");
  }
});

test("no mueve a la papelera pedidos activos", async () => {
  for (const status of ["solicitud", "pendiente_abono", "en_proceso"]) {
    const db = dbFalsa([{ id: ID, status, deleted_at: null }]);
    const r = await moverAPapelera(db, ID);
    assert.equal(r.status, 409);
    assert.equal(db.state[0].deleted_at, null);
  }
});

test("responde 404 si no existe y 409 si ya está en la papelera", async () => {
  assert.equal((await moverAPapelera(dbFalsa([]), ID)).status, 404);
  const db = dbFalsa([{ id: ID, status: "rechazado", deleted_at: "2026-11-01T00:00:00Z" }]);
  assert.equal((await moverAPapelera(db, ID)).status, 409);
  assert.equal(db.state[0].deleted_at, "2026-11-01T00:00:00Z");
});

test("restaura un pedido a su sección original", async () => {
  const db = dbFalsa([{ id: ID, status: "finalizado", deleted_at: "2026-11-01T00:00:00Z" }]);
  const r = await restaurarDePapelera(db, ID);
  assert.equal(r.status, 200);
  assert.equal(db.state[0].deleted_at, null);
  assert.equal(db.state[0].status, "finalizado");
});

test("no restaura un pedido que no está en la papelera", async () => {
  const db = dbFalsa([{ id: ID, status: "finalizado", deleted_at: null }]);
  assert.equal((await restaurarDePapelera(db, ID)).status, 409);
  assert.equal((await restaurarDePapelera(dbFalsa([]), ID)).status, 404);
});
