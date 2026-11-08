// Venta de cuadros listos: reserva temporal del cuadro (stock 1), cobro total con
// Mercado Pago (split con comisión de plataforma) y aprobación desde el webhook.
// Toda la lógica recibe sus dependencias para poder probarla sin Supabase ni Mercado Pago.
import { normalizarRut } from "./rut.js";

export const MINUTOS_RESERVA = 20;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const texto = (v, max = 120) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

// El RUT se valida igual en cuadros listos y en pedidos de retratos.
export { normalizarRut };

/* ---------- Datos del comprador ---------- */

export function leerComprador(body = {}) {
  const entrega = body.entrega_tipo === "sucursal" ? "sucursal" : body.entrega_tipo === "domicilio" ? "domicilio" : "";
  const d = {
    nombre: texto(body.nombre, 120),
    rut: normalizarRut(body.rut),
    email: texto(body.email, 120).toLowerCase(),
    telefono: texto(body.telefono, 20),
    entrega_tipo: entrega,
    region: texto(body.region, 80),
    comuna: texto(body.comuna, 80),
    direccion: texto(body.direccion, 200),
    acepta_envio: body.acepta_envio === true,
  };

  let error = null;
  if (d.nombre.length < 3 || !d.nombre.includes(" ")) error = "Ingresa tu nombre y apellido.";
  else if (!d.rut) error = "El RUT no es válido.";
  else if (!REGEX_CORREO.test(d.email)) error = "El correo no es válido.";
  else if (!/^\+569\d{8}$/.test(d.telefono)) error = "El celular no es válido.";
  else if (!d.entrega_tipo) error = "Elige si lo recibes a domicilio o en una sucursal Starken.";
  else if (!d.region || d.comuna.length < 2) error = "Completa la región y la comuna.";
  else if (d.direccion.length < 3) {
    error = d.entrega_tipo === "sucursal" ? "Indica la sucursal Starken donde lo retirarás." : "Completa la dirección de envío.";
  } else if (!d.acepta_envio) error = "Debes aceptar que el envío se paga al recibir en Starken.";

  return { datos: d, error };
}

/* ---------- Comisión ---------- */

// Mismo valor que el saldo de los pedidos personalizados (COMISION_PORCENTAJE, 7 por defecto).
export function leerComisionPorcentaje(valor = process.env.COMISION_PORCENTAJE) {
  const porcentaje = Number(valor ?? 7);
  if (valor === "" || !Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) return null;
  return porcentaje;
}

export const calcularComision = (monto, porcentaje) => Math.min(Math.round(monto * (porcentaje / 100)), monto);

/* ---------- Acceso a datos (Supabase) ---------- */

