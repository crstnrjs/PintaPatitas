import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Huella } from "@/pages/landing/ui";

/*
 * Página a la que vuelve Mercado Pago (back_urls). Solo informa: el estado real del
 * pago lo confirma el webhook, nunca los parámetros de esta URL.
 * tipo=cuadro → compra de un cuadro listo; sin tipo → abono o saldo de un retrato.
 */
const TEXTOS = {
  exitoso: {
    icono: CheckCircleIcon,
    color: "bg-[#e1f0e6] text-[#2d6844]",
    cuadro: {
      titulo: "¡Gracias por tu compra!",
      texto: "Recibimos tu pago y te enviamos la confirmación por correo. Prepararemos tu cuadro y lo despacharemos por Starken; el envío lo pagas al recibirlo.",
    },
    retrato: {
      titulo: "¡Recibimos tu pago!",
      texto: "Gracias por confiar en nosotros. Te escribiremos por correo con los próximos pasos de tu retrato.",
    },
  },
  pendiente: {
    icono: ClockIcon,
    color: "bg-[#faefd9] text-[#865710]",
    cuadro: {
      titulo: "Tu pago está en revisión",
      texto: "Mercado Pago está confirmando tu pago. Apenas se apruebe te llegará un correo con la confirmación de tu compra.",
    },
    retrato: {
      titulo: "Tu pago está en revisión",
      texto: "Mercado Pago está confirmando tu pago. Te avisaremos por correo apenas se acredite.",
    },
  },
  fallido: {
    icono: XCircleIcon,
    color: "bg-[#f7e3e1] text-[#963a31]",
    cuadro: {
      titulo: "El pago no se completó",
      texto: "No se hizo ningún cobro. Tu cuadro sigue reservado unos minutos: puedes volver a intentarlo con los mismos datos.",
    },
    retrato: {
      titulo: "El pago no se completó",
      texto: "No se hizo ningún cobro. Puedes volver a intentarlo desde el enlace de pago que te enviamos por correo.",
    },
  },
};

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";
const boton = `inline-flex min-h-12 items-center justify-center rounded-full px-7 font-semibold transition ${enfoque}`;

export default function ResultadoPago({ resultado }) {
  const [params] = useSearchParams();
  const esCuadro = params.get("tipo") === "cuadro";
  const slug = params.get("cuadro");
  const t = TEXTOS[resultado];
  const { titulo, texto } = esCuadro ? t.cuadro : t.retrato;
  const Icono = t.icono;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const anterior = document.title;
    document.title = `${titulo} | PintaPatitas`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);

  return (
    <div className="fondo-acuarela px-5 py-12 md:px-10 md:py-24">
      <div className="arcilla relative mx-auto max-w-xl overflow-hidden rounded-[26px] px-6 py-10 text-center md:rounded-[32px] md:px-12 md:py-14">
        <Huella className="absolute -right-6 -bottom-8 h-32 w-32 rotate-12 text-cielo/15" />
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${t.color}`}>
          <Icono aria-hidden="true" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.08] text-tinta">{titulo}</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-tinta/70">{texto}</p>

        <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {resultado === "fallido" && esCuadro && slug ? (
            <Link to={`/cuadros-listos/${encodeURIComponent(slug)}`} className={`${boton} bg-acento text-white hover:bg-acento-oscuro`}>
              Volver a intentarlo
            </Link>
          ) : esCuadro ? (
            <Link to="/cuadros-listos" className={`${boton} bg-acento text-white hover:bg-acento-oscuro`}>
              Ver más cuadros
            </Link>
          ) : null}
          <Link to="/" className={`${boton} border border-tinta/15 bg-white/80 text-acento-oscuro hover:bg-white`}>
            Volver al inicio
          </Link>
        </div>

        {resultado !== "exitoso" && (
          <p className="relative mt-7 text-sm leading-relaxed text-tinta/60">
            ¿Tuviste un problema con el pago?{" "}
            <Link
              to="/soporte?motivo=pago"
              className="font-medium text-acento underline underline-offset-4 hover:text-acento-oscuro"
            >
              Escríbenos a soporte
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
