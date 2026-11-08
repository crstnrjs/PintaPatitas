import { Router } from "express";
import rateLimit from "express-rate-limit";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { crearPreferenciaVendedor } from "../lib/mercadopago.js";
import { getMarketplaceSellerStatus, urlDePago } from "../lib/marketplaceSeller.js";
import { crearRepoVentas, iniciarCompra, leerComisionPorcentaje } from "../lib/ventasCuadros.js";

// Endpoint público: se limita para que nadie bloquee cuadros reservándolos en masa.
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta nuevamente en unos minutos." },
});

export function crearRouterCuadros({
  db = supabase,
  vendedora = getMarketplaceSellerStatus,
  crearPreferencia = (body) => crearPreferenciaVendedor().create({ body }),
} = {}) {
  const router = Router();
  const repo = crearRepoVentas(db);

  // Comprar un cuadro listo: reserva 20 minutos y devuelve el link de pago de Mercado Pago.
  router.post("/:slug/comprar", limitador, async (req, res) => {
    try {
      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
      const publicBase = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "");
      const { status, body } = await iniciarCompra({
        slug: req.params.slug,
        body: req.body,
        repo,
        vendedora: vendedora(),
        crearPreferencia,
        urlDePago,
        comisionPorcentaje: leerComisionPorcentaje(),
        frontendUrl,
        notificationUrl: publicBase ? `${publicBase}/api/webhooks/mercadopago` : undefined,
      });
      return res.status(status).json(body);
    } catch (error) {
      console.error("[Cuadros] Error iniciando la compra:", error);
      return res.status(500).json({ error: "No pudimos iniciar la compra. Intenta de nuevo." });
    }
  });

  return router;
}

export default crearRouterCuadros();
