/**
 * Textos de las páginas de empresa "B": Nuestro proceso, El equipo,
 * Preguntas frecuentes y Cotizar.
 *
 * Solo copia explicativa. Las cifras, plazos, precios y garantías salen de
 * sus fuentes reales (diccionario, content/pricing.ts, content/services.ts…)
 * y se insertan en las páginas; aquí no se inventa ningún dato.
 */
import type { Locale } from "@/i18n/config";

interface Titled {
  title: string;
  subtitle: string;
}

export interface CompanyBCopy {
  process: {
    metaTitle: string;
    metaDescription: string;
    hero: { eyebrow: string; title: string; subtitle: string; imageAlt: string };
    intro: Titled;
    indicatorLabel: string;
    /** Qué haces tú en cada etapa (mismo orden que `process.steps`). */
    yourPart: string[];
    yourPartLabel: string;
    durationLabel: string;
    withYou: {
      title: string;
      subtitle: string;
      rows: {
        eyebrow: string;
        title: string;
        description: string;
        imageAlt: string;
        cta: string;
      }[];
    };
    perService: Titled & {
      selectLabel: string;
      viewService: string;
    };
    trustTitle: string;
  };
  team: {
    metaTitle: string;
    metaDescription: string;
    hero: { eyebrow: string; title: string; subtitle: string; imageAlt: string };
    intro: Titled;
    specs: { specialists: string; teams: string; services: string; products: string };
    /** Descripción de cada equipo (mismo orden que `aboutPage.team`). */
    teamDescriptions: string[];
    teamImageAlts: string[];
    seeServices: string;
    coverage: Titled & { servicesLabel: string };
    together: { eyebrow: string; title: string; description: string; imageAlt: string; cta: string };
    join: { title: string; description: string; cta: string; email: string };
  };
  faq: {
    metaTitle: string;
    metaDescription: string;
    hero: { eyebrow: string; title: string; subtitle: string; imageAlt: string };
    searchTitle: string;
    browseTitle: string;
    browseSubtitle: string;
    filterLabel: string;
    categories: {
      general: string;
      payments: string;
      products: string;
    };
    generalGroup: string;
    paymentsGroup: string;
    productsGroup: string;
    viewPage: string;
    countLabel: string;
    helpTitle: string;
    helpSubtitle: string;
    helpCta: string;
    contactCta: string;
  };
  quote: {
    metaTitle: string;
    metaDescription: string;
    hero: { eyebrow: string; title: string; subtitle: string };
    afterTitle: string;
    afterSubtitle: string;
    steps: { title: string; description: string }[];
    formTitle: string;
    formSubtitle: string;
    pricesTitle: string;
    pricesSubtitle: string;
    seePlans: string;
    faqTitle: string;
    channelsTitle: string;
    channelsSubtitle: string;
    hours: string;
  };
}

