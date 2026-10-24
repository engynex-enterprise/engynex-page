import type { Locale } from "@/i18n/config";

/**
 * Textos de las páginas de empresa Misión y visión, Valores, Historia y
 * Cifras. Las cifras, fechas, valores, misión y visión NO se repiten aquí:
 * se leen de `aboutPage`, `whyUs`, `statsBand`… en i18n/dictionaries.ts y de
 * los archivos de contenido (servicios, productos, portafolio). Aquí solo
 * vive el texto explicativo y de posicionamiento.
 *
 * `{n}` se sustituye en la página por un conteo calculado a partir del
 * contenido (p. ej. el número de servicios).
 */

interface Link {
  label: string;
  /** Ruta relativa al idioma (sin /es o /en). */
  path: string;
}

interface Hero {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageAlt: string;
  metaDescription: string;
}

export interface CompanyACopy {
  /** Antetítulo/enlaces de uso común. */
  shared: {
    learnMore: string;
  };
  missionVision: {
    metaTitle: string;
    hero: Hero;
    missionKicker: string;
    missionNote: string;
    visionKicker: string;
    visionNote: string;
    meaningTitle: string;
    meaningSubtitle: string;
    /** Filas divididas: misión → oferta concreta. */
    rows: {
      eyebrow: string;
      title: string;
      description: string;
      image: string;
      imageAlt: string;
      link: Link;
    }[];
  };
  values: {
    metaTitle: string;
    hero: Hero;
    principlesTitle: string;
    principlesIntro: string;
    inPracticeLabel: string;
    expandLabel: string;
    collapseLabel: string;
    photoAlt: string;
    /** Viñetas por valor, en el mismo orden que `aboutPage.values`. */
    practice: string[][];
    rowTitle: string;
    rowSubtitle: string;
    /** Una tarjeta por valor (mismo orden): ejemplo concreto. */
    rowItems: { title: string; description: string; link: Link }[];
  };
  history: {
    metaTitle: string;
    hero: Hero;
    title: string;
    intro: string;
    axisLabel: string;
    carouselLabel: string;
    prev: string;
    next: string;
    milestoneOf: string;
    /** Texto alternativo de la foto de cada hito, mismo orden que `aboutPage.timeline`. */
    milestoneAlts: string[];
    todayKicker: string;
    todayTitle: string;
    todaySubtitle: string;
    servicesLabel: string;
    servicesDesc: string;
    productsLabel: string;
    productsDesc: string;
    servicesLink: string;
    productsLink: string;
  };
  numbers: {
    metaTitle: string;
    hero: Hero;
    behindKicker: string;
    behindTitle: string;
    behindSubtitle: string;
    resultLabel: string;
    portfolioLink: string;
    countsTitle: string;
    countsSubtitle: string;
    countServices: string;
    countProducts: string;
    countIndustries: string;
    countTeams: string;
  };
}

