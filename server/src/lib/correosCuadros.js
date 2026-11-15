import { TERMINOS_VIGENCIA, enviarCorreo, urlTerminos } from "./mailer.js";

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
              <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">PintaPatitas · Obras originales de mascotas</p>
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

const fechaChile = (iso) =>
  new Date(iso ?? Date.now()).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" });

// Derecho a retracto de los cuadros listos (art. 3 bis b, Ley 19.496): 10 días desde la recepción.
const RETRACTO_TEXTO =
  "Tienes 10 días desde que recibas el cuadro para arrepentirte de la compra sin dar motivo (art. 3 bis, Ley 19.496). Para hacerlo, responde a este correo o escribe a soporte@pintapatitas.com con tu número de compra: te indicaremos cómo devolverlo por Starken y te reembolsaremos lo pagado por Mercado Pago. Si llega dañado, escríbenos con fotos; además tienes garantía legal de 6 meses.";

const bloqueRetracto = () => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6f9;border:1px solid #cfe3ec;border-radius:12px;margin-bottom:18px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0 0 6px;color:#1d4e68;font-size:15px;font-weight:bold;">Tu derecho a retracto</p>
        <p style="margin:0;color:#334155;font-size:13px;line-height:1.55;">${esc(RETRACTO_TEXTO)}</p>
      </td></tr>
    </table>`;

/** Confirmación al comprador (respaldo escrito de la compra y de los términos aceptados). */
export async function enviarCorreoCompraCuadro(venta) {
  const terminos = urlTerminos();
  const aceptacion = `Al comprar el ${fechaChile(venta.created_at)} aceptaste los Términos y condiciones vigentes desde el ${TERMINOS_VIGENCIA}`;
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
    </p>
    ${bloqueRetracto()}
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      ${esc(aceptacion)}: <a href="${esc(terminos)}" style="color:#2d6583;font-weight:600;">ver términos</a>. Guarda este correo como respaldo de tu compra.
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
    "Te avisaremos cuando lo despachemos, con el número de seguimiento.",
    "",
    "TU DERECHO A RETRACTO",
    RETRACTO_TEXTO,
    "",
    `${aceptacion}: ${terminos}`,
    "Guarda este correo como respaldo de tu compra.",
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

/** Aviso al comprador cuyo pago llegó cuando el cuadro ya estaba vendido. */
export async function enviarCorreoPagoDuplicadoCuadro(venta) {
  const asunto = `Tu pago por "${venta.cuadro_titulo}" será devuelto — Compra ${codigo(venta)}`;
  const mensaje =
    "Lamentablemente, cuando se aprobó tu pago el cuadro ya había sido vendido a otra persona. Vamos a devolverte el pago completo a través de Mercado Pago; no tienes que hacer nada. Si tienes dudas, responde a este correo o escribe a soporte@pintapatitas.com.";
  const cuerpo = `
    <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(venta.comprador_nombre)}</strong>!</p>
    <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">${esc(mensaje)}</p>
    ${tabla([
      fila("Compra", codigo(venta)),
      fila("Cuadro", venta.cuadro_titulo),
      fila("Monto a devolver", clp(venta.monto)),
      fila("Pago Mercado Pago", venta.mp_payment_id ?? "—"),
    ])}`;
  const texto = [
    `¡Hola ${venta.comprador_nombre}!`,
    "",
    mensaje,
    "",
    `Compra: ${codigo(venta)} · Cuadro: ${venta.cuadro_titulo}`,
    `Monto a devolver: ${clp(venta.monto)}`,
    "PintaPatitas",
  ].join("\n");

  await enviarCorreo({
    to: venta.comprador_email,
    subject: asunto,
    html: plantilla({ titulo: "PintaPatitas", subtitulo: "Devolución de tu pago", cuerpo }),
    text: texto,
  });
}

/** Aviso al comprador de que su cuadro fue despachado, con el número de seguimiento de Starken. */
export async function enviarCorreoDespachoCuadro(venta) {
  const asunto = `Tu cuadro "${venta.cuadro_titulo}" va en camino — Compra ${codigo(venta)}`;
  const seguimiento = venta.seguimiento_starken;
  const lineaSeguimiento = seguimiento
    ? `Puedes seguir tu envío en starken.cl con el número de seguimiento ${seguimiento}.`
    : "Si necesitas el número de seguimiento, responde a este correo y te lo enviamos.";
  const cuerpo = `
    <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(venta.comprador_nombre)}</strong>!</p>
    <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
      Despachamos tu cuadro <strong>${esc(venta.cuadro_titulo)}</strong> por Starken. ${esc(lineaSeguimiento)}
    </p>
    ${tabla([
      fila("Compra", codigo(venta)),
      fila("Cuadro", venta.cuadro_titulo),
      fila("Seguimiento Starken", seguimiento || "—"),
      fila("Entrega", entrega(venta)),
      fila("Comuna", `${venta.comuna}, ${venta.region}`),
    ])}
    <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6;">
      <strong>Recuerda:</strong> el envío es por pagar; el costo de Starken lo pagas al recibir el cuadro. Revísalo al recibirlo y, si notas algún daño, escríbenos con fotos del cuadro y del embalaje.
    </p>
    ${bloqueRetracto()}`;
  const texto = [
    `¡Hola ${venta.comprador_nombre}!`,
    "",
    `Despachamos tu cuadro "${venta.cuadro_titulo}" por Starken (compra ${codigo(venta)}).`,
    lineaSeguimiento,
    entrega(venta),
    `Comuna: ${venta.comuna}, ${venta.region}`,
    "",
    "Recuerda: el envío es por pagar; el costo de Starken lo pagas al recibir el cuadro. Si llega con daños, escríbenos con fotos.",
    "",
    "TU DERECHO A RETRACTO",
    RETRACTO_TEXTO,
    "PintaPatitas",
  ].join("\n");

  await enviarCorreo({
    to: venta.comprador_email,
    subject: asunto,
    html: plantilla({ titulo: "PintaPatitas", subtitulo: `Compra ${codigo(venta)} despachada`, cuerpo }),
    text: texto,
  });
}

/** Lo usa el webhook: nunca lanza, solo registra errores de envío. */
export function notificarVentaCuadro({ tipo, venta }) {
  const tareas =
    tipo === "devolucion"
      ? [enviarCorreoAvisoVentaCuadro(venta, { devolucion: true }), enviarCorreoPagoDuplicadoCuadro(venta)]
      : [enviarCorreoCompraCuadro(venta), enviarCorreoAvisoVentaCuadro(venta)];
  for (const tarea of tareas) {
    tarea.catch((err) => console.error("[Cuadros] Error enviando correo de venta:", err));
  }
}
