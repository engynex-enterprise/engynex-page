import type { Locale } from "@/i18n/config";

export type ProjectCategory =
  | "web"
  | "plataforma"
  | "app"
  | "ecommerce"
  | "branding"
  | "marketing"
  | "audiovisual"
  | "ia";

export interface ProjectCopy {
  title: string;
  summary: string;
  result: string;
}

export interface Project {
  slug: string;
  category: ProjectCategory;
  /** Imagen real del proyecto (en /public/images). */
  image: string;
  /** Gradiente de respaldo/overlay. */
  gradient: string;
  tags: string[];
  es: ProjectCopy;
  en: ProjectCopy;
}

export const categoryLabels: Record<
  ProjectCategory,
  { es: string; en: string }
> = {
  web: { es: "Web", en: "Web" },
  plataforma: { es: "Plataforma", en: "Platform" },
  app: { es: "App móvil", en: "Mobile app" },
  ecommerce: { es: "E-commerce", en: "E-commerce" },
  branding: { es: "Branding", en: "Branding" },
  marketing: { es: "Marketing", en: "Marketing" },
  audiovisual: { es: "Audiovisual", en: "Audiovisual" },
  ia: { es: "IA", en: "AI" },
};

export const projects: Project[] = [
  {
    slug: "nova-retail-ecommerce",
    image: "/images/portfolio-1.jpg",
    category: "ecommerce",
    gradient: "from-brand-green/30 via-navy-700 to-brand-blue/40",
    tags: ["Next.js", "Stripe", "CRO"],
    es: {
      title: "Nova Retail",
      summary:
        "Tienda online omnicanal con inventario en tiempo real y pagos locales para una cadena de retail.",
      result: "+38% en ventas online",
    },
    en: {
      title: "Nova Retail",
      summary:
        "Omnichannel online store with real-time inventory and local payments for a retail chain.",
      result: "+38% online sales",
    },
  },
  {
    slug: "meridian-saas",
    image: "/images/portfolio-2.jpg",
    category: "plataforma",
    gradient: "from-brand-blue/40 via-navy-700 to-brand-green/25",
    tags: ["SaaS", "Dashboard", "API"],
    es: {
      title: "Meridian OS",
      summary:
        "Plataforma de gestión operativa con dashboards, roles y reportes automáticos para logística.",
      result: "12 procesos automatizados",
    },
    en: {
      title: "Meridian OS",
      summary:
        "Operations management platform with dashboards, roles and automated reports for logistics.",
      result: "12 processes automated",
    },
  },
  {
    slug: "pulse-fitness-app",
    image: "/images/portfolio-3.jpg",
    category: "app",
    gradient: "from-brand-green/35 via-navy-700 to-navy-600",
    tags: ["iOS", "Android", "React Native"],
    es: {
      title: "Pulse Fitness",
      summary:
        "App móvil de entrenamiento con rutinas personalizadas, seguimiento y comunidad.",
      result: "50k+ descargas",
    },
    en: {
      title: "Pulse Fitness",
      summary:
        "Mobile training app with personalized routines, tracking and community.",
      result: "50k+ downloads",
    },
  },
  {
    slug: "aurora-branding",
    image: "/images/portfolio-4.jpg",
    category: "branding",
    gradient: "from-navy-600 via-navy-700 to-brand-green/30",
    tags: ["Branding", "Figma", "Design System"],
    es: {
      title: "Aurora Studio",
      summary:
        "Identidad de marca completa y sistema de diseño para una startup de bienestar.",
      result: "Rebrand 360°",
    },
    en: {
      title: "Aurora Studio",
      summary:
        "Complete brand identity and design system for a wellness startup.",
      result: "360° rebrand",
    },
  },
  {
    slug: "vertex-corporate-web",
    image: "/images/portfolio-5.jpg",
    category: "web",
    gradient: "from-brand-blue/35 via-navy-700 to-navy-600",
    tags: ["Web", "SEO", "CMS"],
    es: {
      title: "Vertex Legal",
      summary:
        "Sitio corporativo multilingüe optimizado para SEO para una firma internacional.",
      result: "Top 3 en Google",
    },
    en: {
      title: "Vertex Legal",
      summary:
        "Multilingual, SEO-optimized corporate site for an international firm.",
      result: "Top 3 on Google",
    },
  },
  {
    slug: "helix-ai-assistant",
    image: "/images/portfolio-6.jpg",
    category: "ia",
    gradient: "from-brand-green/30 via-navy-700 to-brand-blue/35",
    tags: ["IA", "LLM", "Automatización"],
    es: {
      title: "Helix Assistant",
      summary:
        "Asistente con IA que responde clientes y automatiza soporte para una fintech.",
      result: "-60% tiempo de respuesta",
    },
    en: {
      title: "Helix Assistant",
      summary:
        "AI assistant that answers clients and automates support for a fintech.",
      result: "-60% response time",
    },
  },
];

export function projectCopy(project: Project, locale: Locale): ProjectCopy {
  return project[locale];
}
