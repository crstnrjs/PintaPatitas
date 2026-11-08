import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPinIcon, PaintBrushIcon, TruckIcon } from "@heroicons/react/24/outline";
import { obras } from "@/pages/landing/contenido";
import { BotonPedido, Encabezado, Huella, Imagen, Ramita } from "@/pages/landing/ui";
import { CONTACTO } from "@/lib/contacto";

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";

const datos = [
  [PaintBrushIcon, "Pintado a mano", "Cada retrato lo pinta Fernanda, uno a uno: no hay filtros ni plantillas."],
  [MapPinIcon, `Desde ${CONTACTO.ciudad}`, `El taller está en ${CONTACTO.ciudad}, región de ${CONTACTO.region}.`],
  [TruckIcon, "Envíos a todo Chile", "Despachamos por Starken a tu domicilio o a la sucursal que elijas."],
];

export default function SobreNosotros() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const anterior = document.title;
    document.title = "Sobre nosotros | PintaPatitas";
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="fondo-acuarela text-tinta">
      <section aria-labelledby="sobre-titulo" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-14 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-10 md:pt-16 md:pb-24">
          <div>
            <p className="text-base font-medium text-acento">Sobre nosotros</p>
            <h1 id="sobre-titulo" className="mt-2 font-display text-[clamp(2.2rem,6.5vw,4.2rem)] leading-[1.04] md:mt-4">
              Hola, soy {CONTACTO.artista}: pinto a tu mascota.
            </h1>
            <div className="mt-5 max-w-xl space-y-4 text-base leading-relaxed text-tinta/75 md:mt-7 md:text-lg">
              <p>
                PintaPatitas nació para convertir a los perros y gatos de cada familia en una obra que se pueda colgar
                en la pared. Trabajo en acrílico, lápiz y digital, siempre a partir de las fotos y la idea que me
                envías.
              </p>
              <p>
                Reviso cada solicitud antes de aceptarla, para asegurarme de que las fotos sirven y de que el retrato
                va a quedar como lo imaginas. Cuando no estoy pintando pedidos, pinto obras propias que encuentras en{" "}
                <Link to="/cuadros-listos" className="font-medium text-acento underline underline-offset-4">
                  Cuadros listos
                </Link>
                .
              </p>
            </div>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <BotonPedido>Crear mi retrato</BotonPedido>
              <Link
                to="/contacto"
                className={`inline-flex min-h-11 items-center justify-center rounded-full text-base font-medium text-acento underline decoration-acento/30 underline-offset-4 hover:decoration-acento ${enfoque}`}
              >
                Escríbeme
              </Link>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[420px]">
            <Ramita className="pointer-events-none absolute -top-10 -right-8 hidden h-48 w-36 rotate-[18deg] text-cielo/40 md:block" />
            <div className="rounded-[6px] bg-bastidor p-2.5 shadow-[0_30px_50px_-20px_rgba(20,42,53,0.55)] md:p-4">
              <div className="overflow-hidden rounded-[2px] bg-white p-1.5 md:p-3">
                <Imagen
                  obra={obras[0]}
                  sizes="(min-width: 768px) 400px, 88vw"
                  className="aspect-[4/5] h-auto w-full object-cover object-[58%_center]"
                />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-sm text-tinta/60">Uno de los retratos pintados por {CONTACTO.artista}.</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="sobre-datos" className="px-5 pb-14 md:px-10 md:pb-24">
        <div className="vidrio mx-auto max-w-6xl rounded-[26px] px-5 py-8 md:rounded-[32px] md:px-14 md:py-14">
          <Encabezado id="sobre-datos" titulo="Cómo trabajo" />
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

      <section aria-label="Pedir un retrato" className="px-5 pb-14 md:px-10 md:pb-28">
        <div className="fondo-pincel relative mx-auto max-w-6xl overflow-hidden rounded-[26px] px-6 py-10 text-white md:rounded-[32px] md:px-14 md:py-16">
          <Huella className="absolute -right-6 -bottom-6 h-40 w-40 rotate-12 text-white/5" />
          <div className="relative max-w-xl">
            <p className="font-display text-[clamp(1.9rem,5vw,3rem)] leading-[1.05]">¿Me cuentas de tu mascota?</p>
            <p className="mt-3 text-white/75 md:text-lg">Envíame sus fotos y tu idea; ves el precio antes de enviar.</p>
            <BotonPedido variante="claro" className="mt-7 w-full sm:w-auto">Crear mi retrato</BotonPedido>
          </div>
        </div>
      </section>
    </div>
  );
}
