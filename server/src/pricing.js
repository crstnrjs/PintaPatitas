import { supabaseAdmin as supabase } from "./lib/supabase.js";

// Devuelve el precio oficial de una opción del catálogo, o null si no está disponible
export async function resolvePrice({ technique_slug, pet_count, width_cm = null, height_cm = null }) {
  let q = supabase
    .from("price_list")
    .select("id, price, size_label, pet_count, techniques!inner(name, slug, is_active)")
    .eq("is_active", true)
    .eq("pet_count", Number(pet_count))
    .eq("techniques.slug", technique_slug)
    .eq("techniques.is_active", true);

  q = width_cm == null ? q.is("width_cm", null) : q.eq("width_cm", Number(width_cm));
  q = height_cm == null ? q.is("height_cm", null) : q.eq("height_cm", Number(height_cm));

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    price_list_id: data.id,
    price: data.price,
    size_label: data.size_label,
    pet_count: data.pet_count,
    technique_name: data.techniques.name,
  };
}