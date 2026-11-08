import test from "node:test";
import assert from "node:assert/strict";
import { calcularComision, iniciarCompra, leerComprador, leerComisionPorcentaje, normalizarRut, procesarPagoCuadro } from "./ventasCuadros.js";

const AHORA = new Date("2026-11-07T15:00:00.000Z");

const comprador = {
  nombre: "Ana Pérez",
  rut: "11.111.111-1",
  email: "Ana@Example.com",
  telefono: "+56912345678",
  entrega_tipo: "domicilio",
  region: "Valparaíso",
  comuna: "Viña del Mar",
  direccion: "Av. Libertad 123, depto 4",
  acepta_envio: true,
};

// Repositorio en memoria con el mismo contrato que crearRepoVentas.
function repoFalso({ cuadro = {}, ventas = [], fallarReserva = false } = {}) {
  const estado = {
    cuadro: { id: "c1", slug: "gato-1a2b", titulo: "Gato", precio: 45000, estado: "disponible", reservado_hasta: null, canal_venta: null, ...cuadro },
    ventas: structuredClone(ventas),
    llamadas: [],
  };
  let n = 1;
  const venta = (id) => estado.ventas.find((v) => v.id === id);
  const repo = {
    estado,
    async obtenerCuadro(slug) { return slug === estado.cuadro.slug ? { ...estado.cuadro } : null; },
    async obtenerCuadroPorId(id) { return id === estado.cuadro.id ? { ...estado.cuadro } : null; },
    async reservarCuadro(id, hasta, ahora) {
      estado.llamadas.push("reservar");
      const c = estado.cuadro;
      const libre = c.estado === "disponible" || (c.estado === "reservado" && c.reservado_hasta < ahora);
      if (fallarReserva || !libre) return false;
      Object.assign(c, { estado: "reservado", reservado_hasta: hasta });
      return true;
    },
    async liberarCuadro(id, hasta) {
      estado.llamadas.push("liberar");
      if (estado.cuadro.estado === "reservado" && estado.cuadro.reservado_hasta === hasta) {
        Object.assign(estado.cuadro, { estado: "disponible", reservado_hasta: null });
      }
    },
    async ventaPendienteVigente(cuadroId, email, ahora) {
      return estado.ventas.find((v) => v.cuadro_id === cuadroId && v.comprador_email === email && v.estado === "pendiente" && v.reservado_hasta > ahora) ?? null;
    },
    async crearVenta(fila) { const v = { id: `v${n}`, numero: n++, ...fila }; estado.ventas.push(v); return { id: v.id, numero: v.numero }; },
    async completarVenta(id, url) { Object.assign(venta(id), { estado: "pendiente", payment_url: url }); },
    async marcarVentaError(id) { venta(id).estado = "error"; },
    async obtenerVenta(id) { return venta(id) ? { ...venta(id) } : null; },
    async aprobarVenta(id, mp, pagadoEn) {
      const v = venta(id);
      if (v.estado !== "pendiente") return "sin_cambio";
      if (estado.ventas.some((o) => o.cuadro_id === v.cuadro_id && o.estado === "aprobado")) return "duplicada";
      Object.assign(v, { estado: "aprobado", mp_payment_id: mp, pagado_en: pagadoEn });
      return "aprobada";
    },
    async marcarRequiereDevolucion(id, mp) { Object.assign(venta(id), { estado: "requiere_devolucion", mp_payment_id: mp }); },
    async marcarCuadroVendido(id, en) {
      if (estado.cuadro.estado === "vendido") return false;
      Object.assign(estado.cuadro, { estado: "vendido", canal_venta: "web", vendido_en: en, reservado_hasta: null });
      return true;
    },
  };
  return repo;
}

function compra(repo, extra = {}) {
  const preferencias = [];
  return {
    preferencias,
    resultado: iniciarCompra({
      slug: "gato-1a2b",
      body: comprador,
      repo,
      vendedora: { ready: true, sellerMode: "test" },
      crearPreferencia: async (body) => { preferencias.push(body); return { init_point: "https://mp/live", sandbox_init_point: "https://mp/sandbox" }; },
      urlDePago: (pref, modo) => (modo === "test" ? pref.sandbox_init_point : pref.init_point),
      comisionPorcentaje: 7,
      frontendUrl: "https://pintapatitas.com",
      notificationUrl: "https://api.pintapatitas.com/api/webhooks/mercadopago",
      ahora: AHORA,
      ...extra,
    }),
  };
}

/* ---------- Validaciones ---------- */

test("valida el RUT con su dígito verificador", () => {
  assert.equal(normalizarRut("11.111.111-1"), "11111111-1");
  assert.equal(normalizarRut("12345678-5"), "12345678-5");
  assert.equal(normalizarRut("10.000.013-k"), "10000013-K");
  assert.equal(normalizarRut("12345678-9"), null);
  assert.equal(normalizarRut("abc"), null);
});

