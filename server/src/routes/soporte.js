import { Router } from "express";
import rateLimit from "express-rate-limit";
import { CORREO_SOPORTE, enviarMensajeSoporte, leerSoporte } from "../lib/soporte.js";

// Formulario público: se limita para que nadie llene la bandeja de soporte.
const limitador = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Enviaste varios mensajes seguidos. Intenta de nuevo en un rato o escríbenos por WhatsApp." },
});

export function crearRouterSoporte({ enviar = enviarMensajeSoporte, destino = process.env.SOPORTE_EMAIL || CORREO_SOPORTE } = {}) {
  const router = Router();

  router.post("/", limitador, async (req, res) => {
    const { datos, error, esBot } = leerSoporte(req.body);
    // A un bot se le responde como si todo saliera bien, pero no se envía nada.
    if (esBot) return res.status(201).json({ ok: true });
    if (error) return res.status(400).json({ error });

    try {
      await enviar(datos, { destino });
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("[Soporte] Error enviando el mensaje:", err?.message ?? err);
      return res.status(502).json({
        error: "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.",
      });
    }
  });

  return router;
}

export default crearRouterSoporte();
