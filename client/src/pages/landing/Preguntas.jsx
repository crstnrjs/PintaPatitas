import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { MAX_FOTOS, MAX_ORIGINAL_MB } from "../pedido/imagenes";
import { Encabezado } from "./ui";

/*
 * Solo las dudas que pueden frenar un pedido. Estilos, envíos y plazos ya se muestran
 * en sus propias secciones de la landing, así que no se repiten aquí.
 * Respuestas basadas en cómo funciona hoy el sistema de solicitudes y pagos, y en los Términos.
 */
const preguntas = [
  [
    "¿Cómo hago mi pedido?",
    "Toca “Crear mi retrato”, elige estilo y tamaño, cuéntanos tu idea y sube sus fotos. El artista revisa tu solicitud y, si la acepta, te llega por correo el enlace de pago.",
  ],
  [
    "¿Cuánto cuesta?",
    "Depende de la técnica, el tamaño y cuántas mascotas incluyas. Antes de enviar tu solicitud ves el precio exacto.",
  ],
  [
    "¿Cuántas fotos puedo subir?",
    `Hasta ${MAX_FOTOS} fotos de máximo ${MAX_ORIGINAL_MB} MB cada una. Con una basta para continuar.`,
  ],
  [
    "¿Cuándo y cómo pago?",
    "Al enviar la solicitud no pagas nada, y si no es aceptada no se cobra. Si el artista la acepta, pagas un abono por Mercado Pago (débito, crédito o dinero en cuenta) y el saldo cuando la obra está lista, antes del envío.",
  ],
  [
    "¿Puedo pedir cambios?",
    <>
      Sí: avísanos cuanto antes, antes de que avance la obra. Si se puede modificar depende de su
      etapa. El detalle está en los{" "}
      <Link to="/terminos" className="font-medium text-acento underline underline-offset-4">
        Términos
      </Link>
      .
    </>,
  ],
];

export default function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-24 py-14 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-[0.8fr_1.2fr] md:gap-12 md:px-10">
        <Encabezado id="preguntas-titulo" titulo="Preguntas frecuentes" />
        <div className="divide-y divide-tinta/10 border-y border-tinta/10">
          {preguntas.map(([p, r]) => (
            <details key={p} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-3.5 text-base font-medium text-tinta marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta md:min-h-14 md:py-5 md:text-lg [&::-webkit-details-marker]:hidden">
                {p}
                <PlusIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-acento transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="max-w-[62ch] pb-5 text-sm leading-relaxed text-tinta/70 md:pb-6 md:text-base">{r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
