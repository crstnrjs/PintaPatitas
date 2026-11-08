import { Link } from "react-router-dom";
import { clp } from "@/pages/pedido/pasos";
import { fotoCuadro, medidasCuadro } from "./datos";

/* Tarjeta enmarcada (mismo bastidor que la galería) que lleva al detalle del cuadro. */
export default function TarjetaCuadro({ cuadro, className = "" }) {
  const portada = cuadro.fotos[0];
  const detalle = [cuadro.tecnica, medidasCuadro(cuadro)].filter(Boolean).join(" · ");

  return (
    <Link
      to={`/cuadros-listos/${cuadro.slug}`}
      className={`group block rounded-[18px] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta ${className}`}
    >
      <span className="relative block overflow-hidden rounded-[14px] bg-bastidor p-2 shadow-[0_24px_40px_-28px_rgb(19_48_61/0.6)] sm:rounded-[18px] sm:p-2.5">
        <span className="block overflow-hidden rounded-[8px] bg-white sm:rounded-[10px]">
          {portada ? (
            <img
              src={fotoCuadro(portada)}
              alt={cuadro.titulo}
              loading="lazy"
              decoding="async"
              className={`aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03] ${cuadro.enCompra ? "opacity-70" : ""}`}
            />
          ) : (
            <span className="block aspect-[4/5] w-full bg-bruma" />
          )}
        </span>
        {cuadro.enCompra && (
          <span className="vidrio absolute top-3.5 left-3.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-tinta sm:top-5 sm:left-5 sm:px-3 sm:text-xs">
            <span className="sm:hidden">En compra</span>
            <span className="hidden sm:inline">En proceso de compra</span>
          </span>
        )}
      </span>
      <span className="mt-3 block px-1">
        <span className="block font-display text-lg leading-tight text-tinta sm:text-xl">{cuadro.titulo}</span>
        {detalle && <span className="mt-1 block text-xs text-tinta/60 sm:text-sm">{detalle}</span>}
        <span className="mt-1.5 block font-semibold text-acento-oscuro">{clp(cuadro.precio)}</span>
      </span>
    </Link>
  );
}
