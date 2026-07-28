/**
 * Acentos por categoría.
 *
 * Tailwind necesita nombres de clase completos en el código para poder
 * generarlos, así que el mapa guarda la cadena entera de cada tono en vez de
 * componerla. Los colores `hue-*` se definen en globals.css con una versión
 * legible para tema claro y otra para oscuro.
 */
export const accentHues = [
  "green",
  "blue",
  "violet",
  "teal",
  "amber",
  "rose",
  "cyan",
  "indigo",
] as const;

export type AccentHue = (typeof accentHues)[number];

interface HueClasses {
  /** Pastilla del icono en reposo. */
  tile: string;
  /** Pastilla + relleno sólido al pasar el cursor sobre la tarjeta. */
  tileHover: string;
  /** Solo texto. */
  text: string;
  /** Punto o filete de acento. */
  dot: string;
  /** Halo difuminado detrás de la tarjeta. */
  glow: string;
  /** Borde al pasar el cursor. */
  border: string;
  /** Filete superior sólido. */
  borderTop: string;
  /** Color de texto al pasar el cursor sobre la tarjeta. */
  textHover: string;
}

export const hue: Record<AccentHue, HueClasses> = {
  green: {
    tile: "bg-hue-green/12 text-hue-green",
    tileHover: "group-hover:bg-hue-green group-hover:text-surface",
    text: "text-hue-green",
    dot: "bg-hue-green",
    glow: "bg-hue-green/25",
    border: "group-hover:border-hue-green/45",
    borderTop: "border-t-hue-green",
    textHover: "group-hover:text-hue-green",
  },
  blue: {
    tile: "bg-hue-blue/12 text-hue-blue",
    tileHover: "group-hover:bg-hue-blue group-hover:text-surface",
    text: "text-hue-blue",
    dot: "bg-hue-blue",
    glow: "bg-hue-blue/25",
    border: "group-hover:border-hue-blue/45",
    borderTop: "border-t-hue-blue",
    textHover: "group-hover:text-hue-blue",
  },
  violet: {
    tile: "bg-hue-violet/12 text-hue-violet",
    tileHover: "group-hover:bg-hue-violet group-hover:text-surface",
    text: "text-hue-violet",
    dot: "bg-hue-violet",
    glow: "bg-hue-violet/25",
    border: "group-hover:border-hue-violet/45",
    borderTop: "border-t-hue-violet",
    textHover: "group-hover:text-hue-violet",
  },
  teal: {
    tile: "bg-hue-teal/12 text-hue-teal",
    tileHover: "group-hover:bg-hue-teal group-hover:text-surface",
    text: "text-hue-teal",
    dot: "bg-hue-teal",
    glow: "bg-hue-teal/25",
    border: "group-hover:border-hue-teal/45",
    borderTop: "border-t-hue-teal",
    textHover: "group-hover:text-hue-teal",
  },
  amber: {
    tile: "bg-hue-amber/12 text-hue-amber",
    tileHover: "group-hover:bg-hue-amber group-hover:text-surface",
    text: "text-hue-amber",
    dot: "bg-hue-amber",
    glow: "bg-hue-amber/25",
    border: "group-hover:border-hue-amber/45",
    borderTop: "border-t-hue-amber",
    textHover: "group-hover:text-hue-amber",
  },
  rose: {
    tile: "bg-hue-rose/12 text-hue-rose",
    tileHover: "group-hover:bg-hue-rose group-hover:text-surface",
    text: "text-hue-rose",
    dot: "bg-hue-rose",
    glow: "bg-hue-rose/25",
    border: "group-hover:border-hue-rose/45",
    borderTop: "border-t-hue-rose",
    textHover: "group-hover:text-hue-rose",
  },
  cyan: {
    tile: "bg-hue-cyan/12 text-hue-cyan",
    tileHover: "group-hover:bg-hue-cyan group-hover:text-surface",
    text: "text-hue-cyan",
    dot: "bg-hue-cyan",
    glow: "bg-hue-cyan/25",
    border: "group-hover:border-hue-cyan/45",
    borderTop: "border-t-hue-cyan",
    textHover: "group-hover:text-hue-cyan",
  },
  indigo: {
    tile: "bg-hue-indigo/12 text-hue-indigo",
    tileHover: "group-hover:bg-hue-indigo group-hover:text-surface",
    text: "text-hue-indigo",
    dot: "bg-hue-indigo",
    glow: "bg-hue-indigo/25",
    border: "group-hover:border-hue-indigo/45",
    borderTop: "border-t-hue-indigo",
    textHover: "group-hover:text-hue-indigo",
  },
};

/** Tono estable a partir de una posición: la misma tarjeta siempre igual. */
export function hueAt(index: number): AccentHue {
  return accentHues[index % accentHues.length];
}

/** Tono por slug de servicio, para que coincida en todas las secciones. */
export const serviceHue: Record<string, AccentHue> = {
  "desarrollo-web": "green",
  "plataformas-web": "blue",
  "apps-moviles": "violet",
  ecommerce: "amber",
  "ux-ui-branding": "rose",
  "marketing-digital": "cyan",
  "produccion-audiovisual": "indigo",
  "ia-automatizacion": "teal",
  "cloud-devops": "blue",
  ciberseguridad: "green",
  "hosting-mantenimiento": "cyan",
  "consultoria-tech": "violet",
  "data-analytics": "indigo",
  "integraciones-apis": "teal",
  "soporte-ti": "amber",
  "alquiler-equipos": "rose",
};

export function hueForService(slug: string, fallbackIndex = 0): AccentHue {
  return serviceHue[slug] ?? hueAt(fallbackIndex);
}
