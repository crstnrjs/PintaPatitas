import { Link } from "react-router-dom";
import { clp } from "../pedido/pasos";
import { estilosInfo } from "./contenido";
import { BotonPedido, Encabezado } from "./ui";

/* Muestra ilustrada de cada técnica (no es una obra real, es una textura que la evoca). */
function Muestra({ slug }) {
  if (slug === "lapiz") {
    return (
      <svg aria-hidden="true" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <rect width="240" height="150" fill="#f6f7f6" />
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={`M${-20 + i * 14} 150 L${40 + i * 14} 0`} stroke="#5d7785" strokeOpacity={0.12 + (i % 4) * 0.07} strokeWidth="1.4" />
        ))}
        <path d="M30 112c30-44 80-70 150-62" stroke="#2c4552" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M44 124c40-30 92-44 156-36" stroke="#2c4552" strokeOpacity=".5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (slug === "digital") {
    return (
      <svg aria-hidden="true" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dcecf1" />
            <stop offset="1" stopColor="#8abfd0" />
          </linearGradient>
        </defs>
        <rect width="240" height="150" fill="url(#dg)" />
        <circle cx="168" cy="58" r="40" fill="#2e6a85" opacity=".85" />
        <circle cx="90" cy="98" r="54" fill="#fbfaf7" opacity=".7" />
        <circle cx="118" cy="40" r="16" fill="#13303d" opacity=".75" />
      </svg>
    );
  }
  // acrílico y cualquier técnica nueva
  return (
    <svg aria-hidden="true" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <rect width="240" height="150" fill="#cfe0e7" />
      <path d="M-10 54c50-26 120-30 260-8" stroke="#2e6a85" strokeWidth="34" strokeLinecap="round" fill="none" opacity=".9" />
      <path d="M-10 102c70-22 150-18 260 6" stroke="#8abfd0" strokeWidth="30" strokeLinecap="round" fill="none" />
      <path d="M40 136c50-14 110-14 180-2" stroke="#1b4458" strokeWidth="14" strokeLinecap="round" fill="none" opacity=".8" />
      <path d="M20 30c40-10 90-12 150-4" stroke="#fbfaf7" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".7" />
    </svg>
  );
}

export default function Estilos({ cargando, error, estilos, formatosDe }) {
  return (
    <section id="estilos" aria-labelledby="estilos-titulo" className="scroll-mt-24 py-14 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="estilos-titulo" titulo="Elige cómo quieres verla">
          El precio final depende del tamaño y de cuántas mascotas aparecen.
        </Encabezado>

        {error ? (
          <p className="mt-8 rounded-2xl bg-white/70 p-6 text-tinta/75 md:mt-10">
            Ahora no pudimos cargar los precios.{" "}
            <Link to="/catalogo" className="font-medium text-acento underline underline-offset-4">
              Puedes verlos al crear tu retrato
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 grid gap-3 md:mt-12 md:grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] md:gap-6">
            {cargando
              ? Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="arcilla h-36 animate-pulse rounded-[22px] md:h-96 md:rounded-[28px]" />
                ))
              : estilos.map((e) => {
                  const info = estilosInfo[e.slug];
                  const formatos = e.has_size ? formatosDe(e.id) : [];
                  return (
                    // Móvil: tarjeta horizontal con la muestra a la izquierda. Desde md: vertical.
                    <li key={e.id} className="arcilla flex gap-4 rounded-[22px] p-2.5 md:flex-col md:gap-0 md:rounded-[28px] md:p-3">
                      <div className="w-24 shrink-0 overflow-hidden rounded-[16px] md:h-36 md:w-auto md:rounded-[20px]">
                        <Muestra slug={e.slug} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col py-1.5 pr-1.5 md:px-4 md:pt-6 md:pb-4">
                        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between md:gap-3">
                          <h3 className="font-display text-xl text-tinta md:text-2xl">{e.name}</h3>
                          {info && <span className="text-sm text-acento">{info.sensacion}</span>}
                        </div>
                        <ul className="mt-2.5 flex flex-wrap gap-1.5 text-xs md:mt-4 md:gap-2 md:text-sm">
                          {info?.rasgos.map((r) => (
                            <li key={r} className="rounded-full bg-bruma px-2.5 py-0.5 text-acento-oscuro md:px-3 md:py-1">
                              {r}
                            </li>
                          ))}
                          {formatos.length > 0 && (
                            <li className="rounded-full bg-bruma px-2.5 py-0.5 text-acento-oscuro md:px-3 md:py-1">
                              {formatos.length === 1
                                ? formatos[0].etiqueta
                                : `${formatos.length} tamaños, desde ${formatos[0].etiqueta}`}
                            </li>
                          )}
                        </ul>
                        <p className="mt-auto pt-3 text-sm text-tinta/60 md:pt-8 md:text-base">
                          Desde{" "}
                          <span className="text-xl font-semibold text-tinta md:text-2xl">{clp(e.desde)}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
          </ul>
        )}

        <div className="mt-8 md:mt-12">
          <BotonPedido>Elegir mi estilo</BotonPedido>
        </div>
      </div>
    </section>
  );
}
