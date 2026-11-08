import { normalizarTelefono } from "./StepContacto";
import { apiUrl } from "@/lib/api";

// Arma lo que recibirá el servidor. NO se envía el precio: lo calcula el servidor.
export function armarFormData(datos, estilo) {
  const c = datos.contacto;
  const fd = new FormData();

  fd.append("technique_slug", estilo.slug);
  if (datos.formato) {
    fd.append("width_cm", datos.formato.ancho);
    fd.append("height_cm", datos.formato.alto);
  }
  fd.append("pet_count", datos.mascotas);
  // Nombres de las mascotas (1 a 4), unidos con coma. Opcional.
  const nombres = (datos.nombres ?? [])
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  fd.append("pet_name", nombres);
  fd.append("idea", datos.idea.trim());

  for (const campo of ["nombre", "apellido", "correo", "rut", "region", "comuna"]) {
    fd.append(campo, c[campo].trim());
  }
  fd.append("telefono", `+56${normalizarTelefono(c.telefono)}`);
  fd.append("entrega_tipo", c.entrega_tipo);
  // Solo se envían los datos del destino elegido.
  const camposDestino = c.entrega_tipo === "sucursal" ? ["sucursal"] : ["calle", "numero", "depto"];
  for (const campo of camposDestino) fd.append(campo, c[campo].trim());
  fd.append("acepta_envio", datos.aceptaEnvio ? "true" : "false");

  datos.fotos.forEach((f, i) => fd.append("fotos", f.blob, `mascota-${i + 1}.webp`));
  return fd;
}

export async function enviarPedido(formData) {
  const res = await fetch(apiUrl("/api/pedidos"), { method: "POST", body: formData });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (json.detalle) console.error("Detalle del servidor:", json.detalle);
    throw new Error(json.error ?? "No pudimos enviar tu solicitud. Intenta de nuevo.");
  }
  return json; // { orderId, orderNumber }
}