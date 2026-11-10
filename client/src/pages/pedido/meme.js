// El estilo "Meme" se identifica por el slug de su técnica en Supabase.
// Es siempre acrílico, no lleva medidas y no pide cantidad ni nombres de mascotas.
export const SLUG_MEME = "meme";
export const esMeme = (estilo) => estilo?.slug === SLUG_MEME;
