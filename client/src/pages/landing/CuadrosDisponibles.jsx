import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import TarjetaCuadro from "@/pages/cuadros/TarjetaCuadro";
import { useCuadrosDisponibles } from "@/pages/cuadros/datos";
import { Encabezado } from "./ui";

const MAXIMO = 4;

/* Vitrina de cuadros ya pintados a la venta. Se oculta si no hay ninguno. */
export default function CuadrosDisponibles() {
  const { cuadros } = useCuadrosDisponibles();
  if (cuadros.length === 0) return null;
  const vitrina = cuadros.slice(0, MAXIMO);

  const verTodos = (
    <Link
      to="/cuadros-listos"
      className="inline-flex min-h-11 items-center gap-2 rounded-full text-base font-medium text-acento underline decoration-acento/30 underline-offset-4 transition hover:decoration-acento focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
    >
      Ver {cuadros.length > MAXIMO ? `los ${cuadros.length} cuadros` : "todos los cuadros"}
      <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />
    </Link>
  );

  return (
    <section id="cuadros-listos" aria-labelledby="cuadros-listos-titulo" className="scroll-mt-24 border-y border-white/60 bg-papel/60 py-14 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Encabezado id="cuadros-listos-titulo" titulo="Directo a tu pared">
            Cuadros que ya están pintados y listos para llevar. Hay solo uno de cada uno.
          </Encabezado>
          <div className="hidden sm:block">{verTodos}</div>
        </div>

        {/* Móvil: carrusel deslizable. Desde sm: grilla. */}
        <ul
          className={`-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 ${
            vitrina.length >= MAXIMO ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {vitrina.map((c) => (
            <li key={c.id} className="w-[68%] shrink-0 snap-center sm:w-auto">
              <TarjetaCuadro cuadro={c} />
            </li>
          ))}
        </ul>

        <div className="mt-6 sm:hidden">{verTodos}</div>
      </div>
    </section>
  );
}
