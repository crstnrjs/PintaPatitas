/*
 * Duración máxima de una sesión de admin, medida desde que se ingresó la
 * contraseña (claim `amr` del token de Supabase). Supabase renueva el token
 * indefinidamente; este límite obliga a volver a iniciar sesión.
 * Debe coincidir con DURACION_MAXIMA_MS de client/src/admin/auth/sesionAdmin.js.
 */
export const DURACION_MAXIMA_SESION_MS = 12 * 60 * 60 * 1000;

/** Hora (ms) del último ingreso según el claim amr, o null si no se puede leer. */
export function horaIngreso(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const marcas = (Array.isArray(json.amr) ? json.amr : [])
      .map((m) => Number(m?.timestamp))
      .filter(Number.isFinite);
    return marcas.length ? Math.max(...marcas) * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * true si la sesión superó la duración máxima o no se puede saber cuándo se
 * inició (falla cerrado). Usar solo con un token ya verificado por Supabase.
 */
export function sesionExpirada(token, ahora = Date.now()) {
  const ingreso = horaIngreso(token);
  if (ingreso === null) return true;
  return ahora - ingreso > DURACION_MAXIMA_SESION_MS;
}
