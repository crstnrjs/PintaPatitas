// WebMCP tools para agentes en el navegador
// Se registran en window.load para que estén disponibles tras hidratación

function registrarWebMCP() {
  if (typeof navigator === "undefined" || !navigator.modelContext?.registerTool) {
    return; // API no soportada
  }

  const apiBase = "https://api.pintapatitas.com";

  // Tool: navegar a una ruta de la app
  navigator.modelContext.registerTool({
    name: "navegar",
    description: "Navega a una página de PintaPatitas (inicio, catálogo, cuadros listos, sobre nosotros, contacto, soporte, términos)",
    inputSchema: {
      type: "object",
      properties: {
        ruta: {
          type: "string",
          enum: ["/", "/catalogo", "/cuadros-listos", "/sobre-nosotros", "/contacto", "/soporte", "/terminos"],
          description: "Ruta destino dentro de la app"
        }
      },
      required: ["ruta"]
    },
    execute: async ({ ruta }) => {
      window.location.href = ruta;
      return { ok: true, navegadoA: ruta };
    }
  });

  // Tool: abrir formulario de pedido (catálogo)
  navigator.modelContext.registerTool({
    name: "abrir_pedido",
    description: "Abre el asistente para crear un retrato personalizado (catálogo)",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      window.location.href = "/catalogo";
      return { ok: true, accion: "abrir_catalogo" };
    }
  });

  // Tool: ver cuadros listos
  navigator.modelContext.registerTool({
    name: "ver_cuadros_listos",
    description: "Muestra las obras originales ya pintadas y disponibles para compra directa",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      window.location.href = "/cuadros-listos";
      return { ok: true, accion: "ver_cuadros_listos" };
    }
  });

  // Tool: contactar por WhatsApp
  navigator.modelContext.registerTool({
    name: "contactar_whatsapp",
    description: "Abre WhatsApp con el número de PintaPatitas para consultas",
    inputSchema: {
      type: "object",
      properties: {
        mensaje: { type: "string", description: "Mensaje inicial opcional" }
      }
    },
    execute: async ({ mensaje = "Hola, quiero consultar sobre un retrato" }) => {
      const url = `https://api.whatsapp.com/send/?phone=56954341467&text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
      return { ok: true, accion: "whatsapp", url };
    }
  });

  // Tool: obtener info de la tienda (leo del JSON-LD o config)
  navigator.modelContext.registerTool({
    name: "info_tienda",
    description: "Devuelve información básica de PintaPatitas: artista, técnicas, envío, contacto",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      return {
        ok: true,
        tienda: {
          nombre: "PintaPatitas",
          artista: "Fernanda",
          tecnicas: ["acrílico", "lápiz", "digital"],
          envio: "Starken por pagar a todo Chile",
          tiempoProduccion: "alrededor de una semana y media",
          contacto: {
            whatsapp: "+56 9 5434 1467",
            email: "pinta.patitas@gmail.com",
            instagram: "https://www.instagram.com/pintaa.patitas",
            ubicacion: "La Serena, Coquimbo, Chile"
          },
          urls: {
            inicio: "https://pintapatitas.com/",
            catalogo: "https://pintapatitas.com/catalogo",
            cuadrosListos: "https://pintapatitas.com/cuadros-listos",
            terminos: "https://pintapatitas.com/terminos"
          }
        }
      };
    }
  });
}

// Auto-registrar tras carga completa
if (typeof window !== "undefined") {
  if (document.readyState === "complete") {
    registrarWebMCP();
  } else {
    window.addEventListener("load", registrarWebMCP);
  }
}

export { registrarWebMCP };