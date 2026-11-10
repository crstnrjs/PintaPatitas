import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RUTA_CREAR_CONTRASENA, errorEnlaceInicial } from "@/lib/redirigirEnlaceAuth";
import { marcarInicioSesion } from "./sesionAdmin";

/*
 * Página a la que llegan los enlaces de invitación y de recuperación de Supabase.
 * - Con sesión (el enlace era válido): formulario para elegir la contraseña.
 * - Sin sesión (enlace vencido o entrada directa): pide el correo y envía un
 *   enlace de recuperación nuevo. La respuesta es la misma exista o no la cuenta.
 */

const MIN_LARGO = 8;

const fieldClass =
  "flex h-13.5 items-center gap-3 rounded-[14px] border border-(color:--line) bg-(--white) px-4 text-(color:--mid) transition focus-within:border-(color:--mid) focus-within:shadow-[0_0_0_4px_rgba(82,137,160,.1)]";

const inputClass =
  "h-full min-w-0 flex-1 bg-transparent text-sm text-(color:--ink) outline-none placeholder:text-[#91a1a7]";

const botonClass =
  "mt-1 flex h-13.5 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const AVISO_ENLACE_VENCIDO =
  "El enlace que abriste ya venció o ya se usó. Escribe tu correo y te enviamos uno nuevo.";

function mensajeErrorContrasena(error) {
  if (error?.code === "same_password") return "La contraseña nueva debe ser distinta de la anterior.";
  if (error?.code === "weak_password") return "Esa contraseña es muy fácil de adivinar. Prueba con una más larga.";
  return "No pudimos guardar la contraseña. Intenta de nuevo o pide un enlace nuevo.";
}

export default function CrearContrasena() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState("cargando"); // cargando | crear | solicitar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(errorEnlaceInicial ? AVISO_ENLACE_VENCIDO : "");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let activo = true;
    // getSession espera a que Supabase procese el token que viene en el enlace.
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      if (data.session) {
        setEmail(data.session.user.email ?? "");
        setEstado("crear");
      } else {
        setEstado("solicitar");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      if (session && (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN")) {
        setEmail(session.user.email ?? "");
        setEstado("crear");
      }
    });
    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function guardarContrasena(e) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_LARGO) {
      setError(`La contraseña debe tener al menos ${MIN_LARGO} caracteres.`);
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(mensajeErrorContrasena(error));
      return;
    }
    marcarInicioSesion();
    navigate("/admin", { replace: true });
  }

  async function solicitarEnlace(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${RUTA_CREAR_CONTRASENA}`,
    });
    setLoading(false);
    if (error?.status === 429) {
      setError("Ya pediste varios enlaces. Espera unos minutos y vuelve a intentarlo.");
      return;
    }
    // Para no revelar qué correos tienen cuenta, cualquier otro caso se muestra igual.
    setEnviado(true);
  }

  const titulo = estado === "crear" ? "Crea tu contraseña" : "Recupera tu acceso";
  const bajada =
    estado === "crear"
      ? "Elige la contraseña con la que vas a ingresar al panel."
      : "Te enviaremos un enlace a tu correo para que elijas una contraseña nueva.";

  return (
    <main className="flex min-h-screen flex-col bg-(--surface) px-[7vw]">
      <div className="flex min-h-25 items-center justify-end">
        <Link
          to="/admin/login"
          className="text-[13px] font-semibold text-muted-foreground transition hover:text-(--deep)"
        >
          Volver al ingreso
        </Link>
      </div>

      <div className="m-auto w-full max-w-115 pt-12 pb-20">
        <header>
          <span className="text-[11px] font-extrabold tracking-[.12em] text-(--blue) uppercase">
            Acceso administrativo
          </span>
          <h1 className="mt-3 mb-3.5 text-4xl leading-[1.05] font-bold tracking-tighter text-(--deep) md:text-[44px]">
            {titulo}
          </h1>
          <p className="mb-9 leading-relaxed text-muted-foreground">{bajada}</p>
        </header>

        {estado === "cargando" && (
          <p role="status" className="text-sm text-muted-foreground">
            Revisando el enlace…
          </p>
        )}

        {estado === "crear" && (
          <form onSubmit={guardarContrasena} className="flex flex-col gap-5">
            {email && (
              <p className="text-sm text-(--ink)">
                Cuenta: <strong>{email}</strong>
              </p>
            )}
            <label className="flex flex-col gap-2 text-xs font-bold text-(--ink)">
              Contraseña nueva
              <span className={fieldClass}>
                <Lock size={19} />
                <input
                  type={mostrar ? "text" : "password"}
                  required
                  minLength={MIN_LARGO}
                  autoComplete="new-password"
                  placeholder={`Mínimo ${MIN_LARGO} caracteres`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setMostrar((v) => !v)}
                  className="grid size-8 place-items-center text-muted-foreground transition hover:text-(--deep)"
                >
                  {mostrar ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            <label className="flex flex-col gap-2 text-xs font-bold text-(--ink)">
              Repite la contraseña
              <span className={fieldClass}>
                <Lock size={19} />
                <input
                  type={mostrar ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Escríbela otra vez"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  className={inputClass}
                />
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={botonClass}>
              {loading ? "Guardando..." : "Guardar e ingresar"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {estado === "solicitar" &&
          (enviado ? (
            <p role="status" className="rounded-[14px] border border-(color:--line) bg-(--white) px-4 py-3 text-sm text-(--ink)">
              Si ese correo tiene acceso al panel, te llegará un enlace en unos minutos. Revisa también la carpeta de spam
              o promociones.
            </p>
          ) : (
            <form onSubmit={solicitarEnlace} className="flex flex-col gap-5">
              {aviso && (
                <p role="status" className="rounded-[14px] border border-(color:--line) bg-(--white) px-4 py-3 text-sm text-(--ink)">
                  {aviso}
                </p>
              )}
              <label className="flex flex-col gap-2 text-xs font-bold text-(--ink)">
                Correo electrónico
                <span className={fieldClass}>
                  <Mail size={19} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nombre@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAviso("");
                    }}
                    className={inputClass}
                  />
                </span>
              </label>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className={botonClass}>
                {loading ? "Enviando..." : "Enviarme el enlace"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ))}
      </div>
    </main>
  );
}
