import crypto from "node:crypto";

const AUTHORIZATION_URL = "https://auth.mercadopago.cl/authorization";
const TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map();

function oauthConfig() {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = process.env.MP_OAUTH_REDIRECT_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Faltan MP_CLIENT_ID, MP_CLIENT_SECRET o MP_OAUTH_REDIRECT_URL en server/.env");
  }

  const parsedRedirect = new URL(redirectUri);
  if (parsedRedirect.protocol !== "https:") {
    throw new Error("MP_OAUTH_REDIRECT_URL debe ser HTTPS (ngrok es válido para desarrollo)");
  }

  return { clientId, clientSecret, redirectUri };
}

function pruneExpiredStates() {
  const now = Date.now();
  for (const [state, details] of pendingStates) {
    if (details.expiresAt <= now) pendingStates.delete(state);
  }
}

export function createMarketplaceAuthorizationUrl() {
  pruneExpiredStates();
  const { clientId, redirectUri } = oauthConfig();
  const state = crypto.randomBytes(32).toString("hex");
  const attemptId = crypto.randomBytes(4).toString("hex");

  pendingStates.set(state, {
    attemptId,
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_TTL_MS,
  });

  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);

  return {
    authorizationUrl: url.toString(),
    attemptId,
    diagnostics: getMarketplaceOAuthConfigurationStatus().diagnostics,
  };
}

export function consumeMarketplaceOAuthState(state) {
  pruneExpiredStates();
  if (!state || typeof state !== "string") return false;
  const details = pendingStates.get(state);
  if (!details) return false;
  pendingStates.delete(state);
  return details;
}

export function getMarketplaceOAuthConfigurationStatus() {
  const missing = [];
  const clientId = process.env.MP_CLIENT_ID ?? "";
  const redirectUri = process.env.MP_OAUTH_REDIRECT_URL ?? "";
  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "";
  const platformToken = process.env.MP_ACCESS_TOKEN ?? "";
  const tokenAppId = platformToken.match(/^(?:APP_USR|TEST)-(\d+)-/)?.[1] ?? null;
  let redirectHttps = false;
  let redirectPath = null;
  let redirectHost = null;

  try {
    const parsedRedirect = new URL(redirectUri);
    redirectHttps = parsedRedirect.protocol === "https:";
    redirectHost = parsedRedirect.host;
    redirectPath = parsedRedirect.pathname;
  } catch {
    // URL incompleta o mal formada; se comunica como configuración faltante.
  }

  let publicBaseHost = null;
  try {
    publicBaseHost = new URL(publicBaseUrl).host;
  } catch {
    // La URL pública no es obligatoria para iniciar OAuth, pero se informa como diagnóstico.
  }

  const clientIdMatchesPlatformToken = tokenAppId
    ? clientId === tokenAppId
    : null;

  if (!clientId) missing.push("MP_CLIENT_ID");
  if (!process.env.MP_CLIENT_SECRET) missing.push("MP_CLIENT_SECRET");
  if (!redirectUri) missing.push("MP_OAUTH_REDIRECT_URL");
  if (redirectUri && !redirectHttps) missing.push("MP_OAUTH_REDIRECT_URL debe ser HTTPS");
  if (!/^[a-f\d]{64}$/i.test(process.env.MP_TOKEN_ENCRYPTION_KEY ?? "")) {
    missing.push("MP_TOKEN_ENCRYPTION_KEY");
  }
  if (process.env.MP_OAUTH_TEST_TOKEN !== "true") missing.push("MP_OAUTH_TEST_TOKEN=true");
  return {
    configured: missing.length === 0,
    missing,
    diagnostics: {
      clientIdPresent: Boolean(clientId),
      clientSecretPresent: Boolean(process.env.MP_CLIENT_SECRET),
      clientIdMatchesPlatformToken,
      redirectHttps,
      redirectHost,
      redirectPath,
      redirectHostMatchesPublicBase: redirectHost && publicBaseHost
        ? redirectHost === publicBaseHost
        : null,
      oauthTestMode: process.env.MP_OAUTH_TEST_TOKEN === "true",
      encryptionKeyValid: /^[a-f\d]{64}$/i.test(process.env.MP_TOKEN_ENCRYPTION_KEY ?? ""),
    },
  };
}

export async function exchangeMarketplaceAuthorizationCode(code, state, attemptId) {
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const testToken = process.env.MP_OAUTH_TEST_TOKEN === "true";
  const redirect = new URL(redirectUri);

  console.info("[MP OAuth] Intercambiando código autorizado", {
    attemptId,
    clientIdPresent: Boolean(clientId),
    redirectHost: redirect.host,
    redirectPath: redirect.pathname,
    testTokenRequested: testToken,
    codePresent: Boolean(code),
    statePresent: Boolean(state),
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      state,
      test_token: String(testToken),
    }).toString(),
  });

  const responseText = await response.text();
  let result = {};
  try {
    result = JSON.parse(responseText);
  } catch {
    const title = responseText.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g, " ").trim();
    const visibleText = responseText
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

    console.error("[MP OAuth] Mercado Pago devolvió una respuesta no JSON", {
      attemptId,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      requestId: response.headers.get("x-request-id"),
      title,
      visibleText,
    });

    const error = new Error("Mercado Pago devolvió una página de error en vez de la respuesta OAuth");
    error.status = response.status;
    error.details = { title, visibleText };
    throw error;
  }

  console.info("[MP OAuth] Respuesta recibida de Mercado Pago", {
    attemptId,
    httpStatus: response.status,
    contentType: response.headers.get("content-type"),
    requestId: response.headers.get("x-request-id"),
    error: result.error ?? null,
    message: result.message ?? null,
    liveMode: typeof result.live_mode === "boolean" ? result.live_mode : null,
    userIdPresent: Boolean(result.user_id),
    accessTokenPresent: Boolean(result.access_token),
    refreshTokenPresent: Boolean(result.refresh_token),
  });

  if (!response.ok) {
    const error = new Error(result.message || result.error || "Mercado Pago rechazó el intercambio OAuth");
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result;
}
