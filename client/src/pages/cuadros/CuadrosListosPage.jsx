import { useEffect, useMemo, useState } from "react";
import { SparklesIcon, TruckIcon, HeartIcon } from "@heroicons/react/24/outline";
import { BotonPedido, Encabezado, Huella, Ramita } from "@/pages/landing/ui";
import TarjetaCuadro from "./TarjetaCuadro";
import { useCuadrosDisponibles, useInstagramUrl } from "./datos";

const promesas = [
  [SparklesIcon, "Obra única", "Pintada a mano. No hay otra igual."],
  [HeartIcon, "Lista para llevar", "Ya está terminada, no hay que esperar."],
  [TruckIcon, "Envío por Starken", "A todo Chile. El envío lo pagas al recibir."],
];

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";

export default function CuadrosListosPage() {
  const { cuadros, cargado } = useCuadrosDisponibles();
  const instagramUrl = useInstagramUrl();
  const [filtro, setFiltro] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const anterior = document.title;
    document.title = "Directo a tu pared · Cuadros listos | PintaPatitas";
    return () => {
      document.title = anterior;
    };
  }, []);

  const tecnicas = useMemo(() => {
    const vistas = new Map();
    cuadros.forEach((c) => c.tecnicaSlug && vistas.set(c.tecnicaSlug, c.tecnica));
    return [...vistas];
  }, [cuadros]);
  const visibles = filtro ? cuadros.filter((c) => c.tecnicaSlug === filtro) : cuadros;

  return (
    <div className="fondo-acuarela text-tinta">
      {/* Encabezado */}
      <section aria-labelledby="cuadros-titulo" className="relative overflow-hidden">
        <Ramita className="pointer-events-none absolute -top-4 -right-6 hidden h-56 w-44 rotate-[18deg] text-cielo/40 md:block" />
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-8 md:px-10 md:pt-16 md:pb-12">
          <p className="text-base font-medium text-acento">Cuadros listos</p>
          <h1 id="cuadros-titulo" className="mt-2 font-display text-[clamp(2.3rem,7vw,4.6rem)] leading-[1.04] text-tinta md:mt-4">
            Directo a tu pared
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-tinta/70 md:mt-6 md:text-lg">
            Obras originales que ya están pintadas y listas para llevar. Hay solo una de cada una: cuando alguien la
            compra, desaparece de aquí.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-3 md:mt-10 md:gap-4">
            {promesas.map(([Icono, titulo, texto]) => (
              <li key={titulo} className="arcilla flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 sm:items-start sm:rounded-[22px] sm:p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
                  <Icono aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block font-semibold text-tinta">{titulo}</strong>
                  <span className="block text-sm leading-snug text-tinta/65">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cuadros */}
      <section aria-label="Cuadros disponibles" className="pb-14 md:pb-24">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          {tecnicas.length > 1 && (
            <div role="group" aria-label="Filtrar por técnica" className="mb-6 flex flex-wrap gap-2 md:mb-8">
              {[[null, "Todos"], ...tecnicas].map(([slug, nombre]) => (
                <button
                  key={slug ?? "todos"}
                  type="button"
                  aria-pressed={filtro === slug}
                  onClick={() => setFiltro(slug)}
                  className={`min-h-11 rounded-full px-5 text-sm font-medium transition ${enfoque} ${
                    filtro === slug ? "bg-tinta text-white" : "bg-white/70 text-tinta hover:bg-white"
                  }`}
                >
                  {nombre}
                </button>
              ))}
            </div>
          )}

          {!cargado ? (
            <ul aria-label="Cargando cuadros" className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
              {[0, 1, 2].map((i) => (
                <li key={i} className={i === 2 ? "hidden lg:block" : ""}>
                  <span className="block aspect-[4/5] animate-pulse rounded-[18px] bg-bastidor/70" />
                  <span className="mt-3 block h-5 w-2/3 animate-pulse rounded-full bg-bastidor/70" />
                  <span className="mt-2 block h-4 w-1/3 animate-pulse rounded-full bg-bastidor/60" />
                </li>
              ))}
            </ul>
          ) : cuadros.length === 0 ? (
            <div className="arcilla relative overflow-hidden rounded-[26px] px-6 py-12 text-center md:rounded-[32px] md:py-16">
              <Huella className="mx-auto h-12 w-12 text-cielo" />
              <h2 className="mt-4 font-display text-2xl text-tinta md:text-3xl">Por ahora no hay cuadros disponibles</h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-tinta/70">
                Los cuadros listos se venden rápido. Vuelve pronto
                {instagramUrl ? " o síguenos en Instagram para ver los nuevos apenas salgan" : ""}.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-12 items-center justify-center rounded-full border border-tinta/15 bg-white/80 px-7 font-semibold text-acento-oscuro transition hover:bg-white ${enfoque}`}
                  >
                    Ver Instagram
                  </a>
                )}
                <BotonPedido>Pedir un retrato de mi mascota</BotonPedido>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
              {visibles.map((c) => (
                <li key={c.id}>
                  <TarjetaCuadro cuadro={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Cierre: invitar al retrato personalizado */}
      <section aria-labelledby="cuadros-cierre" className="px-5 pb-14 md:px-10 md:pb-28">
        <div className="fondo-pincel relative mx-auto max-w-6xl overflow-hidden rounded-[26px] px-6 py-10 text-white md:rounded-[32px] md:px-14 md:py-16">
          <Huella className="absolute -right-6 -bottom-6 h-40 w-40 rotate-12 text-white/5" />
          <div className="relative max-w-xl">
            <Encabezado id="cuadros-cierre" claro titulo="¿Quieres uno de tu propia mascota?">
              Envíanos sus fotos y la pintamos en el estilo que elijas.
            </Encabezado>
            <BotonPedido variante="claro" className="mt-7 w-full sm:w-auto md:mt-9">
              Crear mi retrato
            </BotonPedido>
          </div>
        </div>
      </section>
    </div>
  );
}
