import { PlusIcon } from "@heroicons/react/24/outline";
import { MAX_FOTOS, MAX_ORIGINAL_MB } from "../pedido/imagenes";
import { TIEMPO_PRODUCCION } from "./contenido";
import { Encabezado } from "./ui";

const lista = (nombres) =>
  nombres.length <= 1 ? nombres.join("") : `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;

/* Respuestas basadas solo en cómo funciona hoy el sistema de solicitudes y pagos. */
function armarPreguntas(estilos) {
  const nombres = estilos.map((e) => e.name.toLowerCase());
  const conMedidas = estilos.filter((e) => e.has_size).map((e) => e.name.toLowerCase());

  return [
    [
      "¿Cómo funciona el pedido?",
      "Eliges estilo y tamaño, indicas cuántas mascotas van en el cuadro, nos cuentas tu idea y subes sus fotos. Envías la solicitud, el artista la revisa y, si la acepta, te llega por correo el enlace de pago.",
    ],
    [
      "¿Cuánto cuesta?",
      "Depende de la técnica, el tamaño y la cantidad de mascotas. En la sección de estilos ves el precio “desde” de cada técnica, y antes de enviar tu solicitud ves el precio exacto del cuadro que armaste.",
    ],
    nombres.length > 0 && [
      "¿Qué estilos tienen?",
      `Hoy trabajamos en ${lista(nombres)}. Puedes ver cómo es cada uno en la sección de estilos.`,
    ],
    [
      "¿Qué tamaños hay y cuántas mascotas puedo incluir?",
      "Los tamaños y la cantidad de mascotas disponibles dependen de la técnica. Al crear tu retrato ves todas las opciones, cada una con su precio.",
    ],
    [
      "¿Cuántas fotos puedo subir y cuáles sirven?",
      `Hasta ${MAX_FOTOS} fotos, de máximo ${MAX_ORIGINAL_MB} MB cada una, y al menos una para continuar. Funcionan mejor con buena luz, sin filtros y con la cara y los ojos bien visibles.`,
    ],
    [
      "¿Puedo elegir el fondo o pedir detalles específicos?",
      "Sí. En el paso “Tu idea” puedes describir el fondo, los colores, la posición y cualquier detalle importante: una mancha, un collar, su pañuelo favorito.",
    ],
    [
      "¿Cuándo pago?",
      "Al enviar la solicitud no pagas nada. Si el artista la acepta, te llega por correo un enlace de Mercado Pago para pagar un abono y comenzar. El saldo se paga cuando la obra está lista, antes del envío. Puedes pagar con débito, crédito o dinero en cuenta de Mercado Pago.",
    ],
    [
      "¿Qué pasa si mi solicitud no es aceptada?",
      "No se te cobra nada. El pago solo se pide después de que el artista acepta tu solicitud.",
    ],
    [
      "¿Cuánto demora?",
      `El trabajo toma ${TIEMPO_PRODUCCION} desde que comienza, aunque puede variar según el artista y el pedido. A eso se suma el tiempo de envío.`,
    ],
    [
      "¿Envían a todo Chile? ¿Cuánto cuesta el envío?",
      `Sí, enviamos a todo Chile por Starken${conMedidas.length ? ` (cuadros en ${lista(conMedidas)})` : ""}. El envío lo paga el cliente y su costo depende del destino: se cotiza al confirmar tu pedido.`,
    ],
  ].filter(Boolean);
}

export default function Preguntas({ estilos }) {
  const preguntas = armarPreguntas(estilos);
  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-10">
        <Encabezado id="preguntas-titulo" titulo="Preguntas frecuentes">
          Lo que más nos preguntan antes de pedir su retrato.
        </Encabezado>
        <div className="divide-y divide-tinta/10 border-y border-tinta/10">
          {preguntas.map(([p, r]) => (
            <details key={p} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium text-tinta marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta [&::-webkit-details-marker]:hidden">
                {p}
                <PlusIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-acento transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="max-w-[62ch] pb-6 leading-relaxed text-tinta/70">{r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
