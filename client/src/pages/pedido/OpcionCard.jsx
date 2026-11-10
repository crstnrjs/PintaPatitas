import { IconCheck } from "./iconos";

/*
 * Opción del asistente. Con `conFoto`, la tarjeta es vertical y muestra la foto de ejemplo
 * del catálogo (o el ícono si esa opción aún no tiene foto, para que la grilla quede pareja).
 */
const ENFOQUE = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta";

export default function OpcionCard({ icono, titulo, subtitulo, seleccionada, onClick, foto, nombre, conFoto = false }) {
  const check = (
    <span
      aria-hidden="true"
      className={`absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full border-2 transition ${
        seleccionada
          ? "border-acento bg-acento text-white shadow"
          : "border-tinta/20 bg-white/90 text-transparent"
      }`}
    >
      <IconCheck className="size-3.5" />
    </span>
  );
  const estado = seleccionada
    ? "border-acento bg-lino ring-1 ring-acento"
    : "border-tinta/10 bg-white hover:border-tinta/25 hover:shadow-[0_14px_28px_-22px_rgb(19_48_61/0.5)]";

  if (conFoto) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={seleccionada}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border p-2 text-left transition ${estado} ${ENFOQUE}`}
      >
        {nombre && (
          <span className="block px-1 pt-1 pb-2 pr-9 text-sm leading-snug font-semibold text-acento-oscuro wrap-break-word sm:px-2">
            {nombre}
          </span>
        )}
        <span className="block overflow-hidden rounded-xl bg-bruma">
          {foto ? (
            <img
              src={foto}
              alt={`Ejemplo: ${titulo}`}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex aspect-[4/3] items-center justify-center text-acento">{icono}</span>
          )}
        </span>
        <span className="block min-w-0 px-1 pt-2.5 pb-1 sm:px-2 sm:pt-3 sm:pb-1.5">
          <span className="block leading-snug font-semibold text-tinta wrap-break-word">{titulo}</span>
          {subtitulo && (
            <span className="block text-[0.8rem] whitespace-nowrap text-tinta/60 sm:text-sm">{subtitulo}</span>
          )}
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
      className={`relative flex min-h-20 items-center gap-4 rounded-2xl border p-4 pr-12 text-left transition sm:p-5 sm:pr-12 ${estado} ${ENFOQUE}`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bruma text-acento">
        {icono}
      </span>
      <span className="min-w-0">
        {nombre && <span className="block text-sm font-semibold text-acento-oscuro wrap-break-word">{nombre}</span>}
        <span className="block font-semibold text-tinta wrap-break-word">{titulo}</span>
        {subtitulo && <span className="block text-sm text-tinta/60">{subtitulo}</span>}
      </span>
      {check}
    </button>
  );
}