const es: CompanyACopy = {
  shared: {
    learnMore: "Conoce más",
  },
  missionVision: {
    metaTitle: "Misión y visión",
    hero: {
      eyebrow: "Misión y visión",
      title: "Hacia dónde vamos y por qué lo hacemos",
      subtitle:
        "Nuestra misión define cómo trabajamos cada día; nuestra visión, el tipo de empresa que queremos ser para Latinoamérica.",
      imageAlt: "Espacio de trabajo luminoso con vista a la ciudad",
      metaDescription:
        "Conoce la misión y la visión de Engynex, fábrica de desarrollo digital en Colombia, y lo que significan para tu empresa.",
    },
    missionKicker: "Nuestra misión",
    missionNote:
      "En la práctica, esto significa que no entregamos plantillas ni paquetes genéricos: partimos de cómo opera tu empresa y medimos el trabajo por lo que logra.",
    visionKicker: "Nuestra visión",
    visionNote:
      "Queremos que la referencia se gane con trabajo bien hecho: código sólido, diseño cuidado y clientes que vuelven a confiar en nosotros.",
    meaningTitle: "Qué significa para tu empresa",
    meaningSubtitle:
      "Una misión solo vale si se nota en el día a día. Así se traduce en lo que hacemos por ti.",
    rows: [
      {
        eyebrow: "A la medida",
        title: "Soluciones pensadas para tu operación",
        description:
          "Antes de proponer, entendemos tu negocio. Sitios, plataformas y apps se diseñan alrededor de tus procesos, no al revés.",
        image: "/images/svc-desarrollo-web.jpg",
        imageAlt: "Código fuente de un desarrollo a la medida en pantalla",
        link: { label: "Ver los {n} servicios", path: "servicios" },
      },
      {
        eyebrow: "Alta calidad",
        title: "Software listo para trabajar desde el primer día",
        description:
          "Además de proyectos a la medida, tenemos productos que se implementan y se adaptan a tu forma de trabajar: atención, ventas, operación y equipos.",
        image: "/images/svc-ecommerce.jpg",
        imageAlt: "Punto de venta en funcionamiento en un comercio",
        link: { label: "Conocer los {n} productos", path: "productos" },
      },
      {
        eyebrow: "Orientadas a resultados",
        title: "Cada proyecto se mide por lo que logra",
        description:
          "Definimos desde el inicio qué debe mejorar: ventas, tiempos de respuesta, procesos automatizados. Luego lo medimos y lo mostramos.",
        image: "/images/portfolio-1.jpg",
        imageAlt: "Cliente pagando con tarjeta en una tienda en línea",
        link: { label: "Ver casos y resultados", path: "portafolio" },
      },
      {
        eyebrow: "Crecimiento",
        title: "Un aliado que se queda después del lanzamiento",
        description:
          "Impulsar tu crecimiento no termina el día de la entrega. Acompañamos con soporte, mejoras y nuevas etapas cuando tu negocio las necesite.",
        image: "/images/about-meeting.jpg",
        imageAlt: "Equipo trabajando con portátiles alrededor de una mesa",
        link: { label: "Hablar con un experto", path: "contacto" },
      },
    ],
  },
  values: {
    metaTitle: "Nuestros valores",
    hero: {
      eyebrow: "Nuestros valores",
      title: "Los principios detrás de cada proyecto",
      subtitle:
        "Cuatro valores que guían cómo decidimos, cómo construimos y cómo nos relacionamos con cada cliente.",
      imageAlt: "Equipo trabajando con portátiles alrededor de una mesa",
      metaDescription:
        "Calidad, transparencia, innovación y compromiso: los valores de Engynex y cómo se ven en cada proyecto.",
    },
    principlesTitle: "Nuestros principios",
    principlesIntro:
      "No son frases para la pared. Son los criterios que usamos cuando hay que elegir entre hacerlo rápido o hacerlo bien, entre decir lo cómodo o decir lo cierto.",
    inPracticeLabel: "Cómo se ve en tu proyecto",
    expandLabel: "Mostrar detalle",
    collapseLabel: "Ocultar detalle",
    photoAlt: "Integrantes del equipo de Engynex trabajando juntos",
    practice: [
      [
        "Revisión de código y pruebas antes de cada entrega.",
        "Diseño responsive y accesible desde el primer prototipo.",
        "Documentación clara para que tu equipo pueda operar lo entregado.",
      ],
      [
        "Alcance, fechas y costos por etapas, acordados antes de empezar.",
        "Demos periódicas para que veas el avance real, no solo informes.",
        "Te decimos lo que no conviene hacer, aunque no nos convenga a nosotros.",
      ],
      [
        "Elegimos tecnología moderna y escalable, no la de moda.",
        "Proponemos automatización e IA donde ahorran tiempo de verdad.",
        "Probamos ideas con prototipos antes de invertir en desarrollo.",
      ],
      [
        "Un equipo que conoce tu negocio y responde por el resultado.",
        "Soporte cercano antes, durante y después del lanzamiento.",
        "Seguimos midiendo y mejorando cuando el proyecto ya está en producción.",
      ],
    ],
    rowTitle: "Los valores, en la práctica",
    rowSubtitle:
      "Así se notan cuando trabajas con nosotros, de la primera reunión al soporte.",
    rowItems: [
      {
        title: "Entregables que puedes revisar",
        description:
          "Prototipos, demos y documentación: cada etapa deja algo concreto que validar antes de seguir.",
        link: { label: "Ver servicios", path: "servicios" },
      },
      {
        title: "Una propuesta sin letra pequeña",
        description:
          "Cotización y asesoría sin compromiso, con el alcance explicado en lenguaje claro.",
        link: { label: "Pedir una cotización", path: "contacto" },
      },
      {
        title: "IA y automatización con propósito",
        description:
          "Aplicamos inteligencia artificial donde reduce trabajo repetitivo o mejora la atención a tus clientes.",
        link: { label: "IA y automatización", path: "servicios/ia-automatizacion" },
      },
      {
        title: "Acompañamiento después del lanzamiento",
        description:
          "Hosting, mantenimiento y soporte para que tu producto siga funcionando y evolucionando.",
        link: {
          label: "Hosting y mantenimiento",
          path: "servicios/hosting-mantenimiento",
        },
      },
    ],
  },
  history: {
    metaTitle: "Nuestra historia",
    hero: {
      eyebrow: "Nuestra historia",
      title: "De un equipo pequeño a una fábrica de desarrollo digital",
      subtitle:
        "El camino que recorrimos desde 2016 para unir ingeniería, diseño y estrategia en un solo lugar.",
      imageAlt: "Composición abstracta de formas digitales",
      metaDescription:
        "La historia de Engynex desde 2016: cómo pasamos de un pequeño equipo a una fábrica de desarrollo digital con clientes en Latinoamérica.",
    },
    title: "Nuestra historia",
    intro:
      "Cada etapa sumó capacidades nuevas sin perder lo que nos trajo hasta aquí: hacer productos digitales de calidad y acompañar a quien los usa. Recorre los hitos año por año.",
    axisLabel: "Línea de tiempo por año",
    carouselLabel: "Hitos de Engynex",
    prev: "Hito anterior",
    next: "Hito siguiente",
    milestoneOf: "Hito {i} de {n}",
    milestoneAlts: [
      "Integrantes del equipo celebrando un logro",
      "Equipo multidisciplinario trabajando alrededor de una mesa",
      "Equipo trabajando en proyectos para clientes de la región",
      "Espacio de trabajo luminoso con vista a la ciudad",
    ],
    todayKicker: "Hoy",
    todayTitle: "Una oferta completa, bajo un mismo techo",
    todaySubtitle:
      "Lo que empezó como un equipo pequeño hoy cubre todo el ciclo digital de una empresa: construir, diseñar, crecer y operar.",
    servicesLabel: "servicios",
    servicesDesc:
      "Web, plataformas, apps, e-commerce, marketing, video, IA, cloud, ciberseguridad y soporte.",
    productsLabel: "productos",
    productsDesc:
      "Software listo para implementar: atención y ventas, operación y finanzas, equipos e instituciones.",
    servicesLink: "Ver servicios",
    productsLink: "Ver productos",
  },
  numbers: {
    metaTitle: "Engynex en cifras",
    hero: {
      eyebrow: "Engynex en cifras",
      title: "Números que respaldan cada propuesta",
      subtitle:
        "Proyectos, clientes y resultados medibles. Esto es lo que llevamos construido.",
      imageAlt: "Tablero de analítica con gráficos de resultados",
      metaDescription:
        "Engynex en cifras: proyectos entregados, clientes en Latinoamérica, especialistas y resultados reales de nuestro portafolio.",
    },
    behindKicker: "Detrás de las cifras",
    behindTitle: "Resultados reales, proyecto por proyecto",
    behindSubtitle:
      "Los números generales salen de casos concretos. Estos son algunos y lo que lograron.",
    resultLabel: "Resultado",
    portfolioLink: "Ver todo el portafolio",
    countsTitle: "Lo que hay detrás de cada entrega",
    countsSubtitle:
      "La capacidad con la que respondemos a proyectos de cualquier tamaño.",
    countServices: "Servicios integrados",
    countProducts: "Productos de software",
    countIndustries: "Industrias atendidas",
    countTeams: "Equipos especializados",
  },
};

