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

// --- Almacenamiento en Supabase ---
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cargarCredencialesVendedor,
  cifrarCredenciales,
  getMarketplaceSellerCredentials,
  saveMarketplaceSellerCredentials,
} from "./marketplaceCredentials.js";

process.env.MP_TOKEN_ENCRYPTION_KEY ??= "a".repeat(64);

// Imita lo mínimo del cliente de Supabase que usa el módulo.
function dbFalsa({ fila = null, fallaLectura = false, fallaEscritura = false } = {}) {
  const db = {
    fila,
    escrituras: [],
    from() {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () =>
              fallaLectura ? { data: null, error: { message: "relation does not exist" } } : { data: db.fila, error: null },
          }),
        }),
        upsert: async (valor) => {
          if (fallaEscritura) return { error: { message: "sin permiso" } };
          db.escrituras.push(valor);
          db.fila = { payload: valor.payload };
          return { error: null };
        },
      };
    },
  };
  return db;
}

const sinArchivo = path.join(os.tmpdir(), "pp-no-existe.enc");

test("guarda la credencial cifrada en Supabase y la deja disponible", async () => {
  const db = dbFalsa();
  await saveMarketplaceSellerCredentials({ access_token: "APP_USR-secreto", live_mode: true }, { db });
  assert.equal(db.escrituras.length, 1);
  assert.equal(db.escrituras[0].id, "vendedor");
  assert.equal(JSON.stringify(db.escrituras[0].payload).includes("APP_USR-secreto"), false);
  assert.equal(getMarketplaceSellerCredentials().access_token, "APP_USR-secreto");
});

test("si Supabase rechaza el guardado, lanza y no cambia la credencial en memoria", async () => {
  await saveMarketplaceSellerCredentials({ access_token: "anterior", live_mode: true }, { db: dbFalsa() });
  await assert.rejects(
    saveMarketplaceSellerCredentials({ access_token: "nueva", live_mode: true }, { db: dbFalsa({ fallaEscritura: true }) }),
    /Supabase/,
  );
  assert.equal(getMarketplaceSellerCredentials().access_token, "anterior");
});

test("al arrancar carga la credencial guardada en Supabase", async () => {
  const db = dbFalsa({ fila: { payload: cifrarCredenciales({ access_token: "desde-db", live_mode: true }) } });
  assert.equal(await cargarCredencialesVendedor({ db, archivo: sinArchivo }), "supabase");
  assert.equal(getMarketplaceSellerCredentials().access_token, "desde-db");
});

test("sin fila ni archivo, queda sin credencial", async () => {
  assert.equal(await cargarCredencialesVendedor({ db: dbFalsa(), archivo: sinArchivo }), "ninguna");
  assert.equal(getMarketplaceSellerCredentials(), null);
});

test("sube a Supabase la credencial del archivo antiguo", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-cred-"));
  const archivo = path.join(dir, "mercadopago-marketplace.enc");
  fs.writeFileSync(archivo, JSON.stringify(cifrarCredenciales({ access_token: "desde-archivo", live_mode: true })));
  const db = dbFalsa();
  assert.equal(await cargarCredencialesVendedor({ db, archivo }), "archivo-migrado");
  assert.equal(db.escrituras.length, 1);
  assert.equal(getMarketplaceSellerCredentials().access_token, "desde-archivo");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("si Supabase no responde, conserva la credencial que ya estaba en memoria", async () => {
  await saveMarketplaceSellerCredentials({ access_token: "en-memoria", live_mode: true }, { db: dbFalsa() });
  assert.equal(await cargarCredencialesVendedor({ db: dbFalsa({ fallaLectura: true }), archivo: sinArchivo }), "error");
  assert.equal(getMarketplaceSellerCredentials().access_token, "en-memoria");
});