const es: CompanyBCopy = {
  process: {
    metaTitle: "Nuestro proceso",
    metaDescription:
      "Así trabajamos en Engynex: descubrimiento, estrategia y diseño, desarrollo, lanzamiento y crecimiento. Etapas claras, entregas continuas y garantía por escrito.",
    hero: {
      eyebrow: "Nuestro proceso",
      title: "De la idea al lanzamiento, sin sorpresas",
      subtitle:
        "Cuatro etapas claras para que sepas en todo momento qué estamos haciendo, qué sigue y qué necesitamos de ti.",
      imageAlt: "Equipo de Engynex revisando el plan de un proyecto",
    },
    intro: {
      title: "Cuatro etapas, un mismo equipo",
      subtitle:
        "Cada proyecto pasa por las mismas etapas, aunque la duración de cada una cambia según el alcance. Al final de cada etapa hay algo concreto que puedes revisar y aprobar antes de avanzar.",
    },
    indicatorLabel: "Etapas del proceso",
    yourPart: [
      "Nos cuentas tu negocio, tus objetivos y lo que esperas lograr.",
      "Revisas el prototipo y la propuesta visual, y nos das tu aprobación.",
      "Ves los avances en cada demo y nos das retroalimentación.",
      "Validas la publicación y decides con nosotros las siguientes mejoras.",
    ],
    yourPartLabel: "Tu participación",
    durationLabel: "Duración y entregable",
    withYou: {
      title: "Cómo trabajamos contigo",
      subtitle:
        "Un proceso claro solo funciona si la comunicación también lo es. Esto es lo que puedes esperar de nosotros durante todo el proyecto.",
      rows: [
        {
          eyebrow: "Comunicación",
          title: "Siempre sabes en qué punto está tu proyecto",
          description:
            "Te respondemos en menos de 24 horas hábiles y, durante el desarrollo, te mostramos una demo cada 15 días. Nada de esperar semanas sin noticias.",
          imageAlt: "Reunión de seguimiento con un cliente",
          cta: "Ver preguntas frecuentes",
        },
        {
          eyebrow: "Entregas y pagos",
          title: "Pagas por avances que puedes ver",
          description:
            "En proyectos de pago único trabajamos con 50% de anticipo y 50% contra entrega; en proyectos grandes dividimos por hitos. Todo queda por escrito antes de empezar.",
          imageAlt: "Oficina de Engynex",
          cta: "Cotizar un proyecto",
        },
        {
          eyebrow: "Garantía",
          title: "Respondemos por lo que entregamos",
          description:
            "Todos los desarrollos incluyen garantía sobre errores de funcionamiento, entre 2 y 6 meses según el plan. Corregimos sin costo cualquier falla atribuible a nuestro trabajo.",
          imageAlt: "Soporte técnico después del lanzamiento",
          cta: "Ver planes de mantenimiento",
        },
      ],
    },
    perService: {
      title: "Cada servicio tiene su propio proceso",
      subtitle:
        "Una auditoría de ciberseguridad no se trabaja igual que una app. Elige un servicio y mira sus etapas, con la duración y el entregable de cada una.",
      selectLabel: "Servicio",
      viewService: "Ver el servicio completo",
    },
    trustTitle: "Lo que te garantizamos desde el primer contacto",
  },
  team: {
    metaTitle: "El equipo",
    metaDescription:
      "Conoce los cuatro equipos de Engynex: desarrollo, diseño, marketing y audiovisual. Especialistas en casa que trabajan coordinados en tu proyecto.",
    hero: {
      eyebrow: "El equipo",
      title: "Las personas que construyen tu proyecto",
      subtitle:
        "Ingenieros, diseñadores, estrategas y creativos en un mismo lugar, para que tu proyecto no dependa de proveedores sueltos.",
      imageAlt: "Equipo de diseño de Engynex trabajando en una propuesta",
    },
    intro: {
      title: "Cuatro equipos, un solo proyecto",
      subtitle:
        "Organizamos el talento por especialidad para que cada parte de tu proyecto la haga quien mejor la conoce. Y como todos trabajan en casa, se coordinan sin intermediarios.",
    },
    specs: {
      specialists: "Especialistas en casa",
      teams: "Equipos especializados",
      services: "Servicios que cubrimos",
      products: "Productos propios",
    },
    teamDescriptions: [
      "Construye y opera tu tecnología: sitios, plataformas, apps, integraciones, nube y seguridad.",
      "Da forma a la experiencia y a la identidad visual de tu marca antes de escribir código.",
      "Hace que tu producto llegue a las personas correctas y mide qué está funcionando.",
      "Produce el video, la fotografía y el motion que cuentan tu historia.",
    ],
    teamImageAlts: [
      "Desarrolladores trabajando en código",
      "Diseñadora trabajando en una interfaz",
      "Equipo de marketing revisando una campaña",
      "Producción de video en estudio",
    ],
    seeServices: "Ver qué hace",
    coverage: {
      title: "Qué hace cada equipo",
      subtitle:
        "Estos son los servicios que lidera cada equipo. En la mayoría de proyectos participan varios a la vez.",
      servicesLabel: "Servicios que lidera",
    },
    together: {
      eyebrow: "Trabajo coordinado",
      title: "Un equipo multidisciplinario, no una cadena de proveedores",
      description:
        "Cuando diseño, desarrollo y marketing están bajo el mismo techo, las decisiones se toman juntas y nada se pierde en el camino.",
      imageAlt: "Equipo de Engynex en una reunión de trabajo",
      cta: "Ver nuestro proceso",
    },
    join: {
      title: "¿Quieres trabajar con nosotros?",
      description:
        "Si te apasiona construir productos digitales y te interesa sumar tu talento, escríbenos contándonos quién eres y en qué área trabajas.",
      cta: "Escríbenos",
      email: "Enviar un correo",
    },
  },
  faq: {
    metaTitle: "Preguntas frecuentes",
    metaDescription:
      "Todas las preguntas frecuentes de Engynex en un solo lugar: cotizaciones, pagos, garantía, productos y cada uno de nuestros servicios.",
    hero: {
      eyebrow: "Preguntas frecuentes",
      title: "Respuestas claras antes de empezar",
      subtitle:
        "Reunimos aquí todo lo que nos preguntan sobre cotizaciones, pagos, garantía, productos y cada uno de nuestros servicios.",
      imageAlt: "Asesor de Engynex atendiendo una consulta",
    },
    searchTitle: "¿Qué quieres saber?",
    browseTitle: "Explora por tema",
    browseSubtitle:
      "Elige un tema para ver sus preguntas. Cada servicio y producto enlaza a su página completa.",
    filterLabel: "Filtrar preguntas por tema",
    categories: {
      general: "General",
      payments: "Pagos y contratos",
      products: "Productos",
    },
    generalGroup: "Antes de empezar tu proyecto",
    paymentsGroup: "Pagos, contratos y garantía",
    productsGroup: "Implementación de productos",
    viewPage: "Ver página",
    countLabel: "{n} preguntas",
    helpTitle: "¿Necesitas más ayuda?",
    helpSubtitle:
      "En el centro de ayuda encuentras soporte por tema, y si prefieres hablar con una persona, te respondemos en menos de 24 horas hábiles.",
    helpCta: "Ir al centro de ayuda",
    contactCta: "Hablar con un asesor",
  },
  quote: {
    metaTitle: "Cotizar un proyecto",
    metaDescription:
      "Cuéntanos tu proyecto y recibe una propuesta a tu medida en menos de 24 horas hábiles. La cotización y la asesoría son gratis y sin compromiso.",
    hero: {
      eyebrow: "Cotizar",
      title: "Cuéntanos tu proyecto y recibe una propuesta a tu medida",
      subtitle:
        "Llena el formulario en un par de minutos. Un asesor revisa tu caso y te responde con los siguientes pasos.",
    },
    afterTitle: "Qué pasa después de enviar",
    afterSubtitle: "Tres pasos sencillos entre tu mensaje y una propuesta a la medida.",
    steps: [
      {
        title: "Te respondemos en menos de 24 horas",
        description:
          "Un asesor revisa tu mensaje y te contacta en menos de 24 horas hábiles. Si escribes por WhatsApp, normalmente en minutos.",
      },
      {
        title: "Agendamos una llamada de descubrimiento",
        description:
          "Conversamos sobre tu negocio, tus objetivos y tus plazos para entender bien lo que necesitas.",
      },
      {
        title: "Recibes tu propuesta, sin costo",
        description:
          "Te enviamos una propuesta a la medida con alcance, etapas y valor. La cotización y la asesoría son gratis y sin compromiso.",
      },
    ],
    formTitle: "Tu proyecto",
    formSubtitle: "Los campos de nombre, correo y mensaje son obligatorios.",
    pricesTitle: "Precios de referencia",
    pricesSubtitle:
      "Para que llegues con una idea del presupuesto: el valor de entrada de cada servicio. La propuesta final depende del alcance que acordemos.",
    seePlans: "Ver planes",
    faqTitle: "Antes de enviar",
    channelsTitle: "¿Prefieres otro canal?",
    channelsSubtitle: "Escríbenos o llámanos directamente; te atiende el mismo equipo.",
    hours: "Horario de atención",
  },
};

