// Genera dist/sitemap.xml en cada build, con <lastmod> para que buscadores y agentes sepan
// qué cambió. Las páginas fijas llevan la fecha del build; cada cuadro listo a la venta, la
// fecha en que se editó por última vez (se lee de Supabase con la anon key, como el sitio).

const SITIO = "https://pintapatitas.com";

const PAGINAS = [
  { ruta: "/", prioridad: "1.0", frecuencia: "weekly" },
  { ruta: "/catalogo", prioridad: "0.9", frecuencia: "weekly" },
  { ruta: "/cuadros-listos", prioridad: "0.9", frecuencia: "daily" },
  { ruta: "/sobre-nosotros", prioridad: "0.5", frecuencia: "monthly" },
  { ruta: "/contacto", prioridad: "0.5", frecuencia: "monthly" },
  { ruta: "/soporte", prioridad: "0.4", frecuencia: "monthly" },
  { ruta: "/terminos", prioridad: "0.3", frecuencia: "yearly" },
];

const fecha = (d) => new Date(d).toISOString().slice(0, 10);
const escapar = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function cuadrosALaVenta(supabaseUrl, anonKey) {
  if (!supabaseUrl || !anonKey) return [];
  try {
    const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/cuadros_listos?select=slug,updated_at&estado=in.(disponible,reservado)`;
    const res = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    // El build no debe fallar por esto: el sitemap queda con las páginas fijas.
    console.warn(`[sitemap] No se pudieron leer los cuadros listos (${error.message}).`);
    return [];
  }
}

export function construirSitemap({ hoy, cuadros }) {
  const urls = [
    ...PAGINAS.map((p) => ({ loc: `${SITIO}${p.ruta}`, lastmod: hoy, frecuencia: p.frecuencia, prioridad: p.prioridad })),
    ...cuadros.map((c) => ({
      loc: `${SITIO}/cuadros-listos/${encodeURIComponent(c.slug)}`,
      lastmod: fecha(c.updated_at),
      frecuencia: "weekly",
      prioridad: "0.7",
    })),
  ];
  const cuerpo = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapar(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.frecuencia}</changefreq>\n    <priority>${u.prioridad}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cuerpo}\n</urlset>\n`;
}

export default function sitemap({ supabaseUrl, anonKey } = {}) {
  return {
    name: "pintapatitas-sitemap",
    apply: "build",
    async generateBundle() {
      const cuadros = await cuadrosALaVenta(supabaseUrl, anonKey);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: construirSitemap({ hoy: fecha(Date.now()), cuadros }),
      });
    },
  };
}
