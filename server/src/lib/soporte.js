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

// Correo interno de respaldo de pedidos rechazados: un filtro del buzón lo mueve a su carpeta.
export const CORREO_RECHAZOS = "solicitudes@pintapatitas.com";

const clp = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? "$" + n.toLocaleString("es-CL") : "—";
};

/**
 * Cuando la artista rechaza una solicitud: avisa al cliente con el motivo y manda un respaldo
 * interno con asunto "Pedido rechazado #PP-N". Ambos salen desde soporte@ y sin copia oculta
 * (el respaldo ya es la copia). Un fallo en uno no impide el otro; devuelve cuáles fallaron.
 */
export async function enviarCorreosRechazo(
  { pedido, motivo, estadoPrevio },
  { destinoRespaldo = CORREO_RECHAZOS, enviar = enviarCorreo } = {},
) {
  const codigo = `#PP-${pedido.order_number}`;
  const mascota = pedido.pet_name || "tu mascota";
  const conLinkVigente = estadoPrevio === "pendiente_abono";

  const alCliente = enviar({
    to: pedido.customer_email,
    remitente: "soporte",
    respaldo: false,
    replyTo: CORREO_SOPORTE,
    subject: `Tu solicitud ${codigo} fue rechazada — PintaPatitas`,
    html: plantilla({
      titulo: "Tu solicitud fue rechazada",
      subtitulo: `Solicitud ${codigo}`,
      cuerpo: `
        <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(pedido.customer_name)}</strong>!</p>
        <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
          Lamentamos contarte que no podremos realizar la solicitud ${esc(codigo)} para <strong>${esc(mascota)}</strong>.
          Este es el motivo que nos dejó la artista:
        </p>
        ${bloqueMensaje(motivo)}
        ${conLinkVigente
          ? `<p style="margin:16px 0 0;color:#b45309;font-size:13px;line-height:1.6;"><strong>Importante:</strong> si te enviamos un enlace de pago para esta solicitud, por favor no lo uses.</p>`
          : ""}
        <p style="margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
          Si tienes dudas o quieres conversar otra idea, responde este correo y te ayudamos.
        </p>`,
    }),
    text: [
      `¡Hola ${pedido.customer_name}!`,
      "",
      `Lamentamos contarte que no podremos realizar la solicitud ${codigo} para ${mascota}.`,
      "Este es el motivo que nos dejó la artista:",
      "",
      motivo,
      "",
      ...(conLinkVigente ? ["Importante: si te enviamos un enlace de pago para esta solicitud, por favor no lo uses.", ""] : []),
      "Si tienes dudas o quieres conversar otra idea, responde este correo y te ayudamos.",
      "",
      "PintaPatitas",
    ].join("\n"),
  });

  const respaldo = enviar({
    to: destinoRespaldo,
    remitente: "soporte",
    respaldo: false,
    replyTo: `"${String(pedido.customer_name ?? "").replaceAll('"', "")}" <${pedido.customer_email}>`,
    subject: `Pedido rechazado ${codigo}`,
    html: plantilla({
      titulo: "Pedido rechazado",
      subtitulo: `Solicitud ${codigo}`,
      cuerpo: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${[
          fila("Pedido", codigo),
          fila("Cliente", pedido.customer_name),
          fila("Correo", pedido.customer_email),
          fila("Celular", pedido.customer_phone || "—"),
          fila("Mascota", pedido.pet_name || "—"),
          fila("Estilo / tamaño", [pedido.style, pedido.size].filter(Boolean).join(" · ") || "—"),
          fila("Total", clp(pedido.total_amount)),
          fila("Estado anterior", estadoPrevio),
        ].join("")}</table>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Motivo enviado al cliente:</p>
        ${bloqueMensaje(motivo)}`,
    }),
    text: [
      `Pedido rechazado ${codigo}`,
      "",
      `Cliente: ${pedido.customer_name}`,
      `Correo: ${pedido.customer_email}`,
      `Celular: ${pedido.customer_phone || "—"}`,
      `Mascota: ${pedido.pet_name || "—"}`,
      `Estilo / tamaño: ${[pedido.style, pedido.size].filter(Boolean).join(" · ") || "—"}`,
      `Total: ${clp(pedido.total_amount)}`,
      `Estado anterior: ${estadoPrevio}`,
      "",
      "Motivo enviado al cliente:",
      motivo,
    ].join("\n"),
  });

  const [cliente, interno] = await Promise.allSettled([alCliente, respaldo]);
  const fallos = [];
  if (cliente.status === "rejected") {
    fallos.push("cliente");
    console.error(`[Rechazo] No se pudo avisar al cliente (${codigo}):`, cliente.reason?.message ?? cliente.reason);
  }
  if (interno.status === "rejected") {
    fallos.push("respaldo");
    console.error(`[Rechazo] No se pudo enviar el respaldo (${codigo}):`, interno.reason?.message ?? interno.reason);
  }
  return { fallos };
}

/**
 * Alerta interna: Mercado Pago aprobó un pago de un pedido que ya estaba rechazado (el cliente
 * pagó con un enlace enviado antes del rechazo). No toca el cobro: solo avisa para devolver el dinero.
 */
export async function enviarAlertaPagoRechazado(
  { pedido, tipoPago, monto, mpPaymentId },
  { destino = CORREO_RECHAZOS, enviar = enviarCorreo } = {},
) {
  const codigo = `#PP-${pedido.order_number}`;
  const filas = [
    ["Pedido", codigo],
    ["Cliente", pedido.customer_name],
    ["Correo", pedido.customer_email],
    ["Tipo de pago", tipoPago],
    ["Monto", clp(monto)],
    ["ID de pago en Mercado Pago", mpPaymentId],
  ];
  await enviar({
    to: destino,
    remitente: "soporte",
    respaldo: false,
    replyTo: `"${String(pedido.customer_name ?? "").replaceAll('"', "")}" <${pedido.customer_email}>`,
    subject: `⚠ Pago recibido de un pedido rechazado ${codigo}`,
    html: plantilla({
      titulo: "Pago de un pedido rechazado",
      subtitulo: `Solicitud ${codigo}`,
      cuerpo: `
        <p style="margin:0 0 16px;color:#b45309;font-size:14px;line-height:1.6;">
          Mercado Pago aprobó un pago de un pedido que ya estaba <strong>rechazado</strong>. El pedido no cambió de estado:
          hay que devolver el dinero al cliente desde Mercado Pago.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas.map(([e, v]) => fila(e, v)).join("")}</table>`,
    }),
    text: [
      `Mercado Pago aprobó un pago de un pedido ya rechazado (${codigo}).`,
      "El pedido no cambió de estado: hay que devolver el dinero al cliente desde Mercado Pago.",
      "",
      ...filas.map(([e, v]) => `${e}: ${v}`),
    ].join("\n"),
  });
}

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

  // Ambos correos salen desde soporte@ (si SOPORTE_SMTP_USER está configurado), así nada de
  // soporte pasa por la casilla de pedidos. El aviso al equipo ya llega a soporte@: sin copia oculta.
  await enviar({
    to: destino,
    remitente: "soporte",
    respaldo: false,
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
    remitente: "soporte",
    respaldo: false, // El equipo ya tiene el mensaje en el aviso: sin copia oculta a soporte@
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
