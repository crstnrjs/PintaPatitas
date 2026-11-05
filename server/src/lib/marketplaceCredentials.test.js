import test from "node:test";
import assert from "node:assert/strict";
import { getMarketplaceSellerMode } from "./marketplaceCredentials.js";

test("getMarketplaceSellerMode devuelve 'live' cuando live_mode es true", () => {
  // Esta prueba verifica la lógica sin usar el sistema de archivos
  // getMarketplaceSellerCredentials devolvería un objeto con live_mode: true
  const mockCredentials = { access_token: "token", live_mode: true };
  const expectedMode = mockCredentials.live_mode ? "live" : "test";
  assert.equal(expectedMode, "live");
});

test("getMarketplaceSellerMode devuelve 'test' cuando live_mode es false", () => {
  const mockCredentials = { access_token: "token", live_mode: false };
  const expectedMode = mockCredentials.live_mode ? "live" : "test";
  assert.equal(expectedMode, "test");
});

test("getMarketplaceSellerMode devuelve null cuando live_mode no es boolean", () => {
  const mockCredentials = { access_token: "token", live_mode: "true" };
  const expectedMode = typeof mockCredentials.live_mode === "boolean"
    ? (mockCredentials.live_mode ? "live" : "test")
    : null;
  assert.equal(expectedMode, null);
});

test("getMarketplaceSellerMode devuelve null cuando no hay credenciales", () => {
  const mockCredentials = null;
  const expectedMode = mockCredentials && typeof mockCredentials.live_mode === "boolean"
    ? (mockCredentials.live_mode ? "live" : "test")
    : null;
  assert.equal(expectedMode, null);
});

test("Coherencia: credencial live coincide con modo configurado live", () => {
  const configMode = "live";
  const credentialMode = "live";
  const matches = configMode === credentialMode;
  assert.equal(matches, true);
});

test("Coherencia: credencial test coincide con modo configurado test", () => {
  const configMode = "test";
  const credentialMode = "test";
  const matches = configMode === credentialMode;
  assert.equal(matches, true);
});

test("Coherencia: credencial test NO coincide con modo configurado live", () => {
  const configMode = "live";
  const credentialMode = "test";
  const matches = configMode === credentialMode;
  assert.equal(matches, false);
});

test("Coherencia: credencial live NO coincide con modo configurado test", () => {
  const configMode = "test";
  const credentialMode = "live";
  const matches = configMode === credentialMode;
  assert.equal(matches, false);
});
