import type { Locale } from "@/i18n/config";

export type ServiceIcon =
  | "Globe"
  | "LayoutDashboard"
  | "Smartphone"
  | "ShoppingCart"
  | "Palette"
  | "Megaphone"
  | "Clapperboard"
  | "Bot"
  | "Cloud"
  | "ShieldCheck"
  | "Server"
  | "Rocket"
  | "BarChart3"
  | "Plug"
  | "Headset";

export interface ServiceCopy {
  title: string;
  tagline: string;
  description: string;
  intro: string;
  features: string[];
  benefits: { title: string; description: string }[];
  deliverables: string[];
  faqs: { q: string; a: string }[];
}

export interface Service {
  slug: string;
  icon: ServiceIcon;
  accent: "green" | "blue";
  image: string;
  es: ServiceCopy;
  en: ServiceCopy;
}

export const services: Service[] = [
  {
    slug: "desarrollo-web",
    icon: "Globe",
    accent: "green",
    image: "/images/svc-desarrollo-web.jpg",
    es: {
      title: "Desarrollo Web",
      tagline: "Sitios que convierten visitas en clientes",
      description:
        "Sitios corporativos, landing pages y portales rápidos, seguros y optimizados para buscadores.",
      intro:
        "Diseñamos y programamos sitios web a la medida de tu marca: rápidos, seguros y optimizados para convertir. Cada pixel pensado para tu identidad y cada línea de código para el rendimiento y el SEO.",
      features: [
        "Sitios corporativos y landing pages",
        "Optimización SEO técnica y velocidad",
        "Diseño responsive y accesible",
        "Gestor de contenidos (CMS) a la medida",
      ],
      benefits: [
        {
          title: "Velocidad de carga",
          description:
            "Puntajes altos en Core Web Vitals que mejoran tu posición en Google y la experiencia de usuario.",
        },
        {
          title: "Listo para crecer",
          description:
            "Arquitectura moderna que soporta nuevas secciones, idiomas e integraciones sin rehacer todo.",
        },
        {
          title: "Autonomía total",
          description:
            "Un panel intuitivo para que tu equipo actualice contenidos sin depender de un programador.",
        },
      ],
      deliverables: [
        "Diseño UI a medida (desktop y móvil)",
        "Sitio desarrollado y desplegado",
        "SEO técnico y analítica configurada",
        "Capacitación y soporte post-lanzamiento",
      ],
      faqs: [
        {
          q: "¿Cuánto tarda un sitio web?",
          a: "Una landing page puede estar lista en 1–2 semanas; un sitio corporativo completo, entre 4 y 8 semanas según el alcance.",
        },
        {
          q: "¿El sitio será fácil de administrar?",
          a: "Sí. Integramos un gestor de contenidos a tu medida para que edites textos e imágenes sin conocimientos técnicos.",
        },
        {
          q: "¿Incluye hosting y dominio?",
          a: "Podemos gestionar el hosting, el dominio y el mantenimiento como servicio adicional, o desplegarlo en tu infraestructura.",
        },
      ],
    },
    en: {
      title: "Web Development",
      tagline: "Websites that turn visits into clients",
      description:
        "Corporate sites, landing pages and portals that are fast, secure and search-optimized.",
      intro:
        "We design and build websites tailored to your brand: fast, secure and optimized to convert. Every pixel crafted for your identity and every line of code for performance and SEO.",
      features: [
        "Corporate sites and landing pages",
        "Technical SEO and speed optimization",
        "Responsive, accessible design",
        "Custom content management (CMS)",
      ],
      benefits: [
        {
          title: "Loading speed",
          description:
            "High Core Web Vitals scores that improve your Google ranking and user experience.",
        },
        {
          title: "Ready to grow",
          description:
            "A modern architecture that supports new sections, languages and integrations without a rebuild.",
        },
        {
          title: "Full autonomy",
          description:
            "An intuitive panel so your team can update content without depending on a developer.",
        },
      ],
      deliverables: [
        "Custom UI design (desktop and mobile)",
        "Developed and deployed website",
        "Technical SEO and analytics setup",
        "Training and post-launch support",
      ],
      faqs: [
        {
          q: "How long does a website take?",
          a: "A landing page can be ready in 1–2 weeks; a full corporate site, between 4 and 8 weeks depending on scope.",
        },
        {
          q: "Will the site be easy to manage?",
          a: "Yes. We integrate a tailored content manager so you can edit text and images with no technical skills.",
        },
        {
          q: "Does it include hosting and domain?",
          a: "We can manage hosting, domain and maintenance as an add-on, or deploy it on your own infrastructure.",
        },
      ],
    },
  },
  {
    slug: "plataformas-web",
    icon: "LayoutDashboard",
    accent: "blue",
    image: "/images/svc-plataformas-web.jpg",
    es: {
      title: "Plataformas Web",
      tagline: "Software a la medida que escala contigo",
      description:
        "Aplicaciones web y SaaS complejas: paneles, sistemas de gestión, portales e integraciones.",
      intro:
        "Construimos aplicaciones web y plataformas SaaS que resuelven problemas reales de negocio: dashboards, sistemas de gestión, portales de clientes e integraciones con tus herramientas. Arquitectura sólida, lista para escalar.",
      features: [
        "Aplicaciones web (SaaS) a la medida",
        "Dashboards y paneles administrativos",
        "Integraciones y APIs (ERP, CRM, pagos)",
        "Arquitectura escalable en la nube",
      ],
      benefits: [
        {
          title: "A la medida de tu proceso",
          description:
            "Software que se adapta a cómo trabajas, no al revés. Automatiza tareas y elimina hojas de cálculo.",
        },
        {
          title: "Escalabilidad real",
          description:
            "Infraestructura que crece con tus usuarios sin sacrificar velocidad ni disponibilidad.",
        },
        {
          title: "Datos centralizados",
          description:
            "Toda tu operación en un solo lugar, con reportes y métricas en tiempo real para decidir mejor.",
        },
      ],
      deliverables: [
        "Análisis funcional y prototipo",
        "Plataforma desarrollada y probada",
        "Integraciones con tus sistemas",
        "Documentación y soporte continuo",
      ],
      faqs: [
        {
          q: "¿Puedo integrarla con mis sistemas actuales?",
          a: "Sí. Conectamos con ERPs, CRMs, pasarelas de pago y cualquier API para que todo funcione en conjunto.",
        },
        {
          q: "¿Cómo aseguran la calidad?",
          a: "Trabajamos con sprints, control de versiones, pruebas automatizadas y ambientes de staging antes de producción.",
        },
        {
          q: "¿El código es mío?",
          a: "Sí. Al finalizar recibes la propiedad total del código y la documentación técnica del proyecto.",
        },
      ],
    },
    en: {
      title: "Web Platforms",
      tagline: "Custom software that scales with you",
      description:
        "Complex web apps and SaaS: dashboards, management systems, portals and integrations.",
      intro:
        "We build web applications and SaaS platforms that solve real business problems: dashboards, management systems, client portals and integrations with your tools. Solid architecture, ready to scale.",
      features: [
        "Custom web apps (SaaS)",
        "Dashboards and admin panels",
        "Integrations & APIs (ERP, CRM, payments)",
        "Scalable cloud architecture",
      ],
      benefits: [
        {
          title: "Tailored to your process",
          description:
            "Software that adapts to how you work, not the other way around. Automate tasks and drop the spreadsheets.",
        },
        {
          title: "Real scalability",
          description:
            "Infrastructure that grows with your users without sacrificing speed or availability.",
        },
        {
          title: "Centralized data",
          description:
            "Your whole operation in one place, with real-time reports and metrics to decide better.",
        },
      ],
      deliverables: [
        "Functional analysis and prototype",
        "Developed and tested platform",
        "Integrations with your systems",
        "Documentation and ongoing support",
      ],
      faqs: [
        {
          q: "Can it integrate with my current systems?",
          a: "Yes. We connect with ERPs, CRMs, payment gateways and any API so everything works together.",
        },
        {
          q: "How do you ensure quality?",
          a: "We work in sprints, with version control, automated tests and staging environments before production.",
        },
        {
          q: "Do I own the code?",
          a: "Yes. On completion you receive full ownership of the code and the project's technical documentation.",
        },
      ],
    },
  },
  {
    slug: "apps-moviles",
    icon: "Smartphone",
    accent: "green",
    image: "/images/svc-apps-moviles.jpg",
    es: {
      title: "Apps Móviles",
      tagline: "Tu negocio en el bolsillo de tus clientes",
      description:
        "Aplicaciones nativas e híbridas para iOS y Android con experiencias fluidas.",
      intro:
        "Desarrollamos apps móviles nativas e híbridas para iOS y Android con experiencias fluidas, notificaciones push y sincronización en tiempo real. Del prototipo a la App Store, contigo en cada paso.",
      features: [
        "Apps nativas e híbridas (iOS / Android)",
        "Notificaciones push y modo offline",
        "Publicación en App Store y Google Play",
        "Sincronización en tiempo real",
      ],
      benefits: [
        {
          title: "Presencia permanente",
          description:
            "Un ícono en la pantalla de inicio de tus clientes: cercanía y fidelización que la web no ofrece.",
        },
        {
          title: "Experiencia fluida",
          description:
            "Interfaces rápidas y naturales que aprovechan las capacidades del dispositivo.",
        },
        {
          title: "Engagement con push",
          description:
            "Notificaciones inteligentes para reactivar usuarios y comunicar novedades en el momento justo.",
        },
      ],
      deliverables: [
        "Prototipo interactivo",
        "App para iOS y Android",
        "Publicación en las tiendas",
        "Mantenimiento y actualizaciones",
      ],
      faqs: [
        {
          q: "¿Nativa o híbrida?",
          a: "Recomendamos la tecnología según tu presupuesto y necesidades. Las híbridas reducen costos manteniendo gran calidad.",
        },
        {
          q: "¿Se encargan de publicarla?",
          a: "Sí. Gestionamos todo el proceso de publicación en la App Store y Google Play.",
        },
        {
          q: "¿Incluye actualizaciones?",
          a: "Ofrecemos planes de mantenimiento para mantener la app compatible con las nuevas versiones de iOS y Android.",
        },
      ],
    },
    en: {
      title: "Mobile Apps",
      tagline: "Your business in your clients' pocket",
      description:
        "Native and hybrid apps for iOS and Android with fluid experiences.",
      intro:
        "We develop native and hybrid mobile apps for iOS and Android with fluid experiences, push notifications and real-time sync. From prototype to the App Store, with you every step of the way.",
      features: [
        "Native & hybrid apps (iOS / Android)",
        "Push notifications and offline mode",
        "Publishing to App Store & Google Play",
        "Real-time synchronization",
      ],
      benefits: [
        {
          title: "Permanent presence",
          description:
            "An icon on your clients' home screen: closeness and loyalty the web can't offer.",
        },
        {
          title: "Fluid experience",
          description:
            "Fast, natural interfaces that make the most of the device's capabilities.",
        },
        {
          title: "Engagement via push",
          description:
            "Smart notifications to re-engage users and communicate news at the right moment.",
        },
      ],
      deliverables: [
        "Interactive prototype",
        "iOS and Android app",
        "Publishing to the stores",
        "Maintenance and updates",
      ],
      faqs: [
        {
          q: "Native or hybrid?",
          a: "We recommend the technology based on your budget and needs. Hybrid apps cut costs while keeping high quality.",
        },
        {
          q: "Do you handle publishing?",
          a: "Yes. We manage the entire publishing process on the App Store and Google Play.",
        },
        {
          q: "Does it include updates?",
          a: "We offer maintenance plans to keep the app compatible with new iOS and Android versions.",
        },
      ],
    },
  },
  {
    slug: "ecommerce",
    icon: "ShoppingCart",
    accent: "blue",
    image: "/images/svc-ecommerce.jpg",
    es: {
      title: "E-commerce",
      tagline: "Vende en línea sin límites",
      description:
        "Tiendas online rápidas con pasarelas de pago, inventario y logística integrada.",
      intro:
        "Creamos tiendas online rápidas y confiables con pasarelas de pago, gestión de inventario y logística integrada. Optimizadas para vender más y administrar menos.",
      features: [
        "Tiendas online y marketplaces",
        "Pasarelas de pago locales e internacionales",
        "Gestión de inventario y despachos",
        "Optimización de conversión (CRO)",
      ],
      benefits: [
        {
          title: "Más ventas",
          description:
            "Flujo de compra optimizado y sin fricción que aumenta la conversión y el ticket promedio.",
        },
        {
          title: "Menos trabajo manual",
          description:
            "Inventario, pedidos y envíos sincronizados para que administres tu tienda en minutos.",
        },
        {
          title: "Pagos seguros",
          description:
            "Integración con las principales pasarelas locales e internacionales, con máxima seguridad.",
        },
      ],
      deliverables: [
        "Tienda online configurada",
        "Catálogo y pasarelas de pago",
        "Integración de envíos e inventario",
        "Optimización de conversión y analítica",
      ],
      faqs: [
        {
          q: "¿Qué pasarelas de pago integran?",
          a: "Trabajamos con Wompi, PayU, Mercado Pago, Stripe, PayPal y otras según tu país y necesidades.",
        },
        {
          q: "¿Se conecta con mi inventario?",
          a: "Sí. Sincronizamos la tienda con tu sistema de inventario o ERP para evitar sobreventa.",
        },
        {
          q: "¿Sobre qué plataforma la construyen?",
          a: "Según tu caso: soluciones a la medida, Shopify o WooCommerce. Te recomendamos la mejor opción.",
        },
      ],
    },
    en: {
      title: "E-commerce",
      tagline: "Sell online without limits",
      description:
        "Fast online stores with payment gateways, inventory and integrated logistics.",
      intro:
        "We build fast, reliable online stores with payment gateways, inventory management and integrated logistics. Optimized to sell more and manage less.",
      features: [
        "Online stores and marketplaces",
        "Local & international payment gateways",
        "Inventory and shipping management",
        "Conversion rate optimization (CRO)",
      ],
      benefits: [
        {
          title: "More sales",
          description:
            "An optimized, frictionless checkout that increases conversion and average order value.",
        },
        {
          title: "Less manual work",
          description:
            "Synced inventory, orders and shipping so you manage your store in minutes.",
        },
        {
          title: "Secure payments",
          description:
            "Integration with major local and international gateways, with top-level security.",
        },
      ],
      deliverables: [
        "Configured online store",
        "Catalog and payment gateways",
        "Shipping and inventory integration",
        "Conversion optimization and analytics",
      ],
      faqs: [
        {
          q: "Which payment gateways do you integrate?",
          a: "We work with Wompi, PayU, Mercado Pago, Stripe, PayPal and others depending on your country and needs.",
        },
        {
          q: "Does it connect to my inventory?",
          a: "Yes. We sync the store with your inventory system or ERP to avoid overselling.",
        },
        {
          q: "Which platform do you build on?",
          a: "Depending on your case: custom solutions, Shopify or WooCommerce. We recommend the best option.",
        },
      ],
    },
  },
  {
    slug: "ux-ui-branding",
    icon: "Palette",
    accent: "green",
    image: "/images/svc-ux-ui-branding.jpg",
    es: {
      title: "Diseño UX/UI & Branding",
      tagline: "Marcas memorables, experiencias impecables",
      description:
        "Identidad de marca e interfaces centradas en el usuario que enamoran y funcionan.",
      intro:
        "Construimos la identidad de tu marca y diseñamos interfaces centradas en el usuario. Investigación, wireframes, prototipos y sistemas de diseño que enamoran y funcionan.",
      features: [
        "Identidad de marca y manual visual",
        "Investigación y diseño UX",
        "Prototipado interactivo (Figma)",
        "Sistemas de diseño escalables",
      ],
      benefits: [
        {
          title: "Marca coherente",
          description:
            "Una identidad sólida que te diferencia y genera confianza en cada punto de contacto.",
        },
        {
          title: "Menos fricción",
          description:
            "Interfaces intuitivas basadas en investigación real que reducen abandonos y soporte.",
        },
        {
          title: "Diseño escalable",
          description:
            "Un sistema de componentes reutilizables que acelera el desarrollo y mantiene consistencia.",
        },
      ],
      deliverables: [
        "Investigación y arquitectura de información",
        "Identidad visual y manual de marca",
        "Prototipo interactivo en Figma",
        "Sistema de diseño (design system)",
      ],
      faqs: [
        {
          q: "¿Hacen solo el diseño o también el desarrollo?",
          a: "Ambos. Podemos entregarte solo el diseño listo para tu equipo o desarrollarlo nosotros mismos.",
        },
        {
          q: "¿Incluye logo?",
          a: "Sí. El branding incluye logotipo, paleta, tipografías y las guías de uso de tu marca.",
        },
        {
          q: "¿Cómo validan las decisiones de diseño?",
          a: "Con investigación de usuarios, benchmarking y pruebas de usabilidad sobre prototipos.",
        },
      ],
    },
    en: {
      title: "UX/UI Design & Branding",
      tagline: "Memorable brands, flawless experiences",
      description:
        "Brand identity and user-centered interfaces that delight and perform.",
      intro:
        "We build your brand identity and design user-centered interfaces. Research, wireframes, prototypes and design systems that delight and perform.",
      features: [
        "Brand identity and visual guidelines",
        "UX research and design",
        "Interactive prototyping (Figma)",
        "Scalable design systems",
      ],
      benefits: [
        {
          title: "Coherent brand",
          description:
            "A solid identity that sets you apart and builds trust at every touchpoint.",
        },
        {
          title: "Less friction",
          description:
            "Intuitive interfaces based on real research that reduce drop-offs and support tickets.",
        },
        {
          title: "Scalable design",
          description:
            "A reusable component system that speeds up development and keeps consistency.",
        },
      ],
      deliverables: [
        "Research and information architecture",
        "Visual identity and brand guidelines",
        "Interactive Figma prototype",
        "Design system",
      ],
      faqs: [
        {
          q: "Do you only design or also develop?",
          a: "Both. We can hand off the design ready for your team or build it ourselves.",
        },
        {
          q: "Does it include a logo?",
          a: "Yes. Branding includes the logo, palette, typography and your brand's usage guidelines.",
        },
        {
          q: "How do you validate design decisions?",
          a: "With user research, benchmarking and usability testing on prototypes.",
        },
      ],
    },
  },
  {
    slug: "marketing-digital",
    icon: "Megaphone",
    accent: "blue",
    image: "/images/svc-marketing-digital.jpg",
    es: {
      title: "Marketing Digital",
      tagline: "Estrategias que hacen crecer tu marca",
      description:
        "SEO, campañas de rendimiento, redes y contenido que conecta y vende.",
      intro:
        "Impulsamos tu presencia digital con campañas de rendimiento, SEO, gestión de redes y contenido que conecta. Datos, creatividad y resultados medibles.",
      features: [
        "SEO y posicionamiento en Google",
        "Campañas SEM y en redes (Ads)",
        "Gestión de redes sociales y contenido",
        "Analítica y reportes de resultados",
      ],
      benefits: [
        {
          title: "Más visibilidad",
          description:
            "Aparece donde te buscan tus clientes, en Google y redes, con una estrategia integral.",
        },
        {
          title: "Inversión rentable",
          description:
            "Optimizamos cada peso invertido en pauta hacia leads y ventas, no solo clics.",
        },
        {
          title: "Decisiones con datos",
          description:
            "Reportes claros que muestran qué funciona para invertir mejor mes a mes.",
        },
      ],
      deliverables: [
        "Estrategia digital y plan de contenidos",
        "Gestión de campañas y redes",
        "Optimización SEO continua",
        "Reportes mensuales de resultados",
      ],
      faqs: [
        {
          q: "¿En cuánto tiempo veo resultados?",
          a: "Las campañas de pauta generan resultados en semanas; el SEO es una inversión que madura en 3–6 meses.",
        },
        {
          q: "¿Manejan el presupuesto de pauta?",
          a: "Sí. Gestionamos y optimizamos tu inversión en Google Ads y Meta Ads con total transparencia.",
        },
        {
          q: "¿Crean el contenido?",
          a: "Sí. Producimos piezas gráficas, copys y video para redes alineados con tu estrategia.",
        },
      ],
    },
    en: {
      title: "Digital Marketing",
      tagline: "Strategies that grow your brand",
      description:
        "SEO, performance campaigns, social media and content that connects and sells.",
      intro:
        "We boost your digital presence with performance campaigns, SEO, social media management and content that connects. Data, creativity and measurable results.",
      features: [
        "SEO and Google ranking",
        "SEM and social media campaigns (Ads)",
        "Social media and content management",
        "Analytics and results reporting",
      ],
      benefits: [
        {
          title: "More visibility",
          description:
            "Show up where your clients are searching, on Google and social, with an integrated strategy.",
        },
        {
          title: "Profitable spend",
          description:
            "We optimize every ad dollar toward leads and sales, not just clicks.",
        },
        {
          title: "Data-driven decisions",
          description:
            "Clear reports showing what works so you invest better month after month.",
        },
      ],
      deliverables: [
        "Digital strategy and content plan",
        "Campaign and social media management",
        "Ongoing SEO optimization",
        "Monthly results reporting",
      ],
      faqs: [
        {
          q: "How soon will I see results?",
          a: "Ad campaigns generate results in weeks; SEO is an investment that matures in 3–6 months.",
        },
        {
          q: "Do you manage the ad budget?",
          a: "Yes. We manage and optimize your Google Ads and Meta Ads spend with full transparency.",
        },
        {
          q: "Do you create the content?",
          a: "Yes. We produce graphics, copy and video for social aligned with your strategy.",
        },
      ],
    },
  },
  {
    slug: "produccion-audiovisual",
    icon: "Clapperboard",
    accent: "green",
    image: "/images/svc-produccion-audiovisual.jpg",
    es: {
      title: "Producción Audiovisual",
      tagline: "Historias que se ven y se recuerdan",
      description:
        "Video, fotografía y motion graphics de alto impacto para tu marca.",
      intro:
        "Producimos video, fotografía y motion graphics de alto impacto para tu marca: desde el concepto y la grabación hasta la edición y postproducción profesional.",
      features: [
        "Video corporativo y publicitario",
        "Fotografía de producto y marca",
        "Motion graphics y animación 2D/3D",
        "Edición y postproducción",
      ],
      benefits: [
        {
          title: "Impacto que conecta",
          description:
            "El video es el formato que más engagement genera: cuenta tu historia y se queda en la memoria.",
        },
        {
          title: "Calidad profesional",
          description:
            "Equipo, iluminación y edición de nivel para que tu marca luzca como las grandes.",
        },
        {
          title: "Contenido versátil",
          description:
            "Piezas adaptadas para web, redes, pauta y presentaciones a partir de una sola producción.",
        },
      ],
      deliverables: [
        "Concepto creativo y guion",
        "Producción y grabación",
        "Edición y postproducción",
        "Piezas para redes y pauta",
      ],
      faqs: [
        {
          q: "¿Trabajan en todo el país?",
          a: "Sí. Realizamos producciones en distintas ciudades; coordinamos logística según tu proyecto.",
        },
        {
          q: "¿Incluye la idea y el guion?",
          a: "Sí. Partimos del concepto creativo y el guion antes de grabar, alineados con tu objetivo.",
        },
        {
          q: "¿Entregan versiones para redes?",
          a: "Claro. Adaptamos los formatos (vertical, cuadrado, horizontal) para cada plataforma.",
        },
      ],
    },
    en: {
      title: "Audiovisual Production",
      tagline: "Stories people watch and remember",
      description:
        "High-impact video, photography and motion graphics for your brand.",
      intro:
        "We produce high-impact video, photography and motion graphics for your brand: from concept and shooting to professional editing and post-production.",
      features: [
        "Corporate and advertising video",
        "Product and brand photography",
        "Motion graphics and 2D/3D animation",
        "Editing and post-production",
      ],
      benefits: [
        {
          title: "Impact that connects",
          description:
            "Video is the format that drives the most engagement: tell your story and stay memorable.",
        },
        {
          title: "Professional quality",
          description:
            "Top-tier gear, lighting and editing so your brand looks like the big players.",
        },
        {
          title: "Versatile content",
          description:
            "Pieces adapted for web, social, ads and presentations from a single production.",
        },
      ],
      deliverables: [
        "Creative concept and script",
        "Production and shooting",
        "Editing and post-production",
        "Pieces for social and ads",
      ],
      faqs: [
        {
          q: "Do you work nationwide?",
          a: "Yes. We shoot in different cities; we coordinate logistics based on your project.",
        },
        {
          q: "Does it include the idea and script?",
          a: "Yes. We start from the creative concept and script before shooting, aligned with your goal.",
        },
        {
          q: "Do you deliver social versions?",
          a: "Of course. We adapt formats (vertical, square, horizontal) for each platform.",
        },
      ],
    },
  },
  {
    slug: "ia-automatizacion",
    icon: "Bot",
    accent: "blue",
    image: "/images/svc-ia-automatizacion.jpg",
    es: {
      title: "IA & Automatización",
      tagline: "Inteligencia que trabaja por ti",
      description:
        "Chatbots, asistentes con IA y automatización de procesos sin fricción.",
      intro:
        "Integramos inteligencia artificial y automatizamos procesos para que tu equipo se enfoque en lo importante: chatbots, asistentes, análisis de datos y flujos sin fricción.",
      features: [
        "Chatbots y asistentes con IA",
        "Automatización de procesos (RPA)",
        "Integración de modelos de IA (LLMs)",
        "Análisis y visualización de datos",
      ],
      benefits: [
        {
          title: "Ahorro de tiempo",
          description:
            "Automatiza tareas repetitivas y libera a tu equipo para el trabajo que realmente aporta valor.",
        },
        {
          title: "Atención 24/7",
          description:
            "Asistentes con IA que responden a tus clientes al instante, a cualquier hora.",
        },
        {
          title: "Mejores decisiones",
          description:
            "Convierte tus datos en insights accionables con modelos y tableros inteligentes.",
        },
      ],
      deliverables: [
        "Diagnóstico de oportunidades de IA",
        "Chatbot o asistente entrenado",
        "Flujos de automatización activos",
        "Integración y monitoreo",
      ],
      faqs: [
        {
          q: "¿Qué procesos puedo automatizar?",
          a: "Atención al cliente, generación de reportes, entrada de datos, seguimiento de leads y mucho más.",
        },
        {
          q: "¿Usan modelos como los de OpenAI?",
          a: "Sí. Integramos LLMs líderes y los conectamos de forma segura con tus datos y sistemas.",
        },
        {
          q: "¿Es seguro para mis datos?",
          a: "Diseñamos las integraciones con privacidad y control de acceso como prioridad desde el inicio.",
        },
      ],
    },
    en: {
      title: "AI & Automation",
      tagline: "Intelligence that works for you",
      description:
        "Chatbots, AI assistants and frictionless process automation.",
      intro:
        "We integrate artificial intelligence and automate processes so your team can focus on what matters: chatbots, assistants, data analysis and frictionless workflows.",
      features: [
        "AI chatbots and assistants",
        "Process automation (RPA)",
        "AI model integration (LLMs)",
        "Data analysis and visualization",
      ],
      benefits: [
        {
          title: "Time savings",
          description:
            "Automate repetitive tasks and free your team for work that truly adds value.",
        },
        {
          title: "24/7 support",
          description:
            "AI assistants that answer your clients instantly, any time of day.",
        },
        {
          title: "Better decisions",
          description:
            "Turn your data into actionable insights with smart models and dashboards.",
        },
      ],
      deliverables: [
        "AI opportunity assessment",
        "Trained chatbot or assistant",
        "Active automation workflows",
        "Integration and monitoring",
      ],
      faqs: [
        {
          q: "What processes can I automate?",
          a: "Customer support, report generation, data entry, lead follow-up and much more.",
        },
        {
          q: "Do you use models like OpenAI's?",
          a: "Yes. We integrate leading LLMs and connect them securely to your data and systems.",
        },
        {
          q: "Is it safe for my data?",
          a: "We design integrations with privacy and access control as a priority from the start.",
        },
      ],
    },
  },
  {
    slug: "cloud-devops",
    icon: "Cloud",
    accent: "blue",
    image: "/images/svc-cloud-devops.jpg",
    es: {
      title: "Cloud & DevOps",
      tagline: "Infraestructura que nunca te deja caer",
      description:
        "Arquitectura en la nube, CI/CD y automatización de despliegues escalables.",
      intro:
        "Diseñamos y operamos infraestructura en la nube confiable y escalable. Automatizamos despliegues con CI/CD, monitoreamos tu operación y optimizamos costos para que crezcas sin sobresaltos.",
      features: [
        "Arquitectura en AWS, GCP y Azure",
        "CI/CD y automatización de despliegues",
        "Contenedores (Docker, Kubernetes)",
        "Monitoreo, alertas y optimización de costos",
      ],
      benefits: [
        {
          title: "Alta disponibilidad",
          description:
            "Infraestructura resiliente que mantiene tus servicios en línea, incluso en picos de demanda.",
        },
        {
          title: "Despliegues sin miedo",
          description:
            "Pipelines automatizados que llevan cambios a producción de forma segura y frecuente.",
        },
        {
          title: "Costos bajo control",
          description:
            "Optimizamos tus recursos en la nube para que pagues solo por lo que realmente usas.",
        },
      ],
      deliverables: [
        "Arquitectura cloud documentada",
        "Pipelines de CI/CD configurados",
        "Monitoreo y alertas activos",
        "Plan de optimización de costos",
      ],
      faqs: [
        {
          q: "¿Trabajan con mi proveedor cloud actual?",
          a: "Sí. Tenemos experiencia en AWS, Google Cloud y Azure, y podemos migrar entre ellos si conviene.",
        },
        {
          q: "¿Ofrecen soporte continuo?",
          a: "Sí. Contamos con planes de operación y soporte para mantener tu infraestructura saludable.",
        },
        {
          q: "¿Pueden migrar mi sistema a la nube?",
          a: "Claro. Planeamos y ejecutamos la migración minimizando el downtime y el riesgo.",
        },
      ],
    },
    en: {
      title: "Cloud & DevOps",
      tagline: "Infrastructure that never lets you down",
      description:
        "Cloud architecture, CI/CD and scalable deployment automation.",
      intro:
        "We design and run reliable, scalable cloud infrastructure. We automate deployments with CI/CD, monitor your operation and optimize costs so you grow without surprises.",
      features: [
        "Architecture on AWS, GCP and Azure",
        "CI/CD and deployment automation",
        "Containers (Docker, Kubernetes)",
        "Monitoring, alerts and cost optimization",
      ],
      benefits: [
        {
          title: "High availability",
          description:
            "Resilient infrastructure that keeps your services online, even during demand spikes.",
        },
        {
          title: "Deploy without fear",
          description:
            "Automated pipelines that ship changes to production safely and frequently.",
        },
        {
          title: "Costs under control",
          description:
            "We optimize your cloud resources so you only pay for what you actually use.",
        },
      ],
      deliverables: [
        "Documented cloud architecture",
        "Configured CI/CD pipelines",
        "Active monitoring and alerts",
        "Cost optimization plan",
      ],
      faqs: [
        {
          q: "Do you work with my current cloud provider?",
          a: "Yes. We have experience with AWS, Google Cloud and Azure, and can migrate between them if it helps.",
        },
        {
          q: "Do you offer ongoing support?",
          a: "Yes. We have operations and support plans to keep your infrastructure healthy.",
        },
        {
          q: "Can you migrate my system to the cloud?",
          a: "Absolutely. We plan and execute the migration minimizing downtime and risk.",
        },
      ],
    },
  },
  {
    slug: "ciberseguridad",
    icon: "ShieldCheck",
    accent: "green",
    image: "/images/svc-ciberseguridad.jpg",
    es: {
      title: "Ciberseguridad",
      tagline: "Protege lo que más te importa",
      description:
        "Auditorías, pentesting y protección de tus aplicaciones y datos.",
      intro:
        "Protegemos tus aplicaciones, datos y usuarios. Realizamos auditorías de seguridad, pruebas de penetración y aseguramos tus sistemas siguiendo las mejores prácticas de la industria.",
      features: [
        "Auditorías y análisis de vulnerabilidades",
        "Pruebas de penetración (pentesting)",
        "Hardening de aplicaciones e infraestructura",
        "Cumplimiento y protección de datos",
      ],
      benefits: [
        {
          title: "Tranquilidad",
          description:
            "Duerme tranquilo sabiendo que tus sistemas y los datos de tus clientes están protegidos.",
        },
        {
          title: "Confianza del cliente",
          description:
            "La seguridad es reputación: demuestra a tus usuarios que sus datos están seguros contigo.",
        },
        {
          title: "Prevención de pérdidas",
          description:
            "Detectar y corregir a tiempo cuesta mucho menos que responder a un incidente.",
        },
      ],
      deliverables: [
        "Informe de auditoría de seguridad",
        "Reporte de pentesting con hallazgos",
        "Plan de remediación priorizado",
        "Recomendaciones de cumplimiento",
      ],
      faqs: [
        {
          q: "¿Cada cuánto debo auditar mi sistema?",
          a: "Recomendamos una auditoría al menos una vez al año y tras cada cambio mayor en tu plataforma.",
        },
        {
          q: "¿Qué es el pentesting?",
          a: "Es una prueba controlada donde simulamos ataques reales para encontrar vulnerabilidades antes que un atacante.",
        },
        {
          q: "¿Ayudan con normativas de datos?",
          a: "Sí. Te acompañamos a cumplir con normativas de protección de datos aplicables a tu negocio.",
        },
      ],
    },
    en: {
      title: "Cybersecurity",
      tagline: "Protect what matters most",
      description:
        "Audits, pentesting and protection for your applications and data.",
      intro:
        "We protect your applications, data and users. We run security audits, penetration tests and harden your systems following industry best practices.",
      features: [
        "Audits and vulnerability analysis",
        "Penetration testing (pentesting)",
        "Application and infrastructure hardening",
        "Compliance and data protection",
      ],
      benefits: [
        {
          title: "Peace of mind",
          description:
            "Rest easy knowing your systems and your clients' data are protected.",
        },
        {
          title: "Client trust",
          description:
            "Security is reputation: show your users their data is safe with you.",
        },
        {
          title: "Loss prevention",
          description:
            "Detecting and fixing early costs far less than responding to an incident.",
        },
      ],
      deliverables: [
        "Security audit report",
        "Pentesting report with findings",
        "Prioritized remediation plan",
        "Compliance recommendations",
      ],
      faqs: [
        {
          q: "How often should I audit my system?",
          a: "We recommend an audit at least once a year and after every major change to your platform.",
        },
        {
          q: "What is pentesting?",
          a: "A controlled test where we simulate real attacks to find vulnerabilities before an attacker does.",
        },
        {
          q: "Do you help with data regulations?",
          a: "Yes. We guide you to comply with the data protection regulations that apply to your business.",
        },
      ],
    },
  },
  {
    slug: "hosting-mantenimiento",
    icon: "Server",
    accent: "blue",
    image: "/images/svc-hosting-mantenimiento.jpg",
    es: {
      title: "Hosting & Mantenimiento",
      tagline: "Tu sitio siempre rápido y al día",
      description:
        "Hosting administrado, actualizaciones, backups y soporte continuo.",
      intro:
        "Nos encargamos de que tu sitio o plataforma esté siempre disponible, rápido y seguro. Hosting administrado, actualizaciones, copias de seguridad y soporte para que tú te enfoques en tu negocio.",
      features: [
        "Hosting administrado y de alto rendimiento",
        "Actualizaciones y parches de seguridad",
        "Copias de seguridad automáticas",
        "Soporte técnico y monitoreo 24/7",
      ],
      benefits: [
        {
          title: "Cero preocupaciones",
          description:
            "Nosotros vigilamos, actualizamos y respaldamos tu sitio; tú te dedicas a lo tuyo.",
        },
        {
          title: "Máximo rendimiento",
          description:
            "Servidores optimizados y CDN para que tu sitio cargue rápido en cualquier lugar.",
        },
        {
          title: "Recuperación garantizada",
          description:
            "Backups automáticos que te permiten restaurar tu sitio ante cualquier imprevisto.",
        },
      ],
      deliverables: [
        "Hosting configurado y optimizado",
        "Plan de backups automáticos",
        "Monitoreo y reportes de disponibilidad",
        "Soporte técnico según tu plan",
      ],
      faqs: [
        {
          q: "¿Puedo migrar mi sitio actual?",
          a: "Sí. Migramos tu sitio a nuestra infraestructura administrada sin interrupciones perceptibles.",
        },
        {
          q: "¿Qué incluye el soporte?",
          a: "Monitoreo, actualizaciones, backups y atención a incidencias según el plan que elijas.",
        },
        {
          q: "¿Cada cuánto hacen backups?",
          a: "Realizamos copias de seguridad automáticas diarias, con retención configurable.",
        },
      ],
    },
    en: {
      title: "Hosting & Maintenance",
      tagline: "Your site always fast and up to date",
      description:
        "Managed hosting, updates, backups and ongoing support.",
      intro:
        "We keep your site or platform always available, fast and secure. Managed hosting, updates, backups and support so you can focus on your business.",
      features: [
        "Managed, high-performance hosting",
        "Updates and security patches",
        "Automatic backups",
        "24/7 technical support and monitoring",
      ],
      benefits: [
        {
          title: "Zero worries",
          description:
            "We monitor, update and back up your site; you focus on your business.",
        },
        {
          title: "Maximum performance",
          description:
            "Optimized servers and CDN so your site loads fast anywhere.",
        },
        {
          title: "Guaranteed recovery",
          description:
            "Automatic backups let you restore your site after any incident.",
        },
      ],
      deliverables: [
        "Configured, optimized hosting",
        "Automatic backup plan",
        "Monitoring and uptime reports",
        "Technical support per your plan",
      ],
      faqs: [
        {
          q: "Can I migrate my current site?",
          a: "Yes. We migrate your site to our managed infrastructure with no noticeable downtime.",
        },
        {
          q: "What does support include?",
          a: "Monitoring, updates, backups and incident response depending on the plan you choose.",
        },
        {
          q: "How often do you back up?",
          a: "We run automatic daily backups, with configurable retention.",
        },
      ],
    },
  },
  {
    slug: "consultoria-tech",
    icon: "Rocket",
    accent: "green",
    image: "/images/svc-consultoria-tech.jpg",
    es: {
      title: "Consultoría & Transformación Digital",
      tagline: "El plan tecnológico que tu negocio necesita",
      description:
        "Estrategia, arquitectura y acompañamiento para digitalizar tu empresa.",
      intro:
        "Te ayudamos a tomar las decisiones tecnológicas correctas. Definimos la estrategia, la arquitectura y la hoja de ruta para digitalizar y hacer crecer tu negocio con tecnología.",
      features: [
        "Estrategia y hoja de ruta digital",
        "Arquitectura y elección de tecnologías",
        "Digitalización y automatización de procesos",
        "Acompañamiento y gestión de proyectos",
      ],
      benefits: [
        {
          title: "Claridad de rumbo",
          description:
            "Una hoja de ruta clara que prioriza qué construir primero para maximizar el impacto.",
        },
        {
          title: "Menos riesgo",
          description:
            "Evita inversiones equivocadas con decisiones respaldadas por experiencia técnica real.",
        },
        {
          title: "Crecimiento sostenible",
          description:
            "Tecnología alineada con tus objetivos de negocio, pensada para escalar contigo.",
        },
      ],
      deliverables: [
        "Diagnóstico digital de tu empresa",
        "Estrategia y hoja de ruta priorizada",
        "Recomendaciones de arquitectura y stack",
        "Acompañamiento en la ejecución",
      ],
      faqs: [
        {
          q: "¿Es para empresas grandes o pequeñas?",
          a: "Para ambas. Adaptamos la estrategia al tamaño, la madurez digital y los objetivos de tu negocio.",
        },
        {
          q: "¿Ejecutan lo que recomiendan?",
          a: "Sí. Podemos acompañarte solo en la estrategia o encargarnos también de la ejecución.",
        },
        {
          q: "¿Cómo empezamos?",
          a: "Con una sesión de diagnóstico para entender tu operación, objetivos y oportunidades de mejora.",
        },
      ],
    },
    en: {
      title: "Consulting & Digital Transformation",
      tagline: "The tech plan your business needs",
      description:
        "Strategy, architecture and guidance to digitize your company.",
      intro:
        "We help you make the right technology decisions. We define the strategy, architecture and roadmap to digitize and grow your business with technology.",
      features: [
        "Digital strategy and roadmap",
        "Architecture and technology selection",
        "Process digitization and automation",
        "Guidance and project management",
      ],
      benefits: [
        {
          title: "Clear direction",
          description:
            "A clear roadmap that prioritizes what to build first to maximize impact.",
        },
        {
          title: "Less risk",
          description:
            "Avoid wrong investments with decisions backed by real technical experience.",
        },
        {
          title: "Sustainable growth",
          description:
            "Technology aligned with your business goals, designed to scale with you.",
        },
      ],
      deliverables: [
        "Digital assessment of your company",
        "Strategy and prioritized roadmap",
        "Architecture and stack recommendations",
        "Guidance during execution",
      ],
      faqs: [
        {
          q: "Is it for large or small companies?",
          a: "Both. We adapt the strategy to your size, digital maturity and business goals.",
        },
        {
          q: "Do you execute what you recommend?",
          a: "Yes. We can guide you only on strategy or handle the execution as well.",
        },
        {
          q: "How do we start?",
          a: "With an assessment session to understand your operation, goals and improvement opportunities.",
        },
      ],
    },
  },
  {
    slug: "data-analytics",
    icon: "BarChart3",
    accent: "blue",
    image: "/images/svc-data-analytics.jpg",
    es: {
      title: "Data & Analytics",
      tagline: "Decisiones basadas en datos",
      description:
        "Dashboards, business intelligence y análisis para decidir con datos, no con intuición.",
      intro:
        "Convertimos tus datos en decisiones. Integramos tus fuentes, construimos dashboards claros y modelos de análisis para que veas lo que importa en tiempo real y actúes con confianza.",
      features: [
        "Dashboards e informes (BI)",
        "Integración y limpieza de datos",
        "KPIs y métricas a la medida",
        "Análisis predictivo",
      ],
      benefits: [
        {
          title: "Visión clara",
          description:
            "Toda tu información en tableros fáciles de leer, actualizados automáticamente.",
        },
        {
          title: "Mejores decisiones",
          description:
            "Detecta tendencias y oportunidades antes que tu competencia.",
        },
        {
          title: "Una sola fuente de verdad",
          description:
            "Unificamos tus datos dispersos en un solo lugar confiable.",
        },
      ],
      deliverables: [
        "Modelo e integración de datos",
        "Dashboards interactivos",
        "Definición de KPIs",
        "Capacitación en el uso",
      ],
      faqs: [
        {
          q: "¿Con qué herramientas trabajan?",
          a: "Power BI, Looker Studio, Metabase y soluciones a medida, según tu caso.",
        },
        {
          q: "¿Se conecta a mis sistemas?",
          a: "Sí. Integramos bases de datos, hojas de cálculo, ERPs, CRMs y APIs.",
        },
        {
          q: "¿Los tableros se actualizan solos?",
          a: "Sí. Configuramos actualizaciones automáticas para que siempre veas datos frescos.",
        },
      ],
    },
    en: {
      title: "Data & Analytics",
      tagline: "Decisions backed by data",
      description:
        "Dashboards, business intelligence and analysis to decide with data, not guesswork.",
      intro:
        "We turn your data into decisions. We integrate your sources, build clear dashboards and analysis models so you see what matters in real time and act with confidence.",
      features: [
        "Dashboards and reports (BI)",
        "Data integration and cleaning",
        "Custom KPIs and metrics",
        "Predictive analytics",
      ],
      benefits: [
        {
          title: "Clear vision",
          description:
            "All your information in easy-to-read dashboards, updated automatically.",
        },
        {
          title: "Better decisions",
          description:
            "Spot trends and opportunities before your competition.",
        },
        {
          title: "A single source of truth",
          description:
            "We unify your scattered data into one reliable place.",
        },
      ],
      deliverables: [
        "Data model and integration",
        "Interactive dashboards",
        "KPI definition",
        "Usage training",
      ],
      faqs: [
        {
          q: "Which tools do you work with?",
          a: "Power BI, Looker Studio, Metabase and custom solutions, depending on your case.",
        },
        {
          q: "Does it connect to my systems?",
          a: "Yes. We integrate databases, spreadsheets, ERPs, CRMs and APIs.",
        },
        {
          q: "Do dashboards update themselves?",
          a: "Yes. We set up automatic refreshes so you always see fresh data.",
        },
      ],
    },
  },
  {
    slug: "integraciones-apis",
    icon: "Plug",
    accent: "green",
    image: "/images/svc-integraciones.jpg",
    es: {
      title: "Integraciones & APIs",
      tagline: "Conecta todas tus herramientas",
      description:
        "Integramos tus sistemas y creamos APIs para que todo tu software trabaje en conjunto.",
      intro:
        "Hacemos que tus herramientas hablen entre sí. Diseñamos y conectamos APIs e integraciones entre tus sistemas para eliminar el trabajo manual y sincronizar tu información sin errores.",
      features: [
        "Diseño y desarrollo de APIs",
        "Integración de sistemas (ERP, CRM)",
        "Automatización de flujos (webhooks)",
        "Sincronización de datos en tiempo real",
      ],
      benefits: [
        {
          title: "Adiós al trabajo manual",
          description:
            "La información fluye sola entre tus plataformas, sin copiar y pegar.",
        },
        {
          title: "Menos errores",
          description:
            "Datos sincronizados y consistentes en todas tus herramientas.",
        },
        {
          title: "Ecosistema conectado",
          description:
            "Tu software funciona como un solo sistema integrado.",
        },
      ],
      deliverables: [
        "Mapa de integraciones",
        "APIs documentadas",
        "Flujos automatizados activos",
        "Monitoreo y soporte",
      ],
      faqs: [
        {
          q: "¿Integran cualquier sistema?",
          a: "Si tiene API o base de datos, casi siempre sí. Evaluamos cada caso sin compromiso.",
        },
        {
          q: "¿Qué es una API?",
          a: "Es la puerta que permite que dos programas intercambien información de forma segura y automática.",
        },
        {
          q: "¿Usan herramientas no-code?",
          a: "Cuando conviene, sí (Zapier, Make). Para casos complejos desarrollamos integraciones a la medida.",
        },
      ],
    },
    en: {
      title: "Integrations & APIs",
      tagline: "Connect all your tools",
      description:
        "We integrate your systems and build APIs so all your software works together.",
      intro:
        "We make your tools talk to each other. We design and connect APIs and integrations across your systems to remove manual work and sync your information error-free.",
      features: [
        "API design and development",
        "System integration (ERP, CRM)",
        "Workflow automation (webhooks)",
        "Real-time data synchronization",
      ],
      benefits: [
        {
          title: "Goodbye manual work",
          description:
            "Information flows on its own between your platforms — no copy-paste.",
        },
        {
          title: "Fewer errors",
          description:
            "Synced, consistent data across all your tools.",
        },
        {
          title: "Connected ecosystem",
          description:
            "Your software works as one integrated system.",
        },
      ],
      deliverables: [
        "Integration map",
        "Documented APIs",
        "Active automated workflows",
        "Monitoring and support",
      ],
      faqs: [
        {
          q: "Do you integrate any system?",
          a: "If it has an API or database, almost always yes. We assess each case with no commitment.",
        },
        {
          q: "What is an API?",
          a: "It's the door that lets two programs exchange information securely and automatically.",
        },
        {
          q: "Do you use no-code tools?",
          a: "When it fits, yes (Zapier, Make). For complex cases we build custom integrations.",
        },
      ],
    },
  },
  {
    slug: "soporte-ti",
    icon: "Headset",
    accent: "blue",
    image: "/images/svc-soporte-ti.jpg",
    es: {
      title: "Soporte TI & Outsourcing",
      tagline: "Tu equipo de tecnología, siempre disponible",
      description:
        "Soporte técnico, mesa de ayuda y outsourcing de TI para que tu operación no se detenga.",
      intro:
        "Somos la extensión tecnológica de tu equipo. Ofrecemos soporte técnico, mesa de ayuda y outsourcing de TI con tiempos de respuesta claros para que tu operación nunca se detenga.",
      features: [
        "Mesa de ayuda y soporte remoto",
        "Outsourcing de personal TI",
        "Mantenimiento preventivo y correctivo",
        "Acuerdos de nivel de servicio (SLA)",
      ],
      benefits: [
        {
          title: "Respuesta rápida",
          description:
            "Atención con tiempos garantizados para resolver incidencias sin demoras.",
        },
        {
          title: "Ahorro de costos",
          description:
            "Un equipo de TI experto sin el costo de contratar y capacitar internamente.",
        },
        {
          title: "Continuidad operativa",
          description:
            "Prevención y monitoreo para que los problemas no frenen tu negocio.",
        },
      ],
      deliverables: [
        "Plan de soporte con SLA",
        "Mesa de ayuda activa",
        "Reportes de atención",
        "Mantenimiento programado",
      ],
      faqs: [
        {
          q: "¿Ofrecen soporte presencial?",
          a: "Principalmente remoto; coordinamos visitas presenciales según tu ubicación y plan.",
        },
        {
          q: "¿Qué es un SLA?",
          a: "Es un acuerdo que define tiempos de respuesta y resolución garantizados para tu tranquilidad.",
        },
        {
          q: "¿Pueden reforzar mi equipo actual?",
          a: "Sí. Hacemos outsourcing y staff aumentado para complementar a tu equipo interno.",
        },
      ],
    },
    en: {
      title: "IT Support & Outsourcing",
      tagline: "Your tech team, always available",
      description:
        "Technical support, help desk and IT outsourcing so your operation never stops.",
      intro:
        "We're the technology extension of your team. We provide technical support, help desk and IT outsourcing with clear response times so your operation never stops.",
      features: [
        "Help desk and remote support",
        "IT staff outsourcing",
        "Preventive and corrective maintenance",
        "Service level agreements (SLA)",
      ],
      benefits: [
        {
          title: "Fast response",
          description:
            "Support with guaranteed times to resolve incidents without delays.",
        },
        {
          title: "Cost savings",
          description:
            "An expert IT team without the cost of hiring and training in-house.",
        },
        {
          title: "Operational continuity",
          description:
            "Prevention and monitoring so problems don't slow your business.",
        },
      ],
      deliverables: [
        "Support plan with SLA",
        "Active help desk",
        "Support reports",
        "Scheduled maintenance",
      ],
      faqs: [
        {
          q: "Do you offer on-site support?",
          a: "Mainly remote; we coordinate on-site visits based on your location and plan.",
        },
        {
          q: "What is an SLA?",
          a: "An agreement defining guaranteed response and resolution times for your peace of mind.",
        },
        {
          q: "Can you reinforce my current team?",
          a: "Yes. We offer outsourcing and staff augmentation to complement your in-house team.",
        },
      ],
    },
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function serviceCopy(service: Service, locale: Locale): ServiceCopy {
  return service[locale];
}