test("exige los datos del comprador y aceptar el envío por pagar", () => {
  assert.equal(leerComprador(comprador).error, null);
  assert.equal(leerComprador(comprador).datos.email, "ana@example.com");
  assert.match(leerComprador({ ...comprador, nombre: "Ana" }).error, /nombre y apellido/);
  assert.match(leerComprador({ ...comprador, telefono: "912345678" }).error, /celular/);
  assert.match(leerComprador({ ...comprador, entrega_tipo: "dron" }).error, /domicilio o en una sucursal/);
  assert.match(leerComprador({ ...comprador, acepta_envio: "true" }).error, /envío se paga al recibir/);
});

test("usa la comisión de COMISION_PORCENTAJE y la redondea a pesos", () => {
  assert.equal(leerComisionPorcentaje(undefined), 7);
  assert.equal(leerComisionPorcentaje("7"), 7);
  assert.equal(leerComisionPorcentaje("abc"), null);
  assert.equal(leerComisionPorcentaje("120"), null);
  assert.equal(calcularComision(45000, 7), 3150);
  assert.equal(calcularComision(33333, 7), 2333);
});

/* ---------- Iniciar compra ---------- */

test("reserva 20 minutos, cobra el precio de la base y crea el link con comisión", async () => {
  const repo = repoFalso();
  const { resultado, preferencias } = compra(repo, { body: { ...comprador, precio: 1, monto: 1 } });
  const { status, body } = await resultado;

  assert.equal(status, 200);
  assert.equal(body.payment_url, "https://mp/sandbox");
  assert.equal(repo.estado.cuadro.estado, "reservado");
  assert.equal(repo.estado.cuadro.reservado_hasta, "2026-11-07T15:20:00.000Z");

  const [venta] = repo.estado.ventas;
  assert.equal(venta.estado, "pendiente");
  assert.equal(venta.monto, 45000);
  assert.equal(venta.comision_monto, 3150);
  assert.equal(venta.comprador_rut, "11111111-1");

  const [pref] = preferencias;
  assert.equal(pref.items[0].unit_price, 45000);
  assert.equal(pref.marketplace_fee, 3150);
  assert.equal(pref.external_reference, venta.id);
  assert.deepEqual(pref.metadata, { venta_id: venta.id, payment_type: "cuadro" });
  assert.equal(pref.expiration_date_to, "2026-11-07T15:20:00.000+00:00");
  assert.ok(pref.payment_methods.excluded_payment_types.some((t) => t.id === "ticket"));
});

test("no reserva nada si la cuenta de la artista no está lista", async () => {
  const repo = repoFalso();
  const { status } = await compra(repo, { vendedora: { ready: false } }).resultado;
  assert.equal(status, 503);
  assert.deepEqual(repo.estado.llamadas, []);
  assert.equal(repo.estado.cuadro.estado, "disponible");
});

test("rechaza datos inválidos antes de tocar el cuadro", async () => {
  const repo = repoFalso();
  const { status } = await compra(repo, { body: { ...comprador, rut: "1-1" } }).resultado;
  assert.equal(status, 400);
  assert.deepEqual(repo.estado.llamadas, []);
});

test("si otra persona tiene la reserva vigente, responde 409 sin crear otra", async () => {
  const repo = repoFalso({ cuadro: { estado: "reservado", reservado_hasta: "2026-11-07T15:10:00.000Z" } });
  const { status } = await compra(repo).resultado;
  assert.equal(status, 409);
  assert.equal(repo.estado.ventas.length, 0);
  assert.deepEqual(repo.estado.llamadas, []);
});

test("si es el mismo comprador con la reserva vigente, le devuelve su mismo link", async () => {
  const repo = repoFalso({
    cuadro: { estado: "reservado", reservado_hasta: "2026-11-07T15:10:00.000Z" },
    ventas: [{ id: "v9", cuadro_id: "c1", comprador_email: "ana@example.com", estado: "pendiente", reservado_hasta: "2026-11-07T15:10:00.000Z", payment_url: "https://mp/anterior" }],
  });
  const { status, body } = await compra(repo).resultado;
  assert.equal(status, 200);
  assert.equal(body.payment_url, "https://mp/anterior");
  assert.equal(repo.estado.ventas.length, 1);
});

test("una reserva vencida se puede volver a reservar", async () => {
  const repo = repoFalso({ cuadro: { estado: "reservado", reservado_hasta: "2026-11-07T14:30:00.000Z" } });
  const { status } = await compra(repo).resultado;
  assert.equal(status, 200);
  assert.equal(repo.estado.cuadro.reservado_hasta, "2026-11-07T15:20:00.000Z");
});

test("si la reserva atómica pierde la carrera, responde 409", async () => {
  const repo = repoFalso({ fallarReserva: true });
  const { status } = await compra(repo).resultado;
  assert.equal(status, 409);
  assert.equal(repo.estado.ventas.length, 0);
});

