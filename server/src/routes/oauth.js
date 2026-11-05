import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  consumeMarketplaceOAuthState,
  createMarketplaceAuthorizationUrl,
  exchangeMarketplaceAuthorizationCode,
  getMarketplaceOAuthConfigurationStatus,
} from "../lib/marketplaceOAuth.js";
import {
  getMarketplaceSellerMode,
  marketplaceSellerIsConnected,
  saveMarketplaceSellerCredentials,
} from "../lib/marketplaceCredentials.js";

const router = Router();

// Solo un administrador autenticado puede iniciar el vínculo de la cuenta vendedora.
router.get("/mercadopago/start", requireAdmin, (_req, res) => {
  const config = getMarketplaceOAuthConfigurationStatus();
  console.info("[MP OAuth] Solicitud para iniciar autorización recibida", {
    configured: config.configured,
    missing: config.missing,
    ...config.diagnostics,
  });

  if (!config.configured) {
    return res.status(503).json({
      error: "Completa la configuración OAuth del servidor antes de vincular la cuenta.",
      missing: config.missing,
    });
  }

  try {
    const authorization = createMarketplaceAuthorizationUrl();
    console.info("[MP OAuth] Redirección de autorización preparada", {
      attemptId: authorization.attemptId,
      host: new URL(authorization.authorizationUrl).host,
      clientIdPresent: new URL(authorization.authorizationUrl).searchParams.has("client_id"),
      redirectHost: authorization.diagnostics.redirectHost,
      redirectPath: authorization.diagnostics.redirectPath,
      testMode: authorization.diagnostics.oauthTestMode,
    });
    res.json({ authorization_url: authorization.authorizationUrl });
  } catch (error) {
    console.error("No se pudo iniciar OAuth de Mercado Pago:", error.message);
    res.status(503).json({ error: "OAuth no está configurado. Verifica las variables del servidor." });
  }
});

// Mercado Pago redirige aquí después del consentimiento del vendedor.
router.get("/mercadopago/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const attemptId = typeof state === "string" ? state.slice(0, 8) : "missing-state";

  if (oauthError) {
    console.warn("[MP OAuth] Mercado Pago devolvió un error de autorización", {
      attemptId,
      error: String(oauthError).slice(0, 120),
      errorDescription: typeof req.query.error_description === "string"
        ? req.query.error_description.slice(0, 200)
        : null,
      codePresent: Boolean(code),
      statePresent: Boolean(state),
    });
    return res.status(400).send("No se autorizó la cuenta de Mercado Pago. Puedes cerrar esta pestaña.");
  }

  const pending = consumeMarketplaceOAuthState(state);
  console.info("[MP OAuth] Callback recibido", {
    attemptId,
    codePresent: typeof code === "string" && Boolean(code),
    statePresent: typeof state === "string" && Boolean(state),
    stateMatched: Boolean(pending),
    queryKeys: Object.keys(req.query),
  });
  if (!pending) {
    return res.status(400).send("El estado OAuth no es válido o venció. Vuelve al panel e inicia la autorización otra vez.");
  }

  if (typeof code !== "string" || !code) {
    return res.status(400).send("Mercado Pago no devolvió un código OAuth. Vuelve al panel e intenta nuevamente.");
  }

  try {
    // No registrar ni devolver el authorization code, access token o refresh token.
    const tokenData = await exchangeMarketplaceAuthorizationCode(code, state, pending.attemptId);

    if (typeof tokenData.access_token !== "string" || !tokenData.access_token) {
      console.error("OAuth no devolvió un access_token.");
      return res.status(502).send("Mercado Pago no devolvió la autorización esperada. No se guardó ningún token.");
    }

    const config = getMarketplaceOAuthConfigurationStatus();
    if (!config.configured) {
      return res.status(503).send("La configuración OAuth no es válida. No se guardó ningún token.");
    }
    const testMode = config.diagnostics.oauthTestMode;
    const expectedLiveMode = !testMode;
    if (typeof tokenData.live_mode !== "boolean" || tokenData.live_mode !== expectedLiveMode) {
      const requestedMode = testMode ? "de prueba" : "live";
      const returnedMode = tokenData.live_mode === true ? "live" : tokenData.live_mode === false ? "de prueba" : "desconocido";
      console.error(`OAuth devolvió una autorización ${returnedMode} cuando se solicitó una credencial ${requestedMode}; no se guardó.`);
      return res.status(400).send(`Mercado Pago devolvió una autorización ${returnedMode}, no ${requestedMode}. No se guardó ningún token.`);
    }

    if (!tokenData.refresh_token) {
      console.error("OAuth no devolvió refresh_token; no se guardó la autorización incompleta.");
      return res.status(502).send("La autorización no incluyó refresh_token. No se guardó; revisa los permisos OAuth de la aplicación.");
    }

    saveMarketplaceSellerCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      public_key: tokenData.public_key ?? null,
      user_id: tokenData.user_id ?? null,
      live_mode: Boolean(tokenData.live_mode),
      expires_at: Date.now() + Number(tokenData.expires_in || 0) * 1000,
    });

    console.info("[MP OAuth] Cuenta vendedora autorizada y credenciales guardadas cifradas", {
      attemptId: pending.attemptId,
      userIdPresent: Boolean(tokenData.user_id),
      liveMode: Boolean(tokenData.live_mode),
      expiresInPresent: Boolean(tokenData.expires_in),
    });
    return res
      .status(200)
      .send("Cuenta de Mercado Pago vinculada correctamente. Puedes cerrar esta pestaña y volver al panel de PintaPatitas.");
  } catch (error) {
    console.error("[MP OAuth] Error intercambiando autorización con Mercado Pago:", {
      attemptId: pending.attemptId,
      status: error.status,
      message: error.message,
      details: error.details,
    });
    return res.status(502).send("No se pudo completar la autorización con Mercado Pago. Vuelve al panel e inténtalo otra vez.");
  }
});

router.get("/mercadopago/status", requireAdmin, (_req, res) => {
  const config = getMarketplaceOAuthConfigurationStatus();
  const sellerMode = getMarketplaceSellerMode();
  const credentialsPresent = marketplaceSellerIsConnected();
  const mode = config.diagnostics.oauthMode;
  const modeMismatch = credentialsPresent && sellerMode !== null && sellerMode !== mode;
  res.json({
    connected: config.configured && credentialsPresent && sellerMode !== null && sellerMode === mode,
    testMode: config.diagnostics.oauthTestMode,
    mode,
    sellerMode,
    modeMismatch,
    configured: config.configured,
    missing: config.missing,
  });
});

export default router;
