import type { Locale } from "@/i18n/config";

/**
 * Familia de diseño de cada servicio.
 *
 * No tiene sentido que una página de ciberseguridad se vea igual que una de
 * producción audiovisual. Cada familia define la composición del hero, el
 * tratamiento visual del proceso, el orden de las secciones y qué sección
 * exclusiva aparece.
 *
 * - `build`    Construimos software → stack tecnológico, proceso en pipeline.
 * - `creative` Diseño y contenido   → galería de trabajo, proceso en timeline.
 * - `ops`      Operación y soporte  → compromisos de servicio, proceso cíclico.
 * - `data`     Datos e IA           → casos de uso, proceso en flujo de datos.
 * - `hardware` Equipos físicos      → catálogo, proceso logístico.
 */
export type ServiceFamily = "build" | "creative" | "ops" | "data" | "hardware";

const families: Record<string, ServiceFamily> = {
  "desarrollo-web": "build",
  "plataformas-web": "build",
  "apps-moviles": "build",
  ecommerce: "build",
  "integraciones-apis": "build",

  "ux-ui-branding": "creative",
  "marketing-digital": "creative",
  "produccion-audiovisual": "creative",

  "cloud-devops": "ops",
  ciberseguridad: "ops",
  "hosting-mantenimiento": "ops",
  "soporte-ti": "ops",
  "consultoria-tech": "ops",

  "ia-automatizacion": "data",
  "data-analytics": "data",

  "alquiler-equipos": "hardware",
};

export function serviceFamily(slug: string): ServiceFamily {
  return families[slug] ?? "build";
}

/* -------------------------------------------------------------------------- */
/*  Contenido exclusivo de cada familia                                        */
/* -------------------------------------------------------------------------- */

/** `build` — tecnologías con las que se construye ese servicio. */
export const serviceStack: Record<string, string[]> = {
  "desarrollo-web": [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "WordPress",
    "Vercel",
    "Google Analytics",
    "Search Console",
  ],
  "plataformas-web": [
    "React",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS",
    "GitHub Actions",
  ],
  "apps-moviles": [
    "Swift",
    "SwiftUI",
    "Kotlin",
    "Jetpack Compose",
    "React Native",
    "Flutter",
    "Node.js",
    "Firebase",
    "Fastlane",
    "TestFlight",
    "App Store",
    "Google Play",
  ],
  ecommerce: [
    "Shopify",
    "WooCommerce",
    "Next.js",
    "Medusa",
    "Wompi",
    "PayU",
    "Mercado Pago",
    "Coordinadora",
    "Servientrega",
    "Siigo",
    "Alegra",
    "Google Merchant Center",
  ],
  "integraciones-apis": [
    "REST",
    "GraphQL",
    "Webhooks",
    "Node.js",
    "RabbitMQ",
    "Zapier",
    "Make",
    "OAuth 2.0",
  ],
};

/** `creative` — mosaico de trabajo (rutas dentro de /public). */
export const serviceGallery: Record<string, string[]> = {
  "ux-ui-branding": [
    "/images/svc-ux-ui-branding.jpg",
    "/images/portfolio-1.jpg",
    "/images/portfolio-4.jpg",
    "/images/portfolio-2.jpg",
  ],
  "marketing-digital": [
    "/images/svc-marketing-digital.jpg",
    "/images/portfolio-3.jpg",
    "/images/portfolio-5.jpg",
    "/images/portfolio-6.jpg",
  ],
  "produccion-audiovisual": [
    "/images/svc-produccion-audiovisual.jpg",
    "/images/portfolio-6.jpg",
    "/images/about-team.jpg",
    "/images/portfolio-2.jpg",
  ],
};

export interface SlaRow {
  label: string;
  value: string;
}

