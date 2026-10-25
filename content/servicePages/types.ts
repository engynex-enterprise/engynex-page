/**
 * Páginas insignia de servicio (components/services/showcase/ShowcasePage).
 * Estructura inspirada en meta.com (tarjetas fotográficas grandes, titulares
 * enormes, botones píldora) y en las páginas de servicio de Netguru, Webflow
 * Enterprise y Vercel (servicios por capa, resultados medibles, casos con
 * métricas, modelos de trabajo). Cada servicio aporta su contenido.
 */
export type ShowcaseIcon =
  | "megaphone"
  | "layout"
  | "bag"
  | "blocks"
  | "globe"
  | "refresh"
  | "compass"
  | "palette"
  | "code"
  | "pen"
  | "search"
  | "plug"
  | "accessibility"
  | "server"
  | "users"
  | "dashboard"
  | "calendar"
  | "store"
  | "building"
  | "database"
  | "key"
  | "cloud"
  | "shield"
  | "flask"
  | "workflow"
  | "sparkles"
  | "rocket"
  | "clipboard"
  | "mouse";

/** "plans" lleva a la sección de planes; otro valor, al servicio con ese slug. */
export type ShowcaseHref = "plans" | string;

export type ShowcaseCopy = {
  hero: { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string; wordmark: string; image: string };
  proof: { value: string; label: string }[];
  tiles: { title: string; hint: string };
  featured: { eyebrow: string; title: string; body: string; cta: string; image: string };
  solutionsTitle: string;
  solutionsSubtitle: string;
  solutions: { key: string; icon: ShowcaseIcon; image: string; href: ShowcaseHref; eyebrow: string; title: string; body: string; more: string }[];
  capabilities: { titleLight: string; titleBold: string; intro: string; items: { icon: ShowcaseIcon; title: string; body: string; tags: string[] }[] };
  outcomes: {
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
    /** Textos de las tres ilustraciones (calendario, embudo, panel). */
    visual: {
      week: string;
      review: string;
      live: string;
      funnel: { label: string; value: string }[];
      editor: string;
      publish: string;
      saved: string;
    };
  };
  performance: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** value de 0 a 100 (llena el anillo); display, lo que se lee. */
    scores: { label: string; value: number; display?: string }[];
    scoresNote: string;
    vitals: { metric: string; target: string; label: string }[];
    security: string[];
  };
  cases: { title: string; subtitle: string; cta: string; link: string; slugs: string[] };
  models: { title: string; subtitle: string; items: { name: string; fit: string; body: string; points: string[]; cta: string }[] };
  included: { title: string; items: string[] };
  /** Buscador y venta de dominios (reemplaza al diagnóstico gratuito). */
  domains?: boolean;
  /** Iconos de las etapas del proceso, en orden. */
  processIcons?: ShowcaseIcon[];
  process: { stepLabel: string; ctaTitle: string; ctaLabel: string };
  audit?: {
    title: string;
    body: string;
    label: string;
    placeholder: string;
    cta: string;
    note: string;
    /** Mensaje de WhatsApp; {value} es lo que escribió la persona. */
    message: string;
    /** "url" valida una dirección web; "text" pide al menos unas palabras. */
    kind: "url" | "text";
  };
};
