import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Botón flotante al centro inferior: aparece al bajar mucho y vuelve al inicio de la página.
const UMBRAL = 700;

export default function BotonVolverArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alScroll = () => setVisible(window.scrollY > UMBRAL);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  function subir() {
    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: sinAnimacion ? "auto" : "smooth" });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Volver al inicio de la página"
      className="fixed bottom-5 left-1/2 z-30 inline-flex min-h-10 -translate-x-1/2 items-center gap-1.5 rounded-full border border-tinta/12 bg-white/90 px-4 text-sm font-medium text-acento-oscuro shadow-[0_10px_24px_-12px_rgb(19_48_61/0.55)] backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
    >
      <ArrowUp size={16} aria-hidden="true" /> Subir
    </button>
  );
}
