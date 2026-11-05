import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CheckIcon, XMarkIcon, TruckIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useCatalogoPublico } from "./pedido/useCatalogoPublico";
import { clp } from "./pedido/pasos";
import { MAX_FOTOS } from "./pedido/imagenes";
import { MOSTRAR_AVISOS, TIEMPO_PRODUCCION } from "./landing/contenido";
import { useContenidoLanding } from "./landing/useContenidoLanding";
import { obras as obrasIniciales } from "./landing/contenido";
import { BotonPedido, Encabezado, FaltaMaterial, Huella, Imagen, Ramita, Revelar } from "./landing/ui";
import Galeria from "./landing/Galeria";
import FotoAObra from "./landing/FotoAObra";
import Estilos from "./landing/Estilos";
import Preguntas from "./landing/Preguntas";

/* ---------- Portada ---------- */

function Portada({ desde, fraseConfianza }) {
  return (
    <section aria-labelledby="portada-titulo" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-14 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-10 md:pt-16 md:pb-28">
        {/* En móvil la imagen va primero; en escritorio, a la derecha del texto */}
        <div className="relative md:order-last">
          <figure className="relative mx-auto w-full max-w-[460px]">
            <div className="rounded-[6px] bg-bastidor p-2.5 shadow-[0_30px_50px_-20px_rgba(20,42,53,0.55)] md:p-4">
              <div className="overflow-hidden rounded-[2px] bg-white p-1.5 md:p-3">
                <Imagen
                  obra={obrasIniciales[0]}
                  prioridad
                  sizes="(min-width: 768px) 430px, 88vw"
                  className="aspect-square h-auto w-full object-cover object-[58%_center] md:aspect-[4/5]"
                />
              </div>
            </div>
            {desde != null && (
              <figcaption className="vidrio absolute right-3 -bottom-5 rounded-2xl px-4 py-2.5 text-sm text-tinta md:right-auto md:-left-12 md:bottom-10 md:px-5 md:py-3.5">
                <span className="block text-tinta/65">Retratos desde</span>
                <strong className="font-display text-xl md:text-2xl">{clp(desde)}</strong>
              </figcaption>
            )}
          </figure>
        </div>

        <div>
          <p className="hidden text-base font-medium text-acento sm:block">Retratos personalizados de mascotas en Chile</p>
          <h1
            id="portada-titulo"
            className="font-display text-[clamp(2.1rem,7vw,4.6rem)] leading-[1.04] text-tinta sm:mt-5"
          >
            Un retrato de tu mascota para tenerla siempre cerca.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-tinta/70 md:mt-6 md:text-lg">
            Nos envías sus fotos y un artista la retrata en el estilo que elijas.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-5 sm:flex-row sm:items-center md:mt-9">
            <BotonPedido>Crear mi retrato</BotonPedido>
            <a
              href="#galeria"
              className="hidden min-h-11 items-center text-base font-medium text-acento underline decoration-acento/30 underline-offset-4 hover:decoration-acento sm:inline-flex"
            >
              Ver retratos terminados
            </a>
          </div>
          <p className="mt-3 text-sm text-tinta/60 md:mt-6 md:max-w-sm">
            Solo pagas si el artista acepta tu solicitud.
          </p>
          {fraseConfianza && <p className="mt-2 text-sm font-medium text-tinta">{fraseConfianza}</p>}
        </div>
      </div>
    </section>
  );
}

/* ---------- Cómo funciona ---------- */

