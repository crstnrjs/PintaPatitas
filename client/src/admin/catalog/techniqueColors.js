// Colores por técnica, como ayuda visual. La clave es el slug de la tabla techniques.
// Se evita el verde porque ya lo usa la etiqueta ACTIVO.
const PALETA = {
  oleo: {
    dot: "bg-amber-500",
    pill: "bg-amber-100 text-amber-800",
    sel: "border-amber-500 bg-amber-50 text-amber-900",
    chipOn: "border-amber-500 bg-amber-500 text-white",
  },
  acrilico: {
    dot: "bg-sky-500",
    pill: "bg-sky-100 text-sky-800",
    sel: "border-sky-500 bg-sky-50 text-sky-900",
    chipOn: "border-sky-500 bg-sky-500 text-white",
  },
  lapiz: {
    dot: "bg-rose-500",
    pill: "bg-rose-100 text-rose-800",
    sel: "border-rose-500 bg-rose-50 text-rose-900",
    chipOn: "border-rose-500 bg-rose-500 text-white",
  },
  digital: {
    dot: "bg-violet-500",
    pill: "bg-violet-100 text-violet-800",
    sel: "border-violet-500 bg-violet-50 text-violet-900",
    chipOn: "border-violet-500 bg-violet-500 text-white",
  },
};

// Para técnicas nuevas que agregues desde Supabase y aún no tengan color
const OTRO = {
  dot: "bg-slate-500",
  pill: "bg-slate-100 text-slate-700",
  sel: "border-slate-500 bg-slate-50 text-slate-900",
  chipOn: "border-slate-600 bg-slate-600 text-white",
};

export const colorDe = (slug) => PALETA[slug] ?? OTRO;