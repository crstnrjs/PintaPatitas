import { enviarCorreo } from "./mailer.js";

// Correos de la venta de cuadros listos. Mismo estilo que los correos de pedidos.

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const clp = (v) => "$" + Number(v).toLocaleString("es-CL");
const codigo = (venta) => `#CL-${venta.numero}`;
const entrega = (venta) =>
  venta.entrega_tipo === "sucursal" ? `Retiro en sucursal Starken: ${venta.direccion}` : `A domicilio: ${venta.direccion}`;

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
          <tr><td style="padding:24px 28px 12px;">${cuerpo}</td></tr>
          <tr>
            <td style="background:#f1f5f9;padding:16px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">PintaPatitas · Cuadros pintados a mano</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const fila = (etiqueta, valor) =>
  `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;vertical-align:top;">${esc(etiqueta)}</td><td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${esc(valor)}</td></tr>`;

const tabla = (filas) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:18px;">${filas.join("")}</table>`;

/** Confirmación al comprador. */
export async function enviarCorreoCompraCuadro(venta) {
  const asunto = `¡Compraste "${venta.cuadro_titulo}"! — Compra ${codigo(venta)}`;
  const cuerpo = `
    <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(venta.comprador_nombre)}</strong>!</p>
    <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
      Recibimos tu pago. El cuadro <strong>${esc(venta.cuadro_titulo)}</strong> ya es tuyo y lo prepararemos para enviarlo por Starken.
    </p>
    ${tabla([
      fila("Compra", codigo(venta)),
      fila("Cuadro", venta.cuadro_titulo),
      fila("Total pagado", clp(venta.monto)),
      fila("Entrega", entrega(venta)),
      fila("Comuna", `${venta.comuna}, ${venta.region}`),
    ])}
    <p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.6;">
      <strong>El envío es por pagar:</strong> el costo de Starken lo pagas al recibir el cuadro.
      Te avisaremos cuando lo despachemos, con el número de seguimiento.
    </p>`;

  const texto = [
    `¡Hola ${venta.comprador_nombre}!`,
    "",
    `Recibimos tu pago. El cuadro "${venta.cuadro_titulo}" ya es tuyo (compra ${codigo(venta)}).`,
    `Total pagado: ${clp(venta.monto)}`,
    entrega(venta),
    `Comuna: ${venta.comuna}, ${venta.region}`,
    "",
    "El envío es por pagar: el costo de Starken lo pagas al recibir el cuadro.",
    "Te avisaremos cuando lo despachemos.",
    "PintaPatitas",
  ].join("\n");

  await enviarCorreo({
    to: venta.comprador_email,
    subject: asunto,
    html: plantilla({ titulo: "PintaPatitas", subtitulo: `Compra ${codigo(venta)} confirmada`, cuerpo }),
    text: texto,
  });
}

/** Aviso a la artista: hay que preparar el envío (o devolver un pago duplicado). */
export async function enviarCorreoAvisoVentaCuadro(venta, { devolucion = false } = {}) {
  const destino = process.env.ADMIN_NOTIFY_EMAIL;
  if (!destino) throw new Error("Falta ADMIN_NOTIFY_EMAIL en server/.env");

  const base = (process.env.FRONTEND_URL || "https://pintapatitas.com").replace(/\/+$/, "");
  const enlace = `${base}/admin/cuadros-listos`;
  const asunto = devolucion
    ? `⚠️ Pago duplicado de "${venta.cuadro_titulo}": hay que devolverlo — ${codigo(venta)}`
    : `🖼️ ¡Vendiste "${venta.cuadro_titulo}"! Prepara el envío — ${codigo(venta)}`;

  const aviso = devolucion
    ? `<p style="margin:0 0 16px;color:#963a31;font-size:14px;line-height:1.6;"><strong>Este cuadro ya estaba vendido</strong> cuando se aprobó este pago. Hay que devolverle el dinero al comprador desde Mercado Pago (pago ${esc(venta.mp_payment_id)}) y avisarle.</p>`
    : `<p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">Se pagó un cuadro listo. Prepáralo y despáchalo <strong>por pagar</strong> en Starken con estos datos:</p>`;

  const cuerpo = `
    ${aviso}
    ${tabla([
      fila("Compra", codigo(venta)),
      fila("Cuadro", venta.cuadro_titulo),
      fila("Total pagado", clp(venta.monto)),
      fila("Comisión plataforma", clp(venta.comision_monto)),
      fila("Pago Mercado Pago", venta.mp_payment_id ?? "—"),
    ])}
    ${tabla([
      fila("Nombre", venta.comprador_nombre),
      fila("RUT", venta.comprador_rut),
      fila("Correo", venta.comprador_email),
      fila("Celular", venta.comprador_telefono),
      fila("Entrega", entrega(venta)),
      fila("Comuna", venta.comuna),
      fila("Región", venta.region),
    ])}
    <div style="text-align:center;padding:6px 0 18px;">
      <a href="${esc(enlace)}" style="display:inline-block;background:#2d6583;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 26px;border-radius:999px;">Ver en el panel</a>
    </div>`;

  const texto = [
    devolucion ? "PAGO DUPLICADO: el cuadro ya estaba vendido. Hay que devolver este pago." : "Se vendió un cuadro listo.",
    `Compra: ${codigo(venta)} · Cuadro: ${venta.cuadro_titulo} · Total: ${clp(venta.monto)}`,
    `Pago Mercado Pago: ${venta.mp_payment_id ?? "—"}`,
    "",
    `Nombre: ${venta.comprador_nombre}`,
    `RUT: ${venta.comprador_rut}`,
    `Correo: ${venta.comprador_email}`,
    `Celular: ${venta.comprador_telefono}`,
    entrega(venta),
    `Comuna: ${venta.comuna}, ${venta.region}`,
    "",
    `Panel: ${enlace}`,
  ].join("\n");

  await enviarCorreo({
    to: destino,
    subject: asunto,
    html: plantilla({ titulo: devolucion ? "Hay que devolver un pago" : "¡Nueva venta!", subtitulo: venta.cuadro_titulo, cuerpo }),
    text: texto,
  });
}

/** Lo usa el webhook: nunca lanza, solo registra errores de envío. */
export function notificarVentaCuadro({ tipo, venta }) {
  const tareas =
    tipo === "devolucion"
      ? [enviarCorreoAvisoVentaCuadro(venta, { devolucion: true })]
      : [enviarCorreoCompraCuadro(venta), enviarCorreoAvisoVentaCuadro(venta)];
  for (const tarea of tareas) {
    tarea.catch((err) => console.error("[Cuadros] Error enviando correo de venta:", err));
  }
}
