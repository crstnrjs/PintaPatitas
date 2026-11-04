const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconCheck = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconFlecha = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconImagen = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

export const IconGota = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3c3.5 4.2 6 7.1 6 10.2A6 6 0 0 1 6 13.2C6 10.1 8.5 7.2 12 3z" />
  </svg>
);

export const IconPata = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.6}>
    <circle cx="6.5" cy="11" r="1.7" />
    <circle cx="9.5" cy="7" r="1.7" />
    <circle cx="14.5" cy="7" r="1.7" />
    <circle cx="17.5" cy="11" r="1.7" />
    <path d="M12 12.5c-2.6 0-5 2.6-5 4.6 0 1.6 1.3 2.4 2.7 2.4 1 0 1.5-.4 2.3-.4s1.3.4 2.3.4c1.4 0 2.7-.8 2.7-2.4 0-2-2.4-4.6-5-4.6z" />
  </svg>
);