import type { Locale } from "./config";

const es = {
  meta: {
    titleDefault: "Engynex — Fábrica de desarrollo digital",
    titleTemplate: "%s | Engynex",
    description:
      "Fábrica de desarrollo digital: sitios web, plataformas, apps móviles, e-commerce, marketing, producción audiovisual e inteligencia artificial. Ingeniería digital para marcas que crecen.",
  },
  nav: {
    home: "Inicio",
    services: "Servicios",
    products: "Productos",
    portfolio: "Portafolio",
    about: "Nosotros",
    contact: "Contacto",
    cta: "Cotiza tu proyecto",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    menuLabel: "Menú",
    mega: {
      servicesTagline:
        "Del diseño al despliegue: un solo equipo para todo tu ecosistema digital.",
      productsTagline:
        "Software listo para implementar y adaptarse a la forma en que trabajas.",
      aboutTagline:
        "Ingeniería, diseño y estrategia trabajando en un mismo equipo.",
      viewAllServices: "Ver todos los servicios",
      viewAllProducts: "Ver todos los productos",
      viewAllAbout: "Conocer Engynex",
      featuredEyebrow: "Asesoría gratis",
      featuredTitle: "¿No sabes cuál necesitas?",
      featuredDesc:
        "Cuéntanos cómo opera tu empresa y te recomendamos la combinación exacta en menos de 24 horas.",
      featuredCta: "Habla con un experto",
      aboutFeaturedEyebrow: "Nuestro trabajo",
      aboutFeaturedTitle: "Mira lo que hemos construido",
      aboutFeaturedDesc:
        "Más de 120 proyectos entregados para marcas de distintas industrias en Latinoamérica.",
      aboutFeaturedCta: "Ver portafolio",
    },
  },
  badges: {
    top: "Más solicitado",
    popular: "Popular",
    new: "Nuevo",
  },
  common: {
    getStarted: "Empecemos",
    learnMore: "Conoce más",
    viewAll: "Ver todo",
    viewServices: "Ver servicios",
    contactUs: "Contáctanos",
    talkToUs: "Hablemos",
    langLabel: "Idioma",
    whatsapp: "Escríbenos por WhatsApp",
    backToTop: "Volver arriba",
    exploreServices: "Explorar servicios",
    servicesCount: "servicios",
    toggleTheme: "Cambiar tema",
  },
  chat: {
    title: "Engynex",
    status: "En línea · Respuesta inmediata",
    greeting:
      "¡Hola! 👋 Soy el asistente de Engynex. ¿En qué proyecto podemos ayudarte hoy?",
    reply:
      "¡Genial! Da clic en enviar y seguimos la conversación por WhatsApp con un asesor real.",
    quickReplies: [
      "Quiero una página web",
      "Necesito una app o plataforma",
      "Marketing digital",
      "Otro servicio",
    ],
    placeholder: "Escribe tu mensaje...",
    send: "Enviar por WhatsApp",
    open: "Abrir chat",
    close: "Cerrar chat",
    tab: "Contactar por WhatsApp",
    online: "En línea ahora",
    offline: "Fuera de horario · te respondemos al volver",
    pickTitle: "¿Con quién quieres hablar?",
    departments: [
      {
        key: "ventas",
        label: "Cotizar un proyecto",
        desc: "Web, apps, plataformas, marketing y más",
        message: "Hola, quiero cotizar un proyecto con Engynex.",
      },
      {
        key: "soporte",
        label: "Soporte técnico",
        desc: "Ya soy cliente y necesito ayuda",
        message: "Hola, soy cliente de Engynex y necesito soporte técnico.",
      },
      {
        key: "productos",
        label: "Demo de un producto",
        desc: "Chat, CRM, POS, inventarios y más",
        message: "Hola, quiero agendar una demo de un producto de Engynex.",
      },
      {
        key: "pagos",
        label: "Facturación y pagos",
        desc: "Facturas, pagos y planes",
        message: "Hola, tengo una consulta sobre facturación y pagos.",
      },
    ],
    messageLabel: "Tu mensaje",
    pageContext: "Lo escribo desde: {page}",
    openApp: "Abrir WhatsApp",
    qrTitle: "Continúa en tu celular",
    qrHint: "Escanea el código con la cámara de tu teléfono y el mensaje llegará listo para enviar.",
    openWeb: "Abrir WhatsApp Web",
    openDesktop: "Abrir la app de escritorio",
    back: "Cambiar de tema",
    privacy: "Al continuar, la conversación sigue en WhatsApp.",
    moveLeft: "Mover a la izquierda",
    moveRight: "Mover a la derecha",
  },
  trust: [
    {
      title: "Respuesta en 24 h",
      desc: "Te contactamos en menos de un día hábil.",
    },
    {
      title: "Sin compromiso",
      desc: "Cotización y asesoría 100% gratis.",
    },
    {
      title: "+120 proyectos",
      desc: "Experiencia comprobada que respalda tu inversión.",
    },
    {
      title: "Acompañamiento real",
      desc: "Soporte cercano antes, durante y después.",
    },
  ],
  hero: {
    badge: "Fábrica de desarrollo digital",
    titleLead: "Ingeniería digital para",
    titleHighlight: "marcas que quieren crecer",
    subtitle:
      "En Engynex diseñamos, desarrollamos y hacemos crecer tu presencia digital. Web, plataformas, apps, e-commerce, marketing, video e IA — todo bajo un mismo techo.",
    ctaPrimary: "Cotiza tu proyecto",
    ctaSecondary: "Ver servicios",
    stats: [
      { value: "+120", label: "Proyectos entregados" },
      { value: "+80", label: "Clientes felices" },
      { value: "16", label: "Servicios integrados" },
      { value: "10", label: "Años de experiencia" },
    ],
  },
  a11y: {
    tab: "Accesibilidad",
    title: "Accesibilidad",
    subtitle: "Ajusta el sitio a tu manera. Se guarda en este navegador.",
    textSize: "Tamaño del texto",
    sizes: ["Normal", "Grande", "Muy grande"],
    contrast: "Alto contraste",
    contrastDesc: "Texto más oscuro y bordes más visibles.",
    dyslexia: "Fuente para dislexia",
    dyslexiaDesc: "OpenDyslexic: letras con más peso abajo, más fáciles de distinguir.",
    spacing: "Más espacio entre líneas",
    spacingDesc: "Separa líneas, letras y palabras para leer con más calma.",
    links: "Subrayar enlaces",
    linksDesc: "Distingue los enlaces sin depender del color.",
    motion: "Pausar animaciones",
    motionDesc: "Detiene el carrusel, los efectos y el movimiento de fondo.",
    reset: "Restablecer",
    close: "Cerrar",
    note: "Tu sistema también puede pedir menos movimiento o más contraste: el sitio lo respeta.",
  },
  cookies: {
    title: "Tu privacidad en Engynex",
    text: "Usamos cookies y tecnologías similares para que el sitio funcione, recordar tus preferencias y, si lo permites, entender cómo se usa para mejorarlo. Puedes aceptarlas, rechazar las opcionales o elegir cuáles permitir.",
    policy: "Política de cookies",
    acceptAll: "Aceptar todas",
    rejectOptional: "Rechazar opcionales",
    customize: "Personalizar",
    settingsTitle: "Configuración de cookies",
    settingsText: "Elige qué cookies opcionales permites. Las necesarias siempre están activas porque sin ellas el sitio no funciona.",
    save: "Guardar preferencias",
    close: "Cerrar",
    alwaysOn: "Siempre activas",
    footerLink: "Configuración de cookies",
    categories: {
      necessary: {
        title: "Necesarias",
        desc: "Permiten navegar, recordar el idioma, el país y el tema que elegiste, y enviar formularios de forma segura.",
      },
      preferences: {
        title: "Preferencias",
        desc: "Recuerdan ajustes opcionales para personalizar tu experiencia en próximas visitas.",
      },
      analytics: {
        title: "Analítica",
        desc: "Nos ayudan a entender, de forma agregada, qué páginas se visitan para mejorar el sitio.",
      },
      marketing: {
        title: "Marketing",
        desc: "Permiten medir campañas y mostrarte anuncios relevantes en otros sitios.",
      },
    },
  },
  consent: {
    text: "Autorizo a Engynex a tratar mis datos personales para atender esta solicitud, de acuerdo con la",
    link: "Política de tratamiento de datos personales",
    required: "Debes aceptar el tratamiento de datos para continuar.",
  },
  company: {
    subnavLabel: "La empresa",
    exploreTitle: "Sigue conociendo Engynex",
  },
  help: {
    metaTitle: "Centro de ayuda",
    metaDescription:
      "Resuelve tus dudas sobre los servicios y productos de Engynex: cotizaciones, pagos, soporte técnico, hosting, planes y más.",
    titleLead: "Bienvenido al",
    titleHighlight: "Centro de ayuda de Engynex",
    searchLabel: "Buscar en el centro de ayuda",
    searchPlaceholder: "Escribe tu pregunta: hosting, pagos, garantía, soporte…",
    searchButton: "Buscar",
    resultsCount: "{n} resultados",
    noResults: "No encontramos respuestas para tu búsqueda. Escríbenos y te ayudamos.",
    noResultsCta: "Hablar con un asesor",
    groupService: "Servicio",
    groupProduct: "Producto",
    groupGeneral: "General",
    supportTitle: "Soporte de Engynex",
    supportSubtitle: "Encuentra ayuda sobre tu proyecto, tus servicios y tus productos.",
    quick: {
      payments: "Pagos y contratos",
      projects: "Antes de empezar",
      support: "Soporte técnico",
      hosting: "Hosting y dominios",
      products: "Productos",
      contact: "Contacto",
    },
    tiles: {
      supportTitle: "Soporte técnico para tu empresa",
      supportDesc:
        "Mesa de ayuda, mantenimiento de equipos y atención a incidentes con tiempos de respuesta acordados.",
      supportPrimary: "Ayuda de soporte técnico",
      supportSecondary: "Escribir por WhatsApp",
      hostingTitle: "Tu sitio web y hosting",
      hostingDesc: "Dominio, SSL, copias de seguridad, actualizaciones y cambios en tu sitio.",
      hostingPrimary: "Ayuda de hosting",
      securityTitle: "Seguridad y respaldo",
      securityDesc: "Protección de tus datos, accesos, copias de seguridad y respuesta a incidentes.",
      securityPrimary: "Ayuda de ciberseguridad",
      plansTitle: "Planes y precios",
      plansDesc: "Web por suscripción, pago único y planes de soporte: qué incluye cada uno.",
      plansPrimary: "Ver planes",
      processTitle: "Tu proyecto, paso a paso",
      processDesc: "Cómo trabajamos desde la primera reunión hasta el lanzamiento y la garantía.",
      processPrimary: "Ver el proceso",
    },
    servicesTitle: "Ayuda con tu servicio",
    servicesSubtitle: "Preguntas frecuentes de cada uno de nuestros 16 servicios.",
    productsTitle: "Ayuda con tu producto",
    faqTitle: "Preguntas frecuentes",
    paymentsTitle: "Pagos, contratos y garantía",
    projectsTitle: "Antes de empezar tu proyecto",
    productsFaqTitle: "Implementación de productos",
    moreTitle: "Explora más ayuda",
    more: {
      services: "Todos los servicios",
      products: "Todos los productos",
      portfolio: "Casos y portafolio",
      process: "Nuestro proceso",
      about: "Quiénes somos",
      webPlans: "Planes de página web",
      rental: "Alquiler de equipos",
      quote: "Cotizar un proyecto",
      whatsapp: "Soporte por WhatsApp",
    },
    contactTitle: "¿No encontraste lo que buscabas?",
    contactSubtitle: "Nuestro equipo te responde en menos de 24 horas hábiles.",
    whatsapp: "WhatsApp",
    whatsappDesc: "Respuesta en minutos en horario de atención.",
    email: "Correo",
    call: "Llámanos",
    hours: "Horario de atención",
  },
  region: {
    trigger: "Cambiar idioma y país",
    title: "Cambiar país/región e idioma",
    country: "País/región",
    language: "Idioma",
    cancel: "Cancelar",
    confirm: "Confirmar",
    close: "Cerrar",
    help: "Ayuda",
    countries: {
      CO: "Colombia",
      MX: "México",
      PE: "Perú",
      EC: "Ecuador",
      CL: "Chile",
      PA: "Panamá",
      US: "Estados Unidos",
      ES: "España",
    },
    languages: { es: "Español", en: "English" },
  },
  ui: {
    from: "Desde",
    quote: "Cotizar",
    demo: "Solicitar demo",
    faqTitle: "Preguntas frecuentes",
    prev: "Anterior",
    next: "Siguiente",
    viewAll: "Ver todo",
  },
  quickStart: {
    title: "Recibe una propuesta para tu proyecto",
    label: "Correo electrónico",
    placeholder: "tucorreo@empresa.com",
    submit: "Empezar",
    note: "Te respondemos en menos de 24 horas hábiles. Cotización y asesoría sin compromiso. Al continuar, aceptas que te contactemos sobre tu solicitud.",
  },
  homePage: {
    exploreTitle: "Explora servicios, productos y soluciones de Engynex",
    quote: "Cotizar",
    allServices: "Ver los 16 servicios",
    productsTitle: "Software listo para tu operación",
    viewProduct: "Ver producto",
    whyTitle: "¿Por qué elegir Engynex?",
    latestTitle: "Lo último de Engynex",
    subscriptionKicker: "Web por suscripción",
    railTitle: "Explora todo lo que hacemos",
    railSubtitle: "Dieciséis servicios que funcionan como un solo sistema.",
    aboutTitle: "Un solo equipo, de la idea al resultado",
  },
  heroSlides: {
    controls: {
      prev: "Anterior",
      next: "Siguiente",
      pause: "Pausar presentación",
      play: "Reproducir presentación",
      slideLabel: "Diapositiva",
    },
    common: {
      quote: "Cotizar ahora",
      demo: "Solicitar demo",
    },
    intro: {
      navLabel: "Fábrica digital",
      bullets: [
        "Estrategia, diseño y desarrollo en un solo equipo",
        "Entregas por etapas con fechas y costos claros",
        "Soporte y mejora continua después del lanzamiento",
      ],
    },
    services: {
      navLabel: "Servicios",
      eyebrow: "16 servicios especializados",
      titleLead: "Todo tu ecosistema digital",
      titleHighlight: "con un solo aliado",
      subtitle:
        "Web, plataformas, apps, e-commerce, marketing, video, IA, nube, seguridad, soporte y alquiler de equipos. Elige uno o combínalos: nosotros hacemos que funcionen como un solo sistema.",
      cta: "Explorar servicios",
      bullets: [
        "Construye: web, apps, plataformas y e-commerce",
        "Crece: UX/UI, marketing, video y datos",
        "Opera: nube, seguridad, soporte y equipos",
      ],
      proof: { value: "16", label: "servicios con un mismo equipo" },
    },
    products: {
      navLabel: "Productos",
      eyebrow: "Software listo para usar",
      titleLead: "Plataformas probadas,",
      titleHighlight: "funcionando en semanas",
      subtitle:
        "Chat empresarial, POS, CRM, inventarios, intranet, colegios y más. Partimos de una base ya construida y la adaptamos a tu operación.",
      cta: "Ver productos",
      bullets: [
        "Implementación en 2 a 8 semanas",
        "100% personalizable a tus procesos",
        "En la nube o en tu propio servidor",
        "Capacitación y soporte incluidos",
      ],
      proof: { value: "2–8", label: "semanas para salir en vivo" },
    },
    promo: {
      navLabel: "Web por suscripción",
      eyebrow: "Promoción vigente",
      titleLead: "Tu página web profesional",
      titleHighlight: "sin cuota inicial",
      subtitle:
        "Dominio, hosting, SSL, mantenimiento y soporte incluidos mientras tu plan esté activo. Arrancas hoy y pagas mes a mes.",
      cta: "Ver planes y precios",
    },
    rental: {
      navLabel: "Alquiler de equipos",
      eyebrow: "Nuevo servicio",
      titleLead: "Equipos y servidores",
      titleHighlight: "en arriendo",
      cta: "Ver el servicio",
      priceNote: "COP / mes por equipo",
    },
  },
  techStrip: {
    title: "Tecnologías con las que construimos",
    subtitle: "Stack estándar de la industria, sin inventos",
    groups: {
      product: "Producto y frontend",
      backend: "Backend y datos",
      cloud: "Nube e infraestructura",
      commerce: "Móvil y comercio",
    },
  },
  servicesSection: {
    eyebrow: "Qué hacemos",
    title: "Un solo aliado para todo tu ecosistema digital",
    subtitle:
      "Dieciséis servicios especializados que se integran para llevar tu idea del concepto al resultado, sin costuras entre equipos.",
  },
  productsSection: {
    eyebrow: "Productos",
    title: "Software listo para poner a trabajar hoy",
    subtitle:
      "Plataformas ya construidas y probadas —chat empresarial, POS, intranet, colegios, gestión de proyectos y más— que adaptamos a tu operación en semanas.",
    cta: "Ver todos los productos",
  },
  subscriptionBand: {
    eyebrow: "Nuevo",
    title: "Tu página web por suscripción",
    desc: "Dominio, hosting, SSL, mantenimiento y soporte incluidos mientras tu plan esté activo. Sin cuota inicial.",
    priceLabel: "Desde",
    priceNote: "COP / mes",
    cta: "Ver planes y precios",
  },
  featured: {
    eyebrow: "Portafolio",
    title: "Proyectos que generan resultados",
    subtitle: "Una selección de nuestro trabajo más reciente y su impacto.",
    cta: "Ver todo el portafolio",
  },
  clients: {
    eyebrow: "Confianza",
    title: "Empresas que confían en Engynex",
    subtitle:
      "Marcas grandes y negocios que están creciendo: todos necesitan que la tecnología funcione. Estas son algunas con las que hemos trabajado.",
    note: "Y más de 80 empresas en Colombia y Latinoamérica.",
    count: "+80",
    countLabel: "empresas atendidas en Colombia y Latinoamérica",
  },
  industries: {
    eyebrow: "Industrias",
    title: "Experiencia en los sectores que mueven la región",
    subtitle:
      "Entendemos los retos de cada industria y creamos soluciones a su medida.",
    items: [
      {
        name: "Retail & Consumo",
        icon: "ShoppingBag",
        desc: "Tienda en línea, POS e inventario hablando entre sí.",
      },
      {
        name: "Salud",
        icon: "HeartPulse",
        desc: "Agenda de citas, historia clínica y recordatorios.",
      },
      {
        name: "Educación",
        icon: "GraduationCap",
        desc: "Matrículas, notas y portal para acudientes.",
      },
      {
        name: "Fintech & Banca",
        icon: "Landmark",
        desc: "Integración de pagos, seguridad y trazabilidad.",
      },
      {
        name: "Inmobiliario",
        icon: "Building2",
        desc: "Portales de propiedades y CRM de prospectos.",
      },
      {
        name: "Logística",
        icon: "Truck",
        desc: "Rutas, trazabilidad y control de flota.",
      },
      {
        name: "Turismo & Hotelería",
        icon: "Plane",
        desc: "Reservas en línea y gestión de disponibilidad.",
      },
      {
        name: "Gastronomía",
        icon: "UtensilsCrossed",
        desc: "POS, domicilios y pedidos por WhatsApp.",
      },
    ],
  },
  whyUs: {
    eyebrow: "Por qué Engynex",
    title: "Ingeniería, diseño y estrategia en un mismo equipo",
    subtitle:
      "No somos una agencia más: somos tu fábrica de desarrollo. Combinamos disciplina de software con creatividad de marca.",
    items: [
      {
        title: "Equipo multidisciplinario",
        description:
          "Desarrolladores, diseñadores, estrategas y creativos trabajando coordinados en tu proyecto.",
      },
      {
        title: "Tecnología de punta",
        description:
          "Stack moderno y escalable: rendimiento, seguridad y mantenibilidad desde el día uno.",
      },
      {
        title: "Enfoque en resultados",
        description:
          "Cada decisión se mide. Diseñamos para convertir, vender y crecer, no solo para lucir bien.",
      },
      {
        title: "Acompañamiento real",
        description:
          "Comunicación clara, entregas a tiempo y soporte continuo después del lanzamiento.",
      },
    ],
  },
  process: {
    eyebrow: "Cómo trabajamos",
    title: "Un proceso claro, de la idea al lanzamiento",
    subtitle:
      "Metodología ágil y transparente para que sepas exactamente en qué punto está tu proyecto.",
    stepLabel: "Etapa",
    measureNote: "Medimos, ajustamos y volvemos a medir",
    steps: [
      {
        title: "Descubrimiento",
        description:
          "Entendemos tu negocio, objetivos y usuarios para definir el alcance ideal.",
        meta: "1 semana · Reunión de diagnóstico",
      },
      {
        title: "Estrategia & Diseño",
        description:
          "Prototipamos la experiencia y la identidad visual antes de escribir una línea de código.",
        meta: "1–2 semanas · Prototipo aprobado",
      },
      {
        title: "Desarrollo",
        description:
          "Construimos con sprints, entregas continuas y control de calidad en cada paso.",
        meta: "2–8 semanas · Demo cada 15 días",
      },
      {
        title: "Lanzamiento & Crecimiento",
        description:
          "Publicamos, medimos y optimizamos para que tu producto siga evolucionando.",
        meta: "Continuo · Métricas y mejoras",
      },
    ],
  },
  statsBand: {
    eyebrow: "Engynex en cifras",
    title: "Números que respaldan cada propuesta",
    subtitle:
      "No prometemos lo que no hemos hecho. Esto es lo que llevamos construido y cómo trabajamos.",
    items: [
      {
        value: "+120",
        label: "Proyectos entregados",
        detail: "Sitios, plataformas, apps y tiendas en producción.",
      },
      {
        value: "+80",
        label: "Clientes felices",
        detail: "98% vuelve a contratarnos para un segundo proyecto.",
      },
      {
        value: "16",
        label: "Servicios integrados",
        detail: "Del diseño al soporte, sin cambiar de proveedor.",
      },
      {
        value: "10",
        label: "Años de experiencia",
        detail: "Desde 2016 construyendo producto digital en LATAM.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Clientes",
    title: "Lo que dicen de trabajar con nosotros",
    subtitle:
      "Proyectos distintos, un mismo criterio: entregar algo que funcione y que se pueda medir.",
    ratingValue: "4.9 / 5",
    ratingNote: "Satisfacción promedio en los últimos 40 proyectos",
    prev: "Testimonio anterior",
    next: "Testimonio siguiente",
    items: [
      {
        quote:
          "Engynex transformó nuestra operación con una plataforma que realmente entiende nuestro negocio. Profesionalismo total.",
        name: "Laura Gómez",
        avatar: "/images/clients/laura-gomez.jpg",
        role: "COO, Nova Retail",
        company: "Nova Retail · Retail",
        metric: "+38% en pedidos en línea",
      },
      {
        quote:
          "Del branding a la app, todo con una coherencia impecable. Se sienten parte de nuestro equipo.",
        name: "Andrés Martínez",
        avatar: "/images/clients/andres-martinez.jpg",
        role: "CEO, Pulse Fitness",
        company: "Pulse Fitness · Bienestar",
        metric: "App con 4.8 en las tiendas",
      },
      {
        quote:
          "Entregaron a tiempo, con calidad y con datos que respaldan cada decisión. Volveríamos sin dudarlo.",
        name: "Carolina Ruiz",
        avatar: "/images/clients/carolina-ruiz.jpg",
        role: "Directora de Marketing, Vertex",
        company: "Vertex · Servicios",
        metric: "-45% en tiempo de reporte",
      },
      {
        quote:
          "Renovamos 45 equipos sin descapitalizarnos y el soporte responde el mismo día. Dejamos de perder horas por computadores lentos.",
        name: "Diego Ramírez",
        avatar: "/images/clients/diego-ramirez.jpg",
        role: "Gerente Administrativo",
        company: "Distribuciones Andina · Distribución",
        metric: "45 equipos renovados en 3 semanas",
      },
      {
        quote:
          "El POS por fin nos cuadró la caja de las cinco sedes. Antes cerrábamos con diferencias todas las semanas.",
        name: "Julián Restrepo",
        avatar: "/images/clients/julian-restrepo.jpg",
        role: "Directora de Operaciones",
        company: "Hotel Casa Bolívar · Hotelería",
        metric: "Cuadre de caja del 100%",
      },
    ],
  },
  ctaBand: {
    title: "¿Listo para llevar tu marca al siguiente nivel?",
    subtitle:
      "Cuéntanos tu idea y te ayudamos a convertirla en un producto digital que genera resultados.",
    primary: "Cotiza tu proyecto",
    secondary: "Ver portafolio",
  },
  servicesPage: {
    hero: {
      eyebrow: "Servicios",
      title: "Todo lo que tu marca necesita para crecer en digital",
      subtitle:
        "Desde una landing page hasta una plataforma completa con IA. Elige un servicio o combínalos: nosotros nos encargamos de que todo funcione como un solo sistema.",
    },
    featuresTitle: "Qué incluye",
    ctaService: "Cotizar este servicio",
    viewDetail: "Ver servicio",
    plans: {
      eyebrow: "Planes y precios",
      title: "Elige el plan que se ajusta a tu proyecto",
      subtitle:
        "Precios de referencia en pesos colombianos. Ajustamos el alcance a lo que realmente necesitas y te entregamos una cotización formal sin costo.",
      from: "Desde",
      monthly: "/mes",
      once: "pago único",
      custom: "A la medida",
      customPrice: "Cotización personalizada",
      includes: "Incluye",
      cta: "Solicitar cotización",
      ctaCustom: "Hablar con un asesor",
      note: "Los valores están en pesos colombianos (COP) y no incluyen IVA. El precio final depende del alcance acordado; la cotización y la asesoría no tienen costo.",
    },
    /** Secciones exclusivas de cada familia de servicio. */
    extras: {
      stack: {
        eyebrow: "Con qué lo construimos",
        title: "Tecnología estándar de la industria, no inventos",
        subtitle:
          "Usamos herramientas maduras y con comunidad detrás. Si mañana cambias de proveedor, cualquier equipo puede continuar el trabajo.",
      },
      gallery: {
        eyebrow: "Nuestro trabajo",
        title: "Piezas que hemos producido",
        subtitle:
          "Una muestra del acabado que puedes esperar en tu propio proyecto.",
      },
      sla: {
        eyebrow: "Compromisos de servicio",
        title: "Lo que garantizamos por escrito",
        subtitle:
          "Un servicio de operación se mide en tiempos y disponibilidad. Estos son los nuestros, y quedan en el contrato.",
      },
      useCases: {
        eyebrow: "Casos de uso",
        title: "Dónde se nota primero",
        subtitle:
          "Empezamos por lo que da resultado rápido y se puede medir desde el primer mes.",
      },
      catalog: {
        eyebrow: "Catálogo",
        title: "Qué puedes alquilar",
        subtitle:
          "Desde un puesto de trabajo hasta el rack completo. Si no está en la lista, pregúntanos: lo conseguimos.",
      },
    },
    /** Cierre del proceso cíclico (familia de operación). */
    opsLoop: "Y vuelve a empezar: este servicio no termina, se sostiene mes a mes.",
    status: { operational: "Operativo", monitored: "Monitoreo 24/7" },
    commonFaqsTitle: "Sobre trabajar con Engynex",
    commonFaqs: [
      {
        q: "¿Cómo son las formas de pago?",
        a: "En proyectos de pago único trabajamos con 50% de anticipo y 50% contra entrega; en proyectos grandes dividimos por hitos. Los planes mensuales se facturan al inicio de cada mes. Recibimos transferencia, PSE y tarjeta.",
      },
      {
        q: "¿Los precios incluyen IVA?",
        a: "No. Todos los valores publicados están en pesos colombianos antes de IVA. En la cotización formal verás el desglose completo.",
      },
      {
        q: "¿Qué garantía tiene el trabajo entregado?",
        a: "Todos los desarrollos incluyen garantía sobre errores de funcionamiento (entre 2 y 6 meses según el plan). Corregimos sin costo cualquier falla atribuible a nuestro trabajo.",
      },
      {
        q: "¿Debo firmar un contrato de permanencia?",
        a: "Los proyectos de pago único no tienen permanencia. Los planes mensuales se acuerdan por 3 o 12 meses según el servicio, y siempre queda por escrito antes de empezar.",
      },
      {
        q: "¿Trabajan con empresas fuera de Colombia?",
        a: "Sí. Atendemos clientes en toda Latinoamérica de forma remota y podemos facturar en dólares cuando se requiere.",
      },
    ],
    detail: {
      overviewTitle: "En qué consiste",
      benefitsTitle: "Por qué elegir Engynex",
      deliverablesTitle: "Qué recibes",
      faqsTitle: "Preguntas frecuentes",
      relatedTitle: "Otros servicios",
      back: "Volver a servicios",
      ctaTitle: "¿Hablamos de tu proyecto?",
      ctaSubtitle:
        "Cuéntanos qué necesitas y te enviamos una propuesta a tu medida en menos de 24 horas.",
    },
  },
  productsPage: {
    hero: {
      eyebrow: "Productos",
      title: "Software listo para tu empresa, adaptado a tu operación",
      subtitle:
        "Soluciones que ya funcionan en decenas de empresas: chat corporativo, POS, intranet, colegios, gestión de proyectos y mucho más. Las implementamos en semanas y las ajustamos a tus procesos.",
    },
    intro: {
      eyebrow: "Catálogo",
      title: "Elige tu producto y lo adaptamos a tu medida",
      subtitle:
        "Cada producto se entrega configurado, con tus datos migrados, tu marca aplicada y tu equipo capacitado.",
    },
    featuresTitle: "Qué incluye",
    audienceLabel: "Para quién",
    cta: "Solicitar demo",
    ctaAll: "Solicitar una demo",
    whyEyebrow: "Cómo lo entregamos",
    whyTitle: "Producto probado, implementación a tu medida",
    whySubtitle:
      "No empezamos de cero: partimos de una base sólida y la ajustamos a tu operación. Menos tiempo, menos riesgo, mismo resultado a la medida.",
    why: [
      {
        title: "En semanas, no en meses",
        description:
          "La base ya está construida y probada: nos concentramos en configurarla para tu negocio.",
      },
      {
        title: "100% personalizable",
        description:
          "Ajustamos módulos, campos, permisos y flujos para que encajen con tu forma de trabajar.",
      },
      {
        title: "En la nube o en tu servidor",
        description:
          "Tú eliges dónde vive tu información: nuestra infraestructura o la de tu empresa.",
      },
      {
        title: "Capacitación y soporte",
        description:
          "Acompañamos a tu equipo en la puesta en marcha y seguimos disponibles después del lanzamiento.",
      },
    ],
    customEyebrow: "Y mucho más",
    customTitle: "¿No encuentras el producto que necesitas?",
    customSubtitle:
      "Estos son solo los más solicitados. Si tu operación necesita algo distinto, lo diseñamos y construimos a la medida con el mismo equipo y la misma calidad.",
    customPrimary: "Cuéntanos tu necesidad",
    customSecondary: "Ver servicios de desarrollo",
    faqsTitle: "Preguntas frecuentes",
    faqsSubtitle: "Lo que más nos preguntan antes de implementar un producto.",
    faqs: [
      {
        q: "¿Cuánto tarda la implementación?",
        a: "Entre 2 y 8 semanas según el producto y el nivel de personalización. Te damos un cronograma exacto tras la primera reunión.",
      },
      {
        q: "¿Puedo pedir cambios y módulos nuevos?",
        a: "Sí. Todos nuestros productos son personalizables: ajustamos módulos, campos y flujos, y desarrollamos funcionalidades nuevas si las necesitas.",
      },
      {
        q: "¿Se integra con los sistemas que ya uso?",
        a: "Sí. Conectamos con tu ERP, CRM, pasarelas de pago, facturación y cualquier herramienta que exponga una API.",
      },
      {
        q: "¿Cómo se cobra: licencia o pago único?",
        a: "Manejamos ambos modelos: suscripción mensual con soporte incluido o pago único con el código a tu nombre. Te explicamos cuál conviene a tu caso.",
      },
    ],
    detail: {
      back: "Volver a productos",
      overviewTitle: "En qué consiste",
      modulesTitle: "Módulos incluidos",
      faqsTitle: "Preguntas sobre este producto",
      relatedTitle: "Otros productos que te pueden servir",
      allProducts: "Ver todos los productos",
      viewProduct: "Ver producto",
      demoNote: "Demo en vivo sin costo, en menos de 24 horas",
      ctaTitle: "¿Lo vemos funcionando con tus datos?",
      ctaSubtitle:
        "Agendamos una demo, entendemos tu operación y te enviamos la propuesta de implementación sin costo.",
    },
  },
  portfolioPage: {
    hero: {
      eyebrow: "Portafolio",
      title: "Proyectos que hablan por nosotros",
      subtitle:
        "Una muestra de cómo llevamos ideas de distintas industrias al mundo digital, con resultados medibles.",
    },
    all: "Todos",
    resultLabel: "Resultado",
    ctaTitle: "¿Tu proyecto es el siguiente?",
    ctaSubtitle: "Construyamos juntos algo que valga la pena mostrar.",
  },
  aboutPage: {
    hero: {
      eyebrow: "Nosotros",
      title: "Somos tu fábrica de desarrollo digital",
      subtitle:
        "Engynex nació para unir ingeniería, diseño y estrategia en un solo lugar. Ayudamos a empresas y emprendedores a construir productos digitales que crecen con ellos.",
    },
    mission: {
      title: "Misión",
      description:
        "Impulsar el crecimiento de nuestros clientes creando soluciones digitales de alta calidad, a la medida y orientadas a resultados.",
    },
    vision: {
      title: "Visión",
      description:
        "Ser la fábrica de desarrollo digital de referencia en Latinoamérica, reconocida por la excelencia técnica y creativa de nuestro trabajo.",
    },
    valuesTitle: "Nuestros valores",
    valuesSubtitle: "Los principios que guían cada proyecto que asumimos.",
    values: [
      {
        title: "Calidad sin excusas",
        description:
          "Hacemos las cosas bien, con estándares altos en código, diseño y comunicación.",
      },
      {
        title: "Transparencia",
        description:
          "Procesos claros, precios honestos y comunicación directa en cada etapa.",
      },
      {
        title: "Innovación",
        description:
          "Adoptamos las mejores tecnologías para darte una ventaja real.",
      },
      {
        title: "Compromiso",
        description:
          "Tu éxito es nuestro éxito. Nos involucramos como si el proyecto fuera nuestro.",
      },
    ],
    statsTitle: "Engynex en números",
    statsEyebrow: "Trayectoria",
    statsSubtitle:
      "Lo que hemos construido desde 2016, en cifras verificables.",
    stats: [
      {
        value: "+120",
        label: "Proyectos entregados",
        detail: "En 16 líneas de servicio y 8 industrias distintas.",
      },
      {
        value: "+80",
        label: "Clientes en 3 países",
        detail: "Colombia como base, atendiendo toda Latinoamérica.",
      },
      {
        value: "25",
        label: "Especialistas",
        detail: "Ingeniería, diseño, marketing y audiovisual en casa.",
      },
      {
        value: "98%",
        label: "Clientes que repiten",
        detail: "La mejor señal de que el trabajo quedó bien hecho.",
      },
    ],
    timelineTitle: "Nuestra historia",
    timelineSubtitle:
      "El camino que nos convirtió en tu fábrica de desarrollo digital.",
    timeline: [
      {
        year: "2016",
        title: "El comienzo",
        desc: "Nace Engynex con un pequeño equipo apasionado por crear productos digitales de calidad.",
      },
      {
        year: "2019",
        title: "Crecimiento",
        desc: "Ampliamos servicios a plataformas, apps y marketing, consolidando un equipo multidisciplinario.",
      },
      {
        year: "2022",
        title: "Expansión regional",
        desc: "Comenzamos a trabajar con clientes en toda Latinoamérica de forma remota.",
      },
      {
        year: "2026",
        title: "Hoy",
        desc: "Una fábrica de desarrollo integral con 16 servicios y más de 120 proyectos entregados.",
      },
    ],
    teamTitle: "El equipo detrás de Engynex",
    teamSubtitle:
      "Un grupo apasionado de ingenieros, diseñadores y estrategas.",
    team: [
      { name: "Equipo de Desarrollo", role: "Ingeniería de software" },
      { name: "Equipo de Diseño", role: "UX/UI & Branding" },
      { name: "Equipo de Marketing", role: "Growth & Contenido" },
      { name: "Equipo Audiovisual", role: "Video & Motion" },
    ],
  },
  contactPage: {
    hero: {
      eyebrow: "Contacto",
      title: "Hablemos de tu proyecto",
      subtitle:
        "Cuéntanos qué necesitas y te responderemos en menos de 24 horas hábiles con una propuesta a tu medida.",
    },
    form: {
      name: "Nombre completo",
      namePlaceholder: "Tu nombre",
      email: "Correo electrónico",
      emailPlaceholder: "tucorreo@empresa.com",
      company: "Empresa",
      companyPlaceholder: "Nombre de tu empresa",
      phone: "Teléfono / WhatsApp",
      phonePlaceholder: "+57 300 000 0000",
      service: "Servicio o producto de interés",
      servicePlaceholder: "Selecciona una opción",
      serviceGroupServices: "Servicios",
      serviceGroupProducts: "Productos",
      serviceOther: "Otro / No estoy seguro",
      message: "Cuéntanos sobre tu proyecto",
      messagePlaceholder: "Objetivos, plazos, referencias...",
      submit: "Enviar mensaje",
      sending: "Enviando...",
      successTitle: "¡Mensaje enviado!",
      successBody:
        "Gracias por escribirnos. Nuestro equipo se pondrá en contacto contigo muy pronto.",
      error:
        "Hubo un problema al enviar el formulario. Escríbenos directo a hola@engynex.com.",
      required: "Este campo es obligatorio",
      invalidEmail: "Ingresa un correo válido",
    },
    infoTitle: "Otras formas de contactarnos",
    info: {
      emailLabel: "Correo",
      phoneLabel: "Teléfono / WhatsApp",
      addressLabel: "Ubicación",
      address: "Colombia · Trabajamos con clientes en toda LATAM",
      hoursLabel: "Horario",
      hours: "Lun a Vie, 8:00 – 18:00 (GMT-5)",
    },
    channelsTitle: "Elige cómo prefieres hablar con nosotros",
    channelsSubtitle:
      "Estamos disponibles por el canal que te resulte más cómodo. Respuesta rápida garantizada.",
    channels: {
      whatsapp: { title: "WhatsApp", desc: "Chatea con un asesor ahora mismo." },
      email: { title: "Correo", desc: "Escríbenos y te respondemos hoy." },
      call: { title: "Llámanos", desc: "Hablemos por teléfono directo." },
      social: { title: "Redes sociales", desc: "Síguenos y escríbenos por DM." },
      action: "Abrir",
    },
    faqsTitle: "Preguntas frecuentes",
    faqsSubtitle: "Resolvemos las dudas más comunes antes de empezar.",
    faqs: [
      {
        q: "¿Cuánto tardan en responder?",
        a: "Respondemos en menos de 24 horas hábiles. Por WhatsApp normalmente en minutos.",
      },
      {
        q: "¿La cotización tiene costo?",
        a: "No. La cotización y la asesoría inicial son totalmente gratis y sin compromiso.",
      },
      {
        q: "¿Trabajan con clientes fuera de Colombia?",
        a: "Sí. Trabajamos de forma remota con clientes en toda Latinoamérica.",
      },
      {
        q: "¿Qué pasa después de que los contacto?",
        a: "Agendamos una llamada de descubrimiento, entendemos tu necesidad y te enviamos una propuesta a la medida.",
      },
    ],
  },
  footer: {
    tagline:
      "Tu fábrica de desarrollo digital. Diseñamos, desarrollamos y hacemos crecer tu marca.",
    servicesTitle: "Servicios",
    productsTitle: "Productos",
    companyTitle: "Empresa",
    contactTitle: "Contacto",
    followUs: "Síguenos",
    rights: "Todos los derechos reservados.",
    madeWith: "Hecho con ingeniería y pasión.",
    legalPrivacy: "Privacidad",
    legalTerms: "Términos",
    legalCookies: "Cookies",
    legalCenter: "Centro legal",
    plansTitle: "Planes",
    webPlans: "Página web por suscripción",
    supportPlans: "Planes de soporte TI",
    rentalPlans: "Alquiler de equipos",
    helpTitle: "Ayuda y soporte",
    helpCenter: "Centro de ayuda",
    faqs: "Preguntas frecuentes",
    techSupport: "Soporte técnico",
    quote: "Cotizar un proyecto",
    whatsapp: "Escríbenos por WhatsApp",
    portfolio: "Portafolio y casos",
    servicesAll: "Ver todos los servicios",
    productsAll: "Ver todos los productos",
    company: "Fábrica de desarrollo digital con sede en Colombia, al servicio de empresas en toda Latinoamérica.",
  },
};

const en = {
  meta: {
    titleDefault: "Engynex — Digital development factory",
    titleTemplate: "%s | Engynex",
    description:
      "Digital development factory: websites, platforms, mobile apps, e-commerce, marketing, audiovisual production and artificial intelligence. Digital engineering for growing brands.",
  },
  nav: {
    home: "Home",
    services: "Services",
    products: "Products",
    portfolio: "Portfolio",
    about: "About",
    contact: "Contact",
    cta: "Get a quote",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuLabel: "Menu",
    mega: {
      servicesTagline:
        "From design to deployment: one team for your entire digital ecosystem.",
      productsTagline:
        "Software that is ready to deploy and adapts to the way you work.",
      aboutTagline: "Engineering, design and strategy working as one team.",
      viewAllServices: "View all services",
      viewAllProducts: "View all products",
      viewAllAbout: "Get to know Engynex",
      featuredEyebrow: "Free advice",
      featuredTitle: "Not sure which one you need?",
      featuredDesc:
        "Tell us how your company runs and we'll recommend the exact combination in under 24 hours.",
      featuredCta: "Talk to an expert",
      aboutFeaturedEyebrow: "Our work",
      aboutFeaturedTitle: "See what we've built",
      aboutFeaturedDesc:
        "Over 120 projects delivered for brands across many industries in Latin America.",
      aboutFeaturedCta: "View portfolio",
    },
  },
  badges: {
    top: "Most requested",
    popular: "Popular",
    new: "New",
  },
  common: {
    getStarted: "Let's start",
    learnMore: "Learn more",
    viewAll: "View all",
    viewServices: "View services",
    contactUs: "Contact us",
    talkToUs: "Talk to us",
    langLabel: "Language",
    whatsapp: "Message us on WhatsApp",
    backToTop: "Back to top",
    exploreServices: "Explore services",
    servicesCount: "services",
    toggleTheme: "Toggle theme",
  },
  chat: {
    title: "Engynex",
    status: "Online · Instant reply",
    greeting:
      "Hi! 👋 I'm the Engynex assistant. What project can we help you with today?",
    reply:
      "Great! Hit send and we'll continue the conversation on WhatsApp with a real advisor.",
    quickReplies: [
      "I want a website",
      "I need an app or platform",
      "Digital marketing",
      "Another service",
    ],
    placeholder: "Type your message...",
    send: "Send via WhatsApp",
    open: "Open chat",
    close: "Close chat",
    tab: "Contact us on WhatsApp",
    online: "Online now",
    offline: "Outside business hours · we'll reply when we're back",
    pickTitle: "Who would you like to talk to?",
    departments: [
      {
        key: "ventas",
        label: "Request a quote",
        desc: "Web, apps, platforms, marketing and more",
        message: "Hi, I'd like a quote for a project with Engynex.",
      },
      {
        key: "soporte",
        label: "Technical support",
        desc: "I'm a client and need help",
        message: "Hi, I'm an Engynex client and I need technical support.",
      },
      {
        key: "productos",
        label: "Product demo",
        desc: "Chat, CRM, POS, inventory and more",
        message: "Hi, I'd like to book a demo of an Engynex product.",
      },
      {
        key: "pagos",
        label: "Billing and payments",
        desc: "Invoices, payments and plans",
        message: "Hi, I have a question about billing and payments.",
      },
    ],
    messageLabel: "Your message",
    pageContext: "Writing from: {page}",
    openApp: "Open WhatsApp",
    qrTitle: "Continue on your phone",
    qrHint: "Scan the code with your phone's camera and the message will be ready to send.",
    openWeb: "Open WhatsApp Web",
    openDesktop: "Open the desktop app",
    back: "Change topic",
    privacy: "If you continue, the conversation moves to WhatsApp.",
    moveLeft: "Move to the left",
    moveRight: "Move to the right",
  },
  trust: [
    {
      title: "24 h response",
      desc: "We get back to you within one business day.",
    },
    {
      title: "No commitment",
      desc: "Quote and advice, 100% free.",
    },
    {
      title: "+120 projects",
      desc: "Proven experience that backs your investment.",
    },
    {
      title: "Real support",
      desc: "Close support before, during and after.",
    },
  ],
  hero: {
    badge: "Digital development factory",
    titleLead: "Digital engineering for",
    titleHighlight: "brands that want to grow",
    subtitle:
      "At Engynex we design, build and grow your digital presence. Web, platforms, apps, e-commerce, marketing, video and AI — all under one roof.",
    ctaPrimary: "Get a quote",
    ctaSecondary: "View services",
    stats: [
      { value: "+120", label: "Projects delivered" },
      { value: "+80", label: "Happy clients" },
      { value: "16", label: "Integrated services" },
      { value: "10", label: "Years of experience" },
    ],
  },
  a11y: {
    tab: "Accessibility",
    title: "Accessibility",
    subtitle: "Adjust the site your way. Saved in this browser.",
    textSize: "Text size",
    sizes: ["Normal", "Large", "Extra large"],
    contrast: "High contrast",
    contrastDesc: "Darker text and more visible borders.",
    dyslexia: "Dyslexia-friendly font",
    dyslexiaDesc: "OpenDyslexic: weighted letter bottoms that are easier to tell apart.",
    spacing: "More line spacing",
    spacingDesc: "More space between lines, letters and words for calmer reading.",
    links: "Underline links",
    linksDesc: "Spot links without relying on color.",
    motion: "Pause animations",
    motionDesc: "Stops the carousel, effects and background motion.",
    reset: "Reset",
    close: "Close",
    note: "Your system can also ask for less motion or more contrast: the site respects it.",
  },
  cookies: {
    title: "Your privacy at Engynex",
    text: "We use cookies and similar technologies to make the site work, remember your preferences and, if you allow it, understand how it's used so we can improve it. You can accept them, reject the optional ones or choose which to allow.",
    policy: "Cookie Policy",
    acceptAll: "Accept all",
    rejectOptional: "Reject optional",
    customize: "Customize",
    settingsTitle: "Cookie settings",
    settingsText: "Choose which optional cookies you allow. Necessary cookies are always on because the site can't work without them.",
    save: "Save preferences",
    close: "Close",
    alwaysOn: "Always on",
    footerLink: "Cookie settings",
    categories: {
      necessary: {
        title: "Necessary",
        desc: "Let you browse, remember the language, country and theme you chose, and submit forms securely.",
      },
      preferences: {
        title: "Preferences",
        desc: "Remember optional settings to personalize your experience on future visits.",
      },
      analytics: {
        title: "Analytics",
        desc: "Help us understand, in aggregate, which pages are visited so we can improve the site.",
      },
      marketing: {
        title: "Marketing",
        desc: "Let us measure campaigns and show you relevant ads on other sites.",
      },
    },
  },
  consent: {
    text: "I authorize Engynex to process my personal data to handle this request, in accordance with the",
    link: "Personal Data Processing Policy",
    required: "You must accept the data processing terms to continue.",
  },
  company: {
    subnavLabel: "The company",
    exploreTitle: "Keep exploring Engynex",
  },
  help: {
    metaTitle: "Help Center",
    metaDescription:
      "Get answers about Engynex services and products: quotes, payments, technical support, hosting, plans and more.",
    titleLead: "Welcome to the",
    titleHighlight: "Engynex Help Center",
    searchLabel: "Search the help center",
    searchPlaceholder: "Type your question: hosting, payments, warranty, support…",
    searchButton: "Search",
    resultsCount: "{n} results",
    noResults: "We couldn't find answers for your search. Write to us and we'll help.",
    noResultsCta: "Talk to an advisor",
    groupService: "Service",
    groupProduct: "Product",
    groupGeneral: "General",
    supportTitle: "Engynex support",
    supportSubtitle: "Find help with your project, your services and your products.",
    quick: {
      payments: "Payments and contracts",
      projects: "Before you start",
      support: "Technical support",
      hosting: "Hosting and domains",
      products: "Products",
      contact: "Contact",
    },
    tiles: {
      supportTitle: "Technical support for your company",
      supportDesc:
        "Help desk, equipment maintenance and incident response with agreed response times.",
      supportPrimary: "Technical support help",
      supportSecondary: "Message us on WhatsApp",
      hostingTitle: "Your website and hosting",
      hostingDesc: "Domain, SSL, backups, updates and changes to your site.",
      hostingPrimary: "Hosting help",
      securityTitle: "Security and backup",
      securityDesc: "Protecting your data, access, backups and incident response.",
      securityPrimary: "Cybersecurity help",
      plansTitle: "Plans and pricing",
      plansDesc: "Website subscription, one-time payment and support plans: what each includes.",
      plansPrimary: "See plans",
      processTitle: "Your project, step by step",
      processDesc: "How we work from the first meeting to launch and warranty.",
      processPrimary: "See the process",
    },
    servicesTitle: "Get help with your service",
    servicesSubtitle: "Frequently asked questions for each of our 16 services.",
    productsTitle: "Get help with your product",
    faqTitle: "FAQs",
    paymentsTitle: "Payments, contracts and warranty",
    projectsTitle: "Before you start your project",
    productsFaqTitle: "Product rollout",
    moreTitle: "Explore more support",
    more: {
      services: "All services",
      products: "All products",
      portfolio: "Case studies and portfolio",
      process: "Our process",
      about: "About us",
      webPlans: "Website plans",
      rental: "Equipment rental",
      quote: "Request a quote",
      whatsapp: "WhatsApp support",
    },
    contactTitle: "Didn't find what you were looking for?",
    contactSubtitle: "Our team replies within 24 business hours.",
    whatsapp: "WhatsApp",
    whatsappDesc: "Replies in minutes during business hours.",
    email: "Email",
    call: "Call us",
    hours: "Business hours",
  },
  region: {
    trigger: "Change language and country",
    title: "Change country/region and language",
    country: "Country/region",
    language: "Language",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    help: "Help",
    countries: {
      CO: "Colombia",
      MX: "Mexico",
      PE: "Peru",
      EC: "Ecuador",
      CL: "Chile",
      PA: "Panama",
      US: "United States",
      ES: "Spain",
    },
    languages: { es: "Español", en: "English" },
  },
  ui: {
    from: "Starting at",
    quote: "Get a quote",
    demo: "Request a demo",
    faqTitle: "FAQs",
    prev: "Previous",
    next: "Next",
    viewAll: "View all",
  },
  quickStart: {
    title: "Get a proposal for your project",
    label: "Email",
    placeholder: "you@company.com",
    submit: "Get started",
    note: "We reply within 24 business hours. Free, no-commitment quote and advice. By continuing, you agree to be contacted about your request.",
  },
  homePage: {
    exploreTitle: "Explore Engynex services, products and solutions",
    quote: "Get a quote",
    allServices: "See all 16 services",
    productsTitle: "Software ready for your operation",
    viewProduct: "View product",
    whyTitle: "Why choose Engynex?",
    latestTitle: "The latest from Engynex",
    subscriptionKicker: "Website subscription",
    railTitle: "Explore everything we do",
    railSubtitle: "Sixteen services that work as a single system.",
    aboutTitle: "One team, from idea to results",
  },
  heroSlides: {
    controls: {
      prev: "Previous",
      next: "Next",
      pause: "Pause slideshow",
      play: "Play slideshow",
      slideLabel: "Slide",
    },
    common: {
      quote: "Get a quote",
      demo: "Request a demo",
    },
    intro: {
      navLabel: "Digital factory",
      bullets: [
        "Strategy, design and development in one team",
        "Staged delivery with clear dates and costs",
        "Support and continuous improvement after launch",
      ],
    },
    services: {
      navLabel: "Services",
      eyebrow: "16 specialized services",
      titleLead: "Your entire digital ecosystem",
      titleHighlight: "with one partner",
      subtitle:
        "Web, platforms, apps, e-commerce, marketing, video, AI, cloud, security, support and equipment rental. Pick one or combine them: we make them work as a single system.",
      cta: "Explore services",
      bullets: [
        "Build: web, apps, platforms and e-commerce",
        "Grow: UX/UI, marketing, video and data",
        "Run: cloud, security, support and equipment",
      ],
      proof: { value: "16", label: "services from a single team" },
    },
    products: {
      navLabel: "Products",
      eyebrow: "Ready-to-use software",
      titleLead: "Proven platforms,",
      titleHighlight: "running in weeks",
      subtitle:
        "Business chat, POS, CRM, inventory, intranet, school management and more. We start from a built base and adapt it to your operation.",
      cta: "View products",
      bullets: [
        "Rollout in 2 to 8 weeks",
        "100% customizable to your processes",
        "In the cloud or on your own server",
        "Training and support included",
      ],
      proof: { value: "2–8", label: "weeks to go live" },
    },
    promo: {
      navLabel: "Website subscription",
      eyebrow: "Current promotion",
      titleLead: "Your professional website",
      titleHighlight: "with no setup fee",
      subtitle:
        "Domain, hosting, SSL, maintenance and support included for as long as your plan is active. Start today and pay month to month.",
      cta: "See plans and pricing",
    },
    rental: {
      navLabel: "Equipment rental",
      eyebrow: "New service",
      titleLead: "Computers and servers",
      titleHighlight: "for rent",
      cta: "See the service",
      priceNote: "COP / month per device",
    },
  },
  techStrip: {
    title: "Technologies we build with",
    subtitle: "An industry-standard stack, no inventions",
    groups: {
      product: "Product & frontend",
      backend: "Backend & data",
      cloud: "Cloud & infrastructure",
      commerce: "Mobile & commerce",
    },
  },
  servicesSection: {
    eyebrow: "What we do",
    title: "One partner for your entire digital ecosystem",
    subtitle:
      "Sixteen specialized services that come together to take your idea from concept to result, with no seams between teams.",
  },
  productsSection: {
    eyebrow: "Products",
    title: "Software ready to put to work today",
    subtitle:
      "Platforms already built and proven —business chat, POS, intranet, school management, project management and more— that we adapt to your operation in weeks.",
    cta: "View all products",
  },
  subscriptionBand: {
    eyebrow: "New",
    title: "Your website on a subscription",
    desc: "Domain, hosting, SSL, maintenance and support included for as long as your plan is active. No setup fee.",
    priceLabel: "From",
    priceNote: "COP / month",
    cta: "See plans and pricing",
  },
  featured: {
    eyebrow: "Portfolio",
    title: "Work that delivers results",
    subtitle: "A selection of our most recent projects and their impact.",
    cta: "View the full portfolio",
  },
  clients: {
    eyebrow: "Trust",
    title: "Companies that trust Engynex",
    subtitle:
      "Large brands and growing businesses: they all need technology that works. These are some of the ones we've worked with.",
    note: "Plus more than 80 companies across Colombia and Latin America.",
    count: "+80",
    countLabel: "companies served across Colombia and Latin America",
  },
  industries: {
    eyebrow: "Industries",
    title: "Experience across the sectors that move the region",
    subtitle:
      "We understand the challenges of each industry and build tailored solutions.",
    items: [
      {
        name: "Retail & Consumer",
        icon: "ShoppingBag",
        desc: "Online store, POS and inventory talking to each other.",
      },
      {
        name: "Healthcare",
        icon: "HeartPulse",
        desc: "Appointment booking, patient records and reminders.",
      },
      {
        name: "Education",
        icon: "GraduationCap",
        desc: "Enrollment, grades and a portal for guardians.",
      },
      {
        name: "Fintech & Banking",
        icon: "Landmark",
        desc: "Payment integration, security and traceability.",
      },
      {
        name: "Real Estate",
        icon: "Building2",
        desc: "Property portals and lead management CRM.",
      },
      {
        name: "Logistics",
        icon: "Truck",
        desc: "Routing, traceability and fleet control.",
      },
      {
        name: "Travel & Hospitality",
        icon: "Plane",
        desc: "Online booking and availability management.",
      },
      {
        name: "Food & Restaurants",
        icon: "UtensilsCrossed",
        desc: "POS, delivery and WhatsApp ordering.",
      },
    ],
  },
  whyUs: {
    eyebrow: "Why Engynex",
    title: "Engineering, design and strategy in one team",
    subtitle:
      "We're not just another agency: we're your development factory. We blend software discipline with brand creativity.",
    items: [
      {
        title: "Multidisciplinary team",
        description:
          "Developers, designers, strategists and creatives working in sync on your project.",
      },
      {
        title: "Cutting-edge technology",
        description:
          "A modern, scalable stack: performance, security and maintainability from day one.",
      },
      {
        title: "Results-driven",
        description:
          "Every decision is measured. We design to convert, sell and grow — not just to look good.",
      },
      {
        title: "Real support",
        description:
          "Clear communication, on-time delivery and ongoing support after launch.",
      },
    ],
  },
  process: {
    eyebrow: "How we work",
    title: "A clear process, from idea to launch",
    subtitle:
      "An agile, transparent methodology so you always know exactly where your project stands.",
    stepLabel: "Stage",
    measureNote: "We measure, adjust and measure again",
    steps: [
      {
        title: "Discovery",
        description:
          "We understand your business, goals and users to define the ideal scope.",
        meta: "1 week · Discovery meeting",
      },
      {
        title: "Strategy & Design",
        description:
          "We prototype the experience and visual identity before writing a line of code.",
        meta: "1–2 weeks · Approved prototype",
      },
      {
        title: "Development",
        description:
          "We build in sprints, with continuous delivery and quality control at every step.",
        meta: "2–8 weeks · Demo every two weeks",
      },
      {
        title: "Launch & Growth",
        description:
          "We ship, measure and optimize so your product keeps evolving.",
        meta: "Ongoing · Metrics and improvements",
      },
    ],
  },
  statsBand: {
    eyebrow: "Engynex in numbers",
    title: "Numbers that back every proposal",
    subtitle:
      "We don't promise what we haven't done. This is what we've built and how we work.",
    items: [
      {
        value: "+120",
        label: "Projects delivered",
        detail: "Sites, platforms, apps and stores live in production.",
      },
      {
        value: "+80",
        label: "Happy clients",
        detail: "98% come back to us for a second project.",
      },
      {
        value: "16",
        label: "Integrated services",
        detail: "From design to support, without switching vendors.",
      },
      {
        value: "10",
        label: "Years of experience",
        detail: "Building digital products across LATAM since 2016.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Clients",
    title: "What it's like to work with us",
    subtitle:
      "Different projects, one standard: ship something that works and can be measured.",
    ratingValue: "4.9 / 5",
    ratingNote: "Average satisfaction across our last 40 projects",
    prev: "Previous testimonial",
    next: "Next testimonial",
    items: [
      {
        quote:
          "Engynex transformed our operation with a platform that truly understands our business. Total professionalism.",
        name: "Laura Gómez",
        avatar: "/images/clients/laura-gomez.jpg",
        role: "COO, Nova Retail",
        company: "Nova Retail · Retail",
        metric: "+38% in online orders",
      },
      {
        quote:
          "From branding to the app, everything with flawless consistency. They feel like part of our team.",
        name: "Andrés Martínez",
        avatar: "/images/clients/andres-martinez.jpg",
        role: "CEO, Pulse Fitness",
        company: "Pulse Fitness · Wellness",
        metric: "App rated 4.8 in the stores",
      },
      {
        quote:
          "Delivered on time, with quality and data backing every decision. We'd do it again without hesitation.",
        name: "Carolina Ruiz",
        avatar: "/images/clients/carolina-ruiz.jpg",
        role: "Marketing Director, Vertex",
        company: "Vertex · Services",
        metric: "-45% in reporting time",
      },
      {
        quote:
          "We refreshed 45 machines without tying up capital, and support answers the same day. We stopped losing hours to slow computers.",
        name: "Diego Ramírez",
        avatar: "/images/clients/diego-ramirez.jpg",
        role: "Administrative Manager",
        company: "Distribuciones Andina · Distribution",
        metric: "45 devices refreshed in 3 weeks",
      },
      {
        quote:
          "The POS finally balanced the cash across our five locations. We used to close with discrepancies every week.",
        name: "Julián Restrepo",
        avatar: "/images/clients/julian-restrepo.jpg",
        role: "Operations Director",
        company: "Hotel Casa Bolívar · Hospitality",
        metric: "100% cash reconciliation",
      },
    ],
  },
  ctaBand: {
    title: "Ready to take your brand to the next level?",
    subtitle:
      "Tell us your idea and we'll help you turn it into a digital product that drives results.",
    primary: "Get a quote",
    secondary: "View portfolio",
  },
  servicesPage: {
    hero: {
      eyebrow: "Services",
      title: "Everything your brand needs to grow online",
      subtitle:
        "From a landing page to a full AI-powered platform. Pick one service or combine them: we make sure everything works as a single system.",
    },
    featuresTitle: "What's included",
    ctaService: "Get a quote for this service",
    viewDetail: "View service",
    plans: {
      eyebrow: "Plans and pricing",
      title: "Choose the plan that fits your project",
      subtitle:
        "Reference prices in Colombian pesos. We adapt the scope to what you actually need and send you a formal quote at no cost.",
      from: "From",
      monthly: "/month",
      once: "one-time",
      custom: "Custom",
      customPrice: "Tailored quote",
      includes: "Includes",
      cta: "Request a quote",
      ctaCustom: "Talk to an advisor",
      note: "Values are in Colombian pesos (COP) and exclude VAT. The final price depends on the agreed scope; quotes and advice are always free.",
    },
    /** Sections exclusive to each service family. */
    extras: {
      stack: {
        eyebrow: "What we build it with",
        title: "Industry-standard technology, no inventions",
        subtitle:
          "We use mature tools with a community behind them. If you change vendors tomorrow, any team can pick up the work.",
      },
      gallery: {
        eyebrow: "Our work",
        title: "Pieces we've produced",
        subtitle:
          "A sample of the finish you can expect on your own project.",
      },
      sla: {
        eyebrow: "Service commitments",
        title: "What we guarantee in writing",
        subtitle:
          "An operations service is measured in response times and availability. These are ours, and they go in the contract.",
      },
      useCases: {
        eyebrow: "Use cases",
        title: "Where you'll notice it first",
        subtitle:
          "We start with what pays off fast and can be measured from the first month.",
      },
      catalog: {
        eyebrow: "Catalog",
        title: "What you can rent",
        subtitle:
          "From a single workstation to a full rack. If it's not on the list, ask us: we'll source it.",
      },
    },
    /** Closing line for the cyclical process (operations family). */
    opsLoop: "And it starts over: this service doesn't end, it's sustained month after month.",
    status: { operational: "Operational", monitored: "24/7 monitoring" },
    commonFaqsTitle: "About working with Engynex",
    commonFaqs: [
      {
        q: "What are the payment terms?",
        a: "For one-time projects we work with 50% upfront and 50% on delivery; large projects are split into milestones. Monthly plans are billed at the start of each month. We accept bank transfer, PSE and card.",
      },
      {
        q: "Do prices include VAT?",
        a: "No. All published values are in Colombian pesos before VAT. The formal quote shows the full breakdown.",
      },
      {
        q: "What warranty does the delivered work have?",
        a: "Every development includes a warranty on functional defects (2 to 6 months depending on the plan). We fix any failure attributable to our work at no cost.",
      },
      {
        q: "Do I have to sign a minimum-term contract?",
        a: "One-time projects have no minimum term. Monthly plans are agreed for 3 or 12 months depending on the service, and it's always in writing before we start.",
      },
      {
        q: "Do you work with companies outside Colombia?",
        a: "Yes. We serve clients across Latin America remotely and can invoice in US dollars when needed.",
      },
    ],
    detail: {
      overviewTitle: "What it's about",
      benefitsTitle: "Why choose Engynex",
      deliverablesTitle: "What you get",
      faqsTitle: "Frequently asked questions",
      relatedTitle: "Other services",
      back: "Back to services",
      ctaTitle: "Shall we talk about your project?",
      ctaSubtitle:
        "Tell us what you need and we'll send you a tailored proposal in under 24 hours.",
    },
  },
  productsPage: {
    hero: {
      eyebrow: "Products",
      title: "Ready-made software for your company, tailored to your operation",
      subtitle:
        "Solutions already running in dozens of companies: business chat, POS, intranet, school management, project management and much more. We deploy them in weeks and adapt them to your processes.",
    },
    intro: {
      eyebrow: "Catalog",
      title: "Pick your product and we tailor it to you",
      subtitle:
        "Every product is delivered configured, with your data migrated, your brand applied and your team trained.",
    },
    featuresTitle: "What's included",
    audienceLabel: "Who it's for",
    cta: "Request a demo",
    ctaAll: "Request a demo",
    whyEyebrow: "How we deliver",
    whyTitle: "Proven product, tailored implementation",
    whySubtitle:
      "We don't start from scratch: we begin with a solid base and adjust it to your operation. Less time, less risk, the same tailored result.",
    why: [
      {
        title: "In weeks, not months",
        description:
          "The core is already built and tested: we focus on configuring it for your business.",
      },
      {
        title: "100% customizable",
        description:
          "We adjust modules, fields, permissions and workflows to match the way you work.",
      },
      {
        title: "Cloud or your own server",
        description:
          "You choose where your data lives: our infrastructure or your company's.",
      },
      {
        title: "Training and support",
        description:
          "We guide your team through rollout and stay available long after launch.",
      },
    ],
    customEyebrow: "And much more",
    customTitle: "Can't find the product you need?",
    customSubtitle:
      "These are just the most requested ones. If your operation needs something different, we design and build it from scratch with the same team and the same quality.",
    customPrimary: "Tell us what you need",
    customSecondary: "See development services",
    faqsTitle: "Frequently asked questions",
    faqsSubtitle: "What clients ask us most before deploying a product.",
    faqs: [
      {
        q: "How long does implementation take?",
        a: "Between 2 and 8 weeks depending on the product and the level of customization. We give you an exact timeline after the first meeting.",
      },
      {
        q: "Can I request changes and new modules?",
        a: "Yes. All our products are customizable: we adjust modules, fields and workflows, and build new features whenever you need them.",
      },
      {
        q: "Does it integrate with the systems I already use?",
        a: "Yes. We connect to your ERP, CRM, payment gateways, invoicing and any tool that exposes an API.",
      },
      {
        q: "How is it priced: license or one-time payment?",
        a: "We offer both models: a monthly subscription with support included, or a one-time payment with the code in your name. We'll explain which fits your case.",
      },
    ],
    detail: {
      back: "Back to products",
      overviewTitle: "What it's about",
      modulesTitle: "Included modules",
      faqsTitle: "Questions about this product",
      relatedTitle: "Other products that may fit",
      allProducts: "View all products",
      viewProduct: "View product",
      demoNote: "Free live demo, in under 24 hours",
      ctaTitle: "Shall we see it running with your data?",
      ctaSubtitle:
        "We schedule a demo, understand your operation and send you the implementation proposal at no cost.",
    },
  },
  portfolioPage: {
    hero: {
      eyebrow: "Portfolio",
      title: "Projects that speak for us",
      subtitle:
        "A sample of how we bring ideas from different industries to the digital world, with measurable results.",
    },
    all: "All",
    resultLabel: "Result",
    ctaTitle: "Is your project next?",
    ctaSubtitle: "Let's build something worth showing off.",
  },
  aboutPage: {
    hero: {
      eyebrow: "About",
      title: "We are your digital development factory",
      subtitle:
        "Engynex was born to bring engineering, design and strategy together in one place. We help companies and entrepreneurs build digital products that grow with them.",
    },
    mission: {
      title: "Mission",
      description:
        "To drive our clients' growth by creating high-quality, custom, results-oriented digital solutions.",
    },
    vision: {
      title: "Vision",
      description:
        "To be the leading digital development factory in Latin America, recognized for the technical and creative excellence of our work.",
    },
    valuesTitle: "Our values",
    valuesSubtitle: "The principles that guide every project we take on.",
    values: [
      {
        title: "Quality, no excuses",
        description:
          "We do things right, with high standards in code, design and communication.",
      },
      {
        title: "Transparency",
        description:
          "Clear processes, honest pricing and direct communication at every stage.",
      },
      {
        title: "Innovation",
        description:
          "We adopt the best technologies to give you a real advantage.",
      },
      {
        title: "Commitment",
        description:
          "Your success is our success. We get involved as if the project were our own.",
      },
    ],
    statsTitle: "Engynex in numbers",
    statsEyebrow: "Track record",
    statsSubtitle: "What we've built since 2016, in verifiable numbers.",
    stats: [
      {
        value: "+120",
        label: "Projects delivered",
        detail: "Across 16 service lines and 8 different industries.",
      },
      {
        value: "+80",
        label: "Clients in 3 countries",
        detail: "Based in Colombia, serving all of Latin America.",
      },
      {
        value: "25",
        label: "Specialists",
        detail: "Engineering, design, marketing and video in-house.",
      },
      {
        value: "98%",
        label: "Returning clients",
        detail: "The clearest sign the work was done right.",
      },
    ],
    timelineTitle: "Our story",
    timelineSubtitle:
      "The path that made us your digital development factory.",
    timeline: [
      {
        year: "2016",
        title: "The beginning",
        desc: "Engynex is born with a small team passionate about building quality digital products.",
      },
      {
        year: "2019",
        title: "Growth",
        desc: "We expanded into platforms, apps and marketing, building a multidisciplinary team.",
      },
      {
        year: "2022",
        title: "Regional expansion",
        desc: "We started working remotely with clients across Latin America.",
      },
      {
        year: "2026",
        title: "Today",
        desc: "A full development factory with 16 services and over 120 projects delivered.",
      },
    ],
    teamTitle: "The team behind Engynex",
    teamSubtitle:
      "A passionate group of engineers, designers and strategists.",
    team: [
      { name: "Development Team", role: "Software engineering" },
      { name: "Design Team", role: "UX/UI & Branding" },
      { name: "Marketing Team", role: "Growth & Content" },
      { name: "Audiovisual Team", role: "Video & Motion" },
    ],
  },
  contactPage: {
    hero: {
      eyebrow: "Contact",
      title: "Let's talk about your project",
      subtitle:
        "Tell us what you need and we'll get back to you within 24 business hours with a tailored proposal.",
    },
    form: {
      name: "Full name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "you@company.com",
      company: "Company",
      companyPlaceholder: "Your company name",
      phone: "Phone / WhatsApp",
      phonePlaceholder: "+57 300 000 0000",
      service: "Service or product of interest",
      servicePlaceholder: "Select an option",
      serviceGroupServices: "Services",
      serviceGroupProducts: "Products",
      serviceOther: "Other / Not sure",
      message: "Tell us about your project",
      messagePlaceholder: "Goals, timeline, references...",
      submit: "Send message",
      sending: "Sending...",
      successTitle: "Message sent!",
      successBody:
        "Thanks for reaching out. Our team will get in touch with you very soon.",
      error:
        "There was a problem submitting the form. Write us directly at hola@engynex.com.",
      required: "This field is required",
      invalidEmail: "Enter a valid email",
    },
    infoTitle: "Other ways to reach us",
    info: {
      emailLabel: "Email",
      phoneLabel: "Phone / WhatsApp",
      addressLabel: "Location",
      address: "Colombia · Working with clients across LATAM",
      hoursLabel: "Hours",
      hours: "Mon to Fri, 8:00 – 18:00 (GMT-5)",
    },
    channelsTitle: "Choose how you'd like to talk to us",
    channelsSubtitle:
      "We're available on whichever channel is most convenient for you. Fast response guaranteed.",
    channels: {
      whatsapp: { title: "WhatsApp", desc: "Chat with an advisor right now." },
      email: { title: "Email", desc: "Write to us and we'll reply today." },
      call: { title: "Call us", desc: "Let's talk by phone directly." },
      social: { title: "Social media", desc: "Follow us and DM us anytime." },
      action: "Open",
    },
    faqsTitle: "Frequently asked questions",
    faqsSubtitle: "We answer the most common questions before we start.",
    faqs: [
      {
        q: "How soon do you reply?",
        a: "We reply within 24 business hours. On WhatsApp, usually within minutes.",
      },
      {
        q: "Is the quote free?",
        a: "Yes. The quote and initial advice are completely free and with no commitment.",
      },
      {
        q: "Do you work with clients outside Colombia?",
        a: "Yes. We work remotely with clients across Latin America.",
      },
      {
        q: "What happens after I contact you?",
        a: "We schedule a discovery call, understand your needs and send you a tailored proposal.",
      },
    ],
  },
  footer: {
    tagline:
      "Your digital development factory. We design, build and grow your brand.",
    servicesTitle: "Services",
    productsTitle: "Products",
    companyTitle: "Company",
    contactTitle: "Contact",
    followUs: "Follow us",
    rights: "All rights reserved.",
    madeWith: "Made with engineering and passion.",
    legalPrivacy: "Privacy",
    legalTerms: "Terms",
    legalCookies: "Cookies",
    legalCenter: "Legal Center",
    plansTitle: "Plans",
    webPlans: "Website subscription",
    supportPlans: "IT support plans",
    rentalPlans: "Equipment rental",
    helpTitle: "Help and support",
    helpCenter: "Help Center",
    faqs: "FAQs",
    techSupport: "Technical support",
    quote: "Request a quote",
    whatsapp: "Message us on WhatsApp",
    portfolio: "Portfolio and case studies",
    servicesAll: "See all services",
    productsAll: "See all products",
    company: "Digital development factory based in Colombia, serving companies across Latin America.",
  },
} satisfies typeof es;

export type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
