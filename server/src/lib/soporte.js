import { enviarCorreo } from "./mailer.js";

// Mensajes del formulario de soporte (/soporte). Van al correo de soporte, con "responder a"
// el correo del cliente, y el cliente recibe una copia de lo que envió.

export const CORREO_SOPORTE = "soporte@pintapatitas.com";
export const MOTIVOS = {
  retrato: "Pedido de retrato",
  cuadro: "Compra de un cuadro listo",
  pago: "Pagos",
  envio: "Envío",
  otro: "Otra consulta",
};
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sin saltos de línea (evita inyectar cabeceras en el asunto) y sin espacios de más.
const linea = (v, max) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
// El mensaje conserva sus saltos de línea, pero sin líneas vacías de sobra.
const parrafos = (v, max) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "");

export function leerSoporte(body = {}) {
  const datos = {
    nombre: linea(body.nombre, 120),
    email: linea(body.email, 120).toLowerCase(),
    telefono: linea(body.telefono, 20),
    pedido: linea(body.pedido, 30),
    motivo: Object.hasOwn(MOTIVOS, body.motivo) ? body.motivo : "",
    mensaje: parrafos(body.mensaje, 3000),
  };
  // Campo oculto: una persona lo deja vacío; un bot que rellena todo, no.
  const esBot = typeof body.sitio_web === "string" && body.sitio_web.trim() !== "";

  let error = null;
  if (datos.nombre.length < 2) error = "Ingresa tu nombre.";
  else if (!REGEX_CORREO.test(datos.email)) error = "El correo no es válido.";
  else if (datos.telefono && !/^\+569\d{8}$/.test(datos.telefono)) error = "El celular no es válido.";
  else if (!datos.motivo) error = "Elige el motivo de tu consulta.";
  else if (datos.mensaje.length < 20) error = "Cuéntanos un poco más sobre el problema (mínimo 20 caracteres).";

  return { datos, error, esBot };
}

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const fila = (etiqueta, valor) =>
  `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;vertical-align:top;width:34%;">${esc(etiqueta)}</td><td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;">${esc(valor)}</td></tr>`;

function plantilla({ titulo, subtitulo, cuerpo }) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#e8f0f3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8f0f3;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;border:1px solid #dbe7ee;overflow:hidden;">
          <tr>
            <td style="background:#2d6583;padding:26px 28px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">${esc(titulo)}</p>
              <p style="margin:6px 0 0;color:#cfe3ec;font-size:14px;">${esc(subtitulo)}</p>
            </td>
          </tr>
          <tr><td style="padding:24px 28px 18px;">${cuerpo}</td></tr>
          <tr>
            <td style="background:#f1f5f9;padding:16px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">PintaPatitas · Soporte</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const bloqueMensaje = (mensaje) =>
  `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(mensaje)}</div>`;

/** Envía el mensaje al equipo y una copia al cliente. La copia es opcional: si falla, no se reporta error. */
export async function enviarMensajeSoporte(datos, { destino = CORREO_SOPORTE, enviar = enviarCorreo } = {}) {
  const motivo = MOTIVOS[datos.motivo];
  const asunto = `[Soporte] ${motivo} — ${datos.nombre}${datos.pedido ? ` (${datos.pedido})` : ""}`;

  const filas = [
    fila("Nombre", datos.nombre),
    fila("Correo", datos.email),
    fila("Celular", datos.telefono || "—"),
    fila("Motivo", motivo),
    fila("N° de pedido", datos.pedido || "—"),
  ].join("");

  await enviar({
    to: destino,
    replyTo: `"${datos.nombre.replaceAll('"', "")}" <${datos.email}>`,
    subject: asunto,
    html: plantilla({
      titulo: "Nuevo mensaje de soporte",
      subtitulo: motivo,
      cuerpo: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${filas}</table>
        ${bloqueMensaje(datos.mensaje)}
        <p style="margin:16px 0 0;color:#64748b;font-size:12px;">Responde este correo para contestarle directamente a ${esc(datos.nombre)}.</p>`,
    }),
    text: [
      `Nuevo mensaje de soporte — ${motivo}`,
      "",
      `Nombre: ${datos.nombre}`,
      `Correo: ${datos.email}`,
      `Celular: ${datos.telefono || "—"}`,
      `N° de pedido: ${datos.pedido || "—"}`,
      "",
      datos.mensaje,
    ].join("\n"),
  });

  enviar({
    to: datos.email,
    replyTo: destino,
    subject: "Recibimos tu mensaje — PintaPatitas",
    html: plantilla({
      titulo: "Recibimos tu mensaje",
      subtitulo: motivo,
      cuerpo: `
        <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(datos.nombre)}</strong>!</p>
        <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
          Gracias por escribirnos. Te responderemos a este correo lo antes posible. Esta es una copia de lo que nos enviaste:
        </p>
        ${bloqueMensaje(datos.mensaje)}`,
    }),
    text: [
      `¡Hola ${datos.nombre}!`,
      "",
      "Gracias por escribirnos. Te responderemos a este correo lo antes posible.",
      "Esta es una copia de lo que nos enviaste:",
      "",
      datos.mensaje,
      "",
      "PintaPatitas",
    ].join("\n"),
  }).catch((err) => console.error("[Soporte] No se pudo enviar la copia al cliente:", err?.message ?? err));
}
