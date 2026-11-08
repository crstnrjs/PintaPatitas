import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ClockIcon,
  MagnifyingGlassPlusIcon,
  SparklesIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { clp } from "@/pages/pedido/pasos";
import { BotonPedido, Huella } from "@/pages/landing/ui";
import { fotoCuadro, medidasCuadro, useCuadro, useInstagramUrl } from "./datos";
import FormularioCompra from "./FormularioCompra";

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";

function Volver() {
  return (
    <Link
      to="/cuadros-listos"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-medium text-acento transition hover:text-acento-oscuro ${enfoque}`}
    >
      <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
      Todos los cuadros
    </Link>
  );
}

/* Foto principal enmarcada + miniaturas. En móvil las miniaturas se deslizan. */
function Fotos({ cuadro }) {
  const [actual, setActual] = useState(0);
  const dialogo = useRef(null);
  const fotos = cuadro.fotos;
  const principal = fotos[actual];

  return (
    <div>
      <div className="rounded-[6px] bg-bastidor p-2.5 shadow-[0_30px_50px_-20px_rgba(20,42,53,0.55)] md:p-4">
        <button
          type="button"
          onClick={() => dialogo.current?.showModal()}
          className="group relative block w-full overflow-hidden rounded-[2px] bg-white p-1.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta md:p-3"
        >
          {principal ? (
            <img
              src={fotoCuadro(principal)}
              alt={`${cuadro.titulo}, foto ${actual + 1} de ${fotos.length}`}
              fetchPriority="high"
              className="mx-auto max-h-[70vh] w-full object-contain"
            />
          ) : (
            <span className="block aspect-[4/5] bg-bruma" />
          )}
          <span className="vidrio absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full text-tinta opacity-90 transition group-hover:opacity-100 md:right-5 md:bottom-5">
            <MagnifyingGlassPlusIcon aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Ver en grande</span>
          </span>
        </button>
      </div>

      {fotos.length > 1 && (
        <ul aria-label="Fotos del cuadro" className="-mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
          {fotos.map((path, i) => (
            <li key={path} className="shrink-0">
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual}
                className={`block overflow-hidden rounded-xl p-0.5 transition ${enfoque} ${
                  i === actual ? "bg-acento" : "bg-white/70 opacity-75 hover:opacity-100"
                }`}
              >
                <img src={fotoCuadro(path)} alt="" loading="lazy" className="h-16 w-16 rounded-[10px] object-cover md:h-20 md:w-20" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogo}
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        aria-label={cuadro.titulo}
        className="m-auto max-h-[92vh] max-w-[min(92vw,1000px)] overflow-visible bg-transparent p-0 backdrop:bg-tinta/80"
      >
        {principal && (
          <div className="relative">
            <img src={fotoCuadro(principal)} alt={cuadro.titulo} className="max-h-[88vh] w-auto rounded-xl object-contain" />
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
    </div>
  );
}

/* Botón "Comprar" que despliega el formulario; si hay una compra en curso, se avisa. */
function Compra({ cuadro, instagramUrl }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  function abrir() {
    setAbierto(true);
    requestAnimationFrame(() => caja.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (abierto) {
    return (
      <div ref={caja} className="arcilla scroll-mt-28 rounded-[22px] p-5 md:p-6">
        <FormularioCompra cuadro={cuadro} onCancelar={() => setAbierto(false)} />
      </div>
    );
  }

  if (cuadro.enCompra) {
    return (
      <div className="rounded-[22px] bg-[#faefd9] p-5 text-[#6e470d]">
        <div className="flex gap-3">
          <ClockIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed">
            <strong className="block font-semibold">Alguien está comprando este cuadro ahora.</strong>
            Si la compra no se concreta, volverá a estar disponible en unos minutos.
          </p>
        </div>
        <button type="button" onClick={abrir} className={`mt-3 min-h-11 text-sm font-semibold underline underline-offset-4 ${enfoque}`}>
          ¿Eres tú? Retoma tu compra
        </button>
      </div>
    );
  }

  return (
    <div className="arcilla rounded-[22px] p-5 md:p-6">
      <button
        type="button"
        onClick={abrir}
        className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-acento px-7 py-3.5 text-base font-semibold text-white shadow-[0_6px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 ${enfoque}`}
      >
        Comprar este cuadro
      </button>
      <p className="mt-3 text-center text-sm leading-relaxed text-tinta/65">
        Pago seguro con Mercado Pago: tarjetas de débito, crédito o saldo en tu cuenta.
        {instagramUrl && (
          <>
            {" "}¿Dudas?{" "}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-acento underline underline-offset-4">
              Escríbenos por Instagram
            </a>
            .
          </>
        )}
      </p>
    </div>
  );
}

