// Base URL de la API:
// En producción: se define con VITE_API_URL (ej. https://api.pintapatitas.com)
// En desarrollo local: si está vacío, utiliza la ruta relativa '/api' con el proxy de Vite
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function apiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}