const en: CompanyACopy = {
  shared: {
    learnMore: "Learn more",
  },
  missionVision: {
    metaTitle: "Mission and vision",
    hero: {
      eyebrow: "Mission and vision",
      title: "Where we're going and why we do it",
      subtitle:
        "Our mission shapes how we work every day; our vision, the kind of company we want to be for Latin America.",
      imageAlt: "Bright workspace overlooking the city",
      metaDescription:
        "Learn about the mission and vision of Engynex, a digital development factory in Colombia, and what they mean for your business.",
    },
    missionKicker: "Our mission",
    missionNote:
      "In practice, this means we don't deliver templates or generic packages: we start from how your business runs and measure the work by what it achieves.",
    visionKicker: "Our vision",
    visionNote:
      "We want to earn that reputation through good work: solid code, careful design and clients who choose to work with us again.",
    meaningTitle: "What it means for your business",
    meaningSubtitle:
      "A mission only matters if you can see it day to day. Here's how it translates into what we do for you.",
    rows: [
      {
        eyebrow: "Tailored",
        title: "Solutions designed around your operation",
        description:
          "Before we propose anything, we understand your business. Sites, platforms and apps are designed around your processes, not the other way around.",
        image: "/images/svc-desarrollo-web.jpg",
        imageAlt: "Source code for a custom build on screen",
        link: { label: "See all {n} services", path: "servicios" },
      },
      {
        eyebrow: "High quality",
        title: "Software that works from day one",
        description:
          "Beyond custom projects, we offer products you can deploy and adapt to the way you work: customer service, sales, operations and teams.",
        image: "/images/svc-ecommerce.jpg",
        imageAlt: "Point of sale in use at a store",
        link: { label: "Explore the {n} products", path: "productos" },
      },
      {
        eyebrow: "Results-driven",
        title: "Every project is measured by what it achieves",
        description:
          "From the start we define what should improve: sales, response times, automated processes. Then we measure it and show it to you.",
        image: "/images/portfolio-1.jpg",
        imageAlt: "Customer paying by card in an online store",
        link: { label: "See cases and results", path: "portafolio" },
      },
      {
        eyebrow: "Growth",
        title: "A partner who stays after launch",
        description:
          "Driving your growth doesn't end on delivery day. We stay with you through support, improvements and new phases whenever your business needs them.",
        image: "/images/about-meeting.jpg",
        imageAlt: "Team working on laptops around a table",
        link: { label: "Talk to an expert", path: "contacto" },
      },
    ],
  },
  values: {
    metaTitle: "Our values",
    hero: {
      eyebrow: "Our values",
      title: "The principles behind every project",
      subtitle:
        "Four values that guide how we decide, how we build and how we work with every client.",
      imageAlt: "Team working on laptops around a table",
      metaDescription:
        "Quality, transparency, innovation and commitment: Engynex's values and how they show up in every project.",
    },
    principlesTitle: "Our principles",
    principlesIntro:
      "They're not slogans for the wall. They're the criteria we use when we have to choose between doing it fast or doing it right, between saying what's comfortable or saying what's true.",
    inPracticeLabel: "How it shows up in your project",
    expandLabel: "Show details",
    collapseLabel: "Hide details",
    photoAlt: "Engynex team members working together",
    practice: [
      [
        "Code review and testing before every delivery.",
        "Responsive, accessible design from the very first prototype.",
        "Clear documentation so your team can run what we deliver.",
      ],
      [
        "Scope, dates and costs by phase, agreed before we start.",
        "Regular demos so you see real progress, not just reports.",
        "We tell you what isn't worth doing, even when it doesn't benefit us.",
      ],
      [
        "We choose modern, scalable technology, not whatever is trendy.",
        "We propose automation and AI where they genuinely save time.",
        "We test ideas with prototypes before investing in development.",
      ],
      [
        "A team that knows your business and owns the outcome.",
        "Close support before, during and after launch.",
        "We keep measuring and improving once the project is live.",
      ],
    ],
    rowTitle: "Our values, in practice",
    rowSubtitle:
      "This is how you notice them when you work with us, from the first meeting to ongoing support.",
    rowItems: [
      {
        title: "Deliverables you can review",
        description:
          "Prototypes, demos and documentation: each phase leaves something concrete to validate before moving on.",
        link: { label: "See services", path: "servicios" },
      },
      {
        title: "A proposal with no fine print",
        description:
          "Free, no-commitment quotes and advice, with the scope explained in plain language.",
        link: { label: "Request a quote", path: "contacto" },
      },
      {
        title: "AI and automation with a purpose",
        description:
          "We apply artificial intelligence where it cuts repetitive work or improves how you serve your customers.",
        link: { label: "AI and automation", path: "servicios/ia-automatizacion" },
      },
      {
        title: "Support after launch",
        description:
          "Hosting, maintenance and support so your product keeps running and evolving.",
        link: {
          label: "Hosting and maintenance",
          path: "servicios/hosting-mantenimiento",
        },
      },
    ],
  },
  history: {
    metaTitle: "Our story",
    hero: {
      eyebrow: "Our story",
      title: "From a small team to a digital development factory",
      subtitle:
        "The path we've taken since 2016 to bring engineering, design and strategy together in one place.",
      imageAlt: "Abstract composition of digital shapes",
      metaDescription:
        "The story of Engynex since 2016: how we grew from a small team into a digital development factory with clients across Latin America.",
    },
    title: "Our story",
    intro:
      "Each stage added new capabilities without losing what brought us here: building quality digital products and supporting the people who use them. Walk through the milestones year by year.",
    axisLabel: "Timeline by year",
    carouselLabel: "Engynex milestones",
    prev: "Previous milestone",
    next: "Next milestone",
    milestoneOf: "Milestone {i} of {n}",
    milestoneAlts: [
      "Team members celebrating an achievement",
      "Multidisciplinary team working around a table",
      "Team working on projects for clients across the region",
      "Bright workspace overlooking the city",
    ],
    todayKicker: "Today",
    todayTitle: "A complete offering, under one roof",
    todaySubtitle:
      "What started as a small team now covers a company's entire digital cycle: build, design, grow and operate.",
    servicesLabel: "services",
    servicesDesc:
      "Web, platforms, apps, e-commerce, marketing, video, AI, cloud, cybersecurity and support.",
    productsLabel: "products",
    productsDesc:
      "Ready-to-deploy software: customer service and sales, operations and finance, teams and institutions.",
    servicesLink: "See services",
    productsLink: "See products",
  },
  numbers: {
    metaTitle: "Engynex in numbers",
    hero: {
      eyebrow: "Engynex in numbers",
      title: "Numbers behind every proposal",
      subtitle:
        "Projects, clients and measurable results. This is what we've built so far.",
      imageAlt: "Analytics dashboard with results charts",
      metaDescription:
        "Engynex in numbers: projects delivered, clients across Latin America, specialists and real results from our portfolio.",
    },
    behindKicker: "Behind the numbers",
    behindTitle: "Real results, project by project",
    behindSubtitle:
      "The overall numbers come from specific cases. Here are some of them and what they achieved.",
    resultLabel: "Result",
    portfolioLink: "See the full portfolio",
    countsTitle: "What's behind every delivery",
    countsSubtitle:
      "The capabilities we bring to projects of any size.",
    countServices: "Integrated services",
    countProducts: "Software products",
    countIndustries: "Industries served",
    countTeams: "Specialized teams",
  },
};

export const companyA: Record<Locale, CompanyACopy> = { es, en };

/** Sustituye `{clave}` por su valor. */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
