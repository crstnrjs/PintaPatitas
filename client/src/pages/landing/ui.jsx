import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MOSTRAR_AVISOS } from "./contenido";

const enfoque =
  "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta";

/* Todos los CTA llevan al flujo real de solicitud (/catalogo). */
export function BotonPedido({ children, variante = "solido", className = "" }) {
  const estilos = {
    solido:
      "bg-acento text-white shadow-[0_6px_0_-1px_var(--color-acento-oscuro)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_-1px_var(--color-acento-oscuro)] active:translate-y-0.5 active:shadow-[0_3px_0_-1px_var(--color-acento-oscuro)]",
    claro:
      "bg-papel text-acento-oscuro shadow-[0_6px_0_-1px_rgb(9_30_40/0.5)] hover:-translate-y-0.5 active:translate-y-0.5",
  };
  return (
    <Link
      to="/catalogo"
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition ${estilos[variante]} ${enfoque} ${className}`}
    >
      {children}
    </Link>
  );
}

/* Imagen con copias livianas para móvil (archivo-480.webp, archivo-720.webp). */
export function Imagen({ obra, sizes, className = "", prioridad = false, ...resto }) {
  const srcSet = obra.variantes?.length
    ? [
        ...obra.variantes.map((w) => `${obra.src.replace(/\.webp$/, `-${w}.webp`)} ${w}w`),
        `${obra.src} ${obra.ancho}w`,
      ].join(", ")
    : undefined;
  return (
    <img
      src={obra.src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={obra.ancho}
      height={obra.alto}
      alt={obra.alt}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async"
      className={className}
      {...resto}
    />
  );
}

/* Aparición suave, una sola vez, cuando el bloque entra en pantalla. */
export function Revelar({ as: Tag = "div", children, ...resto }) {
  const ref = useRef(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setVisto(true);
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-revelar={visto ? "si" : "no"} {...resto}>
      {children}
    </Tag>
  );
}

/* Encabezado de sección: título + bajada corta. */
export function Encabezado({ id, titulo, children, centrado = false, claro = false }) {
  return (
    <div className={`max-w-2xl ${centrado ? "mx-auto text-center" : ""}`}>
      <h2
        id={id}
        className={`font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] ${claro ? "text-white" : "text-tinta"}`}
      >
        {titulo}
      </h2>
      {children && (
        <p className={`mt-4 text-lg leading-relaxed ${claro ? "text-white/75" : "text-tinta/70"}`}>
          {children}
        </p>
      )}
    </div>
  );
}

/* Recuadro para marcar material real que falta. Se activa con MOSTRAR_AVISOS en contenido.js (solo en desarrollo). */
export function FaltaMaterial({ children }) {
  if (!MOSTRAR_AVISOS || !import.meta.env.DEV) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 p-5 text-sm text-amber-900">
      <strong className="block">Falta material (solo visible en desarrollo)</strong>
      {children}
    </div>
  );
}

/* Ramita botánica en trazo, decorativa. */
export function Ramita({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 160" fill="none" className={className}>
      <path d="M60 158C58 112 62 66 78 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[
        [64, 128, -1],
        [66, 100, 1],
        [69, 74, -1],
        [73, 48, 1],
        [76, 26, -1],
      ].map(([x, y, lado]) => (
        <path
          key={y}
          d={`M${x} ${y}c${lado * 18} -6 ${lado * 30} -20 ${lado * 32} -34c${lado * -16} 2 ${lado * -30} 14 ${lado * -32} 34z`}
          fill="currentColor"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}

/* Mancha orgánica tipo acuarela/arcilla, decorativa. */
export function Mancha({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={className}>
      <path
        fill="currentColor"
        d="M44 30c26-22 74-26 106-6s46 60 36 96-44 64-84 70-74-14-88-48S18 52 44 30z"
      />
    </svg>
  );
}

/* Huellita, decorativa. */
export function Huella({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className} fill="currentColor">
      <ellipse cx="32" cy="44" rx="14" ry="11" />
      <ellipse cx="14" cy="28" rx="6" ry="8" />
      <ellipse cx="25" cy="16" rx="6" ry="8" />
      <ellipse cx="39" cy="16" rx="6" ry="8" />
      <ellipse cx="50" cy="28" rx="6" ry="8" />
    </svg>
  );
}
