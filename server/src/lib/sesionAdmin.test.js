import test from "node:test";
import assert from "node:assert/strict";
import { DURACION_MAXIMA_SESION_MS, horaIngreso, sesionExpirada } from "./sesionAdmin.js";

function token(payload) {
  const parte = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${parte({ alg: "HS256" })}.${parte(payload)}.firma`;
}

const ahora = Date.UTC(2026, 10, 7, 12, 0, 0);
const segundos = (ms) => Math.floor(ms / 1000);

test("lee la hora de ingreso desde el claim amr", () => {
  const t = token({ amr: [{ method: "password", timestamp: segundos(ahora - 60_000) }] });
  assert.equal(horaIngreso(t), segundos(ahora - 60_000) * 1000);
});

test("acepta una sesión iniciada hace menos de la duración máxima", () => {
  const t = token({ amr: [{ method: "password", timestamp: segundos(ahora - 60 * 60 * 1000) }] });
  assert.equal(sesionExpirada(t, ahora), false);
});

test("rechaza una sesión iniciada hace más de la duración máxima aunque el token se haya renovado", () => {
  const ingreso = ahora - DURACION_MAXIMA_SESION_MS - 60_000;
  const t = token({ iat: segundos(ahora - 60_000), amr: [{ method: "password", timestamp: segundos(ingreso) }] });
  assert.equal(sesionExpirada(t, ahora), true);
});

test("falla cerrado si el token no trae amr o está mal formado", () => {
  assert.equal(sesionExpirada(token({ iat: segundos(ahora) }), ahora), true);
  assert.equal(sesionExpirada("no-es-un-jwt", ahora), true);
});
