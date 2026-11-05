import { useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { obras as obrasPredeterminadas } from "./contenido";
import { Encabezado, FaltaMaterial, Imagen } from "./ui";

/* Galería tipo masonry con filtro por técnica (si hay obras etiquetadas) y visor ampliado. */
export default function Galeria({ estilos, obras = obrasPredeterminadas, cargado = true }) {
  const [filtro, setFiltro] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const dialogo = useRef(null);

  const nombreDe = (slug) => estilos.find((e) => e.slug === slug)?.name ?? slug;
  const tecnicas = useMemo(
    () => [...new Set(obras.map((o) => o.tecnica).filter(Boolean))],
    [obras],
  );
  const visibles = filtro ? obras.filter((o) => o.tecnica === filtro) : obras;

  if (obras.length === 0) return null;

  function abrir(obra) {
    setAbierta(obra);
    dialogo.current?.showModal();
  }

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-titulo"
      className="scroll-mt-24 py-14 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="galeria-titulo" titulo="Retratos que ya viven en su casa">
          Cada cuadro parte de las fotos que nos envía su familia.
        </Encabezado>

        {tecnicas.length > 1 && (
          <div role="group" aria-label="Filtrar por técnica" className="mt-6 flex flex-wrap gap-2 md:mt-8">
            {[null, ...tecnicas].map((t) => (
              <button
                key={t ?? "todas"}
                type="button"
                aria-pressed={filtro === t}
                onClick={() => setFiltro(t)}
                className={`min-h-11 rounded-full px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta ${
                  filtro === t ? "bg-tinta text-white" : "bg-white/70 text-tinta hover:bg-white"
                }`}
              >
                {t ? nombreDe(t) : "Todas"}
              </button>
            ))}
          </div>
        )}

        {/* Móvil: carrusel horizontal deslizable. Desde sm: masonry en columnas. */}
        <ul
          className={`-mx-5 mt-8 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:block sm:columns-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:[&>li]:mb-5 ${visibles.length > 2 ? "lg:columns-3" : "max-w-4xl"}`}
        >
          {visibles.map((o) => (
            <li key={o.src} className="w-[80%] shrink-0 snap-center break-inside-avoid sm:w-auto">
              <button
                type="button"
                onClick={() => abrir(o)}
                className="group block w-full overflow-hidden rounded-[18px] bg-bastidor p-2.5 text-left shadow-[0_24px_40px_-28px_rgb(19_48_61/0.6)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta"
              >
                <span className="block overflow-hidden rounded-[10px]">
                  <Imagen
                    obra={o}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 80vw"
                    className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="sr-only">Ver en grande</span>
                {o.tecnica && (
                  <span className="mt-2.5 block px-1.5 pb-0.5 text-sm text-tinta/70">
                    {nombreDe(o.tecnica)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {cargado && obras.length < 6 && (
          <FaltaMaterial>
            Hay {obras.length} obras reales en la galería. Agrega más fotos de pinturas terminadas
            (distintas mascotas, técnicas y tamaños) en <code>pages/landing/contenido.js</code>.
          </FaltaMaterial>
        )}
      </div>

      <dialog
        ref={dialogo}
        onClose={() => setAbierta(null)}
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        aria-label={abierta?.alt ?? "Obra"}
        className="m-auto max-h-[92vh] max-w-[min(92vw,900px)] overflow-visible bg-transparent p-0 backdrop:bg-tinta/80"
      >
        {abierta && (
          <div className="relative">
            <img
              src={abierta.src}
              alt={abierta.alt}
              width={abierta.ancho}
              height={abierta.alto}
              className="max-h-[88vh] w-auto rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              aria-label="Cerrar"
              className="absolute -top-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-papel text-tinta shadow-lg focus-visible:outline-3 focus-visible:outline-cielo"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}
