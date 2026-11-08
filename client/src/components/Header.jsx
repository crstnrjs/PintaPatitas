import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { destinoEnlace, enlacesLanding } from "./navegacion";

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";

export default function Header() {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const enPedido = pathname === "/catalogo";

  // Cierra el menú móvil con Escape (los enlaces lo cierran al hacer clic)
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [abierto]);

  const enCuadros = pathname.startsWith("/cuadros-listos");

  // "Cuadros listos" es una página propia: va como botón junto a "Crear mi retrato" (desde sm).
  // En celular, donde no cabe el botón, se mantiene dentro del menú.
  const enlaces = (
    <>
      {enlacesLanding.map((enlace) => {
        const activo = enlace.to && pathname.startsWith(enlace.to);
        return (
          <Link
            key={enlace.label}
            to={destinoEnlace(enlace)}
            onClick={() => setAbierto(false)}
            aria-current={activo ? "page" : undefined}
            className={`items-center rounded-full px-3 transition hover:text-tinta ${enlace.to ? "flex sm:hidden" : "flex"} min-h-11 ${activo ? "font-medium text-tinta" : "text-tinta/75"} ${enfoque}`}
          >
            {enlace.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="vidrio mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full py-2 pr-2 pl-4 sm:pl-5">
        <Link to="/" className={`shrink-0 font-display text-lg text-tinta sm:text-xl md:text-2xl ${enfoque} rounded`}>
          PintaPatitas
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 text-[15px] lg:flex">
          {enlaces}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/cuadros-listos"
            aria-current={enCuadros ? "page" : undefined}
            className={`hidden min-h-11 items-center whitespace-nowrap rounded-full border px-5 text-sm font-semibold transition sm:inline-flex ${
              enCuadros
                ? "border-acento/40 bg-bruma text-acento-oscuro"
                : "border-tinta/12 bg-white/80 text-acento-oscuro hover:border-acento/30 hover:bg-white"
            } ${enfoque}`}
          >
            Cuadros listos
          </Link>
          {!enPedido && (
            <Link
              to="/catalogo"
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-acento px-4 text-sm sm:px-5 font-semibold text-white transition hover:bg-acento-oscuro ${enfoque}`}
            >
              Crear mi retrato
            </Link>
          )}
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-tinta hover:bg-white/70 lg:hidden ${enfoque}`}
          >
            {abierto ? <XMarkIcon className="h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {abierto && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="vidrio mx-auto mt-2 flex max-w-6xl flex-col rounded-[24px] p-3 text-lg lg:hidden"
        >
          <Link
            to="/"
            onClick={() => {
              setAbierto(false);
              window.scrollTo({ top: 0 });
            }}
            className={`flex min-h-11 items-center rounded-full px-3 text-tinta/75 hover:text-tinta ${enfoque}`}
          >
            Inicio
          </Link>
          {enlaces}
        </nav>
      )}
    </header>
  );
}