export default function CuadroDetalle() {
  const { slug } = useParams();
  const { cuadro, cargado } = useCuadro(slug);
  const instagramUrl = useInstagramUrl();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (!cuadro) return;
    const anterior = document.title;
    document.title = `${cuadro.titulo} · Directo a tu pared | PintaPatitas`;
    return () => {
      document.title = anterior;
    };
  }, [cuadro]);

  if (!cargado) {
    return (
      <div className="fondo-acuarela">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-6 pb-14 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-10 md:pt-12" aria-label="Cargando cuadro">
          <span className="block aspect-[4/5] animate-pulse rounded-[6px] bg-bastidor/70" />
          <div className="space-y-4 md:pt-10">
            <span className="block h-12 w-3/4 animate-pulse rounded-2xl bg-bastidor/70" />
            <span className="block h-8 w-1/3 animate-pulse rounded-2xl bg-bastidor/60" />
            <span className="block h-32 animate-pulse rounded-[22px] bg-bastidor/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!cuadro) {
    return (
      <div className="fondo-acuarela px-5 py-14 md:px-10 md:py-24">
        <div className="arcilla mx-auto max-w-xl rounded-[26px] px-6 py-12 text-center md:rounded-[32px]">
          <Huella className="mx-auto h-12 w-12 text-cielo" />
          <h1 className="mt-4 font-display text-3xl text-tinta">Este cuadro ya no está disponible</h1>
          <p className="mt-3 leading-relaxed text-tinta/70">Puede que ya haya encontrado hogar. Mira los otros cuadros listos.</p>
          <Link
            to="/cuadros-listos"
            className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-acento px-7 font-semibold text-white transition hover:bg-acento-oscuro ${enfoque}`}
          >
            Ver cuadros disponibles
          </Link>
        </div>
      </div>
    );
  }

  const medidas = medidasCuadro(cuadro);
  const datos = [
    ["Técnica", cuadro.tecnica],
    ["Medidas", medidas],
  ].filter(([, v]) => v);

  return (
    <div className="fondo-acuarela text-tinta">
      <div className="mx-auto max-w-6xl px-5 pt-3 pb-14 md:px-10 md:pt-8 md:pb-24">
        <Volver />

        <div className="mt-3 grid items-start gap-8 md:mt-6 md:grid-cols-[1.1fr_1fr] md:gap-14">
          {/* La foto acompaña al bajar mientras se completa el formulario de compra. */}
          <div className="md:sticky md:top-28">
            <Fotos key={cuadro.id} cuadro={cuadro} />
          </div>

          <div>
            <p className="text-base font-medium text-acento">Obra única · lista para llevar</p>
            <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] text-tinta">{cuadro.titulo}</h1>
            <p className="mt-3 font-display text-3xl text-acento-oscuro md:mt-4">{clp(cuadro.precio)}</p>

            {datos.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {datos.map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/70 px-4 py-3">
                    <dt className="text-sm text-tinta/55">{k}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {cuadro.descripcion && (
              <p className="mt-6 leading-relaxed whitespace-pre-line text-tinta/75">{cuadro.descripcion}</p>
            )}

            <div className="mt-7">
              <Compra cuadro={cuadro} instagramUrl={instagramUrl} />
            </div>

            <ul className="mt-7 space-y-4">
              {[
                [TruckIcon, "Envío por Starken a todo Chile", "Se despacha por pagar: el costo del envío lo pagas al recibirlo."],
                // Un cuadro digital no está "pintado a mano": se describe como obra original.
                [
                  SparklesIcon,
                  cuadro.tecnicaSlug === "digital" ? "Obra original" : "Pintado a mano",
                  "Es la única copia. Cuando se vende, sale de la tienda.",
                ],
              ].map(([Icono, titulo, texto]) => (
                <li key={titulo} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
                    <Icono aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="block font-semibold text-tinta">{titulo}</strong>
                    <span className="mt-0.5 block text-sm leading-relaxed text-tinta/70">{texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="vidrio mt-14 flex flex-col items-start gap-5 rounded-[26px] px-5 py-7 sm:flex-row sm:items-center sm:justify-between md:mt-20 md:rounded-[32px] md:px-10 md:py-9">
          <div>
            <p className="font-display text-2xl text-tinta">¿Prefieres uno de tu mascota?</p>
            <p className="mt-1 text-tinta/70">Te lo pintamos a partir de sus fotos.</p>
          </div>
          <BotonPedido className="w-full sm:w-auto">Crear mi retrato</BotonPedido>
        </div>
      </div>
    </div>
  );
}
