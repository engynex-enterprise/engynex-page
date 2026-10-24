/**
 * Configuración compartida de los ajustes de accesibilidad. Vive fuera de
 * lib/a11y.ts ("use client") porque el layout, que es de servidor, necesita
 * el script inicial como texto.
 */
export interface A11ySettings {
  /** 0 = 100 %, 1 = 112,5 %, 2 = 125 %. */
  textSize: 0 | 1 | 2;
  contrast: boolean;
  dyslexia: boolean;
  spacing: boolean;
  links: boolean;
  /** Pausar animaciones y movimiento. */
  motion: boolean;
}

export const A11Y_DEFAULTS: A11ySettings = {
  textSize: 0,
  contrast: false,
  dyslexia: false,
  spacing: false,
  links: false,
  motion: false,
};

export const KEY = "engynex-a11y";
export const EVENT = "engynex-a11y-change";

/** Clase en <html> por cada ajuste booleano. */
export const A11Y_CLASSES = {
  contrast: "a11y-contrast",
  dyslexia: "a11y-dyslexia",
  spacing: "a11y-spacing",
  links: "a11y-links",
  motion: "a11y-motion",
} as const;

/**
 * Clase de tamaño de texto por nivel. Se aplica con `zoom` al contenido (no a
 * la barra de navegación, que conserva su diseño): reacomoda sin desbordar.
 */
export const TEXT_SIZES = ["", "a11y-text-1", "a11y-text-2"];

/** Script en línea para el <head>: aplica lo guardado antes de pintar. */
export const A11Y_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('${KEY}')||'null');if(!s)return;var c=document.documentElement.classList,m=${JSON.stringify(A11Y_CLASSES)};for(var k in m){if(s[k])c.add(m[k]);}var z=${JSON.stringify(TEXT_SIZES)}[s.textSize||0];if(z)c.add(z);}catch(e){}})();`;

