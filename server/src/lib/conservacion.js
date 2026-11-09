import { supabaseAdmin } from "./supabase.js";

// Plazo de conservación de los datos personales (Términos y condiciones, sección 5).
// Las funciones SQL nunca aceptan menos de 6 meses. Requiere 202611090001_conservacion_datos.sql.
export const MESES_CONSERVACION = 6;
const BUCKET = "pet-photos";
const LOTE = 100;
const UN_DIA = 24 * 60 * 60 * 1000;

// Elimina fotos y datos personales vencidos. Las fotos se borran ANTES de anonimizar:
// si algo falla, el pedido sigue pendiente y se reintenta en la próxima pasada.
export async function aplicarConservacion({ db = supabaseAdmin, meses = MESES_CONSERVACION } = {}) {
  let pedidos = 0;
  let fotos = 0;

  for (;;) {
    const { data, error } = await db.rpc("pedidos_para_anonimizar", { p_meses: meses, p_limite: LOTE });
    if (error) throw error;
    if (!data?.length) break;

    const rutas = data.flatMap((p) => p.fotos ?? []);
    if (rutas.length > 0) {
      const { error: errFotos } = await db.storage.from(BUCKET).remove(rutas);
      if (errFotos) throw errFotos;
    }

    const { data: n, error: errPedidos } = await db.rpc("anonimizar_pedidos", {
      p_ids: data.map((p) => p.order_id),
      p_meses: meses,
    });
    if (errPedidos) throw errPedidos;

    pedidos += n ?? 0;
    fotos += rutas.length;
    // Si un lote no avanzó, se corta para no repetirlo en bucle.
    if (!n || data.length < LOTE) break;
  }

  const { data: ventas, error: errVentas } = await db.rpc("anonimizar_ventas_cuadros", { p_meses: meses });
  if (errVentas) throw errVentas;

  return { pedidos, fotos, ventas: ventas ?? 0 };
}

async function pasada(db) {
  try {
    const r = await aplicarConservacion({ db });
    if (r.pedidos || r.fotos || r.ventas) {
      console.log(`[Conservación] ${r.pedidos} pedidos y ${r.ventas} ventas anonimizados, ${r.fotos} fotos eliminadas.`);
    }
  } catch (error) {
    console.error("[Conservación] No se pudo aplicar el plazo de conservación:", error?.message ?? error);
  }
}

// Una pasada al minuto de arrancar y luego una vez al día.
export function programarConservacion({ db = supabaseAdmin, retraso = 60_000, intervalo = UN_DIA } = {}) {
  const inicio = setTimeout(() => pasada(db), retraso);
  const diario = setInterval(() => pasada(db), intervalo);
  inicio.unref?.();
  diario.unref?.();
  return () => {
    clearTimeout(inicio);
    clearInterval(diario);
  };
}
