import test from "node:test";
import assert from "node:assert/strict";
import { renovarTokenSiHaceFalta, MARGEN_RENOVACION_MS, esErrorDefinitivo } from "./renovacionTokenMP.js";
import { refreshMarketplaceAccessToken } from "./marketplaceOAuth.js";
import { enviarAlertaTokenMercadoPago } from "./soporte.js";

const DIA = 24 * 60 * 60 * 1000;
const AHORA = Date.UTC(2026, 10, 10);

const credencial = (diasRestantes, extra = {}) => ({
  access_token: "APP_USR-viejo",
  refresh_token: "TG-viejo",
  live_mode: true,
  user_id: 123,
  public_key: "APP_USR-pk",
  expires_at: AHORA + diasRestantes * DIA,
  ...extra,
});

function espias(actual, refrescar) {
  const guardados = [];
  const avisos = [];
  return {
    guardados,
    avisos,
    opciones: {
      ahora: AHORA,
      obtener: () => actual,
      refrescar,
      guardar: async (c) => guardados.push(c),
      avisar: async (a) => avisos.push(a),
    },
  };
}

const errorMP = (status, code) => Object.assign(new Error(code), { status, code });

test("no hace nada sin credencial", async () => {
  const { opciones, guardados } = espias(null, async () => assert.fail("no debe llamar a Mercado Pago"));
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "sin-credencial");
  assert.equal(guardados.length, 0);
});

test("no renueva si faltan más de 30 días", async () => {
  const { opciones, guardados } = espias(credencial(60), async () => assert.fail("no debe llamar a Mercado Pago"));
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "vigente");
  assert.equal(guardados.length, 0);
});

test("renueva cuando faltan menos de 30 días y guarda ambos tokens nuevos", async () => {
  let recibido;
  const { opciones, guardados, avisos } = espias(credencial(10), async (rt) => {
    recibido = rt;
    return { access_token: "APP_USR-nuevo", refresh_token: "TG-nuevo", live_mode: true, expires_in: 15552000 };
  });
  const r = await renovarTokenSiHaceFalta(opciones);
  assert.equal(r.resultado, "renovada");
  assert.equal(recibido, "TG-viejo");
  assert.equal(guardados.length, 1);
  assert.equal(guardados[0].access_token, "APP_USR-nuevo");
  assert.equal(guardados[0].refresh_token, "TG-nuevo");
  assert.equal(guardados[0].expires_at, AHORA + 15552000 * 1000);
  assert.equal(guardados[0].user_id, 123);
  assert.equal(guardados[0].public_key, "APP_USR-pk");
  assert.equal(guardados[0].renovado_en, AHORA);
  assert.equal(avisos.length, 0);
});

test("renueva si no se conoce la fecha de vencimiento", async () => {
  const { opciones, guardados } = espias(credencial(0, { expires_at: undefined }), async () => ({
    access_token: "a", refresh_token: "b", live_mode: true, expires_in: 100,
  }));
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "renovada");
  assert.equal(guardados.length, 1);
});

test("permiso revocado: no guarda y avisa aunque falten semanas", async () => {
  const { opciones, guardados, avisos } = espias(credencial(20), async () => {
    throw errorMP(400, "invalid_grant");
  });
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "fallo");
  assert.equal(guardados.length, 0);
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].definitivo, true);
});

test("fallo temporal con tiempo de sobra: reintenta mañana sin avisar", async () => {
  const { opciones, avisos } = espias(credencial(20), async () => {
    throw errorMP(503, null);
  });
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "fallo");
  assert.equal(avisos.length, 0);
});

test("fallo temporal con menos de 7 días: avisa", async () => {
  const { opciones, avisos } = espias(credencial(5), async () => {
    throw errorMP(503, null);
  });
  await renovarTokenSiHaceFalta(opciones);
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].definitivo, false);
});

test("rechaza una credencial renovada de otro modo (live/prueba)", async () => {
  const { opciones, guardados } = espias(credencial(10), async () => ({
    access_token: "TEST-x", refresh_token: "TG-x", live_mode: false, expires_in: 100,
  }));
  assert.equal((await renovarTokenSiHaceFalta(opciones)).resultado, "fallo");
  assert.equal(guardados.length, 0);
});

test("si guardar en Supabase falla, informa fallo sin lanzar", async () => {
  const { opciones } = espias(credencial(10), async () => ({
    access_token: "a", refresh_token: "b", live_mode: true, expires_in: 100,
  }));
  opciones.guardar = async () => {
    throw new Error("Supabase caído");
  };
  const r = await renovarTokenSiHaceFalta(opciones);
  assert.equal(r.resultado, "fallo");
  assert.match(r.error, /Supabase/);
});

test("el margen de renovación es de 30 días", () => {
  assert.equal(MARGEN_RENOVACION_MS, 30 * DIA);
  assert.equal(esErrorDefinitivo(errorMP(400, "invalid_grant")), true);
  assert.equal(esErrorDefinitivo(errorMP(500, null)), false);
});

test("pide a Mercado Pago grant_type=refresh_token con las credenciales de la app", async () => {
  const antes = { id: process.env.MP_CLIENT_ID, secret: process.env.MP_CLIENT_SECRET };
  process.env.MP_CLIENT_ID = "123";
  process.env.MP_CLIENT_SECRET = "secreto";
  let cuerpo;
  const r = await refreshMarketplaceAccessToken("TG-viejo", {
    fetchImpl: async (_url, init) => {
      cuerpo = new URLSearchParams(init.body);
      return { ok: true, json: async () => ({ access_token: "nuevo" }) };
    },
  });
  assert.equal(r.access_token, "nuevo");
  assert.equal(cuerpo.get("grant_type"), "refresh_token");
  assert.equal(cuerpo.get("refresh_token"), "TG-viejo");
  assert.equal(cuerpo.get("client_id"), "123");

  await assert.rejects(
    refreshMarketplaceAccessToken("TG-viejo", {
      fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: "invalid_grant", message: "invalid_grant" }) }),
    }),
    (e) => e.status === 400 && e.code === "invalid_grant",
  );
  process.env.MP_CLIENT_ID = antes.id ?? "";
  process.env.MP_CLIENT_SECRET = antes.secret ?? "";
  if (antes.id === undefined) delete process.env.MP_CLIENT_ID;
  if (antes.secret === undefined) delete process.env.MP_CLIENT_SECRET;
});

test("el aviso va al buzón interno con la fecha y qué hacer", async () => {
  const enviados = [];
  await enviarAlertaTokenMercadoPago(
    { venceEn: Date.UTC(2026, 11, 1, 12), definitivo: true, motivo: "invalid_grant" },
    { destino: "interno@pintapatitas.com", enviar: async (c) => enviados.push(c) },
  );
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].to, "interno@pintapatitas.com");
  assert.match(enviados[0].subject, /Mercado Pago/);
  assert.match(enviados[0].text, /volver a vincular/);
  assert.match(enviados[0].text, /diciembre/);
});
