import nodemailer from "nodemailer";

// Transporte SMTP configurable para Hostinger/Gmail. Se crea una sola vez y se reutiliza.
let transport = null;

function obtenerConfigSMTP() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE === undefined ? true : process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  return { host, port, secure, user, pass };
}

function obtenerFromAddress() {
  return process.env.SMTP_USER || process.env.GMAIL_USER;
}

function obtenerTransport() {
  if (transport) return transport;

  const { host, port, secure, user, pass } = obtenerConfigSMTP();
  if (!user || !pass) {
    throw new Error("Faltan las credenciales SMTP/GMAIL en server/.env");
  }

  transport = nodemailer.createTransport({
    host,
    port,
    secure,
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

function filaItem(etiqueta, valor, esUltimo = false) {
  return `
    <tr>
      <td style="padding:7px 0;color:#64748b;font-size:13px;width:38%;vertical-align:top;border-bottom:${esUltimo ? "none" : "1px solid #f1f5f9"};">${esc(etiqueta)}</td>
      <td style="padding:7px 0;color:#0f172a;font-size:14px;font-weight:500;text-align:right;border-bottom:${esUltimo ? "none" : "1px solid #f1f5f9"};">${valor ? esc(valor) : "—"}</td>
    </tr>`;
}

function filaItemHTML(etiqueta, valorHTML, esUltimo = false) {
  return `
    <tr>
      <td style="padding:7px 0;color:#64748b;font-size:13px;width:38%;vertical-align:top;border-bottom:${esUltimo ? "none" : "1px solid #f1f5f9"};">${esc(etiqueta)}</td>
      <td style="padding:7px 0;color:#0f172a;font-size:14px;font-weight:500;text-align:right;border-bottom:${esUltimo ? "none" : "1px solid #f1f5f9"};">${valorHTML || "—"}</td>
    </tr>`;
}

function tarjetaSeccion(titulo, icono, contenido) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:14px;overflow:hidden;">
      <tr>
        <td style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:14px;margin-right:6px;">${icono}</span>
          <strong style="color:#1d4e68;font-size:13px;letter-spacing:.02em;text-transform:uppercase;">${esc(titulo)}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${contenido}
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Envía a la amiga (administradora) un correo con todos los datos de una solicitud nueva.
 */
export async function enviarCorreoNuevaSolicitud({ pedido, fotos }) {
  const destino = process.env.ADMIN_NOTIFY_EMAIL;
  if (!destino) throw new Error("Falta ADMIN_NOTIFY_EMAIL en server/.env");

  const base = (process.env.FRONTEND_URL || "https://pintapatitas.com").replace(/\/+$/, "");
  const enlace = `${base}/admin/solicitudes/${pedido.id}`;

  const n = pedido.pet_count ?? 1;
  const asunto = `🐾 ¡Nueva Solicitud #PP-${pedido.order_number}! — Retrato de ${esc(pedido.pet_name || (n === 1 ? "1 mascota" : `${n} mascotas`))}`;

  const direccion = [pedido.street, pedido.street_number].filter(Boolean).join(" ");
  const direccionCompleta = [direccion, pedido.apartment].filter(Boolean).join(" · ");
  // Retiro en sucursal Starken: no hay dirección, sino el nombre de la sucursal.
  const enSucursal = pedido.delivery_type === "sucursal";
  const etiquetaDestino = enSucursal ? "Sucursal Starken" : "Dirección";
  const lugarEntrega = enSucursal ? pedido.starken_branch : direccionCompleta;

  // Normalizar teléfono para WhatsApp
  const telDigits = (pedido.customer_phone || "").replace(/\D/g, "");
  const waNumero = telDigits.startsWith("56") ? telDigits : `56${telDigits}`;
  const enlaceWhatsApp = telDigits.length >= 8 ? `https://wa.me/${waNumero}` : null;

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${esc(asunto)}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-container { width: 100% !important; border-radius: 0 !important; }
        .inner-padding { padding: 18px 16px !important; }
        .header-padding { padding: 22px 18px !important; }
        .btn-full { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#ebf1f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ebf1f4;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <!-- Contenedor Principal -->
          <table role="presentation" width="600" class="email-container" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:18px;border:1px solid #dbe6ec;overflow:hidden;box-shadow:0 8px 30px rgba(29,78,104,0.08);">
            
            <!-- Cabecera de la Marca -->
            <tr>
              <td class="header-padding" style="background:linear-gradient(135deg, #1d4e68 0%, #2d6583 100%);padding:28px 28px 24px;text-align:center;">
                <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:999px;margin-bottom:10px;">
                  <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">PintaPatitas · Retratos</span>
                </div>
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">¡Tienes una nueva solicitud!</h1>
                <div style="margin-top:12px;">
                  <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:13px;font-weight:700;padding:6px 14px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                    Solicitud #PP-${esc(pedido.order_number)}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Cuerpo del Correo -->
            <tr>
              <td class="inner-padding" style="padding:24px 28px 16px;">

                <!-- Tarjeta 1: La Obra y Mascota -->
                ${tarjetaSeccion(
                  "La Obra y Mascota",
                  "🎨",
                  filaItem("Mascota(s)", pedido.pet_name || "Sin nombre indicado") +
                  filaItem("Estilo / Técnica", pedido.style) +
                  filaItem("Tamaño", pedido.size) +
                  filaItem("Cantidad de mascotas", String(n), !pedido.description) +
                  (pedido.description
                    ? `<tr>
                        <td colspan="2" style="padding:10px 0 2px;">
                          <div style="background:#f1f5f9;border-left:3px solid #2d6583;padding:10px 12px;border-radius:6px;">
                            <span style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Indicaciones del cliente:</span>
                            <span style="font-size:13px;color:#0f172a;line-height:1.45;">"${esc(pedido.description)}"</span>
                          </div>
                        </td>
                      </tr>`
                    : "")
                )}

                <!-- Tarjeta 2: Cliente y Contacto -->
                ${tarjetaSeccion(
                  "Datos del Cliente",
                  "👤",
                  filaItem("Nombre", pedido.customer_name) +
                  filaItem("RUT", pedido.customer_rut) +
                  filaItemHTML(
                    "Correo",
                    pedido.customer_email
                      ? `<a href="mailto:${esc(pedido.customer_email)}" style="color:#2d6583;font-weight:600;text-decoration:none;">${esc(pedido.customer_email)}</a>`
                      : ""
                  ) +
                  filaItemHTML(
                    "Celular",
                    pedido.customer_phone
                      ? `<a href="tel:${esc(pedido.customer_phone)}" style="color:#0f172a;text-decoration:none;">${esc(pedido.customer_phone)}</a>` +
                        (enlaceWhatsApp
                          ? `<br/><a href="${esc(enlaceWhatsApp)}" target="_blank" style="display:inline-block;margin-top:4px;color:#16a34a;font-size:12px;font-weight:700;text-decoration:none;">💬 Abrir WhatsApp</a>`
                          : "")
                      : ""
                  )
                )}

                <!-- Tarjeta 3: Valores y Pago -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:14px;margin-bottom:14px;overflow:hidden;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color:#0f766e;font-size:13px;font-weight:600;text-transform:uppercase;">
                            💰 Resumen de Valores
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color:#475569;font-size:13px;padding:3px 0;">Valor total del cuadro:</td>
                                <td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right;padding:3px 0;">${clp(pedido.total_amount)}</td>
                              </tr>
                              <tr>
                                <td style="color:#0f766e;font-size:14px;font-weight:700;padding:6px 0 0;border-top:1px dashed #99f6e4;">Abono inicial a cobrar (50%):</td>
                                <td style="color:#0f766e;font-size:18px;font-weight:800;text-align:right;padding:6px 0 0;border-top:1px dashed #99f6e4;">${clp(pedido.deposit_amount)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Tarjeta 4: Dirección de Despacho -->
                ${tarjetaSeccion(
                  "Envío Starken (por pagar)",
                  "📍",
                  filaItem("Entrega", enSucursal ? "Retiro en sucursal" : "A domicilio") +
                  filaItem(etiquetaDestino, lugarEntrega) +
                  filaItem("Comuna", pedido.commune) +
                  filaItem("Región", pedido.region, true)
                )}

                <!-- Botón de Acción Principal -->
                <div style="text-align:center;padding:14px 0 10px;">
                  <a href="${esc(enlace)}" class="btn-full" style="display:inline-block;background:#1d4e68;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:999px;box-shadow:0 4px 14px rgba(29,78,104,0.35);">
                    Ver solicitud en el panel de control →
                  </a>
                </div>

                <!-- Aviso de Fotos -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-top:14px;text-align:center;">
                  <p style="margin:0;color:#64748b;font-size:12px;line-height:1.4;">
                    📸 <strong>${fotos.length} foto(s) de referencia</strong> adjuntas en este correo y disponibles en el panel.
                  </p>
                </div>

              </td>
            </tr>

            <!-- Pie de Página -->
            <tr>
              <td style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Solicitud recibida el ${new Date(pedido.created_at).toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">
                  PintaPatitas · Retratos de mascotas hechos con amor en Chile
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
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
    `RUT: ${pedido.customer_rut ?? "—"}`,
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
    "ENVÍO STARKEN (POR PAGAR)",
    `Entrega: ${enSucursal ? "Retiro en sucursal" : "A domicilio"}`,
    `${etiquetaDestino}: ${lugarEntrega || "—"}`,
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
    from: `"PintaPatitas" <${obtenerFromAddress()}>`,
    to: destino,
    bcc: obtenerFromAddress(), // Copia oculta para respaldo en la bandeja de entrada
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
    from: `"PintaPatitas" <${obtenerFromAddress()}>`,
    to: pedido.customer_email,
    bcc: obtenerFromAddress(), // Copia oculta para respaldo en la bandeja de entrada
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
    from: `"PintaPatitas" <${obtenerFromAddress()}>`,
    to: pedido.customer_email,
    bcc: obtenerFromAddress(), // Copia oculta para respaldo en la bandeja de entrada
    subject: asunto,
    text: texto,
    html,
  });
}

/**
 * Envío genérico con el mismo remitente y copia de respaldo. Lo usan los correos de cuadros listos.
 */
export async function enviarCorreo({ to, subject, html, text, replyTo }) {
  await obtenerTransport().sendMail({
    from: `"PintaPatitas" <${obtenerFromAddress()}>`,
    to,
    bcc: obtenerFromAddress(), // Copia oculta para respaldo en la bandeja de entrada
    ...(replyTo ? { replyTo } : {}), // Al responder, el correo va directo a esta dirección
    subject,
    text,
    html,
  });
}
