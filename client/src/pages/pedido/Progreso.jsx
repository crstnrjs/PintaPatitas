/* Progreso del asistente: en móvil, nombre del paso + barra segmentada; desde sm, cada segmento con su nombre. */
export default function Progreso({ pasos, actual }) {
  return (
    <nav aria-label="Progreso del pedido">
      <div className="flex items-baseline justify-between gap-3 sm:hidden">
        <span className="min-w-0 truncate text-sm font-semibold text-tinta">{pasos[actual].nombre}</span>
        <span className="shrink-0 text-xs text-tinta/60">
          Paso {actual + 1} de {pasos.length}
        </span>
      </div>
      <ol className="mt-2.5 flex gap-1.5 sm:mt-0 sm:gap-2">
        {pasos.map((p, i) => {
          const hecho = i < actual;
          const enCurso = i === actual;
          return (
            <li key={p.id} className="min-w-0 flex-1" aria-current={enCurso ? "step" : undefined}>
              <span
                className={`block h-1.5 rounded-full transition-colors duration-300 ${
                  hecho ? "bg-acento" : enCurso ? "bg-acento-oscuro" : "bg-bastidor"
                }`}
              />
              <span
                className={`mt-2 hidden truncate text-xs sm:block ${
                  enCurso ? "font-semibold text-tinta" : hecho ? "text-tinta/70" : "text-tinta/40"
                }`}
              >
                <span className="sr-only">{hecho ? "Completado: " : enCurso ? "Paso actual: " : ""}</span>
                {p.nombre}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
