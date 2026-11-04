import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCatalogoPublico() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("price_list")
      .select(
        "id, pet_count, width_cm, height_cm, size_label, price, techniques!inner(id, name, slug, has_size, sort_order)"
      )
      .eq("is_active", true)
      .eq("techniques.is_active", true)
      .then(({ data, error }) => {
        if (error) setError("No pudimos cargar el catálogo. Intenta de nuevo en unos minutos.");
        else setFilas(data);
        setCargando(false);
      });
  }, []);

  // Solo técnicas con al menos un producto activo
  const estilos = useMemo(() => {
    const mapa = new Map();
    for (const f of filas) {
      const t = f.techniques;
      const actual = mapa.get(t.id);
      if (!actual) mapa.set(t.id, { ...t, desde: f.price });
      else actual.desde = Math.min(actual.desde, f.price);
    }
    return [...mapa.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [filas]);

  // Medidas disponibles de una técnica, de menor a mayor
  function formatosDe(tecnicaId) {
    const mapa = new Map();
    for (const f of filas) {
      if (f.techniques.id !== tecnicaId || f.width_cm == null) continue;
      const clave = `${f.width_cm}x${f.height_cm}`;
      const actual = mapa.get(clave);
      if (!actual) {
        mapa.set(clave, {
          clave,
          ancho: f.width_cm,
          alto: f.height_cm,
          etiqueta: f.size_label,
          desde: f.price,
        });
      } else actual.desde = Math.min(actual.desde, f.price);
    }
    return [...mapa.values()].sort((a, b) => a.ancho * a.alto - b.ancho * b.alto);
  }

  // Productos (uno por cantidad de mascotas) para una técnica y unas medidas
  // Para técnicas sin medidas, pasa ancho y alto como null
  function productosDe(tecnicaId, ancho, alto) {
    return filas
      .filter(
        (f) =>
          f.techniques.id === tecnicaId &&
          (f.width_cm ?? null) === (ancho ?? null) &&
          (f.height_cm ?? null) === (alto ?? null)
      )
      .sort((a, b) => a.pet_count - b.pet_count);
  }

  return { cargando, error, estilos, formatosDe, productosDe };
}
