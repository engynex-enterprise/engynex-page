/**
 * Proceso de trabajo específico de cada servicio.
 *
 * El proceso genérico de la home ("Descubrimiento → Estrategia → Desarrollo →
 * Lanzamiento") no dice nada en una página de ciberseguridad o de alquiler de
 * equipos. Aquí cada servicio describe sus propias etapas, con la duración y
 * el entregable real de cada una.
 */

export interface ProcessStep {
  title: string;
  description: string;
  /** Duración + entregable de la etapa. */
  meta: string;
}

export interface ProcessCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: ProcessStep[];
}

export interface ServiceProcess {
  es: ProcessCopy;
  en: ProcessCopy;
}

export const serviceProcess: Record<string, ServiceProcess> = {
  "desarrollo-web": {
    es: {
      eyebrow: "Cómo hacemos tu sitio",
      title: "De la primera reunión a tu sitio publicado",
      subtitle:
        "Cuatro etapas cortas, con algo revisable en tus manos cada semana.",
      steps: [
        {
          title: "Contenido y arquitectura",
          description:
            "Definimos las secciones, los textos y las imágenes. Si aún no tienes contenido, te damos la guía y lo redactamos contigo.",
          meta: "3–5 días · Mapa del sitio aprobado",
        },
        {
          title: "Diseño de pantallas",
          description:
            "Diseñamos la home y las plantillas internas en Figma. Ajustamos hasta que te guste antes de programar una sola línea.",
          meta: "1–2 semanas · 2 rondas de ajuste",
        },
        {
          title: "Programación y carga",
          description:
            "Maquetamos, cargamos el contenido, conectamos formularios y dejamos el gestor listo para que edites sin depender de nadie.",
          meta: "2–4 semanas · Enlace de pruebas",
        },
        {
          title: "Publicación y SEO",
          description:
            "Configuramos dominio, SSL, analítica y SEO técnico. Capacitamos a tu equipo y entramos en garantía.",
          meta: "2 días · En línea + capacitación",
        },
      ],
    },
    en: {
      eyebrow: "How we build your site",
      title: "From the first meeting to your site going live",
      subtitle:
        "Four short stages, with something you can review in your hands every week.",
      steps: [
        {
          title: "Content and architecture",
          description:
            "We define sections, copy and images. If you don't have content yet, we give you the guide and write it with you.",
          meta: "3–5 days · Approved sitemap",
        },
        {
          title: "Screen design",
          description:
            "We design the home page and inner templates in Figma. We adjust until you like it before writing a single line of code.",
          meta: "1–2 weeks · 2 rounds of revisions",
        },
        {
          title: "Build and content load",
          description:
            "We code it, load the content, connect the forms and hand over the CMS so you can edit without depending on anyone.",
          meta: "2–4 weeks · Staging link",
        },
        {
          title: "Launch and SEO",
          description:
            "We set up the domain, SSL, analytics and technical SEO. We train your team and the warranty starts.",
          meta: "2 days · Live + training",
        },
      ],
    },
  },

  "plataformas-web": {
    es: {
      eyebrow: "Cómo construimos tu plataforma",
      title: "Módulo a módulo, con demo cada quince días",
      subtitle:
        "Nunca esperas meses para ver algo: cada sprint termina en software que ya puedes usar.",
      steps: [
        {
          title: "Levantamiento funcional",
          description:
            "Mapeamos tus procesos actuales y definimos módulos, roles y reglas de negocio con las personas que los usan.",
          meta: "1–2 semanas · Documento funcional",
        },
        {
          title: "Prototipo navegable",
          description:
            "Diseñamos y validamos las pantallas clave con tus usuarios reales antes de escribir código.",
          meta: "2 semanas · Prototipo aprobado",
        },
        {
          title: "Sprints de desarrollo",
          description:
            "Construimos por módulos y te mostramos avance cada quince días. Ajustamos sobre algo que ya funciona.",
          meta: "8–16 semanas · Demo quincenal",
        },
        {
          title: "Pruebas e integraciones",
          description:
            "Conectamos ERP, CRM y pagos, corremos pruebas automatizadas y validamos todo en un ambiente de staging.",
          meta: "2 semanas · Ambiente de pruebas",
        },
        {
          title: "Salida a producción",
          description:
            "Migramos los datos, capacitamos a tu equipo y acompañamos de cerca las primeras semanas de operación.",
          meta: "1 semana · Go-live acompañado",
        },
      ],
    },
    en: {
      eyebrow: "How we build your platform",
      title: "Module by module, with a demo every two weeks",
      subtitle:
        "You never wait months to see something: every sprint ends in software you can already use.",
      steps: [
        {
          title: "Functional discovery",
          description:
            "We map your current processes and define modules, roles and business rules with the people who actually use them.",
          meta: "1–2 weeks · Functional spec",
        },
        {
          title: "Clickable prototype",
          description:
            "We design and validate the key screens with your real users before writing code.",
          meta: "2 weeks · Approved prototype",
        },
        {
          title: "Development sprints",
          description:
            "We build module by module and show progress every two weeks. You give feedback on something that already works.",
          meta: "8–16 weeks · Demo every 2 weeks",
        },
        {
          title: "Testing and integrations",
          description:
            "We connect ERP, CRM and payments, run automated tests and validate everything in a staging environment.",
          meta: "2 weeks · Staging environment",
        },
        {
          title: "Go live",
          description:
            "We migrate the data, train your team and stay close during the first weeks of operation.",
          meta: "1 week · Supported go-live",
        },
      ],
    },
  },

  "apps-moviles": {
    es: {
      eyebrow: "Cómo llevamos tu app a la tienda",
      title: "Del alcance a la App Store, con builds que puedes usar",
      subtitle:
        "Desde la segunda semana instalas la app en tu celular y opinas sobre algo real.",
      steps: [
        {
          title: "Definición del alcance",
          description:
            "Priorizamos las funciones de la primera versión: lo mínimo que hace falta para salir a la tienda y aprender.",
          meta: "1 semana · Alcance del MVP",
        },
        {
          title: "Diseño de la experiencia",
          description:
            "Prototipo interactivo que puedes tocar en tu propio teléfono antes de invertir en desarrollo.",
          meta: "2 semanas · Prototipo en tu teléfono",
        },
        {
          title: "Desarrollo y builds de prueba",
          description:
            "Cada quince días recibes una versión instalable por TestFlight o APK para usarla de verdad.",
          meta: "6–12 semanas · Build quincenal",
        },
        {
          title: "Publicación en tiendas",
          description:
            "Preparamos ficha, capturas y políticas de privacidad, y gestionamos la revisión de Apple y Google.",
          meta: "1–3 semanas · Revisión de tiendas",
        },
        {
          title: "Monitoreo post-lanzamiento",
          description:
            "Seguimos errores, reseñas y adopción, y publicamos actualizaciones correctivas.",
          meta: "Continuo · Reporte mensual",
        },
      ],
    },
    en: {
      eyebrow: "How we get your app to the store",
      title: "From scope to the App Store, with builds you can use",
      subtitle:
        "From week two you install the app on your phone and give feedback on something real.",
      steps: [
        {
          title: "Scope definition",
          description:
            "We prioritize the features of the first version: the minimum needed to ship and start learning.",
          meta: "1 week · MVP scope",
        },
        {
          title: "Experience design",
          description:
            "An interactive prototype you can tap on your own phone before investing in development.",
          meta: "2 weeks · Prototype on your phone",
        },
        {
          title: "Development and test builds",
          description:
            "Every two weeks you get an installable build via TestFlight or APK to use for real.",
          meta: "6–12 weeks · Build every 2 weeks",
        },
        {
          title: "Store submission",
          description:
            "We prepare the listing, screenshots and privacy policies, and manage the Apple and Google review.",
          meta: "1–3 weeks · Store review",
        },
        {
          title: "Post-launch monitoring",
          description:
            "We track crashes, reviews and adoption, and ship corrective updates.",
          meta: "Ongoing · Monthly report",
        },
      ],
    },
  },

  ecommerce: {
    es: {
      eyebrow: "Cómo montamos tu tienda",
      title: "De tu catálogo a la primera venta en línea",
      subtitle:
        "No publicamos hasta que hayamos comprado en tu tienda de punta a punta, como lo haría un cliente.",
      steps: [
        {
          title: "Catálogo y reglas de venta",
          description:
            "Definimos productos, variantes, precios, impuestos, envíos y políticas de cambio y devolución.",
          meta: "1 semana · Catálogo definido",
        },
        {
          title: "Diseño de la tienda",
          description:
            "Diseñamos home, categoría, ficha de producto y checkout pensando en una sola cosa: que la compra no se caiga.",
          meta: "1–2 semanas · Diseño aprobado",
        },
        {
          title: "Montaje, pagos y envíos",
          description:
            "Montamos la tienda, cargamos productos e integramos pasarela de pago y transportadoras.",
          meta: "2–4 semanas · Tienda en pruebas",
        },
        {
          title: "Pruebas de compra reales",
          description:
            "Hacemos compras completas: pago aprobado, factura emitida, notificación enviada y pedido despachado.",
          meta: "3–5 días · Checklist de compra",
        },
        {
          title: "Lanzamiento y optimización",
          description:
            "Publicamos, medimos el embudo y ajustamos lo que está frenando la conversión.",
          meta: "Continuo · Reporte de conversión",
        },
      ],
    },
    en: {
      eyebrow: "How we set up your store",
      title: "From your catalog to the first online sale",
      subtitle:
        "We don't launch until we've bought from your store end to end, exactly like a customer would.",
      steps: [
        {
          title: "Catalog and selling rules",
          description:
            "We define products, variants, prices, taxes, shipping and your exchange and return policies.",
          meta: "1 week · Catalog defined",
        },
        {
          title: "Store design",
          description:
            "We design home, category, product page and checkout with one goal: not losing the sale halfway.",
          meta: "1–2 weeks · Design approved",
        },
        {
          title: "Build, payments and shipping",
          description:
            "We build the store, upload products and integrate the payment gateway and shipping carriers.",
          meta: "2–4 weeks · Store in testing",
        },
        {
          title: "Real purchase testing",
          description:
            "We run complete purchases: payment approved, invoice issued, notification sent and order dispatched.",
          meta: "3–5 days · Purchase checklist",
        },
        {
          title: "Launch and optimization",
          description:
            "We publish, measure the funnel and fix whatever is holding conversion back.",
          meta: "Ongoing · Conversion report",
        },
      ],
    },
  },

  "ux-ui-branding": {
    es: {
      eyebrow: "Nuestro proceso creativo",
      title: "De la inmersión al manual de marca",
      subtitle:
        "Nada de plantillas: partimos de tu negocio y llegamos a un sistema visual que tu equipo puede usar solo.",
      steps: [
        {
          title: "Inmersión y referentes",
          description:
            "Entendemos tu negocio, tu público y a tu competencia. Armamos contigo el tablero de referentes visuales.",
          meta: "1 semana · Brief y moodboard",
        },
        {
          title: "Concepto y territorio visual",
          description:
            "Presentamos tres rutas creativas distintas, con su razón de ser. Eliges una y la desarrollamos a fondo.",
          meta: "1–2 semanas · 3 propuestas",
        },
        {
          title: "Diseño y sistema",
          description:
            "Aplicamos la ruta elegida a todas las piezas y construimos el sistema de componentes reutilizables.",
          meta: "2–4 semanas · 2 rondas de ajuste",
        },
        {
          title: "Manual y entrega",
          description:
            "Entregamos manual de marca, archivos fuente y guías de uso, y acompañamos a quien vaya a aplicarlos.",
          meta: "1 semana · Archivos editables",
        },
      ],
    },
    en: {
      eyebrow: "Our creative process",
      title: "From immersion to the brand guidelines",
      subtitle:
        "No templates: we start from your business and end with a visual system your team can run on its own.",
      steps: [
        {
          title: "Immersion and references",
          description:
            "We understand your business, your audience and your competitors. We build the visual reference board with you.",
          meta: "1 week · Brief and moodboard",
        },
        {
          title: "Concept and visual territory",
          description:
            "We present three distinct creative routes with the reasoning behind each. You pick one and we develop it fully.",
          meta: "1–2 weeks · 3 concepts",
        },
        {
          title: "Design and system",
          description:
            "We apply the chosen route across every asset and build the reusable component system.",
          meta: "2–4 weeks · 2 rounds of revisions",
        },
        {
          title: "Guidelines and handoff",
          description:
            "We deliver brand guidelines, source files and usage guides, and support whoever will apply them.",
          meta: "1 week · Editable files",
        },
      ],
    },
  },

  "marketing-digital": {
    es: {
      eyebrow: "Cómo trabajamos tu marketing",
      title: "Un ciclo mensual que se ajusta con datos",
      subtitle:
        "No es publicar por publicar: cada mes cerramos con números y decidimos qué cambia el siguiente.",
      steps: [
        {
          title: "Diagnóstico y objetivos",
          description:
            "Revisamos tus canales y a tu competencia, y acordamos la meta real: leads, ventas o reconocimiento.",
          meta: "1 semana · Objetivos y KPI",
        },
        {
          title: "Estrategia y plan de contenidos",
          description:
            "Armamos el calendario editorial, los mensajes y la estructura de campañas por canal.",
          meta: "1 semana · Plan mensual aprobado",
        },
        {
          title: "Producción y publicación",
          description:
            "Creamos piezas, textos y video corto; publicamos en el calendario y activamos las campañas.",
          meta: "Mensual · Calendario en marcha",
        },
        {
          title: "Optimización con datos",
          description:
            "Revisamos costo por lead cada semana y ajustamos audiencias, creatividades y presupuesto.",
          meta: "Semanal · Ajuste de campañas",
        },
        {
          title: "Reporte y siguiente ciclo",
          description:
            "Informe claro de qué funcionó, qué no y en qué invertimos el mes que viene.",
          meta: "Mensual · Reunión de resultados",
        },
      ],
    },
    en: {
      eyebrow: "How we run your marketing",
      title: "A monthly cycle that adjusts with data",
      subtitle:
        "Not posting for the sake of it: every month closes with numbers and a decision on what changes next.",
      steps: [
        {
          title: "Audit and goals",
          description:
            "We review your channels and your competitors, and agree on the real goal: leads, sales or awareness.",
          meta: "1 week · Goals and KPIs",
        },
        {
          title: "Strategy and content plan",
          description:
            "We build the editorial calendar, the messaging and the campaign structure per channel.",
          meta: "1 week · Monthly plan approved",
        },
        {
          title: "Production and publishing",
          description:
            "We create assets, copy and short video; we publish on schedule and launch the campaigns.",
          meta: "Monthly · Calendar running",
        },
        {
          title: "Data-driven optimization",
          description:
            "We review cost per lead weekly and adjust audiences, creatives and budget.",
          meta: "Weekly · Campaign tuning",
        },
        {
          title: "Report and next cycle",
          description:
            "A clear report of what worked, what didn't and where the next month's budget goes.",
          meta: "Monthly · Results meeting",
        },
      ],
    },
  },

  "produccion-audiovisual": {
    es: {
      eyebrow: "De la idea a la pantalla",
      title: "Preproducción, rodaje y postproducción",
      subtitle:
        "Te presentamos el concepto antes de mover una cámara: así el rodaje no tiene sorpresas.",
      steps: [
        {
          title: "Brief y concepto",
          description:
            "Definimos el mensaje, el tono y la idea creativa. Te presentamos el concepto antes de grabar nada.",
          meta: "3–5 días · Concepto aprobado",
        },
        {
          title: "Guion y preproducción",
          description:
            "Guion, storyboard, locaciones, casting y plan de rodaje cerrado, con presupuesto sin sorpresas.",
          meta: "1–2 semanas · Plan de rodaje",
        },
        {
          title: "Rodaje",
          description:
            "Grabamos con equipo profesional: cámara, iluminación, sonido y dirección en set.",
          meta: "1–3 días · Jornada de grabación",
        },
        {
          title: "Postproducción",
          description:
            "Montaje, corrección de color, musicalización, motion graphics y subtítulos.",
          meta: "1–2 semanas · 2 rondas de ajuste",
        },
        {
          title: "Entrega multiformato",
          description:
            "Recibes el máster y las versiones adaptadas a redes, pauta y web, en cada relación de aspecto.",
          meta: "2 días · Piezas por plataforma",
        },
      ],
    },
    en: {
      eyebrow: "From idea to screen",
      title: "Pre-production, shoot and post-production",
      subtitle:
        "We present the concept before a camera moves, so the shoot holds no surprises.",
      steps: [
        {
          title: "Brief and concept",
          description:
            "We define the message, the tone and the creative idea. You approve the concept before anything is shot.",
          meta: "3–5 days · Concept approved",
        },
        {
          title: "Script and pre-production",
          description:
            "Script, storyboard, locations, casting and a closed shooting plan with a no-surprises budget.",
          meta: "1–2 weeks · Shooting plan",
        },
        {
          title: "Shoot",
          description:
            "We shoot with professional crew and gear: camera, lighting, sound and on-set direction.",
          meta: "1–3 days · Shooting days",
        },
        {
          title: "Post-production",
          description:
            "Editing, color grading, music, motion graphics and subtitles.",
          meta: "1–2 weeks · 2 rounds of revisions",
        },
        {
          title: "Multi-format delivery",
          description:
            "You receive the master plus versions adapted for social, ads and web, in every aspect ratio.",
          meta: "2 days · Assets per platform",
        },
      ],
    },
  },

  "ia-automatizacion": {
    es: {
      eyebrow: "Cómo implementamos la IA",
      title: "Del caso de uso al asistente en producción",
      subtitle:
        "Empezamos por un caso concreto y medible. Si no ahorra tiempo real, no lo escalamos.",
      steps: [
        {
          title: "Mapeo de oportunidades",
          description:
            "Identificamos qué tareas repetitivas consumen más horas y cuáles se pueden automatizar desde ya.",
          meta: "1 semana · Casos priorizados",
        },
        {
          title: "Preparación de la información",
          description:
            "Reunimos y ordenamos los documentos y datos con los que se va a entrenar el asistente.",
          meta: "1–2 semanas · Base de conocimiento",
        },
        {
          title: "Piloto controlado",
          description:
            "Ponemos un caso en producción con un grupo reducido y medimos precisión, adopción y ahorro.",
          meta: "2–4 semanas · Métricas del piloto",
        },
        {
          title: "Integración y despliegue",
          description:
            "Conectamos con WhatsApp, tu web o tus sistemas y lo abrimos a toda la operación.",
          meta: "2 semanas · En producción",
        },
        {
          title: "Ajuste fino continuo",
          description:
            "Revisamos conversaciones reales, corregimos respuestas y ampliamos el alcance mes a mes.",
          meta: "Continuo · Revisión mensual",
        },
      ],
    },
    en: {
      eyebrow: "How we roll out AI",
      title: "From the use case to an assistant in production",
      subtitle:
        "We start with one concrete, measurable case. If it doesn't save real time, we don't scale it.",
      steps: [
        {
          title: "Opportunity mapping",
          description:
            "We identify which repetitive tasks eat the most hours and which can be automated right away.",
          meta: "1 week · Prioritized cases",
        },
        {
          title: "Preparing the information",
          description:
            "We gather and organize the documents and data the assistant will be trained on.",
          meta: "1–2 weeks · Knowledge base",
        },
        {
          title: "Controlled pilot",
          description:
            "We put one case into production with a small group and measure accuracy, adoption and savings.",
          meta: "2–4 weeks · Pilot metrics",
        },
        {
          title: "Integration and rollout",
          description:
            "We connect it to WhatsApp, your website or your systems and open it to the whole operation.",
          meta: "2 weeks · In production",
        },
        {
          title: "Continuous fine-tuning",
          description:
            "We review real conversations, correct answers and expand the scope month after month.",
          meta: "Ongoing · Monthly review",
        },
      ],
    },
  },

  "cloud-devops": {
    es: {
      eyebrow: "Cómo operamos tu nube",
      title: "Auditar, automatizar y después operar",
      subtitle:
        "El objetivo no es entregar una arquitectura bonita, es que nadie tenga que despertarse de madrugada.",
      steps: [
        {
          title: "Auditoría de infraestructura",
          description:
            "Revisamos qué tienes hoy, cuánto cuesta y dónde están los puntos únicos de falla.",
          meta: "1 semana · Informe de estado",
        },
        {
          title: "Diseño de la arquitectura",
          description:
            "Definimos la arquitectura objetivo, el proveedor y el plan de migración con su costo estimado.",
          meta: "1–2 semanas · Arquitectura aprobada",
        },
        {
          title: "Automatización y despliegue",
          description:
            "Montamos infraestructura como código, contenedores y pipelines de CI/CD reproducibles.",
          meta: "2–6 semanas · Pipeline en marcha",
        },
        {
          title: "Monitoreo y alertas",
          description:
            "Dejamos tableros, alertas y runbooks para que atender un incidente no dependa de una sola persona.",
          meta: "1 semana · Alertas activas",
        },
        {
          title: "Operación y optimización",
          description:
            "Operamos el día a día, revisamos costos cada mes y ajustamos capacidad según la demanda real.",
          meta: "Continuo · Informe mensual",
        },
      ],
    },
    en: {
      eyebrow: "How we run your cloud",
      title: "Audit, automate, then operate",
      subtitle:
        "The goal isn't a pretty architecture diagram, it's that nobody has to wake up at 3 a.m.",
      steps: [
        {
          title: "Infrastructure audit",
          description:
            "We review what you have today, what it costs and where the single points of failure are.",
          meta: "1 week · Status report",
        },
        {
          title: "Architecture design",
          description:
            "We define the target architecture, the provider and the migration plan with estimated cost.",
          meta: "1–2 weeks · Architecture approved",
        },
        {
          title: "Automation and deployment",
          description:
            "We set up infrastructure as code, containers and reproducible CI/CD pipelines.",
          meta: "2–6 weeks · Pipeline running",
        },
        {
          title: "Monitoring and alerts",
          description:
            "We leave dashboards, alerts and runbooks so handling an incident never depends on one person.",
          meta: "1 week · Alerts active",
        },
        {
          title: "Operation and optimization",
          description:
            "We run day-to-day operations, review costs monthly and adjust capacity to real demand.",
          meta: "Ongoing · Monthly report",
        },
      ],
    },
  },

  ciberseguridad: {
    es: {
      eyebrow: "Cómo auditamos tu seguridad",
      title: "Alcance, pruebas, corrección y retest",
      subtitle:
        "Nada se prueba sin acuerdo previo y sin NDA firmado. Y no cerramos hasta verificar la corrección.",
      steps: [
        {
          title: "Alcance y acuerdo",
          description:
            "Definimos qué se prueba, cuándo y con qué límites. Firmamos NDA antes de recibir cualquier acceso.",
          meta: "3–5 días · Alcance y NDA",
        },
        {
          title: "Reconocimiento y escaneo",
          description:
            "Mapeamos tu superficie expuesta y ejecutamos análisis automatizados de vulnerabilidades.",
          meta: "1 semana · Inventario de riesgos",
        },
        {
          title: "Pruebas manuales",
          description:
            "Simulamos ataques reales sobre aplicación, API y autenticación, con evidencia de cada hallazgo.",
          meta: "1–2 semanas · Explotación controlada",
        },
        {
          title: "Informe y remediación",
          description:
            "Entregamos los hallazgos priorizados por riesgo real y acompañamos a tu equipo en la corrección.",
          meta: "1 semana · Plan priorizado",
        },
        {
          title: "Retest de verificación",
          description:
            "Volvemos a probar lo corregido y certificamos por escrito que quedó cerrado.",
          meta: "3 días · Certificado de retest",
        },
      ],
    },
    en: {
      eyebrow: "How we audit your security",
      title: "Scope, testing, remediation and retest",
      subtitle:
        "Nothing is tested without prior agreement and a signed NDA. And we don't close until fixes are verified.",
      steps: [
        {
          title: "Scope and agreement",
          description:
            "We define what gets tested, when and within what limits. We sign an NDA before receiving any access.",
          meta: "3–5 days · Scope and NDA",
        },
        {
          title: "Recon and scanning",
          description:
            "We map your exposed surface and run automated vulnerability analysis.",
          meta: "1 week · Risk inventory",
        },
        {
          title: "Manual testing",
          description:
            "We simulate real attacks against application, API and authentication, with evidence for every finding.",
          meta: "1–2 weeks · Controlled exploitation",
        },
        {
          title: "Report and remediation",
          description:
            "We deliver findings prioritized by real risk and support your team through the fixes.",
          meta: "1 week · Prioritized plan",
        },
        {
          title: "Verification retest",
          description:
            "We test the fixes again and certify in writing that they're closed.",
          meta: "3 days · Retest certificate",
        },
      ],
    },
  },

  "hosting-mantenimiento": {
    es: {
      eyebrow: "Cómo cuidamos tu sitio",
      title: "Migrar, asegurar y vigilar todos los días",
      subtitle:
        "Si algo se cae, nos enteramos antes que tú. Ese es todo el punto de este servicio.",
      steps: [
        {
          title: "Diagnóstico y migración",
          description:
            "Revisamos tu sitio actual, preparamos el ambiente y migramos sin interrupciones perceptibles.",
          meta: "2–5 días · Migración sin caída",
        },
        {
          title: "Aseguramiento inicial",
          description:
            "Certificado SSL, CDN, copias de seguridad automáticas y endurecimiento del servidor.",
          meta: "2 días · Checklist de seguridad",
        },
        {
          title: "Monitoreo permanente",
          description:
            "Vigilamos disponibilidad y velocidad 24/7 con alertas automáticas ante cualquier caída.",
          meta: "Continuo · Alertas 24/7",
        },
        {
          title: "Mantenimiento programado",
          description:
            "Actualizaciones, parches de seguridad y los cambios de contenido que incluya tu plan.",
          meta: "Mensual · Ventana de mantenimiento",
        },
        {
          title: "Reporte de salud",
          description:
            "Informe mensual de disponibilidad, velocidad y copias de seguridad verificadas.",
          meta: "Mensual · Informe de uptime",
        },
      ],
    },
    en: {
      eyebrow: "How we look after your site",
      title: "Migrate, secure and watch it every day",
      subtitle:
        "If something goes down, we know before you do. That's the entire point of this service.",
      steps: [
        {
          title: "Assessment and migration",
          description:
            "We review your current site, prepare the environment and migrate with no noticeable downtime.",
          meta: "2–5 days · Zero-downtime migration",
        },
        {
          title: "Initial hardening",
          description:
            "SSL certificate, CDN, automatic backups and server hardening.",
          meta: "2 days · Security checklist",
        },
        {
          title: "Continuous monitoring",
          description:
            "We watch uptime and speed 24/7 with automatic alerts on any outage.",
          meta: "Ongoing · 24/7 alerts",
        },
        {
          title: "Scheduled maintenance",
          description:
            "Updates, security patches and the content changes included in your plan.",
          meta: "Monthly · Maintenance window",
        },
        {
          title: "Health report",
          description:
            "A monthly report on uptime, speed and verified backups.",
          meta: "Monthly · Uptime report",
        },
      ],
    },
  },

  "consultoria-tech": {
    es: {
      eyebrow: "Cómo construimos tu hoja de ruta",
      title: "Del diagnóstico al plan que la dirección aprueba",
      subtitle:
        "Hablamos con quien opera y presentamos en lenguaje de negocio, no en lenguaje técnico.",
      steps: [
        {
          title: "Entrevistas y diagnóstico",
          description:
            "Hablamos con las áreas clave y levantamos procesos, sistemas y los dolores reales del día a día.",
          meta: "1–2 semanas · Mapa de procesos",
        },
        {
          title: "Análisis y benchmark",
          description:
            "Comparamos tu madurez digital con la de tu sector y detectamos las brechas que están costando plata.",
          meta: "1 semana · Diagnóstico de madurez",
        },
        {
          title: "Hoja de ruta priorizada",
          description:
            "Definimos qué construir primero, con inversión estimada y retorno esperado por iniciativa.",
          meta: "1–2 semanas · Roadmap a 12 meses",
        },
        {
          title: "Presentación a dirección",
          description:
            "Presentamos el plan en lenguaje de negocio, con cifras, para que se apruebe y se ejecute.",
          meta: "1 sesión · Plan aprobado",
        },
        {
          title: "Acompañamiento en la ejecución",
          description:
            "Comités periódicos de seguimiento para que el plan no se quede en una presentación bonita.",
          meta: "Continuo · Comité quincenal",
        },
      ],
    },
    en: {
      eyebrow: "How we build your roadmap",
      title: "From assessment to a plan leadership approves",
      subtitle:
        "We talk to the people who operate and present in business language, not technical jargon.",
      steps: [
        {
          title: "Interviews and assessment",
          description:
            "We talk to key departments and map processes, systems and the real day-to-day pain points.",
          meta: "1–2 weeks · Process map",
        },
        {
          title: "Analysis and benchmark",
          description:
            "We compare your digital maturity against your sector and find the gaps that are costing money.",
          meta: "1 week · Maturity assessment",
        },
        {
          title: "Prioritized roadmap",
          description:
            "We define what to build first, with estimated investment and expected return per initiative.",
          meta: "1–2 weeks · 12-month roadmap",
        },
        {
          title: "Presentation to leadership",
          description:
            "We present the plan in business language, with numbers, so it gets approved and executed.",
          meta: "1 session · Plan approved",
        },
        {
          title: "Execution support",
          description:
            "Regular steering committees so the plan doesn't stay a nice-looking slide deck.",
          meta: "Ongoing · Bi-weekly committee",
        },
      ],
    },
  },

  "data-analytics": {
    es: {
      eyebrow: "Cómo montamos tu analítica",
      title: "De datos dispersos a una sola fuente de verdad",
      subtitle:
        "Antes de dibujar un solo tablero, acordamos cómo se calcula cada indicador.",
      steps: [
        {
          title: "Definición de indicadores",
          description:
            "Acordamos qué se mide y cómo se calcula. Una sola definición de cada indicador para toda la empresa.",
          meta: "1 semana · Diccionario de KPI",
        },
        {
          title: "Conexión y limpieza de fuentes",
          description:
            "Integramos bases, hojas de cálculo, ERP y CRM, y resolvemos duplicados e inconsistencias.",
          meta: "1–3 semanas · Datos unificados",
        },
        {
          title: "Modelo de datos",
          description:
            "Construimos el modelo y la bodega de datos para que las consultas sean rápidas y confiables.",
          meta: "2 semanas · Modelo validado",
        },
        {
          title: "Tableros por área",
          description:
            "Diseñamos los tableros con permisos por rol y actualización automática programada.",
          meta: "2 semanas · Tableros en línea",
        },
        {
          title: "Adopción y capacitación",
          description:
            "Entrenamos a cada área para que el tablero se use en su reunión semanal, no una vez al año.",
          meta: "1 semana · Equipo capacitado",
        },
      ],
    },
    en: {
      eyebrow: "How we set up your analytics",
      title: "From scattered data to a single source of truth",
      subtitle:
        "Before drawing a single dashboard, we agree on how each indicator is calculated.",
      steps: [
        {
          title: "Indicator definition",
          description:
            "We agree on what gets measured and how it's calculated. One definition per indicator, for the whole company.",
          meta: "1 week · KPI dictionary",
        },
        {
          title: "Source connection and cleanup",
          description:
            "We integrate databases, spreadsheets, ERP and CRM, and resolve duplicates and inconsistencies.",
          meta: "1–3 weeks · Unified data",
        },
        {
          title: "Data model",
          description:
            "We build the model and warehouse so queries are fast and trustworthy.",
          meta: "2 weeks · Validated model",
        },
        {
          title: "Dashboards per department",
          description:
            "We design dashboards with role-based permissions and scheduled automatic refresh.",
          meta: "2 weeks · Dashboards live",
        },
        {
          title: "Adoption and training",
          description:
            "We train each area so the dashboard is used in their weekly meeting, not once a year.",
          meta: "1 week · Team trained",
        },
      ],
    },
  },

  "integraciones-apis": {
    es: {
      eyebrow: "Cómo conectamos tus sistemas",
      title: "Del mapa de sistemas a la sincronización vigilada",
      subtitle:
        "Una integración no termina cuando funciona: termina cuando avisa sola si algo falla.",
      steps: [
        {
          title: "Mapa de sistemas",
          description:
            "Levantamos qué sistemas hay, qué datos comparten y dónde está hoy el trabajo manual de copiar y pegar.",
          meta: "1 semana · Mapa de integraciones",
        },
        {
          title: "Diseño del contrato de datos",
          description:
            "Definimos qué datos viajan, en qué dirección, con qué frecuencia y qué pasa ante un error.",
          meta: "3–5 días · Contrato de datos",
        },
        {
          title: "Desarrollo y pruebas",
          description:
            "Construimos la integración con manejo de errores y reintentos, y la probamos con datos reales.",
          meta: "2–4 semanas · Ambiente de pruebas",
        },
        {
          title: "Puesta en marcha vigilada",
          description:
            "Activamos en producción con monitoreo y alertas ante cualquier sincronización fallida.",
          meta: "1 semana · Monitoreo activo",
        },
        {
          title: "Documentación y soporte",
          description:
            "Entregamos la documentación técnica y quedamos pendientes de la operación de la integración.",
          meta: "Continuo · Soporte de sincronización",
        },
      ],
    },
    en: {
      eyebrow: "How we connect your systems",
      title: "From the system map to monitored syncing",
      subtitle:
        "An integration isn't done when it works: it's done when it tells you by itself if something breaks.",
      steps: [
        {
          title: "System map",
          description:
            "We map what systems exist, what data they share and where the copy-paste work is happening today.",
          meta: "1 week · Integration map",
        },
        {
          title: "Data contract design",
          description:
            "We define what data travels, in which direction, how often and what happens when there's an error.",
          meta: "3–5 days · Data contract",
        },
        {
          title: "Development and testing",
          description:
            "We build the integration with error handling and retries, and test it with real data.",
          meta: "2–4 weeks · Test environment",
        },
        {
          title: "Monitored go-live",
          description:
            "We switch it on in production with monitoring and alerts for any failed sync.",
          meta: "1 week · Monitoring active",
        },
        {
          title: "Documentation and support",
          description:
            "We hand over technical documentation and stay on top of how the integration runs.",
          meta: "Ongoing · Sync support",
        },
      ],
    },
  },

  "soporte-ti": {
    es: {
      eyebrow: "Cómo entra en marcha tu mesa de ayuda",
      title: "Del inventario al SLA que sí se cumple",
      subtitle:
        "Un servicio de soporte se mide en tiempos de respuesta, no en buenas intenciones.",
      steps: [
        {
          title: "Levantamiento de tu operación",
          description:
            "Inventariamos equipos, usuarios, licencias y los sistemas de los que depende tu día a día.",
          meta: "1 semana · Inventario de TI",
        },
        {
          title: "Acuerdo de servicio",
          description:
            "Definimos canales, horarios, prioridades y tiempos de respuesta comprometidos por tipo de caso.",
          meta: "3–5 días · SLA firmado",
        },
        {
          title: "Puesta en marcha de la mesa",
          description:
            "Habilitamos la mesa de ayuda, capacitamos a tus usuarios y entregamos los canales de contacto.",
          meta: "1 semana · Mesa operando",
        },
        {
          title: "Atención y mantenimiento",
          description:
            "Resolvemos incidencias dentro del SLA y ejecutamos el mantenimiento preventivo programado.",
          meta: "Continuo · SLA de 4–8 horas",
        },
        {
          title: "Comité de mejora",
          description:
            "Revisamos los indicadores del mes y atacamos la causa de los casos que se repiten.",
          meta: "Mensual · Comité de servicio",
        },
      ],
    },
    en: {
      eyebrow: "How your help desk goes live",
      title: "From inventory to an SLA that actually holds",
      subtitle:
        "A support service is measured in response times, not in good intentions.",
      steps: [
        {
          title: "Assessment of your operation",
          description:
            "We inventory devices, users, licenses and the systems your day-to-day depends on.",
          meta: "1 week · IT inventory",
        },
        {
          title: "Service agreement",
          description:
            "We define channels, hours, priorities and committed response times per case type.",
          meta: "3–5 days · Signed SLA",
        },
        {
          title: "Help desk rollout",
          description:
            "We stand up the help desk, train your users and hand over the contact channels.",
          meta: "1 week · Desk operating",
        },
        {
          title: "Support and maintenance",
          description:
            "We resolve incidents within the SLA and run scheduled preventive maintenance.",
          meta: "Ongoing · 4–8 hour SLA",
        },
        {
          title: "Improvement committee",
          description:
            "We review the month's indicators and attack the root cause of recurring cases.",
          meta: "Monthly · Service committee",
        },
      ],
    },
  },

  "alquiler-equipos": {
    es: {
      eyebrow: "Cómo llegan tus equipos",
      title: "De la cotización a los equipos funcionando en tu oficina",
      subtitle:
        "Llegan configurados, inventariados e instalados. Tu equipo solo se sienta y trabaja.",
      steps: [
        {
          title: "Levantamiento de necesidades",
          description:
            "Definimos cuántos equipos, con qué perfil de uso (oficina, diseño, servidor) y por cuánto tiempo.",
          meta: "2–3 días · Propuesta por perfil",
        },
        {
          title: "Propuesta y contrato",
          description:
            "Cotización por equipo y plazo, con lo que incluye el soporte y la reposición. Sin letra menuda.",
          meta: "2 días · Contrato firmado",
        },
        {
          title: "Alistamiento y configuración",
          description:
            "Instalamos sistema operativo, licencias, antivirus, tu dominio corporativo y el software que uses.",
          meta: "3–5 días · Equipos inventariados",
        },
        {
          title: "Entrega e instalación en sitio",
          description:
            "Llevamos, conectamos y dejamos funcionando. Cableado y puesta en marcha incluidos.",
          meta: "1–2 días · Acta de entrega",
        },
        {
          title: "Soporte, reposición y renovación",
          description:
            "Mantenimiento preventivo, reemplazo inmediato si algo falla y renovación tecnológica al vencer el plazo.",
          meta: "Continuo · Equipo de respaldo",
        },
      ],
    },
    en: {
      eyebrow: "How your equipment arrives",
      title: "From the quote to machines running in your office",
      subtitle:
        "They arrive configured, inventoried and installed. Your team just sits down and works.",
      steps: [
        {
          title: "Needs assessment",
          description:
            "We define how many devices, for what usage profile (office, design, server) and for how long.",
          meta: "2–3 days · Proposal per profile",
        },
        {
          title: "Proposal and contract",
          description:
            "A quote per device and term, stating what support and replacement include. No fine print.",
          meta: "2 days · Contract signed",
        },
        {
          title: "Provisioning and setup",
          description:
            "We install the operating system, licenses, antivirus, your corporate domain and the software you use.",
          meta: "3–5 days · Devices inventoried",
        },
        {
          title: "On-site delivery and install",
          description:
            "We deliver, connect and leave everything running. Cabling and setup included.",
          meta: "1–2 days · Delivery record",
        },
        {
          title: "Support, replacement and refresh",
          description:
            "Preventive maintenance, immediate replacement if something fails and a technology refresh at term end.",
          meta: "Ongoing · Backup unit ready",
        },
      ],
    },
  },
};

export function getServiceProcess(slug: string): ServiceProcess | undefined {
  return serviceProcess[slug];
}
