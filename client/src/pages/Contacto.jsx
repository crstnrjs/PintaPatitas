import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChatBubbleLeftRightIcon, EnvelopeIcon, MapPinIcon, CameraIcon } from "@heroicons/react/24/outline";
import { Huella } from "@/pages/landing/ui";
import { CONTACTO } from "@/lib/contacto";

const enfoque = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta";

const canales = [
  {
    icono: ChatBubbleLeftRightIcon,
    titulo: "WhatsApp",
    valor: CONTACTO.telefono,
    texto: "La forma más rápida de resolver dudas.",
    href: CONTACTO.whatsappUrl,
    externo: true,
    accion: "Escribir por WhatsApp",
  },
  {
    icono: EnvelopeIcon,
    titulo: "Correo",
    valor: CONTACTO.email,
    texto: "Para consultas con más detalle o sobre un pedido.",
    href: `mailto:${CONTACTO.email}`,
    accion: "Enviar un correo",
  },
  {
    icono: CameraIcon,
    titulo: "Instagram",
    valor: CONTACTO.instagramUsuario,
    texto: "Mira los últimos retratos y cuadros disponibles.",
    href: CONTACTO.instagramUrl,
    externo: true,
    accion: "Ver Instagram",
  },
];

export default function Contacto() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const anterior = document.title;
    document.title = "Contacto | PintaPatitas";
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="fondo-acuarela text-tinta">
      <div className="mx-auto max-w-6xl px-5 pt-8 pb-14 md:px-10 md:pt-16 md:pb-24">
        <p className="text-base font-medium text-acento">Contacto</p>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,6.5vw,4.2rem)] leading-[1.04] md:mt-4">Hablemos de tu retrato</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-tinta/70 md:mt-6 md:text-lg">
          ¿Tienes dudas antes de pedir, o quieres saber cómo va tu pedido? Escríbenos por el canal que prefieras.
        </p>

        <ul className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
          {canales.map(({ icono: Icono, titulo, valor, texto, href, externo, accion }) => (
            <li key={titulo} className="arcilla flex flex-col rounded-[22px] p-5 md:rounded-[26px] md:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
                <Icono aria-hidden="true" className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-2xl">{titulo}</h2>
              <p className="mt-1 font-medium break-words text-acento-oscuro">{valor}</p>
              <p className="mt-2 text-sm leading-relaxed text-tinta/65">{texto}</p>
              <a
                href={href}
                {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-acento px-6 font-semibold text-white shadow-[0_6px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 md:mt-auto ${enfoque}`}
              >
                {accion}
              </a>
            </li>
          ))}
        </ul>

        <div className="vidrio mt-8 flex flex-col gap-5 rounded-[26px] px-5 py-7 sm:flex-row sm:items-center sm:justify-between md:mt-12 md:rounded-[32px] md:px-10 md:py-9">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
              <MapPinIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">
                {CONTACTO.ciudad}, región de {CONTACTO.region}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-tinta/65">
                Atendemos en línea y enviamos por Starken a todo Chile (envío por pagar).
              </p>
            </div>
          </div>
          <Link
            to="/catalogo"
            className={`inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-tinta/15 bg-white/80 px-7 font-semibold text-acento-oscuro transition hover:bg-white ${enfoque}`}
          >
            Crear mi retrato
          </Link>
        </div>

        <p className="mt-10 text-sm leading-relaxed text-tinta/55">
          <Huella className="mr-1.5 inline h-4 w-4 align-[-2px] text-cielo" />
          Antes de escribir, quizás tu duda ya está en las{" "}
          <Link to={{ pathname: "/", hash: "#preguntas" }} className="font-medium text-acento underline underline-offset-4">
            preguntas frecuentes
          </Link>
          . ¿Tienes un problema con un pedido, un pago o un envío? Escríbenos desde{" "}
          <Link to="/soporte" className="font-medium text-acento underline underline-offset-4">
            soporte
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
