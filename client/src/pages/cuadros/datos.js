import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "cuadros";
const CAMPOS =
  "id, slug, titulo, descripcion, ancho_cm, alto_cm, precio, fotos, estado, reservado_hasta, techniques(name, slug)";

export const fotoCuadro = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export const medidasCuadro = (c) =>
  c.ancho_cm && c.alto_cm ? `${Number(c.ancho_cm)} × ${Number(c.alto_cm)} cm` : null;

// Una reserva vencida (el comprador no pagó a tiempo) se muestra como disponible.
const enCompra = (c) => c.estado === "reservado" && c.reservado_hasta && new Date(c.reservado_hasta) > new Date();

const normalizar = (c) => ({
  ...c,
  fotos: c.fotos ?? [],
  tecnica: c.techniques?.name ?? null,
  tecnicaSlug: c.techniques?.slug ?? null,
  enCompra: enCompra(c),
});

/* Cuadros a la venta (la RLS solo deja ver disponibles y reservados). Los que están en compra van al final. */
export function useCuadrosDisponibles() {
  const [estado, setEstado] = useState({ cuadros: [], cargado: false, error: false });

  useEffect(() => {
    let activo = true;
    supabase
      .from("cuadros_listos")
      .select(CAMPOS)
      .in("estado", ["disponible", "reservado"])
      .order("sort_order")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!activo) return;
        const cuadros = (data ?? []).map(normalizar).sort((a, b) => Number(a.enCompra) - Number(b.enCompra));
        setEstado({ cuadros, cargado: true, error: Boolean(error) });
      });
    return () => {
      activo = false;
    };
  }, []);

  return estado;
}

/* Un cuadro por su slug. null si no existe, se vendió o está oculto. */
export function useCuadro(slug) {
  const [estado, setEstado] = useState({ cuadro: null, cargado: false, slug: null });

  useEffect(() => {
    let activo = true;
    supabase
      .from("cuadros_listos")
      .select(CAMPOS)
      .eq("slug", slug)
      .in("estado", ["disponible", "reservado"])
      .maybeSingle()
      .then(({ data }) => {
        if (activo) setEstado({ cuadro: data ? normalizar(data) : null, cargado: true, slug });
      });
    return () => {
      activo = false;
    };
  }, [slug]);

  // Al cambiar de cuadro no se muestra el anterior mientras carga el nuevo.
  return estado.slug === slug ? estado : { cuadro: null, cargado: false };
}

export function useInstagramUrl() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let activo = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "instagram_url")
      .maybeSingle()
      .then(({ data }) => activo && setUrl(data?.value ?? ""));
    return () => {
      activo = false;
    };
  }, []);
  return url;
}
