/**
 * Planes y precios por servicio.
 *
 * Los valores están en pesos colombianos (COP) y se muestran como precios de
 * referencia ("desde"), sin IVA. Se ajustaron a los rangos de mercado en
 * Colombia para 2026; son fáciles de editar aquí sin tocar componentes.
 */

export interface PlanCopy {
  name: string;
  description: string;
  features: string[];
  /** Línea corta bajo el precio (ej. "sin cuota inicial"). */
  note?: string;
}

export interface Plan {
  key: string;
  /** Precio en COP. `null` = cotización a la medida. */
  price: number | null;
  billing: "monthly" | "once";
  /** Plan resaltado visualmente en la tabla. */
  highlight?: boolean;
  badge?: "popular" | "new" | "top";
  es: PlanCopy;
  en: PlanCopy;
}

export const servicePlans: Record<string, Plan[]> = {
  "desarrollo-web": [
    {
      key: "suscripcion",
      price: 189000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Web por Suscripción",
        description:
          "Tu página web completa sin inversión inicial: nosotros ponemos el dominio, el hosting, el SSL y el mantenimiento mientras tu suscripción esté activa.",
        features: [
          "Diseño a la medida de hasta 6 secciones",
          "Dominio .com o .co incluido",
          "Hosting SSD y certificado SSL administrados",
          "Mantenimiento, backups y actualizaciones de seguridad",
          "2 cambios de contenido al mes y soporte por WhatsApp",
        ],
        note: "Sin cuota inicial · permanencia mínima de 12 meses",
      },
      en: {
        name: "Website Subscription",
        description:
          "Your full website with no upfront investment: we provide the domain, hosting, SSL and maintenance for as long as your subscription is active.",
        features: [
          "Custom design with up to 6 sections",
          ".com or .co domain included",
          "Managed SSD hosting and SSL certificate",
          "Maintenance, backups and security updates",
          "2 content updates per month and WhatsApp support",
        ],
        note: "No setup fee · 12-month minimum term",
      },
    },
    {
      key: "corporativa",
      price: 3900000,
      billing: "once",
      es: {
        name: "Web Corporativa",
        description:
          "Sitio propio, pago único. El código y el diseño quedan a tu nombre desde el primer día.",
        features: [
          "Hasta 10 secciones con diseño exclusivo",
          "Gestor de contenidos para editar sin programar",
          "SEO técnico y analítica configurada",
          "Formularios, WhatsApp y redes integrados",
          "3 meses de soporte y garantía incluidos",
        ],
        note: "Hosting y dominio desde $89.000/mes (opcional)",
      },
      en: {
        name: "Corporate Website",
        description:
          "Your own site, one-time payment. The code and design are yours from day one.",
        features: [
          "Up to 10 sections with exclusive design",
          "Content manager to edit without coding",
          "Technical SEO and analytics setup",
          "Forms, WhatsApp and social media integrated",
          "3 months of support and warranty included",
        ],
        note: "Hosting and domain from $89,000 COP/month (optional)",
      },
    },
    {
      key: "premium",
      price: 8900000,
      billing: "once",
      es: {
        name: "Web Premium",
        description:
          "Para marcas que necesitan multiidioma, integraciones y una experiencia de alto nivel.",
        features: [
          "Secciones ilimitadas y multiidioma",
          "Animaciones y componentes a la medida",
          "Integración con CRM, ERP o pasarelas de pago",
          "Optimización avanzada de velocidad y Core Web Vitals",
          "6 meses de soporte prioritario",
        ],
      },
      en: {
        name: "Premium Website",
        description:
          "For brands that need multiple languages, integrations and a high-end experience.",
        features: [
          "Unlimited sections and multi-language",
          "Custom animations and components",
          "CRM, ERP or payment gateway integration",
          "Advanced speed and Core Web Vitals optimization",
          "6 months of priority support",
        ],
      },
    },
  ],

  "plataformas-web": [
    {
      key: "mvp",
      price: 12900000,
      billing: "once",
      es: {
        name: "MVP",
        description:
          "La primera versión funcional de tu plataforma, lista para validar con usuarios reales.",
        features: [
          "Análisis funcional y prototipo navegable",
          "Hasta 8 módulos o pantallas clave",
          "Autenticación y roles básicos",
          "Despliegue en la nube y capacitación",
          "2 meses de soporte incluidos",
        ],
      },
      en: {
        name: "MVP",
        description:
          "The first working version of your platform, ready to validate with real users.",
        features: [
          "Functional analysis and clickable prototype",
          "Up to 8 key modules or screens",
          "Authentication and basic roles",
          "Cloud deployment and training",
          "2 months of support included",
        ],
      },
    },
    {
      key: "plataforma",
      price: 29900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Plataforma Completa",
        description:
          "Software de gestión a la medida para operar tu negocio de punta a punta.",
        features: [
          "Módulos ilimitados según tu operación",
          "Panel administrativo y reportes en tiempo real",
          "Integraciones con ERP, CRM y pasarelas de pago",
          "Pruebas automatizadas y ambiente de staging",
          "6 meses de soporte y evolutivos",
        ],
      },
      en: {
        name: "Full Platform",
        description:
          "Custom management software to run your business end to end.",
        features: [
          "Unlimited modules based on your operation",
          "Admin panel and real-time reporting",
          "ERP, CRM and payment gateway integrations",
          "Automated testing and staging environment",
          "6 months of support and enhancements",
        ],
      },
    },
    {
      key: "enterprise",
      price: null,
      billing: "once",
      es: {
        name: "Enterprise",
        description:
          "Arquitecturas de alta disponibilidad, multiempresa y con equipos dedicados.",
        features: [
          "Arquitectura multiempresa y alta disponibilidad",
          "Equipo dedicado con sprints quincenales",
          "Auditoría de seguridad y cumplimiento",
          "SLA de soporte y monitoreo 24/7",
          "Roadmap de producto acompañado",
        ],
      },
      en: {
        name: "Enterprise",
        description:
          "High-availability, multi-tenant architectures with dedicated teams.",
        features: [
          "Multi-tenant, high-availability architecture",
          "Dedicated team with two-week sprints",
          "Security and compliance audit",
          "Support SLA and 24/7 monitoring",
          "Guided product roadmap",
        ],
      },
    },
  ],

  "apps-moviles": [
    {
      key: "mvp",
      price: 16900000,
      billing: "once",
      es: {
        name: "App MVP",
        description:
          "Una app híbrida para iOS y Android con las funciones esenciales de tu idea.",
        features: [
          "Hasta 10 pantallas con diseño a la medida",
          "Registro, login y notificaciones push",
          "Publicación en App Store y Google Play",
          "Panel básico de administración",
          "2 meses de soporte incluidos",
        ],
      },
      en: {
        name: "MVP App",
        description:
          "A hybrid iOS and Android app with the essential features of your idea.",
        features: [
          "Up to 10 screens with custom design",
          "Sign-up, login and push notifications",
          "Publishing on the App Store and Google Play",
          "Basic admin panel",
          "2 months of support included",
        ],
      },
    },
    {
      key: "negocio",
      price: 29900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "App de Negocio",
        description:
          "App completa con backend propio, pagos e integraciones con tus sistemas.",
        features: [
          "Pantallas ilimitadas y modo offline",
          "Backend, API y panel administrativo",
          "Pasarela de pagos y facturación",
          "Analítica de uso y notificaciones segmentadas",
          "6 meses de soporte y actualizaciones de tienda",
        ],
      },
      en: {
        name: "Business App",
        description:
          "A complete app with its own backend, payments and integrations with your systems.",
        features: [
          "Unlimited screens and offline mode",
          "Backend, API and admin panel",
          "Payment gateway and invoicing",
          "Usage analytics and segmented notifications",
          "6 months of support and store updates",
        ],
      },
    },
    {
      key: "nativa",
      price: null,
      billing: "once",
      es: {
        name: "App Nativa / Marketplace",
        description:
          "Desarrollo nativo, geolocalización en tiempo real o marketplaces con varios perfiles.",
        features: [
          "Desarrollo nativo iOS y Android",
          "Geolocalización y tiempo real",
          "Múltiples perfiles de usuario",
          "Escalamiento y pruebas de carga",
          "Soporte con SLA y evolutivos mensuales",
        ],
      },
      en: {
        name: "Native App / Marketplace",
        description:
          "Native development, real-time geolocation or marketplaces with multiple profiles.",
        features: [
          "Native iOS and Android development",
          "Geolocation and real-time features",
          "Multiple user profiles",
          "Scaling and load testing",
          "Support with SLA and monthly enhancements",
        ],
      },
    },
  ],

  ecommerce: [
    {
      key: "start",
      price: 4900000,
      billing: "once",
      es: {
        name: "Tienda Start",
        description:
          "Tu tienda en línea lista para vender, con catálogo y pagos configurados.",
        features: [
          "Hasta 100 productos cargados",
          "Pasarela de pagos local (Wompi, PayU o Mercado Pago)",
          "Cálculo de envíos y cupones",
          "Diseño responsive con tu marca",
          "Capacitación y 2 meses de soporte",
        ],
      },
      en: {
        name: "Starter Store",
        description:
          "Your online store ready to sell, with catalog and payments configured.",
        features: [
          "Up to 100 products uploaded",
          "Local payment gateway (Wompi, PayU or Mercado Pago)",
          "Shipping rates and coupons",
          "Responsive design with your brand",
          "Training and 2 months of support",
        ],
      },
    },
    {
      key: "pro",
      price: 9900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Tienda Pro",
        description:
          "Para operaciones que ya venden y necesitan automatizar inventario y logística.",
        features: [
          "Productos ilimitados con variantes",
          "Sincronización con inventario o ERP",
          "Integración con transportadoras",
          "Optimización de conversión (CRO) y analítica",
          "6 meses de soporte y ajustes",
        ],
      },
      en: {
        name: "Pro Store",
        description:
          "For operations already selling that need to automate inventory and logistics.",
        features: [
          "Unlimited products with variants",
          "Inventory or ERP synchronization",
          "Shipping carrier integration",
          "Conversion optimization (CRO) and analytics",
          "6 months of support and adjustments",
        ],
      },
    },
    {
      key: "marketplace",
      price: null,
      billing: "once",
      es: {
        name: "Marketplace",
        description:
          "Plataforma con varios vendedores, comisiones y pagos divididos.",
        features: [
          "Panel para múltiples vendedores",
          "Comisiones y pagos divididos",
          "Suscripciones y planes de vendedor",
          "App móvil opcional",
          "Soporte con SLA",
        ],
      },
      en: {
        name: "Marketplace",
        description:
          "A platform with multiple sellers, commissions and split payments.",
        features: [
          "Multi-seller dashboard",
          "Commissions and split payments",
          "Seller subscriptions and plans",
          "Optional mobile app",
          "Support with SLA",
        ],
      },
    },
  ],

  "ux-ui-branding": [
    {
      key: "identidad",
      price: 2900000,
      billing: "once",
      es: {
        name: "Identidad Esencial",
        description:
          "La base visual de tu marca, lista para aplicar en digital e impresos.",
        features: [
          "Logotipo con 3 propuestas y ajustes",
          "Paleta de color y tipografías",
          "Manual de marca básico",
          "Plantillas para redes sociales",
          "Archivos editables y para web",
        ],
      },
      en: {
        name: "Essential Identity",
        description:
          "Your brand's visual foundation, ready for digital and print.",
        features: [
          "Logo with 3 concepts and revisions",
          "Color palette and typography",
          "Basic brand guidelines",
          "Social media templates",
          "Editable and web-ready files",
        ],
      },
    },
    {
      key: "producto",
      price: 6900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Marca + Producto Digital",
        description:
          "Identidad y diseño de la experiencia completa de tu web o aplicación.",
        features: [
          "Investigación de usuarios y benchmarking",
          "Arquitectura de información y wireframes",
          "Prototipo interactivo en Figma",
          "Manual de marca completo",
          "Entrega lista para desarrollo",
        ],
      },
      en: {
        name: "Brand + Digital Product",
        description:
          "Identity plus the full experience design for your website or app.",
        features: [
          "User research and benchmarking",
          "Information architecture and wireframes",
          "Interactive Figma prototype",
          "Complete brand guidelines",
          "Developer-ready handoff",
        ],
      },
    },
    {
      key: "design-system",
      price: null,
      billing: "once",
      es: {
        name: "Design System",
        description:
          "Sistema de diseño escalable para equipos que construyen varios productos.",
        features: [
          "Librería de componentes documentada",
          "Tokens de diseño y temas",
          "Guías de accesibilidad (WCAG)",
          "Sincronización con el código",
          "Acompañamiento al equipo interno",
        ],
      },
      en: {
        name: "Design System",
        description:
          "A scalable design system for teams building several products.",
        features: [
          "Documented component library",
          "Design tokens and themes",
          "Accessibility guidelines (WCAG)",
          "Sync with the codebase",
          "Coaching for your internal team",
        ],
      },
    },
  ],

  "marketing-digital": [
    {
      key: "impulso",
      price: 1290000,
      billing: "monthly",
      es: {
        name: "Impulso",
        description:
          "Presencia constante en redes y campañas para empezar a generar contactos.",
        features: [
          "12 piezas de contenido al mes",
          "Gestión de 2 redes sociales",
          "1 campaña activa (Google o Meta Ads)",
          "Informe mensual de resultados",
          "Optimización SEO básica",
        ],
        note: "No incluye la inversión en pauta",
      },
      en: {
        name: "Boost",
        description:
          "Consistent social presence and campaigns to start generating leads.",
        features: [
          "12 content pieces per month",
          "Management of 2 social networks",
          "1 active campaign (Google or Meta Ads)",
          "Monthly results report",
          "Basic SEO optimization",
        ],
        note: "Ad spend not included",
      },
    },
    {
      key: "crecimiento",
      price: 2490000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Crecimiento",
        description:
          "Estrategia integral con contenido, pauta y SEO trabajando juntos.",
        features: [
          "20 piezas de contenido y video corto",
          "Gestión de 4 redes sociales",
          "Campañas en Google y Meta Ads",
          "SEO on-page y de contenidos",
          "Reunión mensual de estrategia",
        ],
        note: "No incluye la inversión en pauta",
      },
      en: {
        name: "Growth",
        description:
          "An integrated strategy with content, ads and SEO working together.",
        features: [
          "20 content pieces including short video",
          "Management of 4 social networks",
          "Google and Meta Ads campaigns",
          "On-page and content SEO",
          "Monthly strategy meeting",
        ],
        note: "Ad spend not included",
      },
    },
    {
      key: "360",
      price: 4900000,
      billing: "monthly",
      es: {
        name: "Marketing 360°",
        description:
          "Un equipo de marketing completo dedicado a tu marca todos los meses.",
        features: [
          "Contenido ilimitado según plan editorial",
          "Producción audiovisual mensual",
          "Email marketing y automatizaciones",
          "Landing pages y pruebas A/B",
          "Tablero de resultados en tiempo real",
        ],
        note: "No incluye la inversión en pauta",
      },
      en: {
        name: "360° Marketing",
        description:
          "A full marketing team dedicated to your brand every month.",
        features: [
          "Unlimited content per editorial plan",
          "Monthly audiovisual production",
          "Email marketing and automations",
          "Landing pages and A/B testing",
          "Real-time results dashboard",
        ],
        note: "Ad spend not included",
      },
    },
  ],

  "produccion-audiovisual": [
    {
      key: "esencial",
      price: 1900000,
      billing: "once",
      es: {
        name: "Video Esencial",
        description:
          "Una jornada de grabación para contar lo que hace tu empresa.",
        features: [
          "Media jornada de grabación",
          "1 video institucional de hasta 90 segundos",
          "3 versiones verticales para redes",
          "Musicalización y subtítulos",
          "2 rondas de ajustes",
        ],
      },
      en: {
        name: "Essential Video",
        description: "One shooting session to tell what your company does.",
        features: [
          "Half-day shoot",
          "1 corporate video up to 90 seconds",
          "3 vertical versions for social",
          "Music and subtitles",
          "2 rounds of revisions",
        ],
      },
    },
    {
      key: "campana",
      price: 4900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Campaña Audiovisual",
        description:
          "Paquete completo de piezas para lanzar un producto o campaña.",
        features: [
          "Jornada completa de grabación",
          "Video principal + 6 piezas para redes",
          "Fotografía de producto o equipo",
          "Motion graphics y locución",
          "Guion y dirección creativa",
        ],
      },
      en: {
        name: "Audiovisual Campaign",
        description:
          "A complete set of pieces to launch a product or campaign.",
        features: [
          "Full-day shoot",
          "Main video + 6 social cuts",
          "Product or team photography",
          "Motion graphics and voice-over",
          "Script and creative direction",
        ],
      },
    },
    {
      key: "premium",
      price: null,
      billing: "once",
      es: {
        name: "Producción Premium",
        description:
          "Comerciales, animación 3D y producciones en varias ciudades.",
        features: [
          "Producción en varias locaciones",
          "Animación 2D/3D avanzada",
          "Casting y dirección de actores",
          "Dron y equipos especializados",
          "Plan de medios opcional",
        ],
      },
      en: {
        name: "Premium Production",
        description:
          "Commercials, 3D animation and shoots across several cities.",
        features: [
          "Multi-location production",
          "Advanced 2D/3D animation",
          "Casting and talent direction",
          "Drone and specialized gear",
          "Optional media plan",
        ],
      },
    },
  ],

  "ia-automatizacion": [
    {
      key: "piloto",
      price: 3900000,
      billing: "once",
      es: {
        name: "Piloto de IA",
        description:
          "Un caso de uso concreto implementado y medido en pocas semanas.",
        features: [
          "Diagnóstico de oportunidades",
          "1 chatbot o automatización en producción",
          "Entrenamiento con tu información",
          "Integración con WhatsApp o tu web",
          "Métricas de ahorro y adopción",
        ],
      },
      en: {
        name: "AI Pilot",
        description:
          "One concrete use case implemented and measured within weeks.",
        features: [
          "Opportunity assessment",
          "1 chatbot or automation in production",
          "Training with your own information",
          "WhatsApp or website integration",
          "Savings and adoption metrics",
        ],
      },
    },
    {
      key: "asistente",
      price: 8900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Asistente Inteligente",
        description:
          "Un asistente conectado a tus datos y procesos, disponible 24/7.",
        features: [
          "Asistente entrenado con tus documentos",
          "Conexión con CRM, ERP o base de datos",
          "Escalamiento a un agente humano",
          "Panel de conversaciones y reportes",
          "3 meses de ajuste fino incluidos",
        ],
      },
      en: {
        name: "Smart Assistant",
        description:
          "An assistant connected to your data and processes, available 24/7.",
        features: [
          "Assistant trained on your documents",
          "Connection to CRM, ERP or database",
          "Escalation to a human agent",
          "Conversation dashboard and reports",
          "3 months of fine-tuning included",
        ],
      },
    },
    {
      key: "automatizacion",
      price: null,
      billing: "once",
      es: {
        name: "Automatización a la Medida",
        description:
          "Flujos completos automatizados de punta a punta en tu operación.",
        features: [
          "Mapeo y rediseño de procesos",
          "Automatizaciones multi-sistema (RPA)",
          "Modelos de IA propios o LLMs privados",
          "Gobierno de datos y control de acceso",
          "Monitoreo y mejora continua",
        ],
      },
      en: {
        name: "Custom Automation",
        description:
          "Complete end-to-end automated workflows across your operation.",
        features: [
          "Process mapping and redesign",
          "Multi-system automations (RPA)",
          "Custom AI models or private LLMs",
          "Data governance and access control",
          "Monitoring and continuous improvement",
        ],
      },
    },
  ],

  "cloud-devops": [
    {
      key: "setup",
      price: 4900000,
      billing: "once",
      es: {
        name: "Puesta en Marcha",
        description:
          "Dejamos tu infraestructura montada, automatizada y documentada.",
        features: [
          "Diseño de arquitectura en AWS, GCP o Azure",
          "Pipeline de CI/CD configurado",
          "Contenedores y despliegue automatizado",
          "Monitoreo y alertas básicas",
          "Documentación y traspaso al equipo",
        ],
      },
      en: {
        name: "Initial Setup",
        description:
          "We leave your infrastructure built, automated and documented.",
        features: [
          "Architecture design on AWS, GCP or Azure",
          "CI/CD pipeline configured",
          "Containers and automated deployment",
          "Basic monitoring and alerts",
          "Documentation and team handover",
        ],
      },
    },
    {
      key: "gestion",
      price: 1490000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Operación Gestionada",
        description:
          "Nosotros operamos y vigilamos tu nube todos los meses.",
        features: [
          "Monitoreo proactivo y alertas 24/7",
          "Despliegues y mantenimiento continuo",
          "Optimización mensual de costos",
          "Copias de seguridad y plan de recuperación",
          "Informe mensual de disponibilidad",
        ],
        note: "No incluye el consumo del proveedor cloud",
      },
      en: {
        name: "Managed Operations",
        description: "We run and watch over your cloud every month.",
        features: [
          "Proactive monitoring and 24/7 alerts",
          "Deployments and ongoing maintenance",
          "Monthly cost optimization",
          "Backups and recovery plan",
          "Monthly uptime report",
        ],
        note: "Cloud provider usage not included",
      },
    },
    {
      key: "enterprise",
      price: null,
      billing: "monthly",
      es: {
        name: "Enterprise / Migración",
        description:
          "Migraciones completas y arquitecturas críticas con SLA formal.",
        features: [
          "Plan y ejecución de migración",
          "Alta disponibilidad y multi-región",
          "Infraestructura como código (IaC)",
          "Seguridad y cumplimiento auditables",
          "SLA de respuesta garantizado",
        ],
      },
      en: {
        name: "Enterprise / Migration",
        description:
          "Full migrations and mission-critical architectures with a formal SLA.",
        features: [
          "Migration plan and execution",
          "High availability and multi-region",
          "Infrastructure as code (IaC)",
          "Auditable security and compliance",
          "Guaranteed response SLA",
        ],
      },
    },
  ],

  ciberseguridad: [
    {
      key: "auditoria",
      price: 2900000,
      billing: "once",
      es: {
        name: "Auditoría Esencial",
        description:
          "Radiografía de seguridad de tu web o aplicación con plan de acción.",
        features: [
          "Análisis automatizado de vulnerabilidades",
          "Revisión de configuración y accesos",
          "Informe ejecutivo y técnico",
          "Plan de remediación priorizado",
          "Reunión de presentación de hallazgos",
        ],
      },
      en: {
        name: "Essential Audit",
        description:
          "A security X-ray of your site or app with an action plan.",
        features: [
          "Automated vulnerability scanning",
          "Configuration and access review",
          "Executive and technical report",
          "Prioritized remediation plan",
          "Findings presentation meeting",
        ],
      },
    },
    {
      key: "pentesting",
      price: 6900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Pentesting",
        description:
          "Pruebas de intrusión controladas sobre tus sistemas en producción.",
        features: [
          "Pruebas manuales tipo caja gris",
          "Explotación controlada y evidencias",
          "Revisión de API y autenticación",
          "Acompañamiento en la remediación",
          "Retest incluido tras las correcciones",
        ],
      },
      en: {
        name: "Penetration Testing",
        description:
          "Controlled intrusion testing against your production systems.",
        features: [
          "Manual grey-box testing",
          "Controlled exploitation with evidence",
          "API and authentication review",
          "Guidance during remediation",
          "Retest included after fixes",
        ],
      },
    },
    {
      key: "programa",
      price: null,
      billing: "monthly",
      es: {
        name: "Programa Continuo",
        description:
          "Seguridad gestionada durante todo el año, no una foto puntual.",
        features: [
          "Escaneos periódicos programados",
          "Hardening continuo de infraestructura",
          "Respuesta ante incidentes",
          "Capacitación al equipo interno",
          "Acompañamiento en cumplimiento normativo",
        ],
      },
      en: {
        name: "Ongoing Program",
        description:
          "Security managed all year long, not a one-off snapshot.",
        features: [
          "Scheduled recurring scans",
          "Continuous infrastructure hardening",
          "Incident response",
          "Internal team training",
          "Guidance on regulatory compliance",
        ],
      },
    },
  ],

  "hosting-mantenimiento": [
    {
      key: "basico",
      price: 89000,
      billing: "monthly",
      es: {
        name: "Básico",
        description:
          "Para sitios informativos que solo necesitan estar rápidos y seguros.",
        features: [
          "Hosting SSD administrado y SSL",
          "Backups semanales con restauración",
          "Actualizaciones de seguridad",
          "Monitoreo de disponibilidad",
          "Soporte por correo (48 h)",
        ],
      },
      en: {
        name: "Basic",
        description:
          "For informational sites that just need to stay fast and secure.",
        features: [
          "Managed SSD hosting and SSL",
          "Weekly backups with restore",
          "Security updates",
          "Uptime monitoring",
          "Email support (48 h)",
        ],
      },
    },
    {
      key: "pro",
      price: 189000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Pro",
        description:
          "Para sitios de empresa que cambian con frecuencia y reciben tráfico real.",
        features: [
          "Todo lo del plan Básico",
          "Backups diarios y CDN incluida",
          "2 cambios de contenido al mes",
          "Reporte mensual de velocidad y uptime",
          "Soporte por WhatsApp (24 h)",
        ],
      },
      en: {
        name: "Pro",
        description:
          "For company sites that change often and get real traffic.",
        features: [
          "Everything in Basic",
          "Daily backups and CDN included",
          "2 content updates per month",
          "Monthly speed and uptime report",
          "WhatsApp support (24 h)",
        ],
      },
    },
    {
      key: "business",
      price: 390000,
      billing: "monthly",
      es: {
        name: "Business",
        description:
          "Para tiendas y plataformas donde cada minuto fuera de línea cuesta.",
        features: [
          "Todo lo del plan Pro",
          "Servidor dedicado o alto tráfico",
          "Backups cada 6 horas",
          "5 horas de desarrollo al mes",
          "Soporte prioritario con SLA de 4 h",
        ],
      },
      en: {
        name: "Business",
        description:
          "For stores and platforms where every minute offline costs money.",
        features: [
          "Everything in Pro",
          "Dedicated or high-traffic server",
          "Backups every 6 hours",
          "5 development hours per month",
          "Priority support with a 4 h SLA",
        ],
      },
    },
  ],

  "consultoria-tech": [
    {
      key: "diagnostico",
      price: 1900000,
      billing: "once",
      es: {
        name: "Diagnóstico Digital",
        description:
          "Entendemos tu operación y te decimos con claridad por dónde empezar.",
        features: [
          "Entrevistas con áreas clave",
          "Mapa de procesos y sistemas actuales",
          "Diagnóstico de madurez digital",
          "Recomendaciones priorizadas",
          "Presentación a la dirección",
        ],
      },
      en: {
        name: "Digital Assessment",
        description:
          "We understand your operation and tell you clearly where to start.",
        features: [
          "Interviews with key areas",
          "Map of current processes and systems",
          "Digital maturity assessment",
          "Prioritized recommendations",
          "Presentation to leadership",
        ],
      },
    },
    {
      key: "hoja-ruta",
      price: 4900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Hoja de Ruta",
        description:
          "El plan tecnológico de los próximos 12 meses, con costos y tiempos.",
        features: [
          "Arquitectura objetivo y stack recomendado",
          "Roadmap por trimestres",
          "Estimación de inversión y retorno",
          "Definición de indicadores (KPI)",
          "2 sesiones de seguimiento",
        ],
      },
      en: {
        name: "Roadmap",
        description:
          "Your technology plan for the next 12 months, with costs and timelines.",
        features: [
          "Target architecture and recommended stack",
          "Quarterly roadmap",
          "Investment and return estimates",
          "KPI definition",
          "2 follow-up sessions",
        ],
      },
    },
    {
      key: "cto",
      price: 3900000,
      billing: "monthly",
      es: {
        name: "CTO as a Service",
        description:
          "Un líder técnico senior acompañando a tu equipo cada mes.",
        features: [
          "Acompañamiento estratégico continuo",
          "Comités técnicos quincenales",
          "Selección de proveedores y talento",
          "Revisión de arquitectura y calidad",
          "Reporte mensual a la gerencia",
        ],
      },
      en: {
        name: "CTO as a Service",
        description: "A senior tech leader supporting your team every month.",
        features: [
          "Ongoing strategic guidance",
          "Bi-weekly technical committees",
          "Vendor and talent selection",
          "Architecture and quality reviews",
          "Monthly report to management",
        ],
      },
    },
  ],

  "data-analytics": [
    {
      key: "dashboard",
      price: 3900000,
      billing: "once",
      es: {
        name: "Dashboard Esencial",
        description:
          "Tus indicadores clave en un tablero claro y actualizado solo.",
        features: [
          "Conexión de hasta 3 fuentes de datos",
          "1 tablero con tus KPI principales",
          "Actualización automática programada",
          "Capacitación en el uso",
          "1 mes de ajustes incluidos",
        ],
      },
      en: {
        name: "Essential Dashboard",
        description:
          "Your key indicators in a clear dashboard that refreshes itself.",
        features: [
          "Connection of up to 3 data sources",
          "1 dashboard with your main KPIs",
          "Scheduled automatic refresh",
          "Usage training",
          "1 month of adjustments included",
        ],
      },
    },
    {
      key: "bi",
      price: 8900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "BI Completo",
        description:
          "Una sola fuente de verdad para toda la empresa, por área y por rol.",
        features: [
          "Integración y limpieza de todas tus fuentes",
          "Modelo de datos y bodega (data warehouse)",
          "Tableros por área con permisos",
          "Alertas automáticas por indicador",
          "3 meses de soporte y evolutivos",
        ],
      },
      en: {
        name: "Full BI",
        description:
          "A single source of truth for the whole company, by area and role.",
        features: [
          "Integration and cleaning of all your sources",
          "Data model and warehouse",
          "Dashboards per area with permissions",
          "Automatic alerts per indicator",
          "3 months of support and enhancements",
        ],
      },
    },
    {
      key: "avanzado",
      price: null,
      billing: "once",
      es: {
        name: "Analítica Avanzada",
        description:
          "Modelos predictivos y ciencia de datos aplicada a tu negocio.",
        features: [
          "Modelos predictivos y de segmentación",
          "Detección de anomalías y fraude",
          "Pipelines de datos automatizados",
          "Integración con IA generativa",
          "Acompañamiento del equipo de datos",
        ],
      },
      en: {
        name: "Advanced Analytics",
        description:
          "Predictive models and data science applied to your business.",
        features: [
          "Predictive and segmentation models",
          "Anomaly and fraud detection",
          "Automated data pipelines",
          "Generative AI integration",
          "Data team enablement",
        ],
      },
    },
  ],

  "integraciones-apis": [
    {
      key: "puntual",
      price: 2400000,
      billing: "once",
      es: {
        name: "Integración Puntual",
        description:
          "Conectamos dos sistemas y eliminamos ese trabajo manual que te consume.",
        features: [
          "Conexión entre 2 plataformas",
          "Sincronización programada o en tiempo real",
          "Manejo de errores y reintentos",
          "Documentación técnica",
          "1 mes de soporte",
        ],
      },
      en: {
        name: "Single Integration",
        description:
          "We connect two systems and remove that manual work eating your time.",
        features: [
          "Connection between 2 platforms",
          "Scheduled or real-time sync",
          "Error handling and retries",
          "Technical documentation",
          "1 month of support",
        ],
      },
    },
    {
      key: "paquete",
      price: 6900000,
      billing: "once",
      highlight: true,
      badge: "popular",
      es: {
        name: "Ecosistema Conectado",
        description:
          "Varias integraciones y una API propia para que todo hable entre sí.",
        features: [
          "Hasta 4 integraciones",
          "API propia documentada",
          "Webhooks y automatización de flujos",
          "Panel de monitoreo de sincronizaciones",
          "3 meses de soporte",
        ],
      },
      en: {
        name: "Connected Ecosystem",
        description:
          "Several integrations plus your own API so everything talks to each other.",
        features: [
          "Up to 4 integrations",
          "Your own documented API",
          "Webhooks and workflow automation",
          "Sync monitoring dashboard",
          "3 months of support",
        ],
      },
    },
    {
      key: "middleware",
      price: null,
      billing: "once",
      es: {
        name: "Middleware Corporativo",
        description:
          "Capa de integración central para empresas con muchos sistemas.",
        features: [
          "Bus de integración o middleware",
          "Colas y procesamiento asíncrono",
          "Trazabilidad y auditoría de datos",
          "Alta disponibilidad",
          "Soporte con SLA",
        ],
      },
      en: {
        name: "Corporate Middleware",
        description:
          "A central integration layer for companies with many systems.",
        features: [
          "Integration bus or middleware",
          "Queues and asynchronous processing",
          "Data traceability and auditing",
          "High availability",
          "Support with SLA",
        ],
      },
    },
  ],

  "soporte-ti": [
    {
      key: "mesa",
      price: 690000,
      billing: "monthly",
      es: {
        name: "Mesa de Ayuda",
        description:
          "Soporte remoto para que tu equipo nunca se quede bloqueado.",
        features: [
          "Hasta 10 usuarios atendidos",
          "Soporte remoto en horario hábil",
          "Gestión de tickets y reportes",
          "Mantenimiento preventivo trimestral",
          "SLA de respuesta de 8 horas",
        ],
      },
      en: {
        name: "Help Desk",
        description: "Remote support so your team is never stuck.",
        features: [
          "Up to 10 users covered",
          "Remote support during business hours",
          "Ticket management and reports",
          "Quarterly preventive maintenance",
          "8-hour response SLA",
        ],
      },
    },
    {
      key: "pro",
      price: 1490000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Soporte Pro",
        description:
          "Cobertura ampliada, monitoreo y un responsable asignado a tu cuenta.",
        features: [
          "Hasta 30 usuarios atendidos",
          "Monitoreo de servidores y equipos",
          "Visitas presenciales programadas",
          "Gestión de licencias y respaldos",
          "SLA de respuesta de 4 horas",
        ],
      },
      en: {
        name: "Pro Support",
        description:
          "Extended coverage, monitoring and a dedicated account owner.",
        features: [
          "Up to 30 users covered",
          "Server and device monitoring",
          "Scheduled on-site visits",
          "License and backup management",
          "4-hour response SLA",
        ],
      },
    },
    {
      key: "outsourcing",
      price: null,
      billing: "monthly",
      es: {
        name: "Outsourcing TI",
        description:
          "Personal técnico dedicado que se integra a tu equipo interno.",
        features: [
          "Perfiles dedicados (soporte, infra, desarrollo)",
          "Cobertura extendida o 24/7",
          "Gestión completa del área de TI",
          "Indicadores y comité mensual",
          "Escalamiento según demanda",
        ],
      },
      en: {
        name: "IT Outsourcing",
        description:
          "Dedicated technical staff embedded in your internal team.",
        features: [
          "Dedicated profiles (support, infra, development)",
          "Extended or 24/7 coverage",
          "Full management of your IT area",
          "KPIs and monthly committee",
          "Scale up or down on demand",
        ],
      },
    },
  ],

  "alquiler-equipos": [
    {
      key: "puesto-trabajo",
      price: 139000,
      billing: "monthly",
      es: {
        name: "Puesto de Trabajo",
        description:
          "El equipo completo para un colaborador de oficina, listo para usar el primer día.",
        features: [
          "Portátil o torre (Core i5 / Ryzen 5, 16 GB RAM, SSD 512 GB)",
          "Monitor 24\", teclado, mouse y diadema",
          "Windows con licencia, antivirus y tu dominio configurado",
          "Mantenimiento preventivo y mesa de ayuda incluidos",
          "Equipo de reemplazo si falla",
        ],
        note: "Por equipo / mes · desde 12 meses",
      },
      en: {
        name: "Workstation",
        description:
          "The complete setup for an office employee, ready to use on day one.",
        features: [
          "Laptop or tower (Core i5 / Ryzen 5, 16 GB RAM, 512 GB SSD)",
          '24" monitor, keyboard, mouse and headset',
          "Licensed Windows, antivirus and your domain configured",
          "Preventive maintenance and help desk included",
          "Replacement unit if it fails",
        ],
        note: "Per device / month · from 12 months",
      },
    },
    {
      key: "alto-rendimiento",
      price: 329000,
      billing: "monthly",
      highlight: true,
      badge: "popular",
      es: {
        name: "Alto Rendimiento",
        description:
          "Para diseño, ingeniería, edición de video, BI o desarrollo de software.",
        features: [
          "Core i7/i9 o Ryzen 7/9, 32–64 GB RAM, SSD NVMe 1 TB",
          "Tarjeta gráfica dedicada y monitor profesional",
          "MacBook Pro disponible bajo el mismo plan",
          "Soporte prioritario con SLA de 8 horas",
          "Renovación tecnológica cada 24 meses",
        ],
        note: "Por equipo / mes · desde 12 meses",
      },
      en: {
        name: "High Performance",
        description:
          "For design, engineering, video editing, BI or software development.",
        features: [
          "Core i7/i9 or Ryzen 7/9, 32–64 GB RAM, 1 TB NVMe SSD",
          "Dedicated graphics card and professional monitor",
          "MacBook Pro available under the same plan",
          "Priority support with an 8-hour SLA",
          "Technology refresh every 24 months",
        ],
        note: "Per device / month · from 12 months",
      },
    },
    {
      key: "infraestructura",
      price: null,
      billing: "monthly",
      es: {
        name: "Servidores & Infraestructura",
        description:
          "Servidores rack, almacenamiento y red en arriendo, instalados y monitoreados por nosotros.",
        features: [
          "Servidores rack y torre, NAS y almacenamiento",
          "Switches, firewall, access points, UPS y gabinete",
          "Instalación, cableado estructurado y configuración",
          "Monitoreo, backups y mantenimiento programado",
          "Opción de alquiler por evento o proyecto (desde 1 mes)",
        ],
        note: "Cotización según equipos y plazo",
      },
      en: {
        name: "Servers & Infrastructure",
        description:
          "Rack servers, storage and networking on rent, installed and monitored by us.",
        features: [
          "Rack and tower servers, NAS and storage",
          "Switches, firewall, access points, UPS and cabinet",
          "Installation, structured cabling and configuration",
          "Monitoring, backups and scheduled maintenance",
          "Rental by event or project available (from 1 month)",
        ],
        note: "Quoted based on equipment and term",
      },
    },
  ],
};

/**
 * Formatea un valor en pesos colombianos: 189000 → "$189.000".
 * Sin `toLocaleString` para que servidor y cliente rindan siempre igual.
 */
export function formatCOP(value: number): string {
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
