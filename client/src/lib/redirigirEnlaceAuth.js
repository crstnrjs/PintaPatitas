/*
 * Los correos de invitación y de recuperación de Supabase llevan al Site URL
 * (la portada) con los datos de la sesión en el hash (#access_token=...&type=invite).
 * Este módulo se importa antes que el resto de la app y, si ve uno de esos
 * enlaces, cambia la ruta a /admin/crear-contrasena (conservando el hash) para
 * que la persona pueda elegir su contraseña. No navega: solo reemplaza la URL
 * antes de que React Router y Supabase la lean.
 */
export const RUTA_CREAR_CONTRASENA = "/admin/crear-contrasena";

const TIPOS = new Set(["invite", "recovery", "signup", "magiclink"]);

/**
 * Código de error del enlace (p. ej. "otp_expired"), leído antes de que
 * Supabase limpie el hash. null si el enlace no traía error.
 */
export let errorEnlaceInicial = null;

try {
  const { pathname, search, hash } = window.location;
  if (hash.length > 1) {
    const params = new URLSearchParams(hash.slice(1));
    errorEnlaceInicial = params.get("error_code");
    const esEnlaceAuth =
      (params.has("access_token") && TIPOS.has(params.get("type"))) || params.has("error_code");
    if (esEnlaceAuth && pathname !== RUTA_CREAR_CONTRASENA) {
      window.history.replaceState(null, "", `${RUTA_CREAR_CONTRASENA}${search}${hash}`);
    }
  }
} catch {
  // Si algo falla, la app sigue en la ruta original.
}
