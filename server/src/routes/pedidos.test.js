import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { leerCampos, validar, destinoEnvio } = await import("./pedidos.js");

// Así llegan los campos desde el FormData del asistente (todo es texto).
const base = {
  technique_slug: "acrilico",
  pet_count: "1",
  width_cm: "30",
  height_cm: "40",
  nombre: "Ana",
  apellido: "Pérez",
  correo: "ana@example.com",
  telefono: "+56912345678",
  rut: "11.111.111-1",
  entrega_tipo: "domicilio",
  region: "Valparaíso",
  comuna: "Viña del Mar",
  calle: "Av. Libertad",
  numero: "123",
  depto: "4B",
  sucursal: "",
  acepta_envio: "true",
};
const foto = [{}];
const error = (cambios) => validar(leerCampos({ ...base, ...cambios }), foto);

test("acepta un pedido a domicilio con RUT válido", () => {
  assert.equal(error({}), null);
  assert.equal(leerCampos(base).rut, "11111111-1");
});

test("exige un RUT con dígito verificador correcto", () => {
  assert.match(error({ rut: "" }), /RUT/);
  assert.match(error({ rut: "12.345.678-9" }), /RUT/);
});

test("exige elegir domicilio o sucursal", () => {
  assert.match(error({ entrega_tipo: "" }), /domicilio o en una sucursal/);
  assert.match(error({ entrega_tipo: "dron" }), /domicilio o en una sucursal/);
});

test("a domicilio pide calle y número; en sucursal pide la sucursal", () => {
  assert.match(error({ calle: "" }), /dirección de envío/);
  assert.equal(error({ entrega_tipo: "sucursal", calle: "", numero: "", sucursal: "Starken Viña Centro" }), null);
  assert.match(error({ entrega_tipo: "sucursal", calle: "", numero: "", sucursal: "" }), /sucursal Starken/);
});

test("exige aceptar el envío por pagar", () => {
  assert.match(error({ acepta_envio: "" }), /envío se paga al recibir/);
  assert.match(error({ acepta_envio: "false" }), /envío se paga al recibir/);
});

test("guarda solo los datos del destino elegido", () => {
  assert.deepEqual(destinoEnvio(leerCampos(base)), {
    customer_rut: "11111111-1",
    delivery_type: "domicilio",
    starken_branch: null,
    street: "Av. Libertad",
    street_number: "123",
    apartment: "4B",
  });
  assert.deepEqual(destinoEnvio(leerCampos({ ...base, entrega_tipo: "sucursal", sucursal: "Starken Viña Centro" })), {
    customer_rut: "11111111-1",
    delivery_type: "sucursal",
    starken_branch: "Starken Viña Centro",
    street: null,
    street_number: null,
    apartment: null,
  });
});
