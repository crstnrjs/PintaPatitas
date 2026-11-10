import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  borrarMotivoCierre,
  cerrarSesionExpirada,
  marcarInicioSesion,
  motivoCierrePendiente,
  motivoExpiracion,
} from "./sesionAdmin";
// import Logo from "@/components/Logo"; // ajusta la ruta a tu componente

const AVISOS_CIERRE = {
  inactividad: "Tu sesión se cerró por inactividad. Vuelve a ingresar.",
  duracion: "Tu sesión expiró. Por seguridad, vuelve a ingresar.",
};

const fieldClass =
  "flex h-13.5 items-center gap-3 rounded-[14px] border border-(color:--line) bg-(--white) px-4 text-(color:--mid) transition focus-within:border-(color:--mid) focus-within:shadow-[0_0_0_4px_rgba(82,137,160,.1)]";

const inputClass =
  "h-full min-w-0 flex-1 bg-transparent text-sm text-(color:--ink) outline-none placeholder:text-[#91a1a7]";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState(() => AVISOS_CIERRE[motivoCierrePendiente()] ?? "");

  // Si ya hay una sesión vigente, ir directo al panel; si expiró, cerrarla.
  useEffect(() => {
    borrarMotivoCierre();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const motivo = motivoExpiracion(data.session);
      if (motivo) {
        await cerrarSesionExpirada(motivo);
        setAviso(AVISOS_CIERRE[motivo]);
        borrarMotivoCierre();
        return;
      }
      navigate("/admin", { replace: true });
    });
  }, [navigate]);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      console.log("Error de login:", error.message);
      setError("Correo o contraseña incorrectos");
      return;
    }

    marcarInicioSesion();
    navigate("/admin");
  }

  return (
    <main className="grid min-h-screen bg-(--surface) lg:grid-cols-[.95fr_1.05fr]">
      {/* Panel izquierdo (solo en pantallas grandes) */}
      <aside className="relative m-4 hidden min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] bg-(--deep) lg:block">
        {/* Foto horizontal en un panel alto: se recorta centrada en el gato. */}
        <img
          src="/img/login-gato.webp"
          width={1448}
          height={1086}
          alt=""
          className="absolute inset-0 size-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[rgba(33,74,93,.04)] from-35% to-[rgba(22,51,64,.88)]" />
        <div className="absolute -top-26.25 -right-21.25 size-70 rounded-full border border-white/20" />

        <div className="absolute inset-x-13.5 bottom-13 z-10 text-white">
          <blockquote className="mt-5 mb-4 max-w-155 text-[clamp(30px,3vw,46px)] leading-[1.12] font-bold tracking-[-0.045em]">
            Pinta Patitas
          </blockquote>
        </div>
      </aside>

      {/* Panel derecho: formulario */}
      <section className="flex min-h-screen flex-col px-[7vw]">
        <div className="flex min-h-25 items-center justify-end">
          {/* <Link to="/">
            <Logo />
          </Link> */}
          <Link
            to="/"
            className="text-[13px] font-semibold text-muted-foreground transition hover:text-(--deep)"
          >
            Volver al sitio
          </Link>
        </div>

        <div className="m-auto w-full max-w-115 pt-12 pb-20">
          <header>
            <span className="text-[11px] font-extrabold tracking-[.12em] text-(--blue) uppercase">
              Acceso administrativo
            </span>
            <h1 className="mt-3 mb-3.5 text-4xl leading-[1.05] font-bold tracking-tighter text-(--deep) md:text-[44px]">
              Bienvenida Fernanda
            </h1>
            <p className="mb-9 leading-relaxed text-muted-foreground">
              Ingresa tus datos para gestionar las solicitudes y los pagos de la plataforma.
            </p>
          </header>

          {aviso && !error && (
            <p role="status" className="mb-5 rounded-[14px] border border-(color:--line) bg-(--white) px-4 py-3 text-sm text-(--ink)">
              {aviso}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-xs font-bold text-(--ink)">
              Correo electrónico
              <span className={fieldClass}>
                <Mail size={19} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nombre@pintapatitas.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </span>
            </label>

            <label className="flex flex-col gap-2 text-xs font-bold text-(--ink)">
              Contraseña
              <span className={fieldClass}>
                <Lock size={19} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShowPassword((v) => !v)}
                  className="grid size-8 place-items-center text-muted-foreground transition hover:text-(--deep)"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-13.5 w-full items-center justify-center gap-2 rounded-full font-semibold bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar al panel"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <Link
              to="/admin/crear-contrasena"
              className="text-center text-[13px] font-semibold text-muted-foreground transition hover:text-(--deep)"
            >
              ¿Olvidaste tu contraseña o es tu primer ingreso?
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