/** `ops` — compromisos concretos de servicio. */
export const serviceSla: Record<string, { es: SlaRow[]; en: SlaRow[] }> = {
  "cloud-devops": {
    es: [
      { label: "Disponibilidad objetivo", value: "99,9%" },
      { label: "Monitoreo", value: "24/7" },
      { label: "Respuesta a incidente crítico", value: "1 hora" },
      { label: "Revisión de costos", value: "Mensual" },
    ],
    en: [
      { label: "Target availability", value: "99.9%" },
      { label: "Monitoring", value: "24/7" },
      { label: "Critical incident response", value: "1 hour" },
      { label: "Cost review", value: "Monthly" },
    ],
  },
  ciberseguridad: {
    es: [
      { label: "Confidencialidad", value: "NDA firmado" },
      { label: "Entrega del informe", value: "5 días hábiles" },
      { label: "Retest de verificación", value: "Incluido" },
      { label: "Ventana de pruebas", value: "Acordada contigo" },
    ],
    en: [
      { label: "Confidentiality", value: "Signed NDA" },
      { label: "Report delivery", value: "5 business days" },
      { label: "Verification retest", value: "Included" },
      { label: "Testing window", value: "Agreed with you" },
    ],
  },
  "hosting-mantenimiento": {
    es: [
      { label: "Disponibilidad", value: "99,9%" },
      { label: "Copias de seguridad", value: "Diarias" },
      { label: "Tiempo de restauración", value: "Menos de 2 horas" },
      { label: "Soporte", value: "24 h por WhatsApp" },
    ],
    en: [
      { label: "Availability", value: "99.9%" },
      { label: "Backups", value: "Daily" },
      { label: "Restore time", value: "Under 2 hours" },
      { label: "Support", value: "24 h via WhatsApp" },
    ],
  },
  "soporte-ti": {
    es: [
      { label: "Primera respuesta", value: "4 a 8 horas" },
      { label: "Cobertura", value: "Lun–Vie 7:00–17:00" },
      { label: "Mantenimiento preventivo", value: "Trimestral" },
      { label: "Reporte de servicio", value: "Mensual" },
    ],
    en: [
      { label: "First response", value: "4 to 8 hours" },
      { label: "Coverage", value: "Mon–Fri 7:00–17:00" },
      { label: "Preventive maintenance", value: "Quarterly" },
      { label: "Service report", value: "Monthly" },
    ],
  },
  "consultoria-tech": {
    es: [
      { label: "Diagnóstico", value: "1 a 2 semanas" },
      { label: "Horizonte de la hoja de ruta", value: "12 meses" },
      { label: "Comité de seguimiento", value: "Quincenal" },
      { label: "Confidencialidad", value: "NDA firmado" },
    ],
    en: [
      { label: "Assessment", value: "1 to 2 weeks" },
      { label: "Roadmap horizon", value: "12 months" },
      { label: "Steering committee", value: "Bi-weekly" },
      { label: "Confidentiality", value: "Signed NDA" },
    ],
  },
};

export interface UseCase {
  title: string;
  description: string;
  /** Cifra o resultado esperado. */
  result: string;
}

/** `data` — casos de uso concretos y medibles. */
export const serviceUseCases: Record<
  string,
  { es: UseCase[]; en: UseCase[] }
> = {
  "ia-automatizacion": {
    es: [
      {
        title: "Atención 24/7 en WhatsApp",
        description:
          "El asistente responde precios, horarios y disponibilidad, y pasa a un asesor cuando el caso lo amerita.",
        result: "Hasta 70% de consultas resueltas sin agente",
      },
      {
        title: "Cotizaciones automáticas",
        description:
          "El cliente describe lo que necesita y recibe una cotización preliminar en minutos, no al día siguiente.",
        result: "Respuesta en minutos, no en horas",
      },
      {
        title: "Clasificación de correos y tickets",
        description:
          "Cada solicitud entra clasificada, priorizada y asignada al área correcta sin que nadie la lea primero.",
        result: "Cero casos sin asignar",
      },
      {
        title: "Resúmenes de documentos y reuniones",
        description:
          "Contratos, actas y reuniones convertidos en resúmenes con los puntos y compromisos clave.",
        result: "Horas de lectura ahorradas por semana",
      },
    ],
    en: [
      {
        title: "24/7 support on WhatsApp",
        description:
          "The assistant answers prices, hours and availability, and hands over to a rep when the case calls for it.",
        result: "Up to 70% of queries solved without an agent",
      },
      {
        title: "Automated quotes",
        description:
          "The customer describes what they need and gets a preliminary quote in minutes, not the next day.",
        result: "Answers in minutes, not hours",
      },
      {
        title: "Email and ticket triage",
        description:
          "Every request arrives classified, prioritized and routed to the right team before anyone reads it.",
        result: "Zero unassigned cases",
      },
      {
        title: "Document and meeting summaries",
        description:
          "Contracts, minutes and meetings turned into summaries with the key points and commitments.",
        result: "Hours of reading saved every week",
      },
    ],
  },
  "data-analytics": {
    es: [
      {
        title: "Tablero comercial",
        description:
          "Ventas por asesor, canal y producto, con metas y avance del mes actualizados solos.",
        result: "Una sola cifra de ventas para todos",
      },
      {
        title: "Rentabilidad por producto",
        description:
          "Margen real por línea y por cliente, incluyendo costos indirectos que hoy no se ven.",
        result: "Detecta líneas que venden y no dejan",
      },
      {
        title: "Inventario y rotación",
        description:
          "Qué rota, qué está quieto y cuánto capital hay dormido en cada bodega.",
        result: "Menos capital inmovilizado",
      },
      {
        title: "Indicadores de operación",
        description:
          "Tiempos, cumplimiento y cuellos de botella de tu operación en tiempo real.",
        result: "Decisiones el mismo día, no al cierre",
      },
    ],
    en: [
      {
        title: "Sales dashboard",
        description:
          "Sales by rep, channel and product, with targets and month-to-date progress refreshing on their own.",
        result: "One sales number everyone agrees on",
      },
      {
        title: "Profitability by product",
        description:
          "Real margin per line and per client, including indirect costs nobody sees today.",
        result: "Spot lines that sell but don't pay",
      },
      {
        title: "Inventory and turnover",
        description:
          "What moves, what's stuck and how much capital is sleeping in each warehouse.",
        result: "Less capital tied up in stock",
      },
      {
        title: "Operations indicators",
        description:
          "Cycle times, compliance and bottlenecks across your operation in real time.",
        result: "Decisions same day, not at month close",
      },
    ],
  },
};

