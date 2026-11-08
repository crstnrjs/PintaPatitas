// Enlaces de la navegación pública. Los que llevan hash apuntan al id de una sección de la landing;
// los que llevan "to" son páginas propias.
export const enlacesLanding = [
  { hash: "#como-funciona", label: "Cómo funciona" },
  { hash: "#estilos", label: "Estilos" },
  { hash: "#galeria", label: "Galería" },
  { to: "/cuadros-listos", label: "Cuadros listos" },
  { hash: "#preguntas", label: "Preguntas" },
];

export const destinoEnlace = ({ to, hash }) => to ?? { pathname: "/", hash };
