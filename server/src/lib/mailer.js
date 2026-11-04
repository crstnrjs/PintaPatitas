import nodemailer from "nodemailer";

// Transporte Gmail SMTP (contraseña de aplicación). Se crea una sola vez y se reutiliza.
let transport = null;

function obtenerTransport() {
  if (transport) return transport;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en server/.env");
  }

  transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // SSL
    secure: true,
    auth: { user, pass },
  });
  return transport;
}

// Escape de todo texto que viene del cliente
function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Formato chileno: 120000 → $120.000
function clp(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return "$" + n.toLocaleString("es-CL");
}

function fila(etiqueta, valor) {
  return `
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;width:150px;vertical-align:top;">${esc(etiqueta)}</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${valor ? esc(valor) : "—"}</td>
      </tr>`;
}

function filaHTML(etiqueta, valorHTML) {
  return `
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;width:150px;vertical-align:top;">${esc(etiqueta)}</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${valorHTML || "—"}</td>
      </tr>`;
}

function seccion(titulo, filas) {
  return `
    <tr><td colspan="2" style="padding:18px 0 4px;font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#2d6583;">${esc(titulo)}</td></tr>
    ${filas}`;
}

/**
 * Envía a la amiga (administradora) un correo con todos los datos de una solicitud nueva.
 */
export async function enviarCorreoNuevaSolicitud({ pedido, fotos }) {
  const destino = process.env.ADMIN_NOTIFY_EMAIL;
  if (!destino) throw new Error("Falta ADMIN_NOTIFY_EMAIL en server/.env");

  const base = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  const enlace = `${base}/admin/solicitudes/${pedido.id}`;

  const n = pedido.pet_count ?? 1;
  const asunto = `Nueva solicitud #PP-${pedido.order_number} — Retrato de ${n} ${
    n === 1 ? "mascota" : "mascotas"
  } (${pedido.style ?? "estilo"})`;

  const direccion = [pedido.street, pedido.street_number].filter(Boolean).join(" ");
  const direccionCompleta = [direccion, pedido.apartment].filter(Boolean).join(" · ");

  const filas = [
    seccion(
      "Cliente",
      fila("Nombre", pedido.customer_name) +
        filaHTML(
          "Correo",
          pedido.customer_email
            ? `<a href="mailto:${esc(pedido.customer_email)}" style="color:#2d6583;">${esc(
                pedido.customer_email,
              )}</a>`
            : "",
        ) +
        fila("Celular", pedido.customer_phone),
    ),
    seccion(
      "Obra",
      fila("Producto", pedido.product) +
        fila("Estilo", pedido.style) +
        fila("Tamaño", pedido.size) +
        fila("Mascotas", String(n)) +
        fila("Nombre de la mascota", pedido.pet_name) +
        fila("Indicaciones", pedido.description),
    ),
    seccion(
      "Pago",
      fila("Precio total", clp(pedido.total_amount)) +
        fila("Abono a cobrar", clp(pedido.deposit_amount)),
    ),
    seccion(
      "Dirección de envío",
      fila("Dirección", direccionCompleta) +
        fila("Comuna", pedido.commune) +
        fila("Región", pedido.region),
    ),
    seccion("Envío", fila("Fecha", new Date(pedido.created_at).toLocaleString("es-CL"))),
  ].join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#e8f0f3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8f0f3;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;border:1px solid #dbe7ee;overflow:hidden;">
          <tr>
            <td style="background:#2d6583;padding:22px 28px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">PintaPatitas</p>
              <p style="margin:4px 0 0;color:#cfe3ec;font-size:13px;">Nueva solicitud #PP-${esc(
                pedido.order_number,
              )}</p>
            </td>
          </tr>
          <tr><td style="padding:8px 28px 0;">${filas}</td></tr>
          <tr>
            <td style="padding:22px 28px 28px;">
              <a href="${esc(
                enlace,
              )}" style="display:inline-block;background:#2d6583;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:999px;">Ver en el panel</a>
              <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Fotos adjuntas: ${
                fotos.length
              }. Este correo es un respaldo; el pedido siempre queda en el panel.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const texto = [
    `Nueva solicitud #PP-${pedido.order_number}`,
    "",
    "CLIENTE",
    `Nombre: ${pedido.customer_name ?? "—"}`,
    `Correo: ${pedido.customer_email ?? "—"}`,
    `Celular: ${pedido.customer_phone ?? "—"}`,
    "",
    "OBRA",
    `Producto: ${pedido.product ?? "—"}`,
    `Estilo: ${pedido.style ?? "—"}`,
    `Tamaño: ${pedido.size ?? "—"}`,
    `Mascotas: ${n}`,
    `Nombre de la mascota: ${pedido.pet_name ?? "—"}`,
    `Indicaciones: ${pedido.description ?? "—"}`,
    "",
    "PAGO",
    `Precio total: ${clp(pedido.total_amount)}`,
    `Abono a cobrar: ${clp(pedido.deposit_amount)}`,
    "",
    "DIRECCIÓN DE ENVÍO",
    `Dirección: ${direccionCompleta || "—"}`,
    `Comuna: ${pedido.commune ?? "—"}`,
    `Región: ${pedido.region ?? "—"}`,
    "",
    `Fecha: ${new Date(pedido.created_at).toLocaleString("es-CL")}`,
    `Ver en el panel: ${enlace}`,
    `Fotos adjuntas: ${fotos.length}`,
  ].join("\n");

  const attachments = fotos.map((f, i) => ({
    filename: f.nombre || `mascota-${i + 1}.${f.ext || "jpg"}`,
    content: f.buffer,
    contentType: f.contentType,
  }));

  await obtenerTransport().sendMail({
    from: `"PintaPatitas" <${process.env.GMAIL_USER}>`,
    to: destino,
    subject: asunto,
    text: texto,
    html,
    attachments,
  });
}

