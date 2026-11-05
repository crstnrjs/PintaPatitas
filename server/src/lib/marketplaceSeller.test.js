import test from "node:test";
import assert from "node:assert/strict";
import { evaluarCuentaVendedora, urlDePago } from "./marketplaceSeller.js";

const config = (oauthMode, configured = true) => ({ configured, diagnostics: { oauthMode } });
const cred = (live_mode) => ({ access_token: "token-artista", live_mode });

test("lista para cobrar cuando el modo de la credencial coincide (live)", () => {
  const r = evaluarCuentaVendedora({ config: config("live"), credentials: cred(true) });
  assert.equal(r.ready, true);
  assert.equal(r.sellerMode, "live");
  assert.equal(r.modeMismatch, false);
});

test("lista para cobrar cuando el modo de la credencial coincide (test)", () => {
  const r = evaluarCuentaVendedora({ config: config("test"), credentials: cred(false) });
  assert.equal(r.ready, true);
  assert.equal(r.sellerMode, "test");
});

test("no cobra con credencial de prueba si el servidor está en live", () => {
  const r = evaluarCuentaVendedora({ config: config("live"), credentials: cred(false) });
  assert.equal(r.ready, false);
  assert.equal(r.modeMismatch, true);
});

test("no cobra con credencial live si el servidor está en modo prueba", () => {
  const r = evaluarCuentaVendedora({ config: config("test"), credentials: cred(true) });
  assert.equal(r.ready, false);
  assert.equal(r.modeMismatch, true);
});

test("no cobra si la credencial no indica su modo", () => {
  const r = evaluarCuentaVendedora({ config: config("live"), credentials: { access_token: "t" } });
  assert.equal(r.ready, false);
  assert.equal(r.sellerMode, null);
  assert.equal(r.modeMismatch, false);
});

test("no cobra sin credenciales o con configuración OAuth inválida", () => {
  assert.equal(evaluarCuentaVendedora({ config: config("live"), credentials: null }).ready, false);
  assert.equal(
    evaluarCuentaVendedora({ config: config("disabled", false), credentials: cred(true) }).ready,
    false,
  );
});

test("en live usa init_point y nunca el link de sandbox", () => {
  const pref = { init_point: "https://mp/real", sandbox_init_point: "https://mp/sandbox" };
  assert.equal(urlDePago(pref, "live"), "https://mp/real");
  assert.equal(urlDePago({ sandbox_init_point: "https://mp/sandbox" }, "live"), null);
});

test("en modo prueba usa sandbox_init_point", () => {
  const pref = { init_point: "https://mp/real", sandbox_init_point: "https://mp/sandbox" };
  assert.equal(urlDePago(pref, "test"), "https://mp/sandbox");
});

test("sin modo conocido no entrega link", () => {
  assert.equal(urlDePago({ init_point: "https://mp/real" }, null), null);
});
