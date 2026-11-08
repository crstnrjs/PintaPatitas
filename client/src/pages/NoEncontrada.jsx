import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Huella } from "@/pages/landing/ui";

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";

/* URL que no existe. En producción el servidor ya respondió con estado 404 (.htaccess). */
export default function NoEncontrada() {
  useEffect(() => {
    const anterior = document.title;
    document.title = "Página no encontrada | PintaPatitas";
    // Evita que los buscadores indexen esta URL aunque el estado no llegue (por ejemplo, en desarrollo).
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.title = anterior;
      meta.remove();
    };
  }, []);

  return (
    <div className="fondo-acuarela px-5 py-14 md:px-10 md:py-24">
      <div className="arcilla mx-auto max-w-xl rounded-[26px] px-6 py-12 text-center md:rounded-[32px]">
        <Huella className="mx-auto h-12 w-12 text-cielo" />
        <h1 className="mt-4 font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.08] text-tinta">
          No encontramos esta página
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-tinta/70">
          Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link to="/" className={`inline-flex min-h-12 items-center justify-center rounded-full bg-acento px-7 font-semibold text-white transition hover:bg-acento-oscuro ${enfoque}`}>
            Ir al inicio
          </Link>
          <Link to="/cuadros-listos" className={`inline-flex min-h-12 items-center justify-center rounded-full border border-tinta/15 bg-white/80 px-7 font-semibold text-acento-oscuro transition hover:bg-white ${enfoque}`}>
            Ver cuadros listos
          </Link>
        </div>
      </div>
    </div>
  );
}
