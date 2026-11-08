import { supabase } from "@/lib/supabase";

export const BUCKET = "cuadros";

export const fotoUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export const ESTADOS = {
  borrador: { label: "BORRADOR", className: "bg-bruma text-tinta/65", dot: "bg-tinta/40" },
  disponible: { label: "DISPONIBLE", className: "bg-[#e1f0e6] text-[#2d6844]", dot: "bg-[#5ea67a]" },
  reservado: { label: "EN COMPRA", className: "bg-[#faefd9] text-[#865710]", dot: "bg-[#d99a37]" },
  vendido: { label: "VENDIDO", className: "bg-[#ece8f5] text-[#56468a]", dot: "bg-[#8a7bc0]" },
  oculto: { label: "OCULTO", className: "bg-[#f7e3e1] text-[#963a31]", dot: "bg-[#cf6b60]" },
};

export const CANALES = { web: "Web", instagram: "Instagram", otro: "Otro canal" };

// Una reserva vencida (el comprador no pagó a tiempo) vuelve a contar como disponible.
export function reservaActiva(cuadro) {
  return cuadro.estado === "reservado" && cuadro.reservado_hasta && new Date(cuadro.reservado_hasta) > new Date();
}

export function estadoEfectivo(cuadro) {
  if (cuadro.estado === "reservado" && !reservaActiva(cuadro)) return "disponible";
  return cuadro.estado;
}

// Filtro PostgREST: el cuadro está como se ve en pantalla y no tiene una compra en curso.
export function filtroSinCompraEnCurso(estados) {
  const ahora = new Date().toISOString();
  return `estado.in.(${estados.join(",")}),and(estado.eq.reservado,reservado_hasta.lt."${ahora}")`;
}

export function crearSlug(titulo) {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  const sufijo = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  return `${base || "cuadro"}-${sufijo}`;
}

// Reduce y convierte a webp para que la tienda cargue rápido.
export async function procesarFoto(file) {
  if (!file?.type.startsWith("image/")) throw new Error("Selecciona archivos de imagen (JPG, PNG o WebP).");
  if (file.size > 20 * 1024 * 1024) throw new Error("Cada imagen debe pesar menos de 20 MB.");
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen."))),
      "image/webp",
      0.84,
    ),
  );
}
