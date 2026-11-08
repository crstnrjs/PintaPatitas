import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { apiUrl } from "@/lib/api";
import { CONTACTO } from "@/lib/contacto";
import { Huella } from "@/pages/landing/ui";
import { normalizarTelefono } from "@/pages/pedido/StepContacto";

const MOTIVOS = [
  ["retrato", "Pedido de retrato"],
  ["cuadro", "Compra de un cuadro listo"],
  ["pago", "Pagos"],
  ["envio", "Envío"],
  ["otro", "Otra consulta"],
];
const MAX_MENSAJE = 3000;
const MIN_MENSAJE = 20;

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";
const campoBase =
  "mt-1.5 block w-full rounded-2xl border bg-white/90 px-4 text-base text-tinta outline-none transition placeholder:text-tinta/35 focus:ring-3";
const campoOk = "border-tinta/15 focus:border-acento focus:ring-cielo/40";
const campoMal = "border-[#d98a80] focus:border-[#b8483c] focus:ring-[#f3c9c3]";

const consejos = [
  [DocumentTextIcon, "Incluye tu número de pedido", "Si tu consulta es sobre un pedido (#PP-…) o una compra (#CL-…), así lo encontramos más rápido."],
  [ClockIcon, "Te respondemos por correo", "Te llegará una copia de tu mensaje y nuestra respuesta al correo que indiques."],
];

function validar(d) {
  const e = {};
  if (d.nombre.trim().length < 2) e.nombre = "Ingresa tu nombre";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Ingresa un correo válido";
  if (d.telefono.trim() && !/^9\d{8}$/.test(normalizarTelefono(d.telefono))) e.telefono = "Ingresa un celular chileno, por ejemplo 9 1234 5678";
  if (!d.motivo) e.motivo = "Elige el motivo de tu consulta";
  if (d.mensaje.trim().length < MIN_MENSAJE) e.mensaje = `Cuéntanos un poco más (mínimo ${MIN_MENSAJE} caracteres)`;
  return e;
}

function Campo({ etiqueta, opcional, error, ayuda, className = "", children }) {
  return (
    <label className={`block text-sm font-medium text-tinta ${className}`}>
      {etiqueta}
      {opcional && <span className="font-normal text-tinta/45"> (opcional)</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-normal text-[#a0392f]">{error}</span>
      ) : (
        ayuda && <span className="mt-1 block text-xs font-normal text-tinta/55">{ayuda}</span>
      )}
    </label>
  );
}

