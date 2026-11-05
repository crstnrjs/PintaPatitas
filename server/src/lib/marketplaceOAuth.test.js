import test from "node:test";
import assert from "node:assert/strict";
import { getMarketplaceOAuthConfigurationStatus } from "./marketplaceOAuth.js";
import { getMarketplaceSellerMode } from "./marketplaceCredentials.js";

const originalEnv = { ...process.env };

test.after(() => {
  for (const key of [
    "MP_CLIENT_ID",
    "MP_CLIENT_SECRET",
    "MP_OAUTH_REDIRECT_URL",
    "MP_TOKEN_ENCRYPTION_KEY",
    "MP_OAUTH_TEST_TOKEN",
  ]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function configureOAuth(mode) {
  process.env.MP_CLIENT_ID = "123456";
  process.env.MP_CLIENT_SECRET = "client-secret";
  process.env.MP_OAUTH_REDIRECT_URL = "https://api.example.com/api/oauth/mercadopago/callback";
  process.env.MP_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
  if (mode === undefined) delete process.env.MP_OAUTH_TEST_TOKEN;
  else process.env.MP_OAUTH_TEST_TOKEN = mode;
}

test("OAuth permite modo live cuando MP_OAUTH_TEST_TOKEN=false", () => {
  configureOAuth("false");
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, true);
  assert.equal(status.diagnostics.oauthTestMode, false);
  assert.equal(status.diagnostics.oauthMode, "live");
});

test("OAuth mantiene modo test cuando MP_OAUTH_TEST_TOKEN=true", () => {
  configureOAuth("true");
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, true);
  assert.equal(status.diagnostics.oauthTestMode, true);
  assert.equal(status.diagnostics.oauthMode, "test");
});

test("OAuth permite modo live cuando MP_OAUTH_TEST_TOKEN está ausente", () => {
  configureOAuth(undefined);
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, true);
  assert.equal(status.diagnostics.oauthTestMode, false);
  assert.equal(status.diagnostics.oauthMode, "live");
  assert.equal(status.diagnostics.oauthTestTokenValid, true);
});

test("OAuth rechaza valor inválido en MP_OAUTH_TEST_TOKEN", () => {
  configureOAuth("invalid");
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, false);
  assert.equal(status.diagnostics.oauthMode, "disabled");
  assert.equal(status.diagnostics.oauthTestTokenValid, false);
  assert.ok(status.missing.includes("MP_OAUTH_TEST_TOKEN debe ser 'true' o 'false'"));
});

test("OAuth rechaza valor vacío en MP_OAUTH_TEST_TOKEN", () => {
  configureOAuth("");
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, false);
  assert.equal(status.diagnostics.oauthMode, "disabled");
  assert.equal(status.diagnostics.oauthTestTokenValid, false);
});

test("OAuth rechaza valor yes en MP_OAUTH_TEST_TOKEN", () => {
  configureOAuth("yes");
  const status = getMarketplaceOAuthConfigurationStatus();
  assert.equal(status.configured, false);
  assert.equal(status.diagnostics.oauthMode, "disabled");
  assert.equal(status.diagnostics.oauthTestTokenValid, false);
});
