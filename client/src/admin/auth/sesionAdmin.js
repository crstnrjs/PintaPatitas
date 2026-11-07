import { supabase } from "@/lib/supabase";

/*
 * Expiración de la sesión del panel admin.
 *
 * Supabase deja la sesión abierta indefinidamente (guarda el refresh token en
 * localStorage y lo renueva solo). Aquí se aplican dos límites:
 *  - inactividad: sin clics/teclas/scroll durante INACTIVIDAD_MS.
 *  - duración máxima: DURACION_MAXIMA_MS desde que se ingresó la contraseña,
 *    aunque haya actividad.
 * La hora de ingreso se toma del claim `amr` del token de Supabase (no se puede
 * alargar desde el navegador), con respaldo en localStorage.
 * El servidor aplica el mismo límite máximo en requireAdmin.
 */
export const INACTIVIDAD_MS = 30 * 60 * 1000;
export const DURACION_MAXIMA_MS = 12 * 60 * 60 * 1000;

const CLAVE_ACTIVIDAD = "pp_admin_ultima_actividad";
const CLAVE_INGRESO = "pp_admin_ingreso";
const CLAVE_MOTIVO = "pp_admin_motivo_cierre";

function leer(storage, clave) {
  try {
    return storage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(storage, clave, valor) {
  try {
    if (valor === null) storage.removeItem(clave);
    else storage.setItem(clave, valor);
  } catch {
    // Almacenamiento bloqueado (modo privado, etc.): se usa solo el token.
  }
}

/** Hora (ms) en que se ingresó la contraseña según el token, o null. */
function ingresoDesdeToken(session) {
  try {
    const payload = session.access_token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const marcas = (json.amr ?? []).map((m) => Number(m.timestamp)).filter(Number.isFinite);
    return marcas.length ? Math.max(...marcas) * 1000 : null;
  } catch {
    return null;
  }
}

export function marcarInicioSesion() {
  const ahora = String(Date.now());
  escribir(localStorage, CLAVE_INGRESO, ahora);
  escribir(localStorage, CLAVE_ACTIVIDAD, ahora);
}

let ultimaEscritura = 0;
export function registrarActividad() {
  const ahora = Date.now();
  if (ahora - ultimaEscritura < 15_000) return; // evita escribir en cada scroll
  ultimaEscritura = ahora;
  escribir(localStorage, CLAVE_ACTIVIDAD, String(ahora));
}

/**
 * Devuelve "inactividad", "duracion" o null si la sesión sigue vigente.
 */
export function motivoExpiracion(session, ahora = Date.now()) {
  if (!session) return null;
  const ingresoGuardado = Number(leer(localStorage, CLAVE_INGRESO)) || null;
  const ingreso = ingresoDesdeToken(session) ?? ingresoGuardado;
  // Sin forma de saber cuándo se ingresó (sesión anterior a este cambio): se cierra.
  if (!ingreso) return "duracion";
  if (ahora - ingreso > DURACION_MAXIMA_MS) return "duracion";

  const actividad = Number(leer(localStorage, CLAVE_ACTIVIDAD)) || ingreso;
  if (ahora - actividad > INACTIVIDAD_MS) return "inactividad";
  return null;
}

/** Cierra la sesión de este dispositivo y deja el motivo para la pantalla de login. */
export async function cerrarSesionExpirada(motivo) {
  escribir(sessionStorage, CLAVE_MOTIVO, motivo);
  escribir(localStorage, CLAVE_ACTIVIDAD, null);
  escribir(localStorage, CLAVE_INGRESO, null);
  // scope "local": revoca en Supabase solo la sesión de este dispositivo.
  let fallo = false;
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    fallo = Boolean(error);
  } catch {
    fallo = true;
  }
  // Si no se pudo contactar a Supabase (p. ej. sin internet), supabase-js deja
  // la sesión guardada; se borra a mano para que no quede en el dispositivo.
  if (fallo) escribir(localStorage, supabase.auth.storageKey, null);
}

export function limpiarMarcasSesion() {
  escribir(localStorage, CLAVE_ACTIVIDAD, null);
  escribir(localStorage, CLAVE_INGRESO, null);
}

/** Motivo del último cierre automático (para el aviso del login). */
export function motivoCierrePendiente() {
  return leer(sessionStorage, CLAVE_MOTIVO);
}

export function borrarMotivoCierre() {
  escribir(sessionStorage, CLAVE_MOTIVO, null);
}
