import type { Locale } from "@/i18n/config";
import type { ShowcaseCopy } from "./types";

/**
 * Página insignia de Plataformas Web (software a la medida y SaaS).
 * Las metas técnicas (disponibilidad, pruebas, tiempos) son objetivos de
 * entrega, no promesas de contrato: los acuerdos de servicio van en la propuesta.
 */
const es: ShowcaseCopy = {
  hero: {
    eyebrow: "Software a la medida y SaaS",
    title: "Tu operación, en una sola plataforma.",
    subtitle: "Construimos el software que tu negocio necesita: portales, sistemas de gestión y productos SaaS que reemplazan hojas de cálculo y crecen contigo.",
    primary: "Cotizar mi plataforma",
    secondary: "Ver proyectos",
    wordmark: "Plataformas Web",
    image: "/images/svc-consultoria-tech.jpg",
  },
  proof: [
    { value: "+120", label: "proyectos entregados" },
    { value: "Demo", label: "funcional cada 15 días" },
    { value: "99,9%", label: "meta de disponibilidad" },
    { value: "100%", label: "del código y los datos a tu nombre" },
  ],
  tiles: { title: "¿Qué quieres digitalizar?", hint: "Elige y te mostramos cómo lo construimos" },
  featured: {
    eyebrow: "Así trabajamos",
    title: "Software que ya puedes usar, cada quince días",
    body: "Nada de esperar meses: construimos por módulos, te mostramos una demo en cada sprint y ajustamos sobre algo que ya funciona.",
    cta: "Conocer el proceso",
    image: "/images/portfolio-2.jpg",
  },
  solutionsTitle: "Una plataforma para cada forma de operar",
  solutionsSubtitle: "Del portal para tus clientes al producto SaaS que vendes por suscripción: arquitectura sólida desde el primer módulo.",
  solutions: [
    { key: "client-portal", icon: "users", image: "/images/about-team.jpg", href: "plans", eyebrow: "Para atender mejor a tus clientes", title: "Portales de clientes", body: "Pedidos, documentos, facturas, solicitudes y estado de cada caso, con acceso seguro para cada cliente.", more: "Ver planes" },
    { key: "erp", icon: "dashboard", image: "/images/svc-plataformas-web.jpg", href: "plans", eyebrow: "Para dejar las hojas de cálculo", title: "Sistemas de gestión", body: "Inventario, producción, compras, cartera o proyectos: tu proceso real, en un solo sistema con reportes en vivo.", more: "Ver planes" },
    { key: "saas", icon: "cloud", image: "/images/svc-cloud-devops.jpg", href: "plans", eyebrow: "Para vender tu software", title: "Productos SaaS", body: "Multiempresa, suscripciones, pagos recurrentes y panel de administración listos para escalar.", more: "Ver planes" },
    { key: "bookings", icon: "calendar", image: "/images/about-meeting.jpg", href: "plans", eyebrow: "Para agendar y cobrar", title: "Reservas y cotizadores", body: "Agenda en línea, cálculo de precios, pagos y confirmaciones automáticas por correo y WhatsApp.", more: "Ver planes" },
    { key: "marketplace", icon: "store", image: "/images/svc-ecommerce.jpg", href: "ecommerce", eyebrow: "Para conectar oferta y demanda", title: "Marketplaces", body: "Vendedores, compradores, comisiones y pagos divididos en una plataforma con reglas claras.", more: "Ver E-commerce" },
    { key: "ai", icon: "sparkles", image: "/images/svc-ia-automatizacion.jpg", href: "ia-automatizacion", eyebrow: "Para trabajar con IA", title: "Plataformas con IA", body: "Asistentes, clasificación de documentos y automatizaciones integradas a tus datos de forma segura.", more: "Ver IA y automatización" },
  ],
  capabilities: {
    titleLight: "Ingeniería de software",
    titleBold: "de punta a punta",
    intro: "Una plataforma confiable necesita más que pantallas bonitas. Un solo equipo se encarga del análisis, el diseño, el código, la nube y la evolución.",
    items: [
      { icon: "compass", title: "Análisis funcional", body: "Mapeamos tus procesos, roles y reglas de negocio con las personas que los usan todos los días.", tags: ["Procesos", "Historias de usuario", "Alcance"] },
      { icon: "palette", title: "UX de producto", body: "Prototipos navegables validados con usuarios reales antes de programar.", tags: ["Figma", "Prototipo", "Pruebas de uso"] },
      { icon: "code", title: "Front-end y back-end", body: "Aplicaciones rápidas con código tipado, probado y documentado, listo para crecer.", tags: ["React", "Node.js", "TypeScript"] },
      { icon: "database", title: "Datos y reportes", body: "Bases de datos bien diseñadas, tableros en tiempo real y exportaciones para tu equipo.", tags: ["PostgreSQL", "Dashboards", "BI"] },
      { icon: "key", title: "Usuarios, roles y permisos", body: "Inicio de sesión seguro, roles por área y registro de quién hizo qué.", tags: ["SSO", "2FA", "Auditoría"] },
      { icon: "plug", title: "APIs e integraciones", body: "Conectamos ERP, CRM, facturación electrónica, pagos y tus sistemas actuales.", tags: ["REST", "Webhooks", "ERP · CRM"] },
      { icon: "server", title: "Nube y DevOps", body: "Despliegues automáticos, ambientes de pruebas, monitoreo y copias de seguridad.", tags: ["AWS", "Docker", "CI/CD"] },
      { icon: "flask", title: "Calidad y seguridad", body: "Pruebas automatizadas, revisión de código y buenas prácticas OWASP en cada entrega.", tags: ["Tests", "OWASP", "Staging"] },
    ],
  },
  outcomes: {
    title: "Lo que cambia con la plataforma correcta",
    subtitle: "Menos tareas manuales, más control y datos para decidir.",
    items: [
      { title: "Valor desde el primer mes", body: "Empezamos por el módulo que más te duele. Lo usas mientras construimos el resto." },
      { title: "Menos trabajo manual", body: "Las tareas repetitivas pasan a ser automáticas: tu equipo se dedica a lo que genera valor." },
      { title: "Toda la operación a la vista", body: "Indicadores en tiempo real, alertas y reportes sin armar hojas de cálculo cada semana." },
    ],
    visual: {
      week: "Sprint",
      review: "Demo",
      live: "En producción",
      funnel: [
        { label: "Tareas manuales", value: "100%" },
        { label: "Automatizadas", value: "62%" },
        { label: "Horas ahorradas / mes", value: "120" },
      ],
      editor: "Panel de operación",
      publish: "Exportar",
      saved: "Datos al día",
    },
  },
  performance: {
    eyebrow: "Escalabilidad y seguridad",
    title: "Lista para crecer. Segura desde el primer día.",
    subtitle: "Diseñamos la arquitectura para tus usuarios de hoy y los de dentro de tres años, con la seguridad como parte del código, no como un parche.",
    scores: [
      { label: "Disponibilidad", value: 99.9, display: "99,9" },
      { label: "Pruebas automatizadas", value: 80, display: "80%" },
      { label: "Riesgos OWASP revisados", value: 100, display: "10/10" },
      { label: "Código a tu nombre", value: 100, display: "100%" },
    ],
    scoresNote: "Metas de entrega; los acuerdos de servicio se definen en la propuesta.",
    vitals: [
      { metric: "p95", target: "< 300 ms", label: "Respuesta de la API" },
      { metric: "RPO", target: "< 24 h", label: "Pérdida máxima de datos" },
      { metric: "RTO", target: "< 4 h", label: "Tiempo de recuperación" },
    ],
    security: ["Cifrado en tránsito y en reposo", "Roles, permisos y registro de auditoría", "Copias de seguridad diarias y restauración probada", "Cumplimiento de la Ley 1581 de datos personales"],
  },
  cases: {
    title: "Plataformas que ya están operando",
    subtitle: "Algunos proyectos recientes y lo que lograron.",
    cta: "Ver portafolio completo",
    link: "Ver portafolio",
    slugs: ["meridian-saas", "helix-ai-assistant", "nova-retail-ecommerce"],
  },
  models: {
    title: "Elige cómo quieres construirla",
    subtitle: "Empieza pequeño y crece, o construye la plataforma completa de una vez.",
    items: [
      { name: "MVP", fit: "Para validar rápido con usuarios reales", body: "La primera versión funcional con los módulos clave, lista para probar tu idea en el mercado.", points: ["Hasta 8 módulos clave", "Prototipo validado", "2 meses de soporte"], cta: "Ver plan" },
      { name: "Plataforma completa", fit: "Para operar tu negocio de punta a punta", body: "Todos los módulos de tu operación, integraciones y reportes, con pruebas automatizadas y staging.", points: ["Módulos según tu operación", "Integraciones ERP, CRM y pagos", "6 meses de soporte"], cta: "Ver planes" },
      { name: "Equipo dedicado", fit: "Para evolucionar tu producto cada mes", body: "Un equipo de producto (diseño, desarrollo y QA) trabajando en tu roadmap con demos quincenales.", points: ["Roadmap compartido", "Demo cada 15 días", "Informe mensual"], cta: "Hablar con un asesor" },
    ],
  },
  included: {
    title: "Incluido en todas las plataformas",
    items: ["Análisis funcional documentado", "Prototipo navegable", "Código y datos a tu nombre", "Roles y permisos", "Ambiente de pruebas (staging)", "Copias de seguridad", "Documentación técnica", "Capacitación para tu equipo"],
  },
  processIcons: ["clipboard", "mouse", "code", "shield", "rocket"],
  process: { stepLabel: "Etapa", ctaTitle: "Empezamos con un levantamiento sin costo: sales con el mapa de módulos y un estimado de tiempos.", ctaLabel: "Agendar levantamiento" },
  audit: {
    title: "¿Tienes un proceso en Excel? Te proponemos cómo digitalizarlo",
    body: "Cuéntanos en una frase qué proceso quieres mejorar y te enviamos por WhatsApp una propuesta de módulos, tiempos y costo aproximado. Gratis.",
    label: "¿Qué proceso quieres digitalizar?",
    placeholder: "Ej.: el seguimiento de pedidos que hoy llevamos en Excel",
    cta: "Pedir propuesta gratis",
    note: "Sin costo ni compromiso. Respondemos en horario laboral.",
    message: "Hola, quiero una propuesta para digitalizar este proceso: {value}",
    kind: "text",
  },
};

