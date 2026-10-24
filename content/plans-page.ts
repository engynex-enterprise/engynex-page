/**
 * Textos de la página de planes y precios (/planes).
 *
 * Solo copy: los precios, planes y características salen siempre de
 * `content/pricing.ts`, y los títulos de servicio de `content/services.ts`.
 * Las afirmaciones de la comparación "pago único o suscripción" resumen los
 * planes de desarrollo web y sus preguntas frecuentes (`content/faqs.ts`).
 */
import type { Locale } from "@/i18n/config";

export interface PlansPageCopy {
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Etiqueta accesible del grupo de accesos destacados. */
    featuredLabel: string;
  };
  chips: {
    /** Etiqueta accesible de la barra de navegación por grupos. */
    navLabel: string;
    quote: string;
  };
  /** Ancla de cada grupo de `serviceGroups` (por `key`). */
  groupAnchors: Record<string, string>;
  groupCount: (n: number) => string;
  viewService: string;
  compare: {
    eyebrow: string;
    title: string;
    subtitle: string;
    subscription: {
      title: string;
      points: string[];
    };
    once: {
      title: string;
      points: string[];
    };
    seePlans: string;
    moreQuestions: string;
    faqTitle: string;
  };
  faqSubtitle: string;
  trustTitle: string;
}

const es: PlansPageCopy = {
  metaTitle: "Planes y precios",
  metaDescription:
    "Planes y precios de referencia en pesos colombianos para todos los servicios de Engynex: página web por suscripción, soporte TI, alquiler de equipos, desarrollo, marketing y más.",
  hero: {
    eyebrow: "Planes y precios",
    title: "Encuentra el plan para tu empresa",
    subtitle:
      "Precios de referencia en pesos colombianos para cada servicio. Compara planes mensuales y de pago único y pide tu cotización sin costo.",
    featuredLabel: "Planes más consultados",
  },
  chips: {
    navLabel: "Planes por grupo de servicios",
    quote: "Cotizar",
  },
  groupAnchors: {
    build: "construir",
    grow: "crecer",
    run: "operar",
  },
  groupCount: (n) => (n === 1 ? "1 servicio" : `${n} servicios`),
  viewService: "Ver servicio",
  compare: {
    eyebrow: "Página web",
    title: "¿Pago único o suscripción?",
    subtitle:
      "Tu sitio web lo puedes tener de dos formas. Así se diferencian los planes de desarrollo web.",
    subscription: {
      title: "Suscripción mensual",
      points: [
        "Sin cuota inicial: pagas una mensualidad.",
        "Dominio, hosting, SSL y mantenimiento incluidos mientras el plan esté activo.",
        "2 cambios de contenido al mes y soporte por WhatsApp.",
        "Permanencia mínima de 12 meses.",
        "Si cancelas, el dominio queda a tu nombre y te lo transferimos.",
      ],
    },
    once: {
      title: "Pago único",
      points: [
        "Pagas el desarrollo una sola vez.",
        "El código y el diseño quedan a tu nombre desde el primer día.",
        "Gestor de contenidos para editar sin programar.",
        "Soporte y garantía incluidos durante los primeros meses.",
        "El hosting y el dominio son opcionales.",
      ],
    },
    seePlans: "Ver planes de página web",
    moreQuestions: "Más preguntas sobre desarrollo web",
    faqTitle: "Dudas frecuentes sobre los dos modelos",
  },
  faqSubtitle:
    "Formas de pago, garantía y contratos: aplican a todos los planes por igual.",
  trustTitle: "¿Por qué cotizar con Engynex?",
};

const en: PlansPageCopy = {
  metaTitle: "Plans and pricing",
  metaDescription:
    "Reference plans and pricing in Colombian pesos for every Engynex service: website subscription, IT support, equipment rental, development, marketing and more.",
  hero: {
    eyebrow: "Plans and pricing",
    title: "Find the right plan for your business",
    subtitle:
      "Reference prices in Colombian pesos for every service. Compare monthly and one-time plans and request a free quote.",
    featuredLabel: "Most viewed plans",
  },
  chips: {
    navLabel: "Plans by service group",
    quote: "Get a quote",
  },
  groupAnchors: {
    build: "construir",
    grow: "crecer",
    run: "operar",
  },
  groupCount: (n) => (n === 1 ? "1 service" : `${n} services`),
  viewService: "View service",
  compare: {
    eyebrow: "Website",
    title: "One-time payment or subscription?",
    subtitle:
      "You can get your website in two ways. Here is how the web development plans differ.",
    subscription: {
      title: "Monthly subscription",
      points: [
        "No setup fee: you pay a monthly fee.",
        "Domain, hosting, SSL and maintenance included while the plan is active.",
        "2 content updates per month and WhatsApp support.",
        "12-month minimum term.",
        "If you cancel, the domain is in your name and we transfer it to you.",
      ],
    },
    once: {
      title: "One-time payment",
      points: [
        "You pay for the development once.",
        "The code and design are yours from day one.",
        "Content manager to edit without coding.",
        "Support and warranty included for the first months.",
        "Hosting and domain are optional.",
      ],
    },
    seePlans: "See website plans",
    moreQuestions: "More questions about web development",
    faqTitle: "Common questions about both models",
  },
  faqSubtitle:
    "Payment methods, warranty and contracts: the same for every plan.",
  trustTitle: "Why get a quote from Engynex?",
};

const copy: Record<Locale, PlansPageCopy> = { es, en };

export function getPlansPageCopy(locale: Locale): PlansPageCopy {
  return copy[locale];
}

/**
 * Accesos destacados del hero: servicio y, opcionalmente, el plan concreto
 * cuyo precio "desde" se muestra (si no, el plan con precio más bajo).
 * La etiqueta sale del diccionario (`footer.webPlans`, etc.).
 */
export const featuredPlanEntries = [
  { slug: "desarrollo-web", planKey: "suscripcion", label: "webPlans" },
  { slug: "soporte-ti", label: "supportPlans" },
  { slug: "alquiler-equipos", label: "rentalPlans" },
] as const satisfies readonly {
  slug: string;
  planKey?: string;
  label: "webPlans" | "supportPlans" | "rentalPlans";
}[];
