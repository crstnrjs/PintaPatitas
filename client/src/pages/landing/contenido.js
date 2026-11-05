/*
 * Contenido editable de la landing.
 * REGLA: aquí va solo material REAL de PintaPatitas. Nada de testimonios, cifras ni fotos inventadas.
 * Las secciones con listas vacías no se muestran en producción; en desarrollo (npm run dev)
 * aparece un recuadro "Falta material" para recordar qué hay que agregar.
 * Precios, técnicas y tamaños NO van aquí: vienen del catálogo del panel admin.
 */

// true = en npm run dev se ven los recuadros amarillos "Falta material". Nunca se ven en producción.
export const MOSTRAR_AVISOS = false;

// Enlace al perfil de Instagram. Vacío = no se muestra.
export const INSTAGRAM_URL = "";

// Tiempo de trabajo aproximado (no es una garantía).
export const TIEMPO_PRODUCCION = "alrededor de una semana y media";

// Obras terminadas. tecnica = slug del catálogo ("acrilico", "lapiz", "digital") o null si no se sabe.
// variantes: anchos de las copias livianas para móvil (archivo-480.webp, archivo-720.webp). Opcional.
export const obras = [
  {
    src: "/img/banner.webp",
    variantes: [480, 720],
    ancho: 1080,
    alto: 1080,
    alt: "Retrato pintado de un gato tricolor sobre un atril",
    tecnica: null,
  },
  {
    src: "/img/Mqumascota.webp",
    variantes: [480, 720],
    ancho: 1031,
    alto: 1365,
    alt: "Cuadro con cuatro perros y cuatro gatos colgado en un living",
    tecnica: null,
  },
];

// Pares foto original → obra terminada. { foto, obra, ancho, alto, alt, tecnica }
export const comparaciones = [];

// Testimonios reales, solo con autorización. { texto, autor, mascota, foto }
export const testimonios = [];

// Frase de confianza verificada, p. ej. "Más de 100 mascotas convertidas en arte". null = no se muestra.
export const FRASE_CONFIANZA = null;

// Textos por técnica (por slug). Si llega una técnica nueva sin texto, se muestra solo con nombre y precio.
export const estilosInfo = {
  acrilico: {
    sensacion: "Vibrante y cálido",
    texto: "Pintura acrílica con color intenso y textura de pincel. Para un cuadro que se note en la pared.",
    rasgos: ["Color intenso", "Textura de pincel"],
  },
  lapiz: {
    sensacion: "Delicado y atemporal",
    texto: "Dibujo a lápiz que se detiene en cada pelo y en la mirada. Sobrio y lleno de detalle.",
    rasgos: ["Trazo fino", "Mucho detalle"],
  },
  digital: {
    sensacion: "Moderno y luminoso",
    texto: "Ilustración hecha por el artista en formato digital, con colores limpios y líneas suaves.",
    rasgos: ["Colores limpios", "Formato digital"],
  },
};
