/**
 * Agrupación de los servicios dentro del mega menú.
 * Solo estructura + títulos: el detalle de cada servicio vive en content/services.ts.
 */
export interface ServiceGroup {
  key: string;
  slugs: string[];
  es: { title: string };
  en: { title: string };
}

export const serviceGroups: ServiceGroup[] = [
  {
    key: "build",
    slugs: [
      "desarrollo-web",
      "plataformas-web",
      "apps-moviles",
      "ecommerce",
      "integraciones-apis",
    ],
    es: { title: "Construimos tu producto" },
    en: { title: "We build your product" },
  },
  {
    key: "grow",
    slugs: [
      "ux-ui-branding",
      "marketing-digital",
      "produccion-audiovisual",
      "data-analytics",
    ],
    es: { title: "Diseño y crecimiento" },
    en: { title: "Design and growth" },
  },
  {
    key: "run",
    slugs: [
      "ia-automatizacion",
      "cloud-devops",
      "ciberseguridad",
      "hosting-mantenimiento",
      "soporte-ti",
      "alquiler-equipos",
      "consultoria-tech",
    ],
    es: { title: "Tecnología y operación" },
    en: { title: "Technology and operations" },
  },
];

/**
 * Contenido del mega menú de "Nosotros".
 * `path` es relativo al idioma (se le antepone /es o /en).
 */
export interface AboutMenuItem {
  path: string;
  icon: string;
  accent: "green" | "blue";
  es: { title: string; desc: string };
  en: { title: string; desc: string };
}

export interface AboutMenuGroup {
  key: string;
  es: { title: string };
  en: { title: string };
  items: AboutMenuItem[];
}

export const aboutGroups: AboutMenuGroup[] = [
  {
    key: "empresa",
    es: { title: "La empresa" },
    en: { title: "The company" },
    items: [
      {
        path: "nosotros",
        icon: "Building2",
        accent: "green",
        es: { title: "Quiénes somos", desc: "Tu fábrica de desarrollo digital" },
        en: { title: "Who we are", desc: "Your digital development factory" },
      },
      {
        path: "nosotros#mision-vision",
        icon: "Target",
        accent: "blue",
        es: { title: "Misión y visión", desc: "Hacia dónde vamos y por qué" },
        en: { title: "Mission and vision", desc: "Where we're going and why" },
      },
      {
        path: "nosotros#valores",
        icon: "Gem",
        accent: "green",
        es: { title: "Nuestros valores", desc: "Los principios de cada proyecto" },
        en: { title: "Our values", desc: "The principles behind every project" },
      },
      {
        path: "nosotros#historia",
        icon: "History",
        accent: "blue",
        es: { title: "Nuestra historia", desc: "De 2016 a hoy, paso a paso" },
        en: { title: "Our story", desc: "From 2016 to today, step by step" },
      },
    ],
  },
  {
    key: "trabajo",
    es: { title: "Cómo trabajamos" },
    en: { title: "How we work" },
    items: [
      {
        path: "nosotros#proceso",
        icon: "Workflow",
        accent: "green",
        es: { title: "Nuestro proceso", desc: "De la idea al lanzamiento" },
        en: { title: "Our process", desc: "From idea to launch" },
      },
      {
        path: "nosotros#equipo",
        icon: "Users",
        accent: "blue",
        es: { title: "El equipo", desc: "Ingeniería, diseño y estrategia" },
        en: { title: "The team", desc: "Engineering, design and strategy" },
      },
      {
        path: "nosotros#cifras",
        icon: "BarChart3",
        accent: "green",
        es: { title: "Engynex en cifras", desc: "Proyectos, clientes y resultados" },
        en: { title: "Engynex in numbers", desc: "Projects, clients and results" },
      },
    ],
  },
  {
    key: "confianza",
    es: { title: "Confianza" },
    en: { title: "Trust" },
    items: [
      {
        path: "portafolio",
        icon: "Briefcase",
        accent: "blue",
        es: { title: "Portafolio", desc: "Casos reales y sus resultados" },
        en: { title: "Portfolio", desc: "Real cases and their results" },
      },
      {
        path: "contacto#faq",
        icon: "MessageCircleQuestion",
        accent: "green",
        es: { title: "Preguntas frecuentes", desc: "Dudas antes de empezar" },
        en: { title: "FAQ", desc: "Questions before we start" },
      },
      {
        path: "contacto",
        icon: "PhoneCall",
        accent: "blue",
        es: { title: "Contáctanos", desc: "Respuesta en menos de 24 horas" },
        en: { title: "Contact us", desc: "A reply in under 24 hours" },
      },
    ],
  },
];
