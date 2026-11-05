import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { obras as obrasFallback } from "./contenido";

const bucket = "landing";
const publicUrl = (path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

export function useContenidoLanding() {
  const [contenido, setContenido] = useState({ obras: obrasFallback, comparaciones: [], testimonios: [], instagramUrl: "", fraseConfianza: null, cargado: false });
  useEffect(() => {
    let activo = true;
    async function cargar() {
      const [galeria, pares, resenas, ajustes] = await Promise.all([
        supabase.from("gallery_items").select("image_path,width,height,alt,technique_id,techniques(slug)").eq("is_visible", true).order("sort_order"),
        supabase.from("before_after_items").select("photo_path,artwork_path,width,height,alt,technique_id,techniques(slug)").eq("is_visible", true).order("sort_order"),
        supabase.from("testimonials").select("id,quote,author_name,pet_name,image_path").eq("is_visible", true).eq("consent_confirmed", true).order("sort_order"),
        supabase.from("site_settings").select("key,value").in("key", ["instagram_url", "trust_phrase"]),
      ]);
      if (!activo) return;
      const obras = galeria.error || !galeria.data?.length ? obrasFallback : galeria.data.map((o) => ({ src: publicUrl(o.image_path), ancho: o.width, alto: o.height, alt: o.alt, tecnica: o.techniques?.slug ?? null }));
      const comparaciones = pares.error ? [] : (pares.data ?? []).map((p) => ({ foto: publicUrl(p.photo_path), obra: publicUrl(p.artwork_path), ancho: p.width, alto: p.height, alt: p.alt, tecnica: p.techniques?.slug ?? null }));
      const testimonios = resenas.error ? [] : (resenas.data ?? []).map((t) => ({ id: t.id, texto: t.quote, autor: t.author_name, mascota: t.pet_name, foto: t.image_path ? publicUrl(t.image_path) : null }));
      const config = Object.fromEntries((ajustes.data ?? []).map(({ key, value }) => [key, value]));
      if (obras[0]) { const preload = new Image(); preload.src = obras[0].src; }
      setContenido({ obras, comparaciones, testimonios, instagramUrl: config.instagram_url ?? "", fraseConfianza: config.trust_phrase || null, cargado: true });
    }
    cargar().catch(() => {});
    return () => { activo = false; };
  }, []);
  return contenido;
}
