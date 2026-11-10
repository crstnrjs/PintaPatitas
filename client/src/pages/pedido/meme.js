// El estilo "Meme" se identifica por el slug de su técnica en Supabase.
// Es siempre acrílico y no pide cantidad ni nombres de mascotas. Puede llevar medidas
// (techniques.has_size = true): entonces el asistente muestra el paso de formato.
export const SLUG_MEME = "meme";
export const esMeme = (estilo) => estilo?.slug === SLUG_MEME;
