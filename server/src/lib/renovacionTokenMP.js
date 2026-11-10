import { refreshMarketplaceAccessToken } from "./marketplaceOAuth.js";
import {
  cargarCredencialesVendedor,
  getMarketplaceSellerCredentials,
  saveMarketplaceSellerCredentials,
} from "./marketplaceCredentials.js";

/*
 * Renovación automática del access token de la cuenta vendedora (artista).
 *
 * Mercado Pago entrega tokens que vencen (~180 días). Una vez al día se revisa la
 * credencial y, si le quedan menos de MARGEN_RENOVACION_MS, se renueva con el
 * refresh_token. Si falla se reintenta al día siguiente; se avisa por correo cuando
 * el fallo es definitivo (permiso revocado) o cuando el vencimiento está cerca.
 */

const UN_DIA = 24 * 60 * 60 * 1000;
export const MARGEN_RENOVACION_MS = 30 * UN_DIA;
export const MARGEN_AVISO_MS = 7 * UN_DIA;

// Errores con los que reintentar no sirve: hay que volver a vincular la cuenta.
const ERRORES_DEFINITIVOS = new Set(["invalid_grant", "invalid_token", "invalid_client", "unauthorized_client"]);

export function esErrorDefinitivo(error) {
  return ERRORES_DEFINITIVOS.has(error?.code) || error?.status === 401;
}

/**
 * Revisa la credencial y la renueva si hace falta. Nunca lanza.
 * Devuelve { resultado, venceEn? , error? } con resultado:
 * "sin-credencial" | "vigente" | "renovada" | "fallo".
 */
export async function renovarTokenSiHaceFalta({
  ahora = Date.now(),
  obtener = getMarketplaceSellerCredentials,
  refrescar = refreshMarketplaceAccessToken,
  guardar = saveMarketplaceSellerCredentials,
  avisar = async () => {},
} = {}) {
  let actual;
  try {
    actual = obtener();
  } catch (error) {
    console.error("[MP OAuth] No se pudo leer la credencial para renovarla:", error.message);
    return { resultado: "fallo", error: error.message };
  }
  if (!actual?.access_token) return { resultado: "sin-credencial" };

  const venceEn = Number(actual.expires_at);
  const restante = Number.isFinite(venceEn) ? venceEn - ahora : 0;
  if (restante > MARGEN_RENOVACION_MS) return { resultado: "vigente", venceEn };

  try {
    const nueva = await refrescar(actual.refresh_token);
    if (typeof nueva.access_token !== "string" || !nueva.access_token || !nueva.refresh_token) {
      throw new Error("Mercado Pago no devolvió access_token y refresh_token al renovar");
    }
    if (typeof nueva.live_mode === "boolean" && nueva.live_mode !== actual.live_mode) {
      throw new Error("Mercado Pago devolvió una credencial de otro modo (live/prueba); no se guardó");
    }
    const proximoVencimiento = ahora + Number(nueva.expires_in || 0) * 1000;
    await guardar({
      ...actual,
      access_token: nueva.access_token,
      refresh_token: nueva.refresh_token,
      public_key: nueva.public_key ?? actual.public_key ?? null,
      user_id: nueva.user_id ?? actual.user_id ?? null,
      expires_at: proximoVencimiento,
      renovado_en: ahora,
    });
    console.info("[MP OAuth] Token de la cuenta vendedora renovado", {
      venceEn: new Date(proximoVencimiento).toISOString(),
    });
    return { resultado: "renovada", venceEn: proximoVencimiento };
  } catch (error) {
    const definitivo = esErrorDefinitivo(error);
    console.error("[MP OAuth] No se pudo renovar el token de la cuenta vendedora", {
      status: error.status ?? null,
      code: error.code ?? null,
      message: error.message,
      definitivo,
    });
    if (definitivo || restante <= MARGEN_AVISO_MS) {
      try {
        await avisar({ venceEn: Number.isFinite(venceEn) ? venceEn : null, definitivo, motivo: error.message });
      } catch (errorAviso) {
        console.error("[MP OAuth] No se pudo enviar el aviso de renovación:", errorAviso.message);
      }
    }
    return { resultado: "fallo", venceEn, error: error.message };
  }
}

/** Revisa la credencial al poco de arrancar y luego una vez al día. */
export function programarRenovacionToken({ retraso = 2 * 60_000, intervalo = UN_DIA, avisar } = {}) {
  const pasada = async () => {
    // Relee desde Supabase por si la credencial cambió (p. ej., se volvió a vincular).
    await cargarCredencialesVendedor();
    await renovarTokenSiHaceFalta({ avisar });
  };
  const inicio = setTimeout(pasada, retraso);
  const diario = setInterval(pasada, intervalo);
  inicio.unref?.();
  diario.unref?.();
  return () => {
    clearTimeout(inicio);
    clearInterval(diario);
  };
}
