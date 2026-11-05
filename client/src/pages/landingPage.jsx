import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CheckIcon, XMarkIcon, TruckIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useCatalogoPublico } from "./pedido/useCatalogoPublico";
import { clp } from "./pedido/pasos";
import { MAX_FOTOS } from "./pedido/imagenes";
import { MOSTRAR_AVISOS, obras, testimonios, FRASE_CONFIANZA, TIEMPO_PRODUCCION } from "./landing/contenido";
import { BotonPedido, Encabezado, FaltaMaterial, Huella, Imagen, Mancha, Ramita, Revelar } from "./landing/ui";
import Galeria from "./landing/Galeria";
import FotoAObra from "./landing/FotoAObra";
import Estilos from "./landing/Estilos";
import Preguntas from "./landing/Preguntas";

/* ---------- Portada ---------- */

function Portada({ desde }) {
  const obra = obras[0];
  return (
    <section aria-labelledby="portada-titulo" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-10 md:pt-16 md:pb-28">
        <div>
          <p className="text-base font-medium text-acento">Retratos personalizados de mascotas en Chile</p>
          <h1
            id="portada-titulo"
            className="mt-5 font-display text-[clamp(2.3rem,7vw,4.6rem)] leading-[1.02] text-tinta"
          >
            Un retrato de tu mascota para tenerla siempre cerca.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-tinta/70">
            Nos envías sus fotos y nos cuentas cómo es. Un artista la retrata en el estilo que
            elijas, y cada obra es tan única como ella.
          </p>
          <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <BotonPedido>Crear mi retrato</BotonPedido>
            <a
              href="#galeria"
              className="inline-flex min-h-11 items-center text-base font-medium text-acento underline decoration-acento/30 underline-offset-4 hover:decoration-acento"
            >
              Ver retratos terminados
            </a>
          </div>
          <p className="mt-6 max-w-sm text-sm text-tinta/60">
            Envías tu solicitud sin pagar. Solo pagas si el artista la acepta.
          </p>
          {FRASE_CONFIANZA && <p className="mt-2 text-sm font-medium text-tinta">{FRASE_CONFIANZA}</p>}
        </div>

        {obra && (
          <div className="relative">
            <Mancha className="animate-flotar absolute -top-6 -right-10 h-72 w-72 text-cielo/45 md:h-96 md:w-96" />
            <Ramita className="absolute -bottom-2 -left-4 h-40 w-32 -rotate-12 text-salvia md:-left-10" />
            <figure className="relative mx-auto w-full max-w-[460px]">
              <svg aria-hidden="true" viewBox="0 0 200 60" className="mx-auto -mb-1 block h-12 w-48 text-tinta/40">
                <circle cx="100" cy="6" r="4" fill="currentColor" />
                <path d="M100 8 L22 58 M100 8 L178 58" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="animate-colgar origin-top rounded-[6px] bg-bastidor p-3 shadow-[0_30px_50px_-20px_rgba(20,42,53,0.55)] md:p-4">
                <div className="overflow-hidden rounded-[2px] bg-white p-2 md:p-3">
                  <Imagen
                    obra={obra}
                    prioridad
                    sizes="(min-width: 768px) 430px, 88vw"
                    className="aspect-[4/5] h-auto w-full object-cover object-[58%_center]"
                  />
                </div>
              </div>
              {desde != null && (
                <figcaption className="vidrio absolute -bottom-6 left-3 rounded-2xl px-5 py-3.5 text-sm text-tinta md:-left-12 md:bottom-10">
                  <span className="block text-tinta/65">Retratos desde</span>
                  <strong className="font-display text-2xl">{clp(desde)}</strong>
                </figcaption>
              )}
            </figure>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Cómo funciona ---------- */

const pasos = [
  ["Elige tu estilo", "Acrílico, lápiz o digital: cada uno cuenta a tu mascota a su manera."],
  ["Cuéntanos sobre tu mascota", "Tamaño, cuántas mascotas van en el cuadro, sus nombres y cómo te la imaginas."],
  ["Sube sus fotos", `Hasta ${MAX_FOTOS} fotos para que el artista conozca bien su carita y sus colores.`],
  ["Revisamos tu solicitud", "El artista la revisa antes de comenzar. Hasta ese momento no pagas nada."],
  ["Pagas y comienza tu obra", "Te llega por correo el enlace de Mercado Pago para el abono. El saldo se paga cuando la obra está lista, antes del envío."],
];

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-titulo" className="scroll-mt-24 border-y border-white/60 bg-papel/70 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="como-titulo" titulo="Cómo funciona">
          Pedir tu retrato toma unos minutos. Lo que viene después lo cuidamos nosotros.
        </Encabezado>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pasos.map(([titulo, texto], i) => {
            const revision = i === 3;
            return (
              <li
                key={titulo}
                className={`rounded-[22px] p-6 ${revision ? "bg-acento-oscuro text-white shadow-[0_24px_40px_-24px_rgb(19_48_61/0.7)]" : "arcilla"}`}
              >
                <span className={`font-display text-4xl ${revision ? "text-cielo" : "text-acento"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
                <p className={`mt-2 leading-relaxed ${revision ? "text-white/80" : "text-tinta/70"}`}>{texto}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-12">
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
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
        <div>
          <Encabezado id="perso-titulo" claro titulo="Tú nos cuentas cómo quieres recordarla. Nosotros la convertimos en arte." />
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4">
            {personalizable.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/85">
                <CheckIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-cielo" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-md leading-relaxed text-white/70">
            Cada retrato lo hace una persona, no un filtro. El artista estudia sus fotos, revisa tu
            idea antes de comenzar y trabaja cada detalle, por eso no hay dos obras iguales.
          </p>
        </div>

        {/* Ejemplo ilustrativo de lo que se completa en el formulario real */}
        <Revelar>
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

const fotosBuenas = ["Buena luz, de día y sin flash", "La mascota enfocada", "Rostro y ojos bien visibles", "Buena resolución, sin filtros"];
const fotosDificiles = ["Muy oscuras", "Movidas o borrosas", "La mascota muy lejos", "El rostro tapado o de espalda"];

function GuiaFotos() {
  return (
    <section aria-labelledby="fotos-titulo" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="fotos-titulo" titulo="¿Qué fotos necesito?">
          No necesitas una cámara profesional, basta con el celular. Puedes subir hasta {MAX_FOTOS}{" "}
          fotos: suma una de cerca de su cara y otras donde se vean bien sus colores.
        </Encabezado>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            ["Funcionan muy bien", fotosBuenas, CheckIcon, "bg-acento text-white"],
            ["Nos cuestan más", fotosDificiles, XMarkIcon, "bg-bruma text-acento-oscuro"],
          ].map(([titulo, items, Icono, chip]) => (
            <Revelar key={titulo} className="arcilla rounded-[26px] p-7 md:p-9">
              <h3 className="font-display text-2xl text-tinta">{titulo}</h3>
              <ul className="mt-6 space-y-4">
                {items.map((t) => (
                  <li key={t} className="flex items-center gap-4 text-tinta/80">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chip}`}>
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

function Testimonios() {
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
    <section aria-labelledby="testimonios-titulo" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="testimonios-titulo" titulo="Lo que dicen sus familias" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonios.map((t) => (
            <li key={t.texto} className="arcilla rounded-[26px] p-7">
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
    [MapPinIcon, "A todo Chile", "Enviamos los cuadros por Starken a la dirección que indiques."],
    [TruckIcon, "Envío por cuenta del cliente", "Su costo depende del destino y se cotiza al confirmar tu pedido."],
    [ClockIcon, "Tiempo de trabajo", `${TIEMPO_PRODUCCION[0].toUpperCase()}${TIEMPO_PRODUCCION.slice(1)}, según el artista y el pedido.`],
  ];
  return (
    <section aria-labelledby="envios-titulo" className="px-5 md:px-10">
      <div className="vidrio mx-auto max-w-6xl rounded-[32px] px-6 py-12 md:px-14 md:py-16">
        <Encabezado id="envios-titulo" titulo="Envíos a todo Chile" />
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
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
    <section aria-labelledby="cierre-titulo" className="px-5 pb-20 md:px-10 md:pb-28">
      <div className="fondo-pincel relative mx-auto max-w-6xl overflow-hidden rounded-[32px] px-7 py-14 text-white md:px-14 md:py-20">
        <Ramita className="absolute -right-4 -bottom-6 h-56 w-44 rotate-[18deg] text-cielo/25" />
        <div className="relative max-w-xl">
          <h2 id="cierre-titulo" className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]">
            ¿Ya elegiste su mejor foto?
          </h2>
          <p className="mt-4 text-lg text-white/75">
            Con eso basta para empezar. Ves el precio antes de enviar tu solicitud y no pagas nada
            hasta que el artista la acepta.
          </p>
          <BotonPedido variante="claro" className="mt-9">
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
  const { hash } = useLocation();
  const desde = catalogo.estilos.length ? Math.min(...catalogo.estilos.map((e) => e.desde)) : null;

  // Navegación con ancla desde otras páginas (p. ej. /#estilos)
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="fondo-acuarela text-tinta">
      <Portada desde={desde} />
      <Galeria estilos={catalogo.estilos} />
      {/* Futuro: <ObrasDisponibles /> (obras ya pintadas a la venta) encaja aquí, junto a la galería. */}
      <FotoAObra />
      <ComoFunciona />
      <Estilos {...catalogo} />
      <Personalizacion />
      <GuiaFotos />
      <Testimonios />
      <Envios />
      <Preguntas estilos={catalogo.estilos} />
      <Cierre />
    </div>
  );
}
