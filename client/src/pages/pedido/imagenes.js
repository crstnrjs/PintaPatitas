export const MAX_FOTOS = 6;
export const MAX_ORIGINAL_MB = 20;

// Reduce y convierte a webp: las fotos pesan poco y el envío es rápido
export async function aWebp(file, maxLado = 2000, calidad = 0.85) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))),
      "image/webp",
      calidad
    )
  );
}