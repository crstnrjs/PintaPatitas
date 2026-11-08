import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { leerComisionPorcentaje } from "../lib/ventasCuadros.js";

// Porcentajes con los que el servidor cobra de verdad, para que el panel no los repita a mano.
export function porcentajesCobro(env = process.env) {
  const abono = Number(env.ABONO_PORCENTAJE);
  return {
    comision_porcentaje: leerComisionPorcentaje(env.COMISION_PORCENTAJE),
    abono_porcentaje: abono > 0 && abono <= 100 ? abono : null,
  };
}

const router = Router();

router.get("/cobros", requireAdmin, (_req, res) => {
  res.json(porcentajesCobro());
});

export default router;
