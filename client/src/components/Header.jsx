import { Link, NavLink } from "react-router-dom";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useNavigate } from "react-router-dom";

const enlaces = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Crear Pintura" },
];
const enlacesDerecha = [{ to: "/catalogo", label: "Crear Pintura" }];

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex px-5 items-center justify-between p-4">
        <Link to="/" className="text-xl font-semibold">
          PintaPatitas
        </Link>
        <nav className="flex gap-6 align-center">
          {enlaces.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `self-center ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {/*enlacesDerecha.map(({ to, label }) => (
            <ShimmerButton key={to} onClick={() => navigate(to)}>
              {label}
            </ShimmerButton>
          ))*/}
        </nav>
      </div>
    </header>
  );
}
