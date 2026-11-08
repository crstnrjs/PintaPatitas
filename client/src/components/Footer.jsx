import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { destinoEnlace, enlacesLanding } from "./navegacion";
import { useContenidoLanding } from "@/pages/landing/useContenidoLanding";

export default function Footer() {
  const { instagramUrl } = useContenidoLanding();
  return (
    <footer className="bg-tinta text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <p className="font-display text-2xl text-white">PintaPatitas</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Retratos personalizados de mascotas, hechos uno a uno en Chile.
          </p>
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
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="py-1.5 transition hover:text-white">
              Instagram
            </a>
          )}
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
