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
    portfolio: "Portafolio",
    about: "Nosotros",
    contact: "Contacto",
    cta: "Cotiza tu proyecto",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
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
      { value: "8", label: "Servicios integrados" },
      { value: "10", label: "Años de experiencia" },
    ],
  },
  techStrip: {
    title: "Tecnologías con las que construimos",
  },
  servicesSection: {
    eyebrow: "Qué hacemos",
    title: "Un solo aliado para todo tu ecosistema digital",
    subtitle:
      "Quince servicios especializados que se integran para llevar tu idea del concepto al resultado, sin costuras entre equipos.",
  },
  featured: {
    eyebrow: "Portafolio",
    title: "Proyectos que generan resultados",
    subtitle: "Una selección de nuestro trabajo más reciente y su impacto.",
    cta: "Ver todo el portafolio",
  },
  clients: {
    title: "Empresas que confían en Engynex",
    names: ["Nova Retail", "Pulse", "Vertex", "Meridian", "Aurora", "Helix"],
  },
  industries: {
    eyebrow: "Industrias",
    title: "Experiencia en los sectores que mueven la región",
    subtitle:
      "Entendemos los retos de cada industria y creamos soluciones a su medida.",
    items: [
      { name: "Retail & Consumo", icon: "ShoppingBag" },
      { name: "Salud", icon: "HeartPulse" },
      { name: "Educación", icon: "GraduationCap" },
      { name: "Fintech & Banca", icon: "Landmark" },
      { name: "Inmobiliario", icon: "Building2" },
      { name: "Logística", icon: "Truck" },
      { name: "Turismo & Hotelería", icon: "Plane" },
      { name: "Gastronomía", icon: "UtensilsCrossed" },
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
    steps: [
      {
        title: "Descubrimiento",
        description:
          "Entendemos tu negocio, objetivos y usuarios para definir el alcance ideal.",
      },
      {
        title: "Estrategia & Diseño",
        description:
          "Prototipamos la experiencia y la identidad visual antes de escribir una línea de código.",
      },
      {
        title: "Desarrollo",
        description:
          "Construimos con sprints, entregas continuas y control de calidad en cada paso.",
      },
      {
        title: "Lanzamiento & Crecimiento",
        description:
          "Publicamos, medimos y optimizamos para que tu producto siga evolucionando.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Clientes",
    title: "Lo que dicen de trabajar con nosotros",
    items: [
      {
        quote:
          "Engynex transformó nuestra operación con una plataforma que realmente entiende nuestro negocio. Profesionalismo total.",
        name: "Laura Gómez",
        role: "COO, Nova Retail",
      },
      {
        quote:
          "Del branding a la app, todo con una coherencia impecable. Se sienten parte de nuestro equipo.",
        name: "Andrés Martínez",
        role: "CEO, Pulse Fitness",
      },
      {
        quote:
          "Entregaron a tiempo, con calidad y con datos que respaldan cada decisión. Volveríamos sin dudarlo.",
        name: "Carolina Ruiz",
        role: "Directora de Marketing, Vertex",
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
    stats: [
      { value: "+120", label: "Proyectos entregados" },
      { value: "+80", label: "Clientes en 3 países" },
      { value: "25", label: "Especialistas" },
      { value: "98%", label: "Clientes que repiten" },
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
        desc: "Una fábrica de desarrollo integral con 15 servicios y más de 120 proyectos entregados.",
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
      service: "Servicio de interés",
      servicePlaceholder: "Selecciona un servicio",
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
    companyTitle: "Empresa",
    contactTitle: "Contacto",
    followUs: "Síguenos",
    rights: "Todos los derechos reservados.",
    madeWith: "Hecho con ingeniería y pasión.",
    legalPrivacy: "Privacidad",
    legalTerms: "Términos",
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
    portfolio: "Portfolio",
    about: "About",
    contact: "Contact",
    cta: "Get a quote",
    openMenu: "Open menu",
    closeMenu: "Close menu",
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
      { value: "8", label: "Integrated services" },
      { value: "10", label: "Years of experience" },
    ],
  },
  techStrip: {
    title: "Technologies we build with",
  },
  servicesSection: {
    eyebrow: "What we do",
    title: "One partner for your entire digital ecosystem",
    subtitle:
      "Fifteen specialized services that come together to take your idea from concept to result, with no seams between teams.",
  },
  featured: {
    eyebrow: "Portfolio",
    title: "Work that delivers results",
    subtitle: "A selection of our most recent projects and their impact.",
    cta: "View the full portfolio",
  },
  clients: {
    title: "Companies that trust Engynex",
    names: ["Nova Retail", "Pulse", "Vertex", "Meridian", "Aurora", "Helix"],
  },
  industries: {
    eyebrow: "Industries",
    title: "Experience across the sectors that move the region",
    subtitle:
      "We understand the challenges of each industry and build tailored solutions.",
    items: [
      { name: "Retail & Consumer", icon: "ShoppingBag" },
      { name: "Healthcare", icon: "HeartPulse" },
      { name: "Education", icon: "GraduationCap" },
      { name: "Fintech & Banking", icon: "Landmark" },
      { name: "Real Estate", icon: "Building2" },
      { name: "Logistics", icon: "Truck" },
      { name: "Travel & Hospitality", icon: "Plane" },
      { name: "Food & Restaurants", icon: "UtensilsCrossed" },
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
    steps: [
      {
        title: "Discovery",
        description:
          "We understand your business, goals and users to define the ideal scope.",
      },
      {
        title: "Strategy & Design",
        description:
          "We prototype the experience and visual identity before writing a line of code.",
      },
      {
        title: "Development",
        description:
          "We build in sprints, with continuous delivery and quality control at every step.",
      },
      {
        title: "Launch & Growth",
        description:
          "We ship, measure and optimize so your product keeps evolving.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Clients",
    title: "What it's like to work with us",
    items: [
      {
        quote:
          "Engynex transformed our operation with a platform that truly understands our business. Total professionalism.",
        name: "Laura Gómez",
        role: "COO, Nova Retail",
      },
      {
        quote:
          "From branding to the app, everything with flawless consistency. They feel like part of our team.",
        name: "Andrés Martínez",
        role: "CEO, Pulse Fitness",
      },
      {
        quote:
          "Delivered on time, with quality and data backing every decision. We'd do it again without hesitation.",
        name: "Carolina Ruiz",
        role: "Marketing Director, Vertex",
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
    stats: [
      { value: "+120", label: "Projects delivered" },
      { value: "+80", label: "Clients in 3 countries" },
      { value: "25", label: "Specialists" },
      { value: "98%", label: "Returning clients" },
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
        desc: "A full development factory with 15 services and over 120 projects delivered.",
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
      service: "Service of interest",
      servicePlaceholder: "Select a service",
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
    companyTitle: "Company",
    contactTitle: "Contact",
    followUs: "Follow us",
    rights: "All rights reserved.",
    madeWith: "Made with engineering and passion.",
    legalPrivacy: "Privacy",
    legalTerms: "Terms",
  },
} satisfies typeof es;

export type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
