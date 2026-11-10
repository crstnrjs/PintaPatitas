// Colores por técnica, como ayuda visual. La clave es el slug de la tabla techniques.
// Tonos suaves dentro de la familia de la marca; se evita el verde porque ya lo usa la etiqueta ACTIVO.
const PALETA = {
  oleo: {
    dot: "bg-[#d99a37]",
    pill: "bg-[#faefd9] text-[#865710]",
    sel: "border-[#d99a37] bg-[#faefd9] text-[#6b450c]",
    chipOn: "border-[#c0852a] bg-[#c0852a] text-white",
  },
  acrilico: {
    dot: "bg-[#4f8fb0]",
    pill: "bg-[#e1eef5] text-[#1f5675]",
    sel: "border-[#4f8fb0] bg-[#e1eef5] text-[#173f57]",
    chipOn: "border-acento bg-acento text-white",
  },
  lapiz: {
    dot: "bg-[#c97b86]",
    pill: "bg-[#f6e6e8] text-[#8a4651]",
    sel: "border-[#c97b86] bg-[#f6e6e8] text-[#6f3640]",
    chipOn: "border-[#b0626e] bg-[#b0626e] text-white",
  },
  digital: {
    dot: "bg-[#8a7bc0]",
    pill: "bg-[#ece8f5] text-[#56468a]",
    sel: "border-[#8a7bc0] bg-[#ece8f5] text-[#463873]",
    chipOn: "border-[#6f60a8] bg-[#6f60a8] text-white",
  },
  meme: {
    dot: "bg-[#d9763a]",
    pill: "bg-[#fbe9dc] text-[#8a4414]",
    sel: "border-[#d9763a] bg-[#fbe9dc] text-[#6e3510]",
    chipOn: "border-[#c0642a] bg-[#c0642a] text-white",
  },
};

// Para técnicas nuevas que agregues desde Supabase y aún no tengan color
const OTRO = {
  dot: "bg-tinta/40",
  pill: "bg-bruma text-tinta/75",
  sel: "border-tinta/40 bg-bruma/60 text-tinta",
  chipOn: "border-acento-oscuro bg-acento-oscuro text-white",
};

export const colorDe = (slug) => PALETA[slug] ?? OTRO;
