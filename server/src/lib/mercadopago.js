import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getMarketplaceSellerCredentials } from "./marketplaceCredentials.js";

// El abono se cobra con la cuenta principal de la aplicación. No requiere
// OAuth Marketplace, que se reserva para los cobros del saldo con Split 1:1.
export function crearPreferenciaPlataforma() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MP_ACCESS_TOKEN para crear la preferencia de abono");
  }

  const platformClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 7000 },
  });
  return new Preference(platformClient);
}

// Split 1:1 requiere crear la preferencia con el access token OAuth del vendedor
// que autorizó a la aplicación Marketplace.
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
