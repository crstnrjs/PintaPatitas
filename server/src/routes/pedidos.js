import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { supabaseAdmin as supabase } from "../lib/supabase.js";
import { resolvePrice } from "../pricing.js";
import { enviarCorreoNuevaSolicitud } from "../lib/mailer.js";
import { normalizarRut } from "../lib/rut.js";

const BUCKET = "pet-photos";
const MAX_FOTOS = 6;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_FOTOS, fields: 30, fieldSize: 20_000 },
});

// Endpoint público: se limita para que nadie llene la base ni el almacenamiento
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta nuevamente en unos minutos." },
});

// El tipo de archivo se verifica por su contenido, no por lo que declara el navegador
function tipoReal(buf) {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
    if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return { mime: "image/png", ext: "png" };
    if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
      return { mime: "image/webp", ext: "webp" };
    }
  }
  return null;
}

const texto = (v, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// El estilo "Meme" (acrílico, un solo cuadro) no lleva cantidad ni nombres de mascotas
export const SLUG_MEME = "meme";
export const esMeme = (c) => c.technique_slug === SLUG_MEME;

// Texto del producto que se guarda en el pedido y se muestra en correos y panel
export function nombreProducto(c, n) {
  if (esMeme(c)) return "Cuadro de meme";
  return `Retrato de ${n} ${n === 1 ? "mascota" : "mascotas"}`;
}

export function leerCampos(b) {
  const meme = texto(b.technique_slug, 60) === SLUG_MEME;
  return {
    technique_slug: texto(b.technique_slug, 60),
    pet_count: meme
      ? 1
      : typeof b.pet_count === "string" && /^\d+$/.test(b.pet_count) ? Number(b.pet_count) : NaN,
    width_cm: b.width_cm ? (typeof b.width_cm === "string" && /^\d+$/.test(b.width_cm) ? Number(b.width_cm) : NaN) : null,
    height_cm: b.height_cm ? (typeof b.height_cm === "string" && /^\d+$/.test(b.height_cm) ? Number(b.height_cm) : NaN) : null,
    idea: texto(b.idea, 800),
    pet_name: meme ? "" : texto(b.pet_name, 160),
    nombre: texto(b.nombre, 60),
    apellido: texto(b.apellido, 60),
    correo: texto(b.correo, 120).toLowerCase(),
    rut: normalizarRut(b.rut),
    entrega_tipo: b.entrega_tipo === "sucursal" ? "sucursal" : b.entrega_tipo === "domicilio" ? "domicilio" : "",
    sucursal: texto(b.sucursal, 160),
    acepta_envio: b.acepta_envio === "true",
    telefono: texto(b.telefono, 20),
    region: texto(b.region, 80),
    comuna: texto(b.comuna, 80),
    calle: texto(b.calle, 120),
    numero: texto(b.numero, 20),
    depto: texto(b.depto, 40),
  };
}

// Domicilio: calle y número. Sucursal: solo el nombre de la sucursal Starken.
export function destinoEnvio(c) {
  const sucursal = c.entrega_tipo === "sucursal";
  return {
    customer_rut: c.rut,
    delivery_type: c.entrega_tipo,
    starken_branch: sucursal ? c.sucursal : null,
    street: sucursal ? null : c.calle,
    street_number: sucursal ? null : c.numero,
    apartment: sucursal ? null : c.depto || null,
  };
}

export function validar(c, fotos) {
  if (!c.technique_slug) return "Falta el estilo.";
  if (!Number.isInteger(c.pet_count) || c.pet_count < 1 || c.pet_count > 20) return "La cantidad de mascotas debe estar entre 1 y 20.";
  if (Number.isNaN(c.width_cm) || Number.isNaN(c.height_cm)) return "El formato no es válido.";
  if (c.width_cm !== null && (c.width_cm < 1 || c.width_cm > 500)) return "El ancho debe estar entre 1 y 500 cm.";
  if (c.height_cm !== null && (c.height_cm < 1 || c.height_cm > 500)) return "El alto debe estar entre 1 y 500 cm.";
  if ((c.width_cm === null) !== (c.height_cm === null)) return "El formato debe incluir ancho y alto.";
  if (c.nombre.length < 2 || c.apellido.length < 2) return "Ingresa tu nombre y apellido.";
  if (!REGEX_CORREO.test(c.correo)) return "El correo no es válido.";
  if (!/^\+569\d{8}$/.test(c.telefono)) return "El celular no es válido.";
  if (!c.rut) return "El RUT no es válido.";
  if (!c.entrega_tipo) return "Elige si lo recibes a domicilio o en una sucursal Starken.";
  if (!c.region || c.comuna.length < 2) return "Completa la región y la comuna.";
  if (c.entrega_tipo === "domicilio" && (c.calle.length < 2 || !c.numero)) {
    return "Completa la dirección de envío.";
  }
  if (c.entrega_tipo === "sucursal" && c.sucursal.length < 3) {
    return "Indica la sucursal Starken donde lo retirarás.";
  }
  if (!c.acepta_envio) return "Debes aceptar que el envío se paga al recibir en Starken.";
  if (fotos.length < 1) {
    return esMeme(c) ? "Sube la imagen de tu meme." : "Sube al menos una foto de tu mascota.";
  }
  return null;
}

router.post("/", limitador, upload.array("fotos", MAX_FOTOS), async (req, res) => {
  // El abono es una regla de negocio: se configura en server/.env, sin valor inventado
  const porcentaje = Number(process.env.ABONO_PORCENTAJE);
  if (!(porcentaje > 0 && porcentaje <= 100)) {
    console.error("Falta ABONO_PORCENTAJE en server/.env");
    return res.status(500).json({ error: "El servicio no está disponible por ahora." });
  }

  const c = leerCampos(req.body ?? {});
  const fotos = req.files ?? [];
  const problema = validar(c, fotos);
  if (problema) return res.status(400).json({ error: problema });

  const tipos = fotos.map((f) => tipoReal(f.buffer));
  if (tipos.some((t) => !t)) {
    return res.status(400).json({ error: "Una de las fotos no es válida (usa JPG, PNG o WebP)." });
  }

  let pedidoId = null;
  const subidas = [];

  try {
    // El precio SIEMPRE sale de la base de datos, nunca del navegador
    const opcion = await resolvePrice(c);
    if (!opcion) {
      return res
        .status(409)
        .json({ error: "Esa opción ya no está disponible. Vuelve atrás y elige otra." });
    }

    const total = opcion.price;
    const abono = Math.round((total * porcentaje) / 100);
    const n = opcion.pet_count;

    const { data: pedido, error: errPedido } = await supabase
      .from("orders")
      .insert({
        price_list_id: opcion.price_list_id,
        status: "solicitud",
        customer_name: `${c.nombre} ${c.apellido}`,
        customer_email: c.correo,
        customer_phone: c.telefono,
        description: c.idea || null,
        pet_name: c.pet_name || null,
        total_amount: total,
        deposit_amount: abono,
        product: nombreProducto(c, n),
        style: opcion.technique_name,
        size: opcion.size_label,
        pet_count: n,
        region: c.region,
        commune: c.comuna,
        ...destinoEnvio(c),
      })
      .select("id, order_number, created_at")
      .single();
    if (errPedido) throw errPedido;
    pedidoId = pedido.id;

    for (const [i, foto] of fotos.entries()) {
      const { ext, mime } = tipos[i];
      const ruta = `${pedidoId}/${i + 1}-${randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, foto.buffer, { contentType: mime });
      if (error) throw error;
      subidas.push(ruta);
    }

    const { error: errFotos } = await supabase
      .from("order_photos")
      .insert(subidas.map((storage_path, position) => ({ order_id: pedidoId, storage_path, position })));
    if (errFotos) throw errFotos;

    // Respondemos YA (la solicitud está guardada). El correo va después, sin bloquear.
    res.status(201).json({ orderId: pedidoId, orderNumber: pedido.order_number });

    // Correo de respaldo a la amiga, en segundo plano.
    // Va FUERA del try/catch grande (que borra el pedido) y con su propio catch:
    // un fallo de correo nunca afecta al cliente ni borra la solicitud.
    const fotosAdjuntas = fotos.map((f, i) => ({
      buffer: f.buffer,
      nombre: f.originalname || `mascota-${i + 1}.${tipos[i].ext}`,
      ext: tipos[i].ext,
      contentType: tipos[i].mime,
    }));
    enviarCorreoNuevaSolicitud({
      pedido: {
        id: pedidoId,
        order_number: pedido.order_number,
        created_at: pedido.created_at ?? new Date().toISOString(),
        customer_name: `${c.nombre} ${c.apellido}`,
        customer_email: c.correo,
        customer_phone: c.telefono,
        product: nombreProducto(c, n),
        style: opcion.technique_name,
        size: opcion.size_label,
        pet_count: n,
        description: c.idea || null,
        pet_name: c.pet_name || null,
        total_amount: total,
        deposit_amount: abono,
        region: c.region,
        commune: c.comuna,
        ...destinoEnvio(c),
      },
      fotos: fotosAdjuntas,
    })
      .then(() =>
        // Marca de que la amiga ya fue avisada (columna opcional; si no existe, se ignora)
        supabase.from("orders").update({ admin_notified_at: new Date().toISOString() }).eq("id", pedidoId),
      )
      .catch((errCorreo) => {
        console.error(
          `No se pudo enviar el correo de la solicitud #PP-${pedido.order_number}:`,
          errCorreo?.message ?? errCorreo,
        );
      });

    return;
  } catch (err) {
    console.error("Error creando pedido:", err);

    // No dejar pedidos a medias: se borran las fotos subidas y el pedido
    if (subidas.length > 0) await supabase.storage.from(BUCKET).remove(subidas);
    if (pedidoId) await supabase.from("orders").delete().eq("id", pedidoId);

    const respuesta = {
      error: "No pudimos registrar tu solicitud. Intenta de nuevo en unos minutos.",
    };
    // Solo en desarrollo: el motivo real, para poder diagnosticar
    if (process.env.NODE_ENV !== "production") {
      respuesta.detalle = {
        message: err?.message ?? String(err),
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        status: err?.status ?? err?.statusCode,
      };
    }
    return res.status(500).json(respuesta);
  }
});

// Errores de multer: fotos muy pesadas o demasiadas
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: "Las fotos son demasiado pesadas o hay demasiadas (máximo 6, hasta 5 MB cada una).",
    });
  }
  next(err);
});

export default router;