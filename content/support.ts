/**
 * Contenido del centro de soporte técnico (/soporte).
 *
 * Los compromisos de tiempo que se muestran salen de `serviceSla`
 * (content/serviceExtras.ts); aquí solo hay textos de interfaz y la
 * clasificación de problemas para el formulario de solicitud.
 */

export type SupportIcon =
  | "Globe"
  | "Mail"
  | "Monitor"
  | "LayoutDashboard"
  | "ShieldAlert"
  | "Wrench"
  | "Receipt"
  | "RefreshCcw"
  | "KeyRound"
  | "HelpCircle";

export interface SupportIssue {
  /** Valor de la categoría en el formulario. */
  key: string;
  icon: SupportIcon;
  /** Pestaña donde aparece. */
  tab: "technical" | "account";
  es: { title: string; desc: string };
  en: { title: string; desc: string };
}

export const supportIssues: SupportIssue[] = [
  {
    key: "web",
    icon: "Globe",
    tab: "technical",
    es: {
      title: "Mi sitio web no carga o está lento",
      desc: "Errores, caídas, páginas en blanco, certificado SSL vencido o lentitud.",
    },
    en: {
      title: "My website is down or slow",
      desc: "Errors, outages, blank pages, expired SSL certificate or slowness.",
    },
  },
  {
    key: "email",
    icon: "Mail",
    tab: "technical",
    es: {
      title: "Problemas con el correo corporativo",
      desc: "No envía o no recibe, llega a spam, buzón lleno o configuración en un equipo nuevo.",
    },
    en: {
      title: "Business email problems",
      desc: "Can't send or receive, goes to spam, full mailbox or setup on a new device.",
    },
  },
  {
    key: "platform",
    icon: "LayoutDashboard",
    tab: "technical",
    es: {
      title: "Falla en mi plataforma o producto",
      desc: "Un módulo no responde, datos que no cuadran, integraciones o reportes con error.",
    },
    en: {
      title: "My platform or product is failing",
      desc: "A module not responding, data that doesn't add up, broken integrations or reports.",
    },
  },
  {
    key: "equipment",
    icon: "Monitor",
    tab: "technical",
    es: {
      title: "Equipo o servidor con falla",
      desc: "Equipos en alquiler o de tu empresa que no encienden, se bloquean o necesitan reemplazo.",
    },
    en: {
      title: "Device or server failure",
      desc: "Rented or company devices that won't start, freeze or need a replacement.",
    },
  },
  {
    key: "security",
    icon: "ShieldAlert",
    tab: "technical",
    es: {
      title: "Sospecho un problema de seguridad",
      desc: "Accesos extraños, correos de suplantación, sitio alterado o posible pérdida de datos.",
    },
    en: {
      title: "I suspect a security issue",
      desc: "Unusual access, phishing emails, a defaced site or possible data loss.",
    },
  },
  {
    key: "other-technical",
    icon: "Wrench",
    tab: "technical",
    es: {
      title: "Otro problema técnico",
      desc: "Cambios en tu sitio, instalaciones, configuraciones o algo que no aparece en la lista.",
    },
    en: {
      title: "Another technical issue",
      desc: "Changes to your site, installations, settings or anything not listed here.",
    },
  },
  {
    key: "billing",
    icon: "Receipt",
    tab: "account",
    es: {
      title: "Facturas y pagos",
      desc: "Solicitar una factura, reportar un pago o consultar el estado de tu cuenta.",
    },
    en: {
      title: "Invoices and payments",
      desc: "Request an invoice, report a payment or check your account status.",
    },
  },
  {
    key: "plan",
    icon: "RefreshCcw",
    tab: "account",
    es: {
      title: "Cambiar, renovar o cancelar un plan",
      desc: "Subir o bajar de plan, renovar dominio y hosting, o terminar un servicio.",
    },
    en: {
      title: "Change, renew or cancel a plan",
      desc: "Upgrade or downgrade, renew domain and hosting, or end a service.",
    },
  },
  {
    key: "access",
    icon: "KeyRound",
    tab: "account",
    es: {
      title: "Accesos y usuarios",
      desc: "Recuperar una contraseña, crear o quitar usuarios en tu plataforma o tu sitio.",
    },
    en: {
      title: "Access and users",
      desc: "Recover a password, add or remove users on your platform or site.",
    },
  },
  {
    key: "other-account",
    icon: "HelpCircle",
    tab: "account",
    es: {
      title: "Otra consulta administrativa",
      desc: "Contratos, garantías, documentos o cualquier tema que no sea técnico.",
    },
    en: {
      title: "Another administrative question",
      desc: "Contracts, warranties, documents or any non-technical matter.",
    },
  },
];

/** Categorías de "Explorar por categoría": cada una toma las FAQ de un servicio. */
export interface SupportCategory {
  key: string;
  serviceSlug: string;
  icon: SupportIcon;
  es: { title: string };
  en: { title: string };
}

export const supportCategories: SupportCategory[] = [
  {
    key: "hosting",
    serviceSlug: "hosting-mantenimiento",
    icon: "Globe",
    es: { title: "Hosting, dominio y correo" },
    en: { title: "Hosting, domain and email" },
  },
  {
    key: "soporte",
    serviceSlug: "soporte-ti",
    icon: "Wrench",
    es: { title: "Soporte TI y mesa de ayuda" },
    en: { title: "IT support and help desk" },
  },
  {
    key: "seguridad",
    serviceSlug: "ciberseguridad",
    icon: "ShieldAlert",
    es: { title: "Seguridad y respaldo" },
    en: { title: "Security and backup" },
  },
  {
    key: "nube",
    serviceSlug: "cloud-devops",
    icon: "LayoutDashboard",
    es: { title: "Nube y servidores" },
    en: { title: "Cloud and servers" },
  },
  {
    key: "equipos",
    serviceSlug: "alquiler-equipos",
    icon: "Monitor",
    es: { title: "Equipos en alquiler" },
    en: { title: "Rented equipment" },
  },
  {
    key: "web",
    serviceSlug: "desarrollo-web",
    icon: "RefreshCcw",
    es: { title: "Tu sitio web" },
    en: { title: "Your website" },
  },
];

/** Compromisos que se muestran: [servicio, índice de la fila en serviceSla]. */
export const supportCommitments: [string, number][] = [
  ["soporte-ti", 0], // Primera respuesta: 4 a 8 horas
  ["cloud-devops", 2], // Respuesta a incidente crítico: 1 hora
  ["hosting-mantenimiento", 2], // Tiempo de restauración: menos de 2 horas
  ["hosting-mantenimiento", 1], // Copias de seguridad: diarias
];

export const supportCopy = {
  es: {
    metaTitle: "Centro de soporte técnico",
    metaDescription:
      "Reporta una falla, solicita ayuda con tu sitio, plataforma, correo o equipos, y consulta nuestros tiempos de respuesta.",
    titleLead: "¿Cómo podemos",
    titleHighlight: "ayudarte hoy?",
    subtitle:
      "Busca una respuesta o cuéntanos qué está pasando. Nuestro equipo de soporte te acompaña.",
    needTitle: "¿Con qué necesitas ayuda?",
    needSubtitle:
      "Elige el problema y te llevamos al formulario con todo listo, o descríbelo con tus palabras.",
    tabs: { technical: "Problemas técnicos", account: "Cuenta y facturación" },
    getHelp: "Obtener ayuda",
    commitmentsTitle: "Nuestros compromisos de respuesta",
    commitmentsSubtitle:
      "Tiempos acordados en nuestros planes de soporte, hosting y nube.",
    exploreTitle: "Explorar por categoría",
    viewAll: "Ver todas",
    formTitle: "Solicitar soporte",
    formSubtitle:
      "Cuantos más detalles nos des, más rápido lo resolvemos: qué pasó, desde cuándo y a quién afecta.",
    form: {
      name: "Nombre completo",
      email: "Correo electrónico",
      company: "Empresa",
      phone: "Teléfono / WhatsApp",
      category: "Tipo de problema",
      categoryPlaceholder: "Selecciona el tipo de problema",
      priority: "Prioridad",
      priorities: {
        critical: "Crítica: todo está detenido",
        high: "Alta: afecta a varias personas",
        medium: "Media: hay una forma de seguir trabajando",
        low: "Baja: consulta o cambio menor",
      },
      affected: "Servicio o producto afectado",
      affectedPlaceholder: "Selecciona (opcional)",
      affectedOther: "No estoy seguro",
      groupServices: "Servicios",
      groupProducts: "Productos",
      description: "Describe el problema",
      descriptionPlaceholder:
        "Ej.: desde esta mañana el sitio muestra un error 500 al entrar al carrito…",
      submit: "Enviar solicitud",
      sending: "Enviando…",
      success:
        "Recibimos tu solicitud. Un especialista te contactará por correo o WhatsApp según la prioridad.",
      error:
        "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.",
      required: "Este campo es obligatorio.",
      invalidEmail: "Escribe un correo válido.",
      urgentNote:
        "Si todo está detenido, además de enviar el formulario escríbenos por WhatsApp para atenderte de inmediato.",
    },
    stillTitle: "¿Aún necesitas ayuda?",
    whatsappTitle: "Soporte por WhatsApp",
    whatsappDesc:
      "Para incidentes urgentes, escríbenos y te responde un especialista.",
    whatsappCta: "Escribir por WhatsApp",
    callTitle: "Llámanos",
    callCta: "Llamar ahora",
    helpTitle: "Centro de ayuda",
    helpDesc: "Respuestas a preguntas frecuentes sobre servicios, productos, pagos y planes.",
    helpCta: "Ir al centro de ayuda",
  },
  en: {
    metaTitle: "Technical Support Center",
    metaDescription:
      "Report an issue, get help with your website, platform, email or devices, and check our response times.",
    titleLead: "How can we",
    titleHighlight: "help you today?",
    subtitle:
      "Search for an answer or tell us what's happening. Our support team has your back.",
    needTitle: "What do you need help with?",
    needSubtitle:
      "Pick the issue and we'll take you to the form with everything ready, or describe it in your own words.",
    tabs: { technical: "Technical issues", account: "Account and billing" },
    getHelp: "Get help",
    commitmentsTitle: "Our response commitments",
    commitmentsSubtitle:
      "Times agreed in our support, hosting and cloud plans.",
    exploreTitle: "Explore by category",
    viewAll: "View all",
    formTitle: "Request support",
    formSubtitle:
      "The more detail you give us, the faster we solve it: what happened, since when and who it affects.",
    form: {
      name: "Full name",
      email: "Email",
      company: "Company",
      phone: "Phone / WhatsApp",
      category: "Type of issue",
      categoryPlaceholder: "Select the type of issue",
      priority: "Priority",
      priorities: {
        critical: "Critical: everything is down",
        high: "High: affects several people",
        medium: "Medium: there's a workaround",
        low: "Low: question or minor change",
      },
      affected: "Affected service or product",
      affectedPlaceholder: "Select (optional)",
      affectedOther: "I'm not sure",
      groupServices: "Services",
      groupProducts: "Products",
      description: "Describe the issue",
      descriptionPlaceholder:
        "E.g.: since this morning the site shows a 500 error when opening the cart…",
      submit: "Send request",
      sending: "Sending…",
      success:
        "We received your request. A specialist will contact you by email or WhatsApp according to its priority.",
      error:
        "We couldn't send your request. Try again or message us on WhatsApp.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email.",
      urgentNote:
        "If everything is down, besides sending the form, message us on WhatsApp so we can help right away.",
    },
    stillTitle: "Still need help?",
    whatsappTitle: "WhatsApp support",
    whatsappDesc: "For urgent incidents, message us and a specialist will reply.",
    whatsappCta: "Message on WhatsApp",
    callTitle: "Call us",
    callCta: "Call now",
    helpTitle: "Help Center",
    helpDesc: "Answers to frequent questions about services, products, payments and plans.",
    helpCta: "Go to the help center",
  },
};

export type SupportCopy = (typeof supportCopy)["es"];
