import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { destinoEnlace, enlacesLanding } from "./navegacion";
import { useContenidoLanding } from "@/pages/landing/useContenidoLanding";
import { CONTACTO } from "@/lib/contacto";

export default function Footer() {
  const { instagramUrl } = useContenidoLanding();
  return (
    <footer className="bg-tinta text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <p className="font-display text-2xl text-white">PintaPatitas</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Retratos personalizados de mascotas, hechos uno a uno en {CONTACTO.ciudad} y enviados a todo Chile.
          </p>
          <address className="mt-5 flex flex-col gap-1 not-italic">
            <a href={CONTACTO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="py-1 transition hover:text-white">
              WhatsApp {CONTACTO.telefono}
            </a>
            <a href={`mailto:${CONTACTO.email}`} className="py-1 break-all transition hover:text-white">
              {CONTACTO.email}
            </a>
            <span className="py-1 text-white/50">
              {CONTACTO.ciudad}, región de {CONTACTO.region}
            </span>
          </address>
        </div>

        <nav aria-label="Secciones" className="flex flex-col gap-1">
          {enlacesLanding.map((enlace) => (
            <Link key={enlace.label} to={destinoEnlace(enlace)} className="py-1.5 transition hover:text-white">
              {enlace.label}
            </Link>
          ))}
          <Link to="/catalogo" className="py-1.5 font-medium text-white transition hover:text-cielo">
            Crear mi retrato
          </Link>
        </nav>

        <div className="flex flex-col gap-1">
          <Link to="/sobre-nosotros" className="py-1.5 transition hover:text-white">
            Sobre nosotros
          </Link>
          <Link to="/contacto" className="py-1.5 transition hover:text-white">
            Contacto
          </Link>
          <Link to="/soporte" className="py-1.5 transition hover:text-white">
            Soporte
          </Link>
          <a href={instagramUrl || CONTACTO.instagramUrl} target="_blank" rel="noopener noreferrer" className="py-1.5 transition hover:text-white">
            Instagram
          </a>
          <Link to="/terminos" className="py-1.5 transition hover:text-white">
            Términos y condiciones
          </Link>
          <Link to="/admin/login" className="inline-flex items-center gap-1.5 py-1.5 transition hover:text-white">
            <Lock size={13} aria-hidden="true" />
            Administración
          </Link>
        </div>
      </div>
      <p className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/50">
        © {new Date().getFullYear()} PintaPatitas
      </p>
    </footer>
  );
}