export default function Soporte() {
  const [params] = useSearchParams();
  const motivoInicial = MOTIVOS.some(([id]) => id === params.get("motivo")) ? params.get("motivo") : "";
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    telefono: "",
    pedido: (params.get("pedido") ?? "").slice(0, 30),
    motivo: motivoInicial,
    mensaje: "",
    sitio_web: "",
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const anterior = document.title;
    document.title = "Soporte | PintaPatitas";
    return () => {
      document.title = anterior;
    };
  }, []);

  const cambiar = (campo) => (e) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
  };
  const clase = (campo, extra = "min-h-12") => `${campoBase} ${extra} ${errores[campo] ? campoMal : campoOk}`;

  async function enviar(e) {
    e.preventDefault();
    setErrorGeneral("");
    const encontrados = validar(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      e.currentTarget.querySelector(`[name="${Object.keys(encontrados)[0]}"]`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(apiUrl("/api/soporte"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          telefono: datos.telefono.trim() ? `+56${normalizarTelefono(datos.telefono)}` : "",
          pedido: datos.pedido.trim(),
          motivo: datos.motivo,
          mensaje: datos.mensaje.trim(),
          sitio_web: datos.sitio_web,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.");
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fondo-acuarela text-tinta">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 pt-8 pb-14 md:px-10 md:pt-16 md:pb-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        {/* Texto e indicaciones */}
        <div className="lg:sticky lg:top-28">
          <p className="text-base font-medium text-acento">Soporte</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,6.5vw,3.8rem)] leading-[1.04] md:mt-4">¿Necesitas ayuda?</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-tinta/70 md:mt-6 md:text-lg">
            Cuéntanos qué pasó con tu pedido, tu pago o tu envío, y te ayudamos a resolverlo.
          </p>

          <ul className="mt-7 space-y-4 md:mt-10">
            {consejos.map(([Icono, titulo, texto]) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bruma text-acento-oscuro">
                  <Icono aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block font-semibold">{titulo}</strong>
                  <span className="mt-0.5 block text-sm leading-relaxed text-tinta/65">{texto}</span>
                </span>
              </li>
            ))}
          </ul>

          <a
            href={CONTACTO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`vidrio mt-7 flex items-center gap-4 rounded-[22px] p-4 transition hover:bg-white/90 md:mt-10 ${enfoque}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e1f0e6] text-[#2d6844]">
              <ChatBubbleLeftRightIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-sm leading-snug">
              <strong className="block font-semibold">¿Es urgente?</strong>
              <span className="text-tinta/65">Escríbenos por WhatsApp al {CONTACTO.telefono}.</span>
            </span>
          </a>
        </div>

        {/* Formulario */}
        <div className="arcilla relative overflow-hidden rounded-[26px] p-5 sm:p-7 md:rounded-[32px] md:p-9">
          {enviado ? (
            <div role="status" className="py-8 text-center md:py-14">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e1f0e6] text-[#2d6844]">
                <CheckCircleIcon aria-hidden="true" className="h-8 w-8" />
              </span>
              <h2 className="mt-5 font-display text-3xl">¡Mensaje enviado!</h2>
              <p className="mx-auto mt-3 max-w-sm leading-relaxed text-tinta/70">
                Te enviamos una copia a <strong className="break-words text-tinta">{datos.email.trim()}</strong>. Te responderemos ahí lo antes posible.
              </p>
              <Link
                to="/"
                className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-acento px-7 font-semibold text-white transition hover:bg-acento-oscuro ${enfoque}`}
              >
                Volver al inicio
              </Link>
              <Huella className="absolute -right-6 -bottom-8 h-32 w-32 rotate-12 text-cielo/15" />
            </div>
          ) : (
            <form onSubmit={enviar} noValidate className="space-y-5" aria-labelledby="soporte-form-titulo">
              <h2 id="soporte-form-titulo" className="font-display text-2xl md:text-3xl">Escríbenos</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <Campo etiqueta="Nombre" error={errores.nombre}>
                  <input name="nombre" autoComplete="name" className={clase("nombre")} value={datos.nombre} onChange={cambiar("nombre")} maxLength={120} />
                </Campo>
                <Campo etiqueta="Correo" error={errores.email}>
                  <input name="email" type="email" autoComplete="email" className={clase("email")} value={datos.email} onChange={cambiar("email")} maxLength={120} />
                </Campo>
                <Campo etiqueta="Celular" opcional error={errores.telefono}>
                  <span className="relative block">
                    <span className="pointer-events-none absolute top-1/2 left-4 mt-0.75 -translate-y-1/2 text-base text-tinta/50">+56</span>
                    <input
                      name="telefono"
                      type="tel"
                      autoComplete="tel-national"
                      placeholder="9 1234 5678"
                      className={`${clase("telefono")} pl-13`}
                      value={datos.telefono}
                      onChange={cambiar("telefono")}
                      maxLength={16}
                    />
                  </span>
                </Campo>
                <Campo etiqueta="N° de pedido o compra" opcional>
                  <input name="pedido" placeholder="#PP-123 o #CL-45" className={clase("pedido")} value={datos.pedido} onChange={cambiar("pedido")} maxLength={30} />
                </Campo>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-tinta">¿Sobre qué es tu consulta?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MOTIVOS.map(([id, etiqueta]) => (
                    <label
                      key={id}
                      className={`flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${
                        datos.motivo === id ? "bg-tinta text-white" : "bg-white/80 text-tinta ring-1 ring-tinta/12 hover:bg-white"
                      }`}
                    >
                      <input type="radio" name="motivo" value={id} checked={datos.motivo === id} onChange={cambiar("motivo")} className="sr-only" />
                      {etiqueta}
                    </label>
                  ))}
                </div>
                {errores.motivo && <span className="mt-1.5 block text-xs text-[#a0392f]">{errores.motivo}</span>}
              </fieldset>

              <Campo etiqueta="Cuéntanos qué pasó" error={errores.mensaje}>
                <textarea
                  name="mensaje"
                  rows={6}
                  placeholder="Describe el problema con el mayor detalle posible: qué pasó, cuándo y qué esperabas."
                  className={clase("mensaje", "min-h-40 resize-y py-3 leading-relaxed")}
                  value={datos.mensaje}
                  onChange={cambiar("mensaje")}
                  maxLength={MAX_MENSAJE}
                />
                {!errores.mensaje && (
                  <span className="mt-1 flex justify-between text-xs font-normal text-tinta/50">
                    <span>Mínimo {MIN_MENSAJE} caracteres.</span>
                    <span className="tabular-nums">
                      {datos.mensaje.length}/{MAX_MENSAJE}
                    </span>
                  </span>
                )}
              </Campo>

              {/* Campo trampa para bots: las personas no lo ven ni lo llenan. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Sitio web
                  <input name="sitio_web" tabIndex={-1} autoComplete="off" value={datos.sitio_web} onChange={cambiar("sitio_web")} />
                </label>
              </div>

              {errorGeneral && (
                <p role="alert" className="rounded-2xl bg-[#fbefed] px-4 py-3 text-sm text-[#963a31]">
                  {errorGeneral}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acento px-7 py-3.5 text-base font-semibold text-white shadow-[0_6px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto ${enfoque}`}
              >
                <PaperAirplaneIcon aria-hidden="true" className="h-5 w-5" />
                {enviando ? "Enviando…" : "Enviar mensaje"}
              </button>
              <p className="text-xs leading-relaxed text-tinta/50">
                Usamos tus datos solo para responder tu consulta. Más detalles en los{" "}
                <Link to="/terminos" className="underline underline-offset-2">
                  Términos y condiciones
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
