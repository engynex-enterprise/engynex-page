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
  | "mouse"
  | "heart"
  | "truck"
  | "landmark"
  | "graduation"
  | "factory"
  | "wallet"
  | "briefcase"
  | "kanban"
  | "git"
  | "lock"
  | "unlock"
  | "handshake"
  | "lifebuoy"
  | "bug"
  | "target"
  | "usercog"
  | "repeat"
  | "chat";

/** "plans" lleva a la sección de planes; "#ancla", a esa sección; otro valor, al servicio con ese slug. */
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
    /** Comparativo antes / después por tema (opcional). */
    compare?: { beforeLabel: string; afterLabel: string; rows: { topic: string; before: string; after: string }[] };
    /** Textos de las tres ilustraciones (calendario, embudo, panel). */
    visual: {
      week: string;
      review: string;
      live: string;
      funnel: { label: string; value: string }[];
      editor: string;
      publish: string;
      saved: string;
      /** Si existe, la tercera ilustración es un tablero de indicadores en vez del editor. */
      dashboard?: { kpis: { label: string; value: string; delta: string }[]; alert: string };
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
  cases: {
    title: string;
    subtitle: string;
    cta: string;
    link: string;
    slugs: string[];
    /** Caso de estudio completo por proyecto (reto, solución, métricas, equipo). */
    details?: Record<string, ShowcaseCaseDetail>;
    labels?: { challenge: string; solution: string; team: string; duration: string; stack: string };
  };
  models: { title: string; subtitle: string; items: { name: string; fit: string; body: string; points: string[]; cta: string }[] };
  included: { title: string; items: string[] };
  /** Comparativo de tecnologías (nativa, multiplataforma, web app), estilo Netguru. */
  platforms?: {
    title: string;
    subtitle: string;
    recommended: string;
    bestForLabel: string;
    items: {
      name: string;
      tagline: string;
      bestFor: string[];
      tech: string[];
      /** Calificación de 1 a 3 por criterio (rendimiento, costo, tiempo…). */
      ratings: { label: string; value: 1 | 2 | 3 }[];
      highlight?: boolean;
    }[];
    note: string;
  };
  /**
   * Bloques de fábrica de software (Globant, Endava, EPAM, Thoughtworks,
   * BairesDev): la célula que trabaja en tu proyecto, industrias, cómo se
   * gobierna la entrega, comparación de modelos y garantías.
   */
  factory?: ShowcaseFactoryCopy;
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

export type ShowcaseFactoryCopy = {
  squad: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
    /** Encabezado del panel ("Tu célula · Sprint 6"). */
    panelTitle: string;
    panelStatus: string;
    roles: { icon: ShowcaseIcon; role: string; focus: string; share: string }[];
    panelFoot: string;
  };
  industries: { title: string; subtitle: string; items: { icon: ShowcaseIcon; name: string; examples: string }[] };
  governance: {
    eyebrow: string;
    title: string;
    subtitle: string;
    rituals: { cadence: string; name: string; body: string }[];
    metricsTitle: string;
    metrics: { value: string; label: string }[];
    toolsLabel: string;
    tools: string[];
    note: string;
  };
  /** Filas de comparación; una columna por modelo de trabajo (mismo orden). */
  compare: { title: string; criterion: string; rows: { label: string; values: string[] }[] };
  guarantees: { title: string; subtitle: string; items: { icon: ShowcaseIcon; title: string; body: string }[] };
};

export type ShowcaseCaseDetail = {
  industry: string;
  challenge: string;
  solution: string;
  metrics: { value: string; label: string }[];
  team: string;
  duration: string;
  stack: string[];
};
