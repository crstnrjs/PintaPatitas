// Base URL de la API:
// 1. Si está definida VITE_API_URL en las variables de entorno, úsala directamente.
// 2. Si estamos en el navegador en pintapatitas.com o subdominio, apunta automáticamente a https://api.pintapatitas.com.
// 3. En desarrollo local (localhost), usa "" para que el proxy de Vite maneje las peticiones a localhost:3001.

let baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

if (!baseUrl && typeof window !== "undefined") {
  const host = window.location.hostname;
  if (host === "pintapatitas.com" || host === "www.pintapatitas.com") {
    baseUrl = "https://api.pintapatitas.com";
  }
}

export function apiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