export function crearRepoVentas(db) {
  return {
    async obtenerCuadro(slug) {
      const { data, error } = await db
        .from("cuadros_listos")
        .select("id, slug, titulo, precio, estado, reservado_hasta, canal_venta")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async obtenerCuadroPorId(id) {
      const { data, error } = await db
        .from("cuadros_listos")
        .select("id, slug, titulo, precio, estado, reservado_hasta, canal_venta")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    // Un solo UPDATE condicional: dos compradores no pueden reservar el mismo cuadro.
    async reservarCuadro(id, hasta, ahora) {
      const { data, error } = await db
        .from("cuadros_listos")
        .update({ estado: "reservado", reservado_hasta: hasta })
        .eq("id", id)
        .or(`estado.eq.disponible,and(estado.eq.reservado,reservado_hasta.lt."${ahora}")`)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    // Libera solo la reserva propia (misma hora de vencimiento) y solo si sigue reservado.
    async liberarCuadro(id, hasta) {
      const { error } = await db
        .from("cuadros_listos")
        .update({ estado: "disponible", reservado_hasta: null })
        .eq("id", id)
        .eq("estado", "reservado")
        .eq("reservado_hasta", hasta);
      if (error) throw error;
    },

    async ventaPendienteVigente(cuadroId, email, ahora) {
      const { data, error } = await db
        .from("ventas_cuadros")
        .select("id, payment_url, reservado_hasta")
        .eq("cuadro_id", cuadroId)
        .eq("comprador_email", email)
        .eq("estado", "pendiente")
        .gt("reservado_hasta", ahora)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async crearVenta(fila) {
      const { data, error } = await db.from("ventas_cuadros").insert(fila).select("id, numero").single();
      if (error) throw error;
      return data;
    },

    async completarVenta(id, paymentUrl) {
      const { error } = await db
        .from("ventas_cuadros")
        .update({ estado: "pendiente", payment_url: paymentUrl })
        .eq("id", id)
        .eq("estado", "creando");
      if (error) throw error;
    },

    async marcarVentaError(id) {
      const { error } = await db.from("ventas_cuadros").update({ estado: "error" }).eq("id", id).eq("estado", "creando");
      if (error) throw error;
    },

    async obtenerVenta(id) {
      const { data, error } = await db.from("ventas_cuadros").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    // Devuelve "aprobada", "duplicada" (otro pago ya vendió el cuadro) o "sin_cambio".
    async aprobarVenta(id, mpPaymentId, pagadoEn) {
      const { data, error } = await db
        .from("ventas_cuadros")
        .update({ estado: "aprobado", mp_payment_id: mpPaymentId, pagado_en: pagadoEn })
        .eq("id", id)
        .eq("estado", "pendiente")
        .select("id")
        .maybeSingle();
      if (error?.code === "23505") return "duplicada";
      if (error) throw error;
      return data ? "aprobada" : "sin_cambio";
    },

    async marcarRequiereDevolucion(id, mpPaymentId, pagadoEn) {
      const { error } = await db
        .from("ventas_cuadros")
        .update({ estado: "requiere_devolucion", mp_payment_id: mpPaymentId, pagado_en: pagadoEn })
        .eq("id", id)
        .in("estado", ["pendiente", "aprobado"]);
      if (error) throw error;
    },

    // No pisa un cuadro ya vendido (por ejemplo, marcado como vendido por Instagram).
    async marcarCuadroVendido(id, vendidoEn) {
      const { data, error } = await db
        .from("cuadros_listos")
        .update({ estado: "vendido", canal_venta: "web", vendido_en: vendidoEn, reservado_hasta: null })
        .eq("id", id)
        .neq("estado", "vendido")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  };
}

/* ---------- Iniciar compra ---------- */

// Mercado Pago pide la zona horaria explícita (2026-11-07T15:00:00.000+00:00).
const fechaMP = (iso) => iso.replace(/Z$/, "+00:00");

/**
 * Reserva el cuadro, registra la venta y crea el link de pago.
 * Devuelve { status, body } para que la ruta solo lo envíe.
 */
export async function iniciarCompra({
  slug,
  body,
  repo,
  vendedora,
  crearPreferencia,
  urlDePago,
  comisionPorcentaje,
  frontendUrl,
  notificationUrl,
  ahora = new Date(),
}) {
  if (!REGEX_SLUG.test(String(slug ?? ""))) return { status: 404, body: { error: "Este cuadro no existe." } };

  const { datos, error: errorDatos } = leerComprador(body);
  if (errorDatos) return { status: 400, body: { error: errorDatos } };

  if (!vendedora.ready) {
    return {
      status: 503,
      body: { error: "Las compras en línea no están disponibles en este momento. Escríbenos por Instagram para comprarlo." },
    };
  }
  if (comisionPorcentaje === null) {
    return { status: 500, body: { error: "El servicio no está disponible por ahora." } };
  }

  const cuadro = await repo.obtenerCuadro(slug);
  if (!cuadro || !["disponible", "reservado"].includes(cuadro.estado)) {
    return { status: 409, body: { error: "Este cuadro ya no está disponible." } };
  }

  const ahoraIso = ahora.toISOString();
  const reservaActiva = cuadro.estado === "reservado" && cuadro.reservado_hasta && new Date(cuadro.reservado_hasta) > ahora;
  if (reservaActiva) {
    // Si es la misma persona que volvió a apretar "Comprar", se le entrega su mismo link.
    const propia = await repo.ventaPendienteVigente(cuadro.id, datos.email, ahoraIso);
    if (propia?.payment_url) return { status: 200, body: { payment_url: propia.payment_url, reutilizado: true } };
    return {
      status: 409,
      body: { error: "Alguien está comprando este cuadro en este momento. Si no se concreta, volverá a estar disponible en unos minutos." },
    };
  }

  const hasta = new Date(ahora.getTime() + MINUTOS_RESERVA * 60_000).toISOString();
  const reservado = await repo.reservarCuadro(cuadro.id, hasta, ahoraIso);
  if (!reservado) {
    return { status: 409, body: { error: "Alguien acaba de reservar este cuadro. Si no se concreta, volverá a estar disponible en unos minutos." } };
  }

  const monto = Number(cuadro.precio);
  const comision = calcularComision(monto, comisionPorcentaje);
  let venta = null;

  try {
    venta = await repo.crearVenta({
      cuadro_id: cuadro.id,
      cuadro_titulo: cuadro.titulo,
      comprador_nombre: datos.nombre,
      comprador_rut: datos.rut,
      comprador_email: datos.email,
      comprador_telefono: datos.telefono,
      entrega_tipo: datos.entrega_tipo,
      region: datos.region,
      comuna: datos.comuna,
      direccion: datos.direccion,
      monto,
      comision_porcentaje: comisionPorcentaje,
      comision_monto: comision,
      estado: "creando",
      reservado_hasta: hasta,
    });

    const [nombre, ...apellidos] = datos.nombre.split(" ");
    const preferencia = {
      items: [
        {
          id: `cuadro-${cuadro.id}`,
          title: `Cuadro "${cuadro.titulo}"`,
          description: "Cuadro original pintado a mano · PintaPatitas",
          quantity: 1,
          unit_price: monto,
          currency_id: "CLP",
        },
      ],
      payer: { name: nombre, surname: apellidos.join(" "), email: datos.email },
      external_reference: venta.id,
      metadata: { venta_id: venta.id, payment_type: "cuadro" },
      marketplace_fee: comision > 0 ? comision : undefined,
      // El link deja de servir cuando vence la reserva; solo medios de pago inmediatos.
      expires: true,
      expiration_date_from: fechaMP(ahoraIso),
      expiration_date_to: fechaMP(hasta),
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }],
      },
      back_urls: {
        success: `${frontendUrl}/pago-exitoso?tipo=cuadro`,
        failure: `${frontendUrl}/pago-fallido?tipo=cuadro&cuadro=${encodeURIComponent(cuadro.slug)}`,
        pending: `${frontendUrl}/pago-pendiente?tipo=cuadro`,
      },
      auto_return: "approved",
      statement_descriptor: "PINTAPATITAS",
    };
    if (notificationUrl) preferencia.notification_url = notificationUrl;

    const pref = await crearPreferencia(preferencia);
    const paymentUrl = urlDePago(pref, vendedora.sellerMode);
    if (!paymentUrl) throw new Error("Mercado Pago no devolvió una URL de pago.");
    await repo.completarVenta(venta.id, paymentUrl);
    return { status: 200, body: { payment_url: paymentUrl } };
  } catch (error) {
    console.error("[Cuadros] No se pudo crear el cobro:", error);
    try {
      if (venta) await repo.marcarVentaError(venta.id);
      await repo.liberarCuadro(cuadro.id, hasta);
    } catch (errLimpieza) {
      console.error("[Cuadros] No se pudo liberar la reserva:", errLimpieza);
    }
    return { status: 502, body: { error: "No pudimos conectar con Mercado Pago. Intenta de nuevo en unos minutos." } };
  }
}

/* ---------- Webhook ---------- */

const dineroCoincide = (a, b) => Math.round(Number(a) * 100) === Math.round(Number(b) * 100);

/**
 * Procesa un pago aprobado de tipo "cuadro". paymentInfo es la respuesta oficial de Mercado Pago.
 * notificar recibe { tipo: "venta" | "devolucion", venta } y no debe lanzar.
 */
export async function procesarPagoCuadro({ paymentInfo, paymentId, repo, notificar = () => {}, ahora = new Date() }) {
  if (paymentInfo.status !== "approved") return { status: 200, body: "OK" };

  const ventaId = paymentInfo.external_reference || paymentInfo.metadata?.venta_id;
  if (!ventaId) return { status: 422, body: { error: "El pago no está asociado a una venta." } };

  const venta = await repo.obtenerVenta(ventaId);
  if (!venta) return { status: 404, body: { error: "No existe la venta de este pago." } };
  if (!dineroCoincide(paymentInfo.transaction_amount, venta.monto)) {
    return { status: 422, body: { error: "El monto del pago no coincide con el de la venta." } };
  }
  const idPago = String(paymentId);
  if (venta.mp_payment_id && venta.mp_payment_id !== idPago) {
    return { status: 409, body: { error: "La venta ya está asociada a otro pago de Mercado Pago." } };
  }
  if (venta.estado === "requiere_devolucion") return { status: 200, body: "OK" };
  if (!["pendiente", "aprobado"].includes(venta.estado)) {
    return { status: 409, body: { error: "La venta no está esperando un pago." } };
  }

  const pagadoEn = paymentInfo.date_approved || ahora.toISOString();
  let primeraAprobacion = false;

  if (venta.estado === "pendiente") {
    const resultado = await repo.aprobarVenta(venta.id, idPago, pagadoEn);
    if (resultado === "duplicada") {
      // Otro comprador ya pagó este cuadro: hay que devolver este pago.
      await repo.marcarRequiereDevolucion(venta.id, idPago, pagadoEn);
      notificar({ tipo: "devolucion", venta: { ...venta, mp_payment_id: idPago } });
      return { status: 200, body: "OK" };
    }
    if (resultado === "sin_cambio") {
      // Otro evento ya la procesó; se vuelve a leer para continuar de forma idempotente.
      const actual = await repo.obtenerVenta(venta.id);
      if (actual?.estado !== "aprobado" || actual.mp_payment_id !== idPago) return { status: 200, body: "OK" };
    } else {
      primeraAprobacion = true;
    }
  }

  // Reintentar siempre: si un evento anterior falló aquí, el cuadro no debe quedar reservado.
  const marcado = await repo.marcarCuadroVendido(venta.cuadro_id, pagadoEn);
  if (!marcado) {
    const cuadro = await repo.obtenerCuadroPorId(venta.cuadro_id);
    if (cuadro?.estado === "vendido" && cuadro.canal_venta !== "web") {
      // Se vendió por Instagram u otro canal mientras se pagaba en la web.
      await repo.marcarRequiereDevolucion(venta.id, idPago, pagadoEn);
      notificar({ tipo: "devolucion", venta: { ...venta, mp_payment_id: idPago } });
      return { status: 200, body: "OK" };
    }
  }

  if (primeraAprobacion) notificar({ tipo: "venta", venta: { ...venta, mp_payment_id: idPago, pagado_en: pagadoEn } });
  return { status: 200, body: "OK" };
}
