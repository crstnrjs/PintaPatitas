import { supabase } from "@/lib/supabase";

// Las técnicas que se mencionan en los textos salen del catálogo activo: así, cuando la
// artista agrega en el panel un producto de una técnica (p. ej. óleo o lápiz), vuelve a
// aparecer sola en el sitio. El Meme es un tipo de cuadro, no una técnica de pintura.
const NO_ES_TECNICA = new Set(["meme"]);

// [{ name, slug }] → "acrílico, digital y óleo" (null si no hay ninguna)
export function textoTecnicas(estilos, conector = "y") {
  const nombres = (estilos ?? [])
    .filter((e) => e?.name && !NO_ES_TECNICA.has(e.slug))
    .map((e) => e.name.toLocaleLowerCase("es-CL"));
  if (nombres.length === 0) return null;
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} ${conector} ${nombres.at(-1)}`;
}

// Técnicas con al menos un producto activo, en el orden del catálogo. Para usar fuera de React.
export async function obtenerTecnicasActivas() {
  const { data, error } = await supabase
    .from("price_list")
    .select("techniques!inner(name, slug, sort_order)")
    .eq("is_active", true)
    .eq("techniques.is_active", true);
  if (error) throw error;
  const mapa = new Map();
  for (const { techniques: t } of data ?? []) mapa.set(t.slug, t);
  return [...mapa.values()].sort((a, b) => a.sort_order - b.sort_order);
}
