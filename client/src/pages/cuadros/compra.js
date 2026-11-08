import { apiUrl } from "@/lib/api";
import { normalizarTelefono } from "@/pages/pedido/StepContacto";
import { formatearRut, rutValido } from "@/lib/rut";

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

export { formatearRut };

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
