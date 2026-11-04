import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 p-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p>© {new Date().getFullYear()} PintaPatitas</p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 transition hover:text-foreground"
          >
            <Lock size={13} />
            Administración
          </Link>
        </div>
        

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/terminos" className="transition hover:text-foreground">
            Términos y condiciones
          </Link>
        </nav>
      </div>
    </footer>
  );
}
