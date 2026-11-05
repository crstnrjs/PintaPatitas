import { useState } from "react";
import { comparaciones } from "./contenido";
import { Encabezado, FaltaMaterial } from "./ui";

/* Deslizador antes/después: solo CSS (clip-path) + un input range accesible. */
function Comparador({ par }) {
  const [pos, setPos] = useState(50);
  return (
    <figure className="arcilla rounded-[24px] p-3">
      <div
        className="relative overflow-hidden rounded-[16px]"
        style={{ aspectRatio: `${par.ancho} / ${par.alto}` }}
      >
        <img src={par.obra} alt={`Obra terminada: ${par.alt}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={par.foto}
          alt={`Foto original: ${par.alt}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <input
          type="range"
          min="0"
          max="100"
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Deslizar para comparar la foto original con la obra"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 flex justify-between px-1 text-sm text-tinta/70">
        <span>Foto original</span>
        <span>Obra terminada</span>
      </figcaption>
    </figure>
  );
}

export default function FotoAObra() {
  if (comparaciones.length === 0) return null;

  return (
    <section aria-labelledby="foto-obra-titulo" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Encabezado id="foto-obra-titulo" titulo="De tu foto a tu obra">
          Desliza para ver cómo una foto del celular se convierte en un retrato.
        </Encabezado>
        {comparaciones.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {comparaciones.map((par) => (
              <Comparador key={par.obra} par={par} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <FaltaMaterial>
              Esta sección necesita pares reales de “foto original + pintura terminada”. Agrégalos en{" "}
              <code>comparaciones</code> dentro de <code>pages/landing/contenido.js</code>. En producción
              la sección se oculta hasta que existan.
            </FaltaMaterial>
          </div>
        )}
      </div>
    </section>
  );
}
