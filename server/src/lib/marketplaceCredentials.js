import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const credentialsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.private/mercadopago-marketplace.enc",
);

function encryptionKey() {
  const value = process.env.MP_TOKEN_ENCRYPTION_KEY ?? "";
  if (!/^[a-f\d]{64}$/i.test(value)) {
    throw new Error("MP_TOKEN_ENCRYPTION_KEY debe ser una clave hexadecimal aleatoria de 64 caracteres");
  }
  return Buffer.from(value, "hex");
}

export function saveMarketplaceSellerCredentials(credentials) {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);

  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
  fs.writeFileSync(
    credentialsPath,
    JSON.stringify({
      version: 1,
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
      data: encrypted.toString("hex"),
    }),
    { mode: 0o600 },
  );
}

export function getMarketplaceSellerCredentials() {
  if (!fs.existsSync(credentialsPath)) return null;

  const key = encryptionKey();
  const stored = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  if (stored.version !== 1) throw new Error("Formato de credenciales Marketplace no reconocido");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(stored.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(stored.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(stored.data, "hex")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(decrypted);
}

export function marketplaceSellerIsConnected() {
  return Boolean(getMarketplaceSellerCredentials()?.access_token);
}
