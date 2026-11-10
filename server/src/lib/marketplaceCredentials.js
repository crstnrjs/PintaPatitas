import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Credencial OAuth de la cuenta vendedora (artista).
 *
 * Se guarda cifrada (AES-256-GCM con MP_TOKEN_ENCRYPTION_KEY) en la tabla
 * public.marketplace_credentials de Supabase, que solo la service role puede leer.
 * El servidor la carga en memoria al arrancar (cargarCredencialesVendedor) y la
 * lectura (getMarketplaceSellerCredentials) es síncrona sobre esa copia.
 *
 * Antes se guardaba en un archivo del servidor; si la tabla está vacía y el archivo
 * existe, se sube una vez a Supabase para no tener que volver a vincular.
 */

const TABLA = "marketplace_credentials";
const ID = "vendedor";

export const ARCHIVO_ANTIGUO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.private/mercadopago-marketplace.enc",
);

// Registro cifrado { version, iv, tag, data } tal como está guardado, o null.
let registroEnMemoria = null;

async function clienteSupabase() {
  // Import diferido: los tests no necesitan las variables de Supabase.
  const { supabaseAdmin } = await import("./supabase.js");
  return supabaseAdmin;
}

function encryptionKey() {
  const value = process.env.MP_TOKEN_ENCRYPTION_KEY ?? "";
  if (!/^[a-f\d]{64}$/i.test(value)) {
    throw new Error("MP_TOKEN_ENCRYPTION_KEY debe ser una clave hexadecimal aleatoria de 64 caracteres");
  }
  return Buffer.from(value, "hex");
}

export function cifrarCredenciales(credentials) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    data: encrypted.toString("hex"),
  };
}

export function descifrarCredenciales(registro) {
  if (registro?.version !== 1) throw new Error("Formato de credenciales Marketplace no reconocido");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(registro.iv, "hex"));
  decipher.setAuthTag(Buffer.from(registro.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(registro.data, "hex")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(decrypted);
}

async function guardarRegistro(db, registro) {
  const { error } = await db
    .from(TABLA)
    .upsert({ id: ID, payload: registro, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la credencial en Supabase: ${error.message}`);
}

/** Cifra y guarda la credencial en Supabase; solo actualiza la memoria si se guardó. */
export async function saveMarketplaceSellerCredentials(credentials, { db } = {}) {
  const registro = cifrarCredenciales(credentials);
  await guardarRegistro(db ?? (await clienteSupabase()), registro);
  registroEnMemoria = registro;
}

/**
 * Carga la credencial desde Supabase a memoria. Nunca lanza: devuelve el origen
 * ("supabase", "archivo-migrado", "archivo", "ninguna" o "error").
 * Si Supabase falla se conserva lo que ya estaba en memoria.
 */
export async function cargarCredencialesVendedor({ db, archivo = ARCHIVO_ANTIGUO } = {}) {
  let cliente;
  try {
    cliente = db ?? (await clienteSupabase());
    const { data, error } = await cliente.from(TABLA).select("payload").eq("id", ID).maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.payload) {
      registroEnMemoria = data.payload;
      return "supabase";
    }
  } catch (error) {
    console.error("[MP OAuth] No se pudo leer la credencial desde Supabase:", error.message);
    if (registroEnMemoria) return "error";
    // Último recurso: el archivo antiguo, si sigue en el servidor.
    const registro = leerArchivo(archivo);
    if (registro) {
      registroEnMemoria = registro;
      return "archivo";
    }
    return "error";
  }

  const registro = leerArchivo(archivo);
  if (!registro) {
    registroEnMemoria = null;
    return "ninguna";
  }
  try {
    await guardarRegistro(cliente, registro);
    console.info("[MP OAuth] Credencial del archivo antiguo copiada a Supabase");
    registroEnMemoria = registro;
    return "archivo-migrado";
  } catch (error) {
    console.error("[MP OAuth] No se pudo copiar la credencial del archivo a Supabase:", error.message);
    registroEnMemoria = registro;
    return "archivo";
  }
}

function leerArchivo(archivo) {
  try {
    if (!archivo || !fs.existsSync(archivo)) return null;
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
  } catch (error) {
    console.error("[MP OAuth] El archivo de credencial antiguo no se pudo leer:", error.message);
    return null;
  }
}

export function getMarketplaceSellerCredentials() {
  if (!registroEnMemoria) return null;
  return descifrarCredenciales(registroEnMemoria);
}

export function getMarketplaceSellerMode() {
  const credentials = getMarketplaceSellerCredentials();
  return credentials && typeof credentials.live_mode === "boolean"
    ? (credentials.live_mode ? "live" : "test")
    : null;
}

export function marketplaceSellerIsConnected() {
  return Boolean(getMarketplaceSellerCredentials()?.access_token);
}
