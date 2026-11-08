import { IconCheck } from "./iconos";

/*
 * Opción del asistente. Con `conFoto`, la tarjeta es vertical y muestra la foto de ejemplo
 * del catálogo (o el ícono si esa opción aún no tiene foto, para que la grilla quede pareja).
 */
export default function OpcionCard({ icono, titulo, subtitulo, seleccionada, onClick, foto, conFoto = false }) {
  const check = seleccionada && (
    <span className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#2d6583] text-white shadow">
      <IconCheck className="h-3.5 w-3.5" />
    </span>
  );
  const estado = seleccionada
    ? "border-[#2d6583] bg-[#f5fafb] ring-1 ring-[#2d6583]"
    : "border-slate-200 bg-white hover:border-slate-300";

  if (conFoto) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={seleccionada}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border p-2 text-left transition ${estado}`}
      >
        <span className="block overflow-hidden rounded-xl bg-[#e6eef2]">
          {foto ? (
            <img
              src={foto}
              alt={`Ejemplo: ${titulo}`}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex aspect-[4/3] items-center justify-center text-[#2d6583]">{icono}</span>
          )}
        </span>
        <span className="block px-2.5 pt-3 pb-2">
          <span className="block font-semibold text-slate-900">{titulo}</span>
          {subtitulo && <span className="block text-sm text-slate-500">{subtitulo}</span>}
        </span>
        {check}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionada}
      className={`relative flex items-center gap-4 rounded-2xl border p-5 text-left transition ${estado}`}
    >
      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#e6eef2] text-[#2d6583]">
        {icono}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-slate-900">{titulo}</span>
        {subtitulo && <span className="block text-sm text-slate-500">{subtitulo}</span>}
      </span>
      {check}
    </button>
  );
}