test("no vende un cuadro vendido u oculto", async () => {
  for (const estado of ["vendido", "oculto", "borrador"]) {
    const { status } = await compra(repoFalso({ cuadro: { estado } })).resultado;
    assert.equal(status, 409, estado);
  }
});

test("si Mercado Pago falla, libera el cuadro y deja la venta en error", async () => {
  const repo = repoFalso();
  const { status } = await compra(repo, { crearPreferencia: async () => { throw new Error("mp caído"); } }).resultado;
  assert.equal(status, 502);
  assert.equal(repo.estado.cuadro.estado, "disponible");
  assert.equal(repo.estado.ventas[0].estado, "error");
});

/* ---------- Webhook ---------- */

const ventaPendiente = { id: "v1", numero: 1, cuadro_id: "c1", cuadro_titulo: "Gato", monto: 45000, comision_monto: 3150, estado: "pendiente", mp_payment_id: null };
const pago = { status: "approved", currency_id: "CLP", transaction_amount: 45000, external_reference: "v1", metadata: { payment_type: "cuadro" }, date_approved: "2026-11-07T15:05:00.000Z" };

test("un pago aprobado marca la venta y el cuadro como vendidos y avisa una sola vez", async () => {
  const repo = repoFalso({ cuadro: { estado: "reservado", reservado_hasta: "2026-11-07T15:20:00.000Z" }, ventas: [ventaPendiente] });
  const avisos = [];
  const notificar = (a) => avisos.push(a.tipo);

  const r1 = await procesarPagoCuadro({ paymentInfo: pago, paymentId: 555, repo, notificar });
  assert.equal(r1.status, 200);
  assert.equal(repo.estado.ventas[0].estado, "aprobado");
  assert.equal(repo.estado.ventas[0].mp_payment_id, "555");
  assert.equal(repo.estado.cuadro.estado, "vendido");
  assert.equal(repo.estado.cuadro.canal_venta, "web");

  // Mercado Pago reenvía el mismo evento: no se repiten correos.
  const r2 = await procesarPagoCuadro({ paymentInfo: pago, paymentId: 555, repo, notificar });
  assert.equal(r2.status, 200);
  assert.deepEqual(avisos, ["venta"]);
});

test("si un evento anterior aprobó la venta pero no marcó el cuadro, lo reintenta", async () => {
  const repo = repoFalso({
    cuadro: { estado: "reservado", reservado_hasta: "2026-11-07T15:20:00.000Z" },
    ventas: [{ ...ventaPendiente, estado: "aprobado", mp_payment_id: "555" }],
  });
  await procesarPagoCuadro({ paymentInfo: pago, paymentId: 555, repo });
  assert.equal(repo.estado.cuadro.estado, "vendido");
});

test("rechaza un monto distinto al de la venta", async () => {
  const repo = repoFalso({ ventas: [ventaPendiente] });
  const r = await procesarPagoCuadro({ paymentInfo: { ...pago, transaction_amount: 100 }, paymentId: 555, repo });
  assert.equal(r.status, 422);
  assert.equal(repo.estado.ventas[0].estado, "pendiente");
});

test("rechaza un segundo pago distinto para la misma venta", async () => {
  const repo = repoFalso({ ventas: [{ ...ventaPendiente, estado: "aprobado", mp_payment_id: "555" }] });
  const r = await procesarPagoCuadro({ paymentInfo: pago, paymentId: 777, repo });
  assert.equal(r.status, 409);
});

test("si otro comprador ya pagó el cuadro, marca la venta para devolución y avisa", async () => {
  const repo = repoFalso({
    cuadro: { estado: "vendido", canal_venta: "web" },
    ventas: [{ ...ventaPendiente, id: "v0", estado: "aprobado", mp_payment_id: "111" }, ventaPendiente],
  });
  const avisos = [];
  const r = await procesarPagoCuadro({ paymentInfo: pago, paymentId: 555, repo, notificar: (a) => avisos.push(a.tipo) });
  assert.equal(r.status, 200);
  assert.equal(repo.estado.ventas[1].estado, "requiere_devolucion");
  assert.deepEqual(avisos, ["devolucion"]);
});

test("si el cuadro se vendió por Instagram mientras se pagaba, pide devolución", async () => {
  const repo = repoFalso({ cuadro: { estado: "vendido", canal_venta: "instagram" }, ventas: [ventaPendiente] });
  const avisos = [];
  await procesarPagoCuadro({ paymentInfo: pago, paymentId: 555, repo, notificar: (a) => avisos.push(a.tipo) });
  assert.equal(repo.estado.ventas[0].estado, "requiere_devolucion");
  assert.deepEqual(avisos, ["devolucion"]);
});

test("ignora pagos no aprobados sin tocar nada", async () => {
  const repo = repoFalso({ ventas: [ventaPendiente] });
  const r = await procesarPagoCuadro({ paymentInfo: { ...pago, status: "rejected" }, paymentId: 555, repo });
  assert.equal(r.status, 200);
  assert.equal(repo.estado.ventas[0].estado, "pendiente");
});
