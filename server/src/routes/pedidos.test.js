import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { leerCampos, validar, destinoEnvio, nombreProducto } = await import("./pedidos.js");

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

// Estilo "Meme": siempre un cuadro en acrílico, sin cantidad ni nombres de mascotas
const meme = { ...base, technique_slug: "meme", width_cm: "", height_cm: "" };

test("Meme: la cantidad queda en 1 aunque no se envíe o venga otra", () => {
  assert.equal(leerCampos({ ...meme, pet_count: undefined }).pet_count, 1);
  assert.equal(leerCampos({ ...meme, pet_count: "4" }).pet_count, 1);
  assert.equal(leerCampos({ ...meme, pet_count: "abc" }).pet_count, 1);
  assert.equal(validar(leerCampos({ ...meme, pet_count: undefined }), foto), null);
});

test("Meme: ignora el nombre de mascota que llegue", () => {
  assert.equal(leerCampos({ ...meme, pet_name: "Luna" }).pet_name, "");
  assert.equal(leerCampos({ ...base, pet_name: "Luna" }).pet_name, "Luna");
});

test("sin foto, el mensaje depende del estilo", () => {
  assert.equal(validar(leerCampos(meme), []), "Sube la imagen de tu meme.");
  assert.equal(validar(leerCampos(base), []), "Sube al menos una foto de tu mascota.");
});

test("los demás estilos siguen exigiendo la cantidad de mascotas", () => {
  assert.match(error({ pet_count: undefined }), /cantidad de mascotas/);
});

test("nombre del producto guardado en el pedido", () => {
  assert.equal(nombreProducto(leerCampos(meme), 1), "Cuadro de meme");
  assert.equal(nombreProducto(leerCampos(base), 1), "Retrato de 1 mascota");
  assert.equal(nombreProducto(leerCampos(base), 3), "Retrato de 3 mascotas");
});