/**
 * Envía al cliente el correo con el link de pago del abono cuando la solicitud es aceptada.
 */
export async function enviarCorreoClienteAbono({ pedido, paymentUrl }) {
  if (!pedido.customer_email) throw new Error("El pedido no tiene customer_email");

  const asunto = `¡Solicitud aceptada! Paga tu abono para comenzar — Solicitud #PP-${pedido.order_number}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#e8f0f3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8f0f3;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;border:1px solid #dbe7ee;overflow:hidden;">
          <tr>
            <td style="background:#2d6583;padding:26px 28px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">PintaPatitas</p>
              <p style="margin:6px 0 0;color:#cfe3ec;font-size:14px;">¡Tu solicitud #PP-${esc(pedido.order_number)} fue aceptada!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 12px;">
              <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(pedido.customer_name)}</strong>!</p>
              <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
                Revisamos la foto y detalles de <strong>${esc(pedido.pet_name || "tu mascota")}</strong> y nos encanta tu idea. Para comenzar a pintar tu cuadro personalizado, solo debes realizar el pago del abono inicial.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
                <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Técnica / Estilo:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${esc(pedido.style || "—")}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Tamaño:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${esc(pedido.size || "—")}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Monto total:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${clp(pedido.total_amount)}</td></tr>
                <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0 4px;color:#2d6583;font-size:15px;font-weight:bold;">Abono a pagar (50%):</td><td style="padding:8px 0 4px;color:#2d6583;font-size:16px;font-weight:bold;text-align:right;">${clp(pedido.deposit_amount)}</td></tr>
              </table>

              <div style="text-align:center;padding:12px 0 20px;">
                <a href="${esc(paymentUrl)}" style="display:inline-block;background:#009ee3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:999px;box-shadow:0 4px 10px rgba(0,158,227,0.3);">Pagar abono con Mercado Pago</a>
              </div>

              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
                Puedes pagar con tarjeta de débito, crédito o dinero en cuenta de Mercado Pago. Si el botón no abre, copia y pega este enlace en tu navegador:<br/>
                <a href="${esc(paymentUrl)}" style="color:#2d6583;word-break:break-all;">${esc(paymentUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f1f5f9;padding:16px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">
                PintaPatitas · Retratos de mascotas hechos con amor
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const texto = [
    `¡Hola ${pedido.customer_name}!`,
    "",
    `Tu solicitud #PP-${pedido.order_number} para ${pedido.pet_name || "tu mascota"} fue aceptada.`,
    `Técnica: ${pedido.style || "—"}`,
    `Tamaño: ${pedido.size || "—"}`,
    `Monto total: ${clp(pedido.total_amount)}`,
    `Abono a pagar (50%): ${clp(pedido.deposit_amount)}`,
    "",
    "Puedes realizar el pago del abono a través de Mercado Pago en el siguiente enlace:",
    paymentUrl,
    "",
    "Una vez confirmado el abono, empezaremos con la pintura de tu obra de arte.",
    "PintaPatitas",
  ].join("\n");

  await obtenerTransport().sendMail({
    from: `"PintaPatitas" <${process.env.GMAIL_USER}>`,
    to: pedido.customer_email,
    subject: asunto,
    text: texto,
    html,
  });
}

