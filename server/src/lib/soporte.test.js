import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
const { leerSoporte, enviarMensajeSoporte } = await import("./soporte.js");
const { crearRouterSoporte } = await import("../routes/soporte.js");

const base = {
  nombre: "Ana Pérez",
  email: "Ana@Example.com",
  telefono: "+56912345678",
  pedido: "#PP-12",
  motivo: "envio",
  mensaje: "Mi cuadro aún no llega y ya pasaron dos semanas desde el envío.",
  sitio_web: "",
};

test("acepta un mensaje válido y normaliza el correo", () => {
  const { datos, error, esBot } = leerSoporte(base);
  assert.equal(error, null);
  assert.equal(esBot, false);
  assert.equal(datos.email, "ana@example.com");
});

test("exige nombre, correo, motivo y un mensaje con detalle", () => {
  assert.match(leerSoporte({ ...base, nombre: "" }).error, /nombre/);
  assert.match(leerSoporte({ ...base, email: "ana" }).error, /correo/);
  assert.match(leerSoporte({ ...base, motivo: "hackeo" }).error, /motivo/);
  assert.match(leerSoporte({ ...base, mensaje: "ayuda" }).error, /mínimo 20/);
});

test("el celular es opcional, pero si viene debe ser válido", () => {
  assert.equal(leerSoporte({ ...base, telefono: "" }).error, null);
  assert.match(leerSoporte({ ...base, telefono: "123" }).error, /celular/);
});

test("quita los saltos de línea del nombre para que no alteren el asunto", () => {
  const { datos } = leerSoporte({ ...base, nombre: "Ana\r\nBcc: otro@example.com" });
  assert.equal(datos.nombre.includes("\n"), false);
});

test("detecta el campo trampa que solo llenan los bots", () => {
  assert.equal(leerSoporte({ ...base, sitio_web: "http://spam.example" }).esBot, true);
});

test("envía al correo de soporte con 'responder a' el cliente, y una copia al cliente", async () => {
  const enviados = [];
  await enviarMensajeSoporte(leerSoporte(base).datos, {
    destino: "soporte@pintapatitas.com",
    enviar: async (correo) => enviados.push(correo),
  });
  assert.equal(enviados.length, 2);
  assert.equal(enviados[0].to, "soporte@pintapatitas.com");
  assert.match(enviados[0].replyTo, /ana@example\.com/);
  assert.match(enviados[0].subject, /\[Soporte\] Envío — Ana Pérez \(#PP-12\)/);
  assert.equal(enviados[1].to, "ana@example.com");
  // Ambos salen desde la casilla de soporte y sin copia oculta: soporte@ recibe solo el aviso.
  assert.equal(enviados[0].remitente, "soporte");
  assert.equal(enviados[0].respaldo, false);
  assert.equal(enviados[1].remitente, "soporte");
  assert.equal(enviados[1].respaldo, false);
});

test("el remitente de soporte solo se usa si tiene usuario y contraseña", async () => {
  const { obtenerConfigSoporte } = await import("./mailer.js");
  assert.equal(obtenerConfigSoporte({}), null);
  assert.equal(obtenerConfigSoporte({ SOPORTE_SMTP_USER: "soporte@pintapatitas.com" }), null);
  assert.deepEqual(obtenerConfigSoporte({ SOPORTE_SMTP_USER: " soporte@pintapatitas.com ", SOPORTE_SMTP_PASS: "x" }), {
    user: "soporte@pintapatitas.com",
    pass: "x",
  });
});

test("escapa el HTML que escribe el cliente", async () => {
  const enviados = [];
  await enviarMensajeSoporte(leerSoporte({ ...base, mensaje: "<script>alert(1)</script> no llega mi pedido" }).datos, {
    enviar: async (correo) => enviados.push(correo),
  });
  assert.equal(enviados[0].html.includes("<script>"), false);
  assert.ok(enviados[0].html.includes("&lt;script&gt;"));
});

async function post(router, body) {
  const app = express();
  app.use(express.json());
  app.use("/soporte", router);
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/soporte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test("la ruta responde 400 con datos inválidos y no envía nada", async () => {
  let llamadas = 0;
  const r = await post(crearRouterSoporte({ enviar: async () => { llamadas += 1; } }), { ...base, email: "x" });
  assert.equal(r.status, 400);
  assert.equal(llamadas, 0);
});

test("la ruta finge éxito ante un bot sin enviar correos", async () => {
  let llamadas = 0;
  const r = await post(crearRouterSoporte({ enviar: async () => { llamadas += 1; } }), { ...base, sitio_web: "spam" });
  assert.equal(r.status, 201);
  assert.equal(llamadas, 0);
});

test("la ruta responde 502 si el correo no sale", async () => {
  const r = await post(crearRouterSoporte({ enviar: async () => { throw new Error("smtp caído"); } }), base);
  assert.equal(r.status, 502);
});
