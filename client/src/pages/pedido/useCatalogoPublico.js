import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// Fotos de ejemplo que la artista sube a cada producto en Admin → Catálogo.
export const fotoCatalogo = (path) =>
  path ? supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl : null;

// La foto que mejor representa a un grupo de productos: la del retrato más simple
// (menos mascotas, menor tamaño) que tenga foto.
function fotoRepresentativa(productos) {
  const conFoto = productos
    .filter((f) => f.image_path)
    .sort((a, b) => a.pet_count - b.pet_count || (a.width_cm ?? 0) * (a.height_cm ?? 0) - (b.width_cm ?? 0) * (b.height_cm ?? 0));
  return fotoCatalogo(conFoto[0]?.image_path);
}

export function useCatalogoPublico() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("price_list")
      .select(
        "id, pet_count, width_cm, height_cm, size_label, price, image_path, techniques!inner(id, name, slug, has_size, sort_order)"
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
    return [...mapa.values()]
      .map((e) => ({ ...e, foto: fotoRepresentativa(filas.filter((f) => f.techniques.id === e.id)) }))
      .sort((a, b) => a.sort_order - b.sort_order);
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
          productos: [f],
        });
      } else {
        actual.desde = Math.min(actual.desde, f.price);
        actual.productos.push(f);
      }
    }
    return [...mapa.values()]
      .map(({ productos, ...formato }) => ({ ...formato, foto: fotoRepresentativa(productos) }))
      .sort((a, b) => a.ancho * a.alto - b.ancho * b.alto);
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
      .map((f) => ({ ...f, foto: fotoCatalogo(f.image_path) }))
      .sort((a, b) => a.pet_count - b.pet_count);
  }

  return { cargando, error, estilos, formatosDe, productosDe };
}
