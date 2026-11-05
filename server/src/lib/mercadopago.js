import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getMarketplaceSellerCredentials } from "./marketplaceCredentials.js";

// Abono y saldo se cobran con el access token OAuth de la cuenta vendedora (artista).
// El abono va 100% a ella; el saldo lleva marketplace_fee (comisión de plataforma).
export function crearPreferenciaVendedor() {
  const accessToken = getMarketplaceSellerCredentials()?.access_token;
  if (!accessToken) {
    throw new Error("No hay una cuenta vendedora vinculada por OAuth para Split 1:1");
  }

  const sellerClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 7000 },
  });
  return new Preference(sellerClient);
}

// La consulta del pago debe hacerse con una credencial que tenga acceso a la
// cuenta receptora del pago. Preferimos el OAuth del vendedor para Marketplace.
export function crearConsultaPagoVendedor() {
  const accessToken =
    getMarketplaceSellerCredentials()?.access_token || process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta la credencial de Mercado Pago para consultar pagos");
  }

  const sellerClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 7000 },
  });
  return new Payment(sellerClient);
}
