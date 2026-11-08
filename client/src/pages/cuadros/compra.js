import { apiUrl } from "@/lib/api";
import { normalizarTelefono } from "@/pages/pedido/StepContacto";

export const COMPRA_INICIAL = {
  nombre: "",
  rut: "",
  email: "",
  telefono: "",
  entrega_tipo: "domicilio",
  region: "",
  comuna: "",
  direccion: "",
  acepta_envio: false,
};

// Mismo cálculo que el servidor; aquí solo sirve para avisar antes de enviar.
export function rutValido(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return limpio.slice(-1) === esperado;
}

// 111111111 → 11.111.111-1
export function formatearRut(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}

export function validarCompra(c) {
  const e = {};
  if (c.nombre.trim().length < 3 || !c.nombre.trim().includes(" ")) e.nombre = "Ingresa tu nombre y apellido";
  if (!rutValido(c.rut)) e.rut = "Revisa tu RUT";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = "Ingresa un correo válido";
  if (!/^9\d{8}$/.test(normalizarTelefono(c.telefono))) e.telefono = "Ingresa un celular chileno, por ejemplo 9 1234 5678";
  if (!c.region) e.region = "Elige tu región";
  if (c.comuna.trim().length < 2) e.comuna = "Ingresa tu comuna";
  if (c.direccion.trim().length < 3) {
    e.direccion = c.entrega_tipo === "sucursal" ? "Indica la sucursal Starken" : "Ingresa calle y número";
  }
  if (!c.acepta_envio) e.acepta_envio = "Confirma que pagarás el envío al recibir";
  return e;
}

/* Reserva el cuadro y devuelve el link de pago de Mercado Pago. El precio lo pone el servidor. */
export async function iniciarCompra(slug, c) {
  const res = await fetch(apiUrl(`/api/cuadros/${encodeURIComponent(slug)}/comprar`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: c.nombre.trim(),
      rut: c.rut.trim(),
      email: c.email.trim(),
      telefono: `+56${normalizarTelefono(c.telefono)}`,
      entrega_tipo: c.entrega_tipo,
      region: c.region,
      comuna: c.comuna.trim(),
      direccion: c.direccion.trim(),
      acepta_envio: c.acepta_envio,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.payment_url) {
    const error = new Error(json.error ?? "No pudimos iniciar la compra. Intenta de nuevo.");
    error.status = res.status;
    throw error;
  }
  return json.payment_url;
}