const en: CompanyBCopy = {
  process: {
    metaTitle: "Our process",
    metaDescription:
      "How we work at Engynex: discovery, strategy and design, development, launch and growth. Clear stages, continuous delivery and a written warranty.",
    hero: {
      eyebrow: "Our process",
      title: "From idea to launch, with no surprises",
      subtitle:
        "Four clear stages so you always know what we're working on, what comes next and what we need from you.",
      imageAlt: "Engynex team reviewing a project plan",
    },
    intro: {
      title: "Four stages, one team",
      subtitle:
        "Every project goes through the same stages, though how long each one takes depends on the scope. Each stage ends with something concrete you can review and approve before we move on.",
    },
    indicatorLabel: "Process stages",
    yourPart: [
      "You tell us about your business, your goals and what you want to achieve.",
      "You review the prototype and visual proposal, and give us your approval.",
      "You see progress at every demo and share your feedback.",
      "You sign off on the launch and decide the next improvements with us.",
    ],
    yourPartLabel: "Your part",
    durationLabel: "Duration and deliverable",
    withYou: {
      title: "How we work with you",
      subtitle:
        "A clear process only works if communication is clear too. This is what you can expect from us throughout the project.",
      rows: [
        {
          eyebrow: "Communication",
          title: "You always know where your project stands",
          description:
            "We reply in under 24 business hours and, during development, we show you a demo every two weeks. No waiting weeks without news.",
          imageAlt: "Follow-up meeting with a client",
          cta: "See frequently asked questions",
        },
        {
          eyebrow: "Deliveries and payments",
          title: "You pay for progress you can see",
          description:
            "One-off projects are billed 50% upfront and 50% on delivery; larger projects are split into milestones. Everything is put in writing before we start.",
          imageAlt: "Engynex office",
          cta: "Get a quote",
        },
        {
          eyebrow: "Warranty",
          title: "We stand behind what we deliver",
          description:
            "Every build includes a warranty against functional defects, between 2 and 6 months depending on the plan. We fix any fault attributable to our work at no cost.",
          imageAlt: "Technical support after launch",
          cta: "See maintenance plans",
        },
      ],
    },
    perService: {
      title: "Every service has its own process",
      subtitle:
        "A cybersecurity audit isn't run like an app build. Pick a service to see its stages, with the duration and deliverable of each one.",
      selectLabel: "Service",
      viewService: "See the full service",
    },
    trustTitle: "What we guarantee from the first contact",
  },
  team: {
    metaTitle: "The team",
    metaDescription:
      "Meet Engynex's four teams: development, design, marketing and audiovisual. In-house specialists working together on your project.",
    hero: {
      eyebrow: "The team",
      title: "The people who build your project",
      subtitle:
        "Engineers, designers, strategists and creatives in one place, so your project doesn't depend on a patchwork of vendors.",
      imageAlt: "Engynex design team working on a proposal",
    },
    intro: {
      title: "Four teams, one project",
      subtitle:
        "We organize our talent by specialty so each part of your project is handled by the people who know it best. And because everyone is in-house, they coordinate without middlemen.",
    },
    specs: {
      specialists: "In-house specialists",
      teams: "Specialized teams",
      services: "Services we cover",
      products: "Our own products",
    },
    teamDescriptions: [
      "Builds and runs your technology: websites, platforms, apps, integrations, cloud and security.",
      "Shapes your brand's experience and visual identity before any code is written.",
      "Gets your product in front of the right people and measures what's working.",
      "Produces the video, photography and motion that tell your story.",
    ],
    teamImageAlts: [
      "Developers working on code",
      "Designer working on an interface",
      "Marketing team reviewing a campaign",
      "Video production in a studio",
    ],
    seeServices: "See what they do",
    coverage: {
      title: "What each team does",
      subtitle:
        "These are the services each team leads. Most projects involve several teams at once.",
      servicesLabel: "Services they lead",
    },
    together: {
      eyebrow: "Working together",
      title: "A multidisciplinary team, not a chain of vendors",
      description:
        "When design, development and marketing work under the same roof, decisions are made together and nothing gets lost along the way.",
      imageAlt: "Engynex team in a work meeting",
      cta: "See our process",
    },
    join: {
      title: "Want to work with us?",
      description:
        "If you love building digital products and want to bring your talent, write to us telling us who you are and what you do.",
      cta: "Write to us",
      email: "Send an email",
    },
  },
  faq: {
    metaTitle: "Frequently asked questions",
    metaDescription:
      "All of Engynex's frequently asked questions in one place: quotes, payments, warranty, products and each of our services.",
    hero: {
      eyebrow: "Frequently asked questions",
      title: "Clear answers before you start",
      subtitle:
        "Everything people ask us about quotes, payments, warranty, products and each of our services, gathered in one place.",
      imageAlt: "Engynex advisor answering a question",
    },
    searchTitle: "What would you like to know?",
    browseTitle: "Browse by topic",
    browseSubtitle:
      "Pick a topic to see its questions. Each service and product links to its full page.",
    filterLabel: "Filter questions by topic",
    categories: {
      general: "General",
      payments: "Payments and contracts",
      products: "Products",
    },
    generalGroup: "Before you start your project",
    paymentsGroup: "Payments, contracts and warranty",
    productsGroup: "Product implementation",
    viewPage: "View page",
    countLabel: "{n} questions",
    helpTitle: "Need more help?",
    helpSubtitle:
      "The help center has support by topic, and if you'd rather talk to a person, we reply in under 24 business hours.",
    helpCta: "Go to the help center",
    contactCta: "Talk to an advisor",
  },
  quote: {
    metaTitle: "Get a quote",
    metaDescription:
      "Tell us about your project and get a tailored proposal in under 24 business hours. Quotes and advice are free, with no commitment.",
    hero: {
      eyebrow: "Get a quote",
      title: "Tell us about your project and get a tailored proposal",
      subtitle:
        "Fill in the form in a couple of minutes. An advisor reviews your case and gets back to you with the next steps.",
    },
    afterTitle: "What happens after you send it",
    afterSubtitle: "Three simple steps between your message and a tailored proposal.",
    steps: [
      {
        title: "We reply in under 24 hours",
        description:
          "An advisor reviews your message and contacts you within 24 business hours. On WhatsApp, usually within minutes.",
      },
      {
        title: "We schedule a discovery call",
        description:
          "We talk about your business, your goals and your timeline to fully understand what you need.",
      },
      {
        title: "You get your proposal, free",
        description:
          "We send you a tailored proposal with scope, stages and price. Quotes and advice are free, with no commitment.",
      },
    ],
    formTitle: "Your project",
    formSubtitle: "Name, email and message are required.",
    pricesTitle: "Reference prices",
    pricesSubtitle:
      "So you arrive with a budget in mind: the starting price of each service. The final proposal depends on the scope we agree on.",
    seePlans: "See plans",
    faqTitle: "Before you send",
    channelsTitle: "Prefer another channel?",
    channelsSubtitle: "Write or call us directly; the same team will help you.",
    hours: "Business hours",
  },
};

export const companyB: Record<Locale, CompanyBCopy> = { es, en };

/**
 * Servicios que lidera cada equipo (mismo orden que `aboutPage.team`):
 * Desarrollo, Diseño, Marketing y Audiovisual.
 */
export const teamServiceSlugs: string[][] = [
  [
    "desarrollo-web",
    "plataformas-web",
    "apps-moviles",
    "ecommerce",
    "integraciones-apis",
    "ia-automatizacion",
    "cloud-devops",
    "ciberseguridad",
    "hosting-mantenimiento",
    "soporte-ti",
    "alquiler-equipos",
    "consultoria-tech",
  ],
  ["ux-ui-branding"],
  ["marketing-digital", "data-analytics"],
  ["produccion-audiovisual"],
];

/** Identificador de ancla de cada equipo (mismo orden que `aboutPage.team`). */
export const teamAnchors = ["desarrollo", "diseno", "marketing", "audiovisual"];