const pasos = [
  ["Elige tu estilo", "Técnica, tamaño y cuántas mascotas."],
  ["Envía sus fotos y tu idea", `Hasta ${MAX_FOTOS} fotos y cómo te la imaginas.`],
  ["El artista la revisa", "Hasta que la acepta, no pagas nada."],
  ["Pagas y comienza tu obra", "Abono para comenzar, saldo antes del envío."],
];

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-titulo" className="scroll-mt-24 border-y border-white/60 bg-papel/70 py-14 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="como-titulo" titulo="Cómo funciona">
          Pedir tu retrato toma unos minutos.
        </Encabezado>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 md:mt-14 lg:grid-cols-4">
          {pasos.map(([titulo, texto], i) => {
            const revision = i === 2;
            return (
              <li
                key={titulo}
                className={`flex items-center gap-4 rounded-[18px] px-4 py-3.5 sm:block sm:rounded-[22px] sm:p-6 ${revision ? "bg-acento-oscuro text-white shadow-[0_24px_40px_-24px_rgb(19_48_61/0.7)]" : "arcilla"}`}
              >
                <span className={`w-10 shrink-0 font-display text-3xl sm:w-auto sm:text-4xl ${revision ? "text-cielo" : "text-acento"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold sm:mt-4 sm:text-lg">{titulo}</h3>
                  <p className={`mt-0.5 text-sm leading-snug sm:mt-2 sm:text-base sm:leading-relaxed ${revision ? "text-white/80" : "text-tinta/70"}`}>{texto}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 md:mt-12">
          <BotonPedido>Quiero crear el mío</BotonPedido>
        </div>
      </div>
    </section>
  );
}

/* ---------- Personalización + proceso artesanal ---------- */

const personalizable = ["Estilo y tamaño", "Cuántas mascotas", "Sus nombres", "El fondo y los colores", "Su posición", "Manchas, collares y detalles"];

function Personalizacion() {
  return (
    <section aria-labelledby="perso-titulo" className="fondo-pincel relative overflow-hidden text-white">
      <Huella className="absolute -right-6 bottom-8 h-40 w-40 rotate-12 text-white/5" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-14 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
        <div>
          <Encabezado id="perso-titulo" claro titulo="Tú nos cuentas cómo recordarla. Nosotros la convertimos en arte." />
          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:text-base md:mt-10 md:gap-x-6 md:gap-y-4">
            {personalizable.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-white/85 md:gap-3">
                <CheckIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-cielo" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-white/70 sm:text-base md:mt-10">
            Cada retrato lo hace una persona, no un filtro: no hay dos obras iguales.
          </p>
        </div>

        {/* Ejemplo ilustrativo de lo que se completa en el formulario real (solo desde tablet) */}
        <Revelar className="hidden md:block">
          <figure className="relative mx-auto max-w-md rotate-[1.5deg] rounded-[26px] bg-papel p-7 text-tinta shadow-[0_40px_60px_-30px_rgb(0_0_0/0.6)]">
            <figcaption className="text-sm text-tinta/55">Ejemplo de solicitud</figcaption>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Estilo", "Acrílico"],
                ["Mascotas", "2"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-bruma/70 px-4 py-3">
                  <dt className="text-tinta/55">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
              <div className="col-span-2 rounded-2xl bg-bruma/70 px-4 py-3">
                <dt className="text-tinta/55">Tu idea</dt>
                <dd className="mt-1 leading-relaxed">
                  Fondo azul suave, los dos juntos en el sillón. Que se vea la mancha blanca en su
                  pecho y su pañuelo rojo.
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-14 flex-1 rounded-xl bg-gradient-to-br from-bastidor to-cielo/70" />
              ))}
              <span className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-tinta/20 text-xs text-tinta/50">
                +{MAX_FOTOS - 3}
              </span>
            </div>
          </figure>
        </Revelar>
      </div>
    </section>
  );
}

/* ---------- Guía de fotos ---------- */

const fotosBuenas = ["Buena luz, sin flash", "Bien enfocada", "Rostro y ojos visibles", "Sin filtros"];
const fotosDificiles = ["Muy oscuras", "Movidas o borrosas", "Muy lejos", "Rostro tapado"];

function GuiaFotos() {
  return (
    <section aria-labelledby="fotos-titulo" className="py-14 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="fotos-titulo" titulo="¿Qué fotos necesito?">
          Basta con el celular. Sube hasta {MAX_FOTOS} fotos, idealmente una de cerca de su cara.
        </Encabezado>
        <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
          {[
            ["Funcionan muy bien", fotosBuenas, CheckIcon, "bg-acento text-white"],
            ["Nos cuestan más", fotosDificiles, XMarkIcon, "bg-bruma text-acento-oscuro"],
          ].map(([titulo, items, Icono, chip]) => (
            <Revelar key={titulo} className="arcilla rounded-[22px] p-5 md:rounded-[26px] md:p-9">
              <h3 className="font-display text-xl text-tinta md:text-2xl">{titulo}</h3>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm md:mt-6 md:grid-cols-1 md:gap-y-4 md:text-base">
                {items.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-tinta/80 md:gap-4">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8 ${chip}`}>
                      <Icono aria-hidden="true" className="h-4 w-4" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonios (solo reales) ---------- */

function Testimonios({ testimonios }) {
  if (testimonios.length === 0) {
    return MOSTRAR_AVISOS && import.meta.env.DEV ? (
      <div className="mx-auto max-w-6xl px-5 pb-10 md:px-10">
        <FaltaMaterial>
          Aquí van testimonios reales (reseñas de Instagram con autorización: texto, foto de la
          mascota y de la pintura). Agrégalos en <code>testimonios</code> de{" "}
          <code>pages/landing/contenido.js</code>. En producción la sección se oculta mientras esté vacía.
        </FaltaMaterial>
      </div>
    ) : null;
  }
  return (
    <section aria-labelledby="testimonios-titulo" className="py-14 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="testimonios-titulo" titulo="Lo que dicen sus familias" />
        <ul className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
          {testimonios.map((t) => (
            <li key={t.texto} className="arcilla rounded-[22px] p-5 md:rounded-[26px] md:p-7">
              {t.foto && <img src={t.foto} alt={t.mascota ? `Retrato de ${t.mascota}` : ""} loading="lazy" className="mb-5 aspect-square w-full rounded-2xl object-cover" />}
              <blockquote className="leading-relaxed text-tinta/80">“{t.texto}”</blockquote>
              {t.autor && <p className="mt-4 text-sm font-medium text-tinta">{t.autor}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Envíos ---------- */

function Envios() {
  const datos = [
    [MapPinIcon, "Por Starken", "A la dirección que indiques."],
    [TruckIcon, "Lo paga el cliente", "Se cotiza según el destino al confirmar."],
    [ClockIcon, "Tiempo de trabajo", `${TIEMPO_PRODUCCION[0].toUpperCase()}${TIEMPO_PRODUCCION.slice(1)}, aprox.`],
  ];
  return (
    <section aria-labelledby="envios-titulo" className="px-5 md:px-10">
      <div className="vidrio mx-auto max-w-6xl rounded-[26px] px-5 py-8 md:rounded-[32px] md:px-14 md:py-16">
        <Encabezado id="envios-titulo" titulo="Envíos a todo Chile" />
        <ul className="mt-6 grid gap-5 md:mt-10 md:grid-cols-3 md:gap-8">
          {datos.map(([Icono, titulo, texto]) => (
            <li key={titulo} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
                <Icono aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-tinta">{titulo}</h3>
                <p className="mt-1 leading-relaxed text-tinta/70">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Cierre ---------- */

function Cierre() {
  return (
    <section aria-labelledby="cierre-titulo" className="px-5 pb-14 md:px-10 md:pb-28">
      <div className="fondo-pincel relative mx-auto max-w-6xl overflow-hidden rounded-[26px] px-6 py-10 text-white md:rounded-[32px] md:px-14 md:py-20">
        <Ramita className="absolute -right-4 -bottom-6 h-56 w-44 rotate-[18deg] text-cielo/25" />
        <div className="relative max-w-xl">
          <h2 id="cierre-titulo" className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]">
            ¿Ya elegiste su mejor foto?
          </h2>
          <p className="mt-3 text-base text-white/75 md:mt-4 md:text-lg">
            Ves el precio antes de enviar y no pagas nada hasta que el artista acepta.
          </p>
          <BotonPedido variante="claro" className="mt-7 w-full sm:w-auto md:mt-9">
            Convertir a mi mascota en una obra
          </BotonPedido>
        </div>
      </div>
    </section>
  );
}

/* ---------- Página ---------- */

export default function LandingPage() {
  const catalogo = useCatalogoPublico();
  const contenido = useContenidoLanding();
  const { hash } = useLocation();
  const desde = catalogo.estilos.length ? Math.min(...catalogo.estilos.map((e) => e.desde)) : null;

  // Navegación con ancla desde otras páginas (p. ej. /#estilos)
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="fondo-acuarela text-tinta">
      <Portada desde={desde} fraseConfianza={contenido.fraseConfianza} />
      <Galeria estilos={catalogo.estilos} obras={contenido.obras} cargado={contenido.cargado} />
      {/* Futuro: <ObrasDisponibles /> (obras ya pintadas a la venta) encaja aquí, junto a la galería. */}
      <FotoAObra comparaciones={contenido.comparaciones} />
      <ComoFunciona />
      <Estilos {...catalogo} />
      <Personalizacion />
      <GuiaFotos />
      <Testimonios testimonios={contenido.testimonios} />
      <Envios />
      <Preguntas />
      <Cierre />
    </div>
  );
}