const en: ShowcaseCopy = {
  hero: {
    eyebrow: "Custom software and SaaS",
    title: "Your operation, in one platform.",
    subtitle: "We build the software your business needs: portals, management systems and SaaS products that replace spreadsheets and grow with you.",
    primary: "Get a quote",
    secondary: "See projects",
    wordmark: "Web Platforms",
    image: "/images/svc-consultoria-tech.jpg",
  },
  proof: [
    { value: "+120", label: "projects delivered" },
    { value: "Demo", label: "of working software every 2 weeks" },
    { value: "99.9%", label: "uptime target" },
    { value: "100%", label: "of code and data in your name" },
  ],
  tiles: { title: "What do you want to digitize?", hint: "Pick one and we'll show you how we build it" },
  featured: {
    eyebrow: "How we work",
    title: "Software you can use, every two weeks",
    body: "No waiting months: we build module by module, demo every sprint and adjust on something that already works.",
    cta: "See the process",
    image: "/images/portfolio-2.jpg",
  },
  solutionsTitle: "A platform for every way of operating",
  solutionsSubtitle: "From a client portal to the SaaS product you sell by subscription: solid architecture from the first module.",
  solutions: [
    { key: "client-portal", icon: "users", image: "/images/about-team.jpg", href: "plans", eyebrow: "To serve your clients better", title: "Client portals", body: "Orders, documents, invoices, requests and case status, with secure access for each client.", more: "See plans" },
    { key: "erp", icon: "dashboard", image: "/images/svc-plataformas-web.jpg", href: "plans", eyebrow: "To leave spreadsheets behind", title: "Management systems", body: "Inventory, production, purchasing, receivables or projects: your real process in one system with live reports.", more: "See plans" },
    { key: "saas", icon: "cloud", image: "/images/svc-cloud-devops.jpg", href: "plans", eyebrow: "To sell your software", title: "SaaS products", body: "Multi-tenant, subscriptions, recurring payments and an admin panel ready to scale.", more: "See plans" },
    { key: "bookings", icon: "calendar", image: "/images/about-meeting.jpg", href: "plans", eyebrow: "To book and get paid", title: "Booking and quoting", body: "Online booking, pricing calculators, payments and automatic confirmations by email and WhatsApp.", more: "See plans" },
    { key: "marketplace", icon: "store", image: "/images/svc-ecommerce.jpg", href: "ecommerce", eyebrow: "To connect supply and demand", title: "Marketplaces", body: "Sellers, buyers, commissions and split payments on a platform with clear rules.", more: "See E-commerce" },
    { key: "ai", icon: "sparkles", image: "/images/svc-ia-automatizacion.jpg", href: "ia-automatizacion", eyebrow: "To work with AI", title: "AI-powered platforms", body: "Assistants, document classification and automations integrated with your data, securely.", more: "See AI & automation" },
  ],
  capabilities: {
    titleLight: "Software engineering",
    titleBold: "end to end",
    intro: "A reliable platform needs more than nice screens. One team owns analysis, design, code, cloud and evolution.",
    items: [
      { icon: "compass", title: "Functional analysis", body: "We map your processes, roles and business rules with the people who use them every day.", tags: ["Processes", "User stories", "Scope"] },
      { icon: "palette", title: "Product UX", body: "Clickable prototypes validated with real users before coding.", tags: ["Figma", "Prototype", "Usability tests"] },
      { icon: "code", title: "Front end and back end", body: "Fast apps with typed, tested and documented code, ready to grow.", tags: ["React", "Node.js", "TypeScript"] },
      { icon: "database", title: "Data and reporting", body: "Well-designed databases, real-time dashboards and exports for your team.", tags: ["PostgreSQL", "Dashboards", "BI"] },
      { icon: "key", title: "Users, roles and permissions", body: "Secure sign-in, roles per area and a log of who did what.", tags: ["SSO", "2FA", "Audit log"] },
      { icon: "plug", title: "APIs and integrations", body: "We connect ERP, CRM, e-invoicing, payments and your current systems.", tags: ["REST", "Webhooks", "ERP · CRM"] },
      { icon: "server", title: "Cloud and DevOps", body: "Automatic deployments, test environments, monitoring and backups.", tags: ["AWS", "Docker", "CI/CD"] },
      { icon: "flask", title: "Quality and security", body: "Automated tests, code review and OWASP best practices in every release.", tags: ["Tests", "OWASP", "Staging"] },
    ],
  },
  outcomes: {
    title: "What changes with the right platform",
    subtitle: "Less manual work, more control and data to decide.",
    items: [
      { title: "Value from the first month", body: "We start with the module that hurts most. You use it while we build the rest." },
      { title: "Less manual work", body: "Repetitive tasks become automatic: your team focuses on what creates value." },
      { title: "Your whole operation in view", body: "Real-time KPIs, alerts and reports without building spreadsheets every week." },
    ],
    visual: {
      week: "Sprint",
      review: "Demo",
      live: "In production",
      funnel: [
        { label: "Manual tasks", value: "100%" },
        { label: "Automated", value: "62%" },
        { label: "Hours saved / month", value: "120" },
      ],
      editor: "Operations panel",
      publish: "Export",
      saved: "Data up to date",
    },
  },
  performance: {
    eyebrow: "Scalability and security",
    title: "Ready to grow. Secure from day one.",
    subtitle: "We design the architecture for today's users and those three years from now, with security built into the code, not patched on.",
    scores: [
      { label: "Uptime", value: 99.9, display: "99.9" },
      { label: "Automated tests", value: 80, display: "80%" },
      { label: "OWASP risks reviewed", value: 100, display: "10/10" },
      { label: "Code in your name", value: 100, display: "100%" },
    ],
    scoresNote: "Delivery targets; service level agreements are set in the proposal.",
    vitals: [
      { metric: "p95", target: "< 300 ms", label: "API response" },
      { metric: "RPO", target: "< 24 h", label: "Maximum data loss" },
      { metric: "RTO", target: "< 4 h", label: "Recovery time" },
    ],
    security: ["Encryption in transit and at rest", "Roles, permissions and audit log", "Daily backups and tested restore", "Data protection compliance"],
  },
  cases: {
    title: "Platforms already in operation",
    subtitle: "A few recent projects and what they achieved.",
    cta: "See full portfolio",
    link: "See portfolio",
    slugs: ["meridian-saas", "helix-ai-assistant", "nova-retail-ecommerce"],
  },
  models: {
    title: "Choose how to build it",
    subtitle: "Start small and grow, or build the full platform at once.",
    items: [
      { name: "MVP", fit: "To validate fast with real users", body: "The first working version with the key modules, ready to test your idea in the market.", points: ["Up to 8 key modules", "Validated prototype", "2 months of support"], cta: "See plan" },
      { name: "Full platform", fit: "To run your business end to end", body: "Every module of your operation, integrations and reports, with automated tests and staging.", points: ["Modules for your operation", "ERP, CRM and payment integrations", "6 months of support"], cta: "See plans" },
      { name: "Dedicated team", fit: "To evolve your product every month", body: "A product team (design, development and QA) working on your roadmap with biweekly demos.", points: ["Shared roadmap", "Demo every 2 weeks", "Monthly report"], cta: "Talk to an advisor" },
    ],
  },
  included: {
    title: "Included in every platform",
    items: ["Documented functional analysis", "Clickable prototype", "Code and data in your name", "Roles and permissions", "Staging environment", "Backups", "Technical documentation", "Team training"],
  },
  processIcons: ["clipboard", "mouse", "code", "shield", "rocket"],
  process: { stepLabel: "Stage", ctaTitle: "We start with a free discovery session: you leave with a module map and a timeline estimate.", ctaLabel: "Book a discovery session" },
  audit: {
    title: "Running a process in Excel? We'll propose how to digitize it",
    body: "Tell us in one sentence which process you want to improve and we'll send a proposal on WhatsApp with modules, timeline and estimated cost. Free.",
    label: "Which process do you want to digitize?",
    placeholder: "E.g. order tracking we currently do in Excel",
    cta: "Get a free proposal",
    note: "No cost, no commitment. We reply during business hours.",
    message: "Hi, I'd like a proposal to digitize this process: {value}",
    kind: "text",
  },
};

export const plataformasWebPage: Record<Locale, ShowcaseCopy> = { es, en };
