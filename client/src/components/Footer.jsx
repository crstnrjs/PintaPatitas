import { Link } from "react-router-dom";
import { Lock, Mail, MapPin, MessageCircle } from "lucide-react";
import { destinoEnlace, enlacesLanding } from "./navegacion";
import { useContenidoLanding } from "@/pages/landing/useContenidoLanding";
import { CONTACTO } from "@/lib/contacto";

const enlace = "py-1 transition hover:text-white";

/*
 * Footer compacto: en móvil los enlaces van en dos columnas y lo legal pasa a la franja inferior,
 * para que no ocupe más de media pantalla.
 */
export default function Footer() {
  const { instagramUrl } = useContenidoLanding();
  return (
    <footer className="bg-tinta text-sm text-white/70">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-7 px-5 pt-9 pb-6 md:grid-cols-[1.6fr_1fr_1fr] md:px-10 md:pt-12 md:pb-8">
        <div className="min-w-0">
          <p className="font-display text-xl text-white">PintaPatitas</p>
          <p className="mt-1.5 max-w-xs leading-relaxed">
            Retratos de mascotas hechos uno a uno en {CONTACTO.ciudad}, con envío a todo Chile.
          </p>
          <address className="mt-4 flex flex-col gap-1.5 not-italic">
            <a
              href={CONTACTO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <MessageCircle size={15} aria-hidden="true" className="shrink-0 text-cielo" />
              WhatsApp {CONTACTO.telefono}
            </a>
            <a href={`mailto:${CONTACTO.email}`} className="inline-flex min-w-0 items-center gap-2 transition hover:text-white">
              <Mail size={15} aria-hidden="true" className="shrink-0 text-cielo" />
              <span className="break-all">{CONTACTO.email}</span>
            </a>
            <span className="inline-flex items-center gap-2 text-white/50">
              <MapPin size={15} aria-hidden="true" className="shrink-0" />
              {CONTACTO.ciudad}, región de {CONTACTO.region}
            </span>
          </address>
        </div>

        {/* En móvil ambas listas comparten fila */}
        <div className="grid grid-cols-2 gap-x-6 md:col-span-2 md:gap-x-8">
          <nav aria-label="Secciones" className="flex flex-col">
            <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-white/45 uppercase">Explora</p>
            {enlacesLanding.map((e) => (
              <Link key={e.label} to={destinoEnlace(e)} className={enlace}>
                {e.label}
              </Link>
            ))}
            <Link to="/catalogo" className="py-1 font-medium text-white transition hover:text-cielo">
              Crear mi retrato
            </Link>
          </nav>

          <nav aria-label="PintaPatitas" className="flex flex-col">
            <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-white/45 uppercase">Ayuda</p>
            <Link to="/sobre-nosotros" className={enlace}>
              Sobre nosotros
            </Link>
            <Link to="/contacto" className={enlace}>
              Contacto
            </Link>
            <Link to="/soporte" className={enlace}>
              Soporte
            </Link>
            <a href={instagramUrl || CONTACTO.instagramUrl} target="_blank" rel="noopener noreferrer" className={enlace}>
              Instagram
            </a>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-1 px-5 py-3.5 text-xs text-white/50 md:px-10">
          <p>© {new Date().getFullYear()} PintaPatitas</p>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="py-1 transition hover:text-white">
              Términos y condiciones
            </Link>
            <Link to="/admin/login" className="inline-flex items-center gap-1 py-1 transition hover:text-white">
              <Lock size={11} aria-hidden="true" />
              Administración
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