export interface CatalogGroup {
  title: string;
  items: string[];
}

/** `hardware` — catálogo de lo que se puede alquilar. */
export const serviceCatalog: Record<
  string,
  { es: CatalogGroup[]; en: CatalogGroup[] }
> = {
  "alquiler-equipos": {
    es: [
      {
        title: "Puestos de trabajo",
        items: [
          "Portátiles Core i5 / Ryzen 5, 16 GB RAM",
          "Torres de escritorio empresariales",
          'Monitores de 24" y 27"',
          "Teclado, mouse y diadema",
        ],
      },
      {
        title: "Alto rendimiento",
        items: [
          "Core i7 / i9 y Ryzen 7 / 9",
          "Estaciones con tarjeta gráfica dedicada",
          "MacBook Pro para diseño y video",
          "32 a 64 GB de RAM y SSD NVMe",
        ],
      },
      {
        title: "Servidores e infraestructura",
        items: [
          "Servidores rack y torre",
          "NAS y almacenamiento en red",
          "Gabinetes, UPS y PDU",
          "Switches, firewall y access points",
        ],
      },
      {
        title: "Periféricos y sala",
        items: [
          "Impresoras y multifuncionales",
          "Escáneres de alto volumen",
          "Videobeams y pantallas",
          "Cámaras y audio para videoconferencia",
        ],
      },
    ],
    en: [
      {
        title: "Workstations",
        items: [
          "Core i5 / Ryzen 5 laptops, 16 GB RAM",
          "Business desktop towers",
          '24" and 27" monitors',
          "Keyboard, mouse and headset",
        ],
      },
      {
        title: "High performance",
        items: [
          "Core i7 / i9 and Ryzen 7 / 9",
          "Workstations with dedicated GPU",
          "MacBook Pro for design and video",
          "32 to 64 GB RAM and NVMe SSD",
        ],
      },
      {
        title: "Servers and infrastructure",
        items: [
          "Rack and tower servers",
          "NAS and network storage",
          "Cabinets, UPS and PDU",
          "Switches, firewall and access points",
        ],
      },
      {
        title: "Peripherals and meeting rooms",
        items: [
          "Printers and multifunction devices",
          "High-volume scanners",
          "Projectors and displays",
          "Video conferencing cameras and audio",
        ],
      },
    ],
  },
};

/**
 * Helpers tipados por idioma.
 *
 * Nombres con prefijo `get`: cualquier función que empiece por `use` la trata
 * la regla `react-hooks/rules-of-hooks` como un hook y no se puede llamar
 * dentro de un componente de servidor asíncrono.
 */
export function getSla(slug: string, locale: Locale): SlaRow[] {
  return serviceSla[slug]?.[locale] ?? [];
}
export function getUseCases(slug: string, locale: Locale): UseCase[] {
  return serviceUseCases[slug]?.[locale] ?? [];
}
export function getCatalog(slug: string, locale: Locale): CatalogGroup[] {
  return serviceCatalog[slug]?.[locale] ?? [];
}
