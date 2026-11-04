import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, StoreIcon, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabase";

const menu = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/solicitudes", label: "Solicitudes", icon: Package },
  { to: "/admin/catalogo", label: "Catálogo", icon: StoreIcon },
  { to: "/admin/configuracion/mercadopago", label: "Mercado Pago", icon: WalletCards },
];

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  const sidebarLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-black/10 text-black"
        : "text-muted-foreground hover:bg-black/5 hover:text-(--deep)"
    }`;

  const pillLink = ({ isActive }) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-(--deep) text-black" : "bg-white font-bold"
    }`;

  return (
    <div className="flex min-h-screen bg-(--surface)">
      {/* Sidebar (solo escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-65 shrink-0 flex-col justify-between border-r border-line bg-white p-5 lg:flex">
        <div>
          <p className="px-4 py-3 text-lg font-bold text-(--deep)">PintaPatitas</p>
          <nav className="mt-6 flex flex-col gap-1">
            {menu.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={sidebarLink}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-(--surface) p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {initials(admin?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-(--ink)">
              {admin?.name ?? "..."}
            </strong>
            <small className="block truncate text-xs text-muted-foreground">
              {admin?.email}
            </small>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-black/5 hover:text-(--deep)"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        {/* Navegación móvil */}
        <nav className="flex gap-2 overflow-x-auto p-4 lg:hidden">
          {menu.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={pillLink}>
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-muted-foreground"
          >
            Salir
          </button>
        </nav>

        <main className="p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