/**
 * Envía al cliente el correo con el link de pago del saldo cuando la pintura está lista.
 */
export async function enviarCorreoClienteSaldo({ pedido, paymentUrl, saldoAmount }) {
  if (!pedido.customer_email) throw new Error("El pedido no tiene customer_email");

  const asunto = `¡Tu pintura está lista! Paga el saldo para despachar — Pedido #PP-${pedido.order_number}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#e8f0f3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8f0f3;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;border:1px solid #dbe7ee;overflow:hidden;">
          <tr>
            <td style="background:#2d6583;padding:26px 28px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">PintaPatitas</p>
              <p style="margin:6px 0 0;color:#cfe3ec;font-size:14px;">¡La pintura de ${esc(pedido.pet_name || "tu mascota")} está lista!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 12px;">
              <p style="margin:0 0 14px;color:#0f172a;font-size:16px;">¡Hola, <strong>${esc(pedido.customer_name)}</strong>!</p>
              <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
                Nos complace contarte que hemos terminado tu retrato personalizado. Para proceder con el despacho o entrega, solo resta saldar el monto pendiente.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
                <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Pedido:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">#PP-${esc(pedido.order_number)}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Total obra:</td><td style="padding:4px 0;color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${clp(pedido.total_amount)}</td></tr>
                <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0 4px;color:#2d6583;font-size:15px;font-weight:bold;">Saldo final a pagar:</td><td style="padding:8px 0 4px;color:#2d6583;font-size:16px;font-weight:bold;text-align:right;">${clp(saldoAmount)}</td></tr>
              </table>

              <div style="text-align:center;padding:12px 0 20px;">
                <a href="${esc(paymentUrl)}" style="display:inline-block;background:#009ee3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:999px;box-shadow:0 4px 10px rgba(0,158,227,0.3);">Pagar saldo con Mercado Pago</a>
              </div>

              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
                Enlace directo:<br/>
                <a href="${esc(paymentUrl)}" style="color:#2d6583;word-break:break-all;">${esc(paymentUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f1f5f9;padding:16px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">
                PintaPatitas · Retratos de mascotas hechos con amor
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const texto = [
    `¡Hola ${pedido.customer_name}!`,
    "",
    `La pintura de ${pedido.pet_name || "tu mascota"} está lista (Pedido #PP-${pedido.order_number}).`,
    `Saldo a pagar: ${clp(saldoAmount)}`,
    "",
    "Paga tu saldo a través de Mercado Pago en el siguiente enlace:",
    paymentUrl,
    "",
    "Apenas se acredite el pago, prepararemos el envío.",
    "PintaPatitas",
  ].join("\n");

  await obtenerTransport().sendMail({
    from: `"PintaPatitas" <${process.env.GMAIL_USER}>`,
    to: pedido.customer_email,
    subject: asunto,
    text: texto,
    html,
  });
}
