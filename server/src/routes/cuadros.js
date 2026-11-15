import { Router } from "express";
import rateLimit from "express-rate-limit";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { crearPreferenciaVendedor } from "../lib/mercadopago.js";
import { getMarketplaceSellerStatus, urlDePago } from "../lib/marketplaceSeller.js";
import { crearRepoVentas, iniciarCompra, leerComisionPorcentaje } from "../lib/ventasCuadros.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { enviarCorreoDespachoCuadro } from "../lib/correosCuadros.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  admin = requireAdmin,
  avisarDespacho = enviarCorreoDespachoCuadro,
} = {}) {
  const router = Router();
  const repo = crearRepoVentas(db);

  // Marcar una venta como enviada: guarda el seguimiento y avisa al comprador por correo.
  router.post("/ventas/:id/enviado", admin, async (req, res) => {
    const { id } = req.params;
    if (!UUID.test(id)) return res.status(400).json({ error: "Identificador no válido." });
    const seguimiento =
      typeof req.body?.seguimiento === "string" ? req.body.seguimiento.trim().slice(0, 60) : "";

    const { data: venta, error } = await db
      .from("ventas_cuadros")
      .update({ estado_envio: "enviado", seguimiento_starken: seguimiento || null, enviado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("estado", "aprobado")
      .eq("estado_envio", "por_enviar")
      .select("*")
      .maybeSingle();
    if (error) {
      console.error("[Cuadros] Error marcando la venta como enviada:", error);
      return res.status(500).json({ error: "No se pudo marcar la venta como enviada." });
    }
    if (!venta) return res.status(409).json({ error: "La venta no está pagada o ya fue marcada como enviada." });

    let correoEnviado = true;
    try {
      await avisarDespacho(venta);
    } catch (err) {
      correoEnviado = false;
      console.error(`[Cuadros] Error enviando el correo de despacho de #CL-${venta.numero}:`, err?.message ?? err);
    }
    return res.json({ ok: true, correo_enviado: correoEnviado });
  });

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
