import { getMarketplaceOAuthConfigurationStatus } from "./marketplaceOAuth.js";
import { getMarketplaceSellerCredentials } from "./marketplaceCredentials.js";

// Regla única para decidir si se puede cobrar con la cuenta de la artista.
// Solo está lista si la configuración OAuth es válida, hay token y el modo de la
// credencial guardada (live/test) coincide con MP_OAUTH_TEST_TOKEN.
export function evaluarCuentaVendedora({ config, credentials }) {
  const mode = config.diagnostics.oauthMode;
  const credentialsPresent = Boolean(credentials?.access_token);
  const sellerMode =
    credentials && typeof credentials.live_mode === "boolean"
      ? (credentials.live_mode ? "live" : "test")
      : null;
  const modeMismatch = credentialsPresent && sellerMode !== null && sellerMode !== mode;
  const ready = config.configured && credentialsPresent && sellerMode !== null && sellerMode === mode;
  return { ready, mode, sellerMode, credentialsPresent, modeMismatch };
}

export function getMarketplaceSellerStatus() {
  return evaluarCuentaVendedora({
    config: getMarketplaceOAuthConfigurationStatus(),
    credentials: getMarketplaceSellerCredentials(),
  });
}

// El link se elige según el modo de la cuenta que crea la preferencia (la artista),
// no según MP_ACCESS_TOKEN. En live nunca se entrega un link de sandbox.
export function urlDePago(pref, sellerMode) {
  if (sellerMode === "test") return pref.sandbox_init_point || pref.init_point || null;
  if (sellerMode === "live") return pref.init_point || null;
  return null;
}
