import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Images, LayoutDashboard, LogOut, Menu, Package, StoreIcon, WalletCards, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { initials } from "@/admin/shared/ui";

const menu = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/solicitudes", label: "Solicitudes", icon: Package },
  { to: "/admin/catalogo", label: "Catálogo", icon: StoreIcon },
  { to: "/admin/contenido", label: "Contenido", icon: Images },
  { to: "/admin/configuracion/mercadopago", label: "Mercado Pago", icon: WalletCards },
];

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";

function Huella({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="currentColor" className={className}>
      <ellipse cx="32" cy="44" rx="14" ry="11" />
      <ellipse cx="14" cy="28" rx="6" ry="8" />
      <ellipse cx="25" cy="16" rx="6" ry="8" />
      <ellipse cx="39" cy="16" rx="6" ry="8" />
      <ellipse cx="50" cy="28" rx="6" ry="8" />
    </svg>
  );
}

function Marca() {
  return (
    <Link to="/admin" className={`flex items-center gap-2.5 rounded-xl px-2 py-1 ${enfoque}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-acento to-acento-oscuro text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
        <Huella className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg text-tinta">PintaPatitas</span>
        <span className="block text-[11px] text-tinta/50">Taller</span>
      </span>
    </Link>
  );
}

/* Contenido del sidebar: se usa en escritorio y dentro del drawer móvil. */
function Navegacion({ admin, onLogout, onNavigate }) {
  const enlace = ({ isActive }) =>
    `group relative flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium transition ${enfoque} ${
      isActive
        ? "bg-white text-acento-oscuro shadow-[inset_0_1px_0_#fff,0_8px_20px_-14px_rgb(19_48_61/0.7)]"
        : "text-tinta/60 hover:bg-white/60 hover:text-tinta"
    }`;

  return (
    <div className="flex h-full flex-col">
      <Marca />

      <p className="mt-8 px-3.5 text-xs font-medium text-tinta/40">Menú</p>
      <nav aria-label="Administración" className="mt-2 flex flex-col gap-1">
        {menu.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={enlace} onClick={onNavigate}>
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-acento transition ${isActive ? "opacity-100" : "opacity-0"}`}
                />
                <Icon size={18} className={isActive ? "text-acento" : ""} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-6 flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm text-tinta/55 transition hover:bg-white/60 hover:text-tinta ${enfoque}`}
      >
        <ExternalLink size={17} aria-hidden="true" />
        Ver sitio
      </a>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 rounded-[20px] border border-white/80 bg-white/70 p-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bruma text-sm font-semibold text-acento-oscuro">
            {initials(admin?.name) || "·"}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-semibold text-tinta">{admin?.name ?? "Cargando…"}</strong>
            <small className="block truncate text-xs text-tinta/50">{admin?.email}</small>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className={`grid size-10 shrink-0 place-items-center rounded-full text-tinta/55 transition hover:bg-[#f7e3e1] hover:text-[#963a31] ${enfoque}`}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [admin, setAdmin] = useState(null);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("admins")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();
      setAdmin({ name: data?.name ?? user.email, email: user.email });
    }
    loadAdmin();
  }, []);

  // Drawer móvil: Escape lo cierra y bloquea el scroll de fondo mientras está abierto
  useEffect(() => {
    if (!drawer) return;
    const cerrar = (e) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", cerrar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", cerrar);
      document.body.style.overflow = "";
    };
  }, [drawer]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="fondo-admin min-h-screen text-tinta lg:flex">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 p-4 lg:block">
        <div className="h-full rounded-[28px] border border-white/70 bg-white/45 p-4 shadow-[0_20px_50px_-36px_rgb(19_48_61/0.6)]">
          <Navegacion admin={admin} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="sticky top-0 z-30 p-3 lg:hidden">
        <div className="vidrio flex items-center justify-between rounded-full py-1.5 pr-1.5 pl-2">
          <Marca />
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menú"
            aria-expanded={drawer}
            aria-controls="admin-drawer"
            className={`grid size-11 place-items-center rounded-full text-tinta hover:bg-white/70 ${enfoque}`}
          >
            <Menu size={21} />
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-tinta/35 backdrop-blur-[3px] motion-safe:animate-in motion-safe:fade-in"
          />
          <aside
            id="admin-drawer"
            aria-label="Menú de administración"
            className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] bg-[#f4f8f9] p-4 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-left"
          >
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Cerrar menú"
              className={`absolute top-4 right-4 grid size-10 place-items-center rounded-full text-tinta/60 hover:bg-white ${enfoque}`}
            >
              <X size={19} />
            </button>
            <Navegacion admin={admin} onLogout={handleLogout} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <main className="min-w-0 flex-1 px-4 pt-3 pb-12 sm:px-6 lg:px-8 lg:pt-8 xl:px-10">
        <div key={pathname} className="mx-auto max-w-7xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
