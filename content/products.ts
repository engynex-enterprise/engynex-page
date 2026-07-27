import type { Locale } from "@/i18n/config";

/** Iconos disponibles para productos (ver components/ProductIcon.tsx). */
export type ProductIcon =
  | "MessagesSquare"
  | "Handshake"
  | "LifeBuoy"
  | "ScanBarcode"
  | "ReceiptText"
  | "Boxes"
  | "Network"
  | "SquareKanban"
  | "UsersRound"
  | "FileSignature"
  | "GraduationCap"
  | "CalendarClock";

/** Grupos con los que se organizan los productos en la página y el mega menú. */
export type ProductCategory =
  | "atencion-ventas"
  | "operacion-finanzas"
  | "equipos-instituciones";

export type ProductBadge = "top" | "popular" | "new";

export interface ProductCopy {
  title: string;
  tagline: string;
  description: string;
  features: string[];
  audience: string;
  /** Párrafo de apertura de la ficha del producto. */
  intro: string;
  /** Por qué conviene (3 ítems). */
  benefits: { title: string; description: string }[];
  /** Módulos y capacidades que trae la plataforma. */
  modules: string[];
  /** Preguntas específicas del producto. */
  faqs: { q: string; a: string }[];
}

export interface Product {
  slug: string;
  icon: ProductIcon;
  accent: "green" | "blue";
  category: ProductCategory;
  badge?: ProductBadge;
  /** Imagen de cabecera de la ficha. */
  image: string;
  es: ProductCopy;
  en: ProductCopy;
}

export interface ProductCategoryMeta {
  key: ProductCategory;
  icon: ProductIcon;
  es: { title: string; description: string };
  en: { title: string; description: string };
}

export const productCategories: ProductCategoryMeta[] = [
  {
    key: "atencion-ventas",
    icon: "Handshake",
    es: {
      title: "Atención y ventas",
      description: "Conversa, vende y fideliza sin perder ningún cliente.",
    },
    en: {
      title: "Support and sales",
      description: "Chat, sell and retain without losing a single customer.",
    },
  },
  {
    key: "operacion-finanzas",
    icon: "Boxes",
    es: {
      title: "Operación y finanzas",
      description:
        "Controla inventario, documentos y proyectos en un solo sitio.",
    },
    en: {
      title: "Operations and finance",
      description: "Control inventory, documents and projects in one place.",
    },
  },
  {
    key: "equipos-instituciones",
    icon: "Network",
    es: {
      title: "Equipos e instituciones",
      description: "Plataformas para tu gente y para tu comunidad.",
    },
    en: {
      title: "Teams and institutions",
      description: "Platforms for your people and your community.",
    },
  },
];

export const products: Product[] = [
  {
    slug: "chat-empresas",
    icon: "MessagesSquare",
    accent: "green",
    category: "atencion-ventas",
    badge: "top",
    image: "/images/svc-ia-automatizacion.jpg",
    es: {
      title: "Chat para Empresas",
      tagline: "Atiende a todos tus clientes desde un solo lugar",
      description:
        "Centraliza WhatsApp, web y redes sociales en una sola bandeja, con chatbot de IA, respuestas rápidas y métricas de atención.",
      features: [
        "Bandeja unificada: WhatsApp, web, Instagram y Facebook",
        "Chatbot con IA y respuestas automáticas",
        "Asignación de conversaciones por agente",
        "Reportes de tiempos de respuesta y satisfacción",
      ],
      audience: "Ideal para equipos de ventas y servicio al cliente.",
      intro:
        "Cuando la atención está repartida entre el WhatsApp de un asesor, el Instagram de marketing y el correo de servicio, siempre se pierde alguien. Nuestro chat empresarial reúne todos los canales en una sola bandeja compartida, con un chatbot de IA que responde lo repetitivo y escala a una persona cuando hace falta.",
      benefits: [
        {
          title: "Ninguna conversación sin respuesta",
          description:
            "Asignación automática, alertas por tiempo de espera y reasignación cuando un asesor no está disponible.",
        },
        {
          title: "El historial no se va con el asesor",
          description:
            "Las conversaciones y los contactos quedan en la empresa, no en el celular de una persona.",
        },
        {
          title: "Atención 24/7 sin ampliar el equipo",
          description:
            "El chatbot resuelve preguntas frecuentes, cotiza y agenda mientras tu equipo duerme.",
        },
      ],
      modules: [
        "Bandeja compartida multicanal con etiquetas y filtros",
        "Chatbot con IA entrenado con tu catálogo y tus políticas",
        "Respuestas rápidas, plantillas y envíos masivos aprobados",
        "Ficha de contacto con historial completo por cliente",
        "Tablero de métricas: primera respuesta, resolución y CSAT",
        "Roles, turnos y horarios de atención por equipo",
      ],
      faqs: [
        {
          q: "¿Necesito una línea de WhatsApp nueva?",
          a: "No necesariamente. Podemos migrar tu número actual a WhatsApp Business API o configurar una línea nueva; te explicamos las implicaciones de cada opción antes de decidir.",
        },
        {
          q: "¿Cuántos agentes soporta?",
          a: "Desde 1 hasta cientos. La licencia se ajusta al número de agentes conectados y puedes subir o bajar según la temporada.",
        },
        {
          q: "¿El chatbot responde con información inventada?",
          a: "No. Se entrena únicamente con tu información y está configurado para reconocer sus límites y pasar la conversación a una persona cuando no tiene la respuesta.",
        },
      ],
    },
    en: {
      title: "Business Chat",
      tagline: "Serve every customer from a single inbox",
      description:
        "Bring WhatsApp, your website and social media into one inbox, with an AI chatbot, quick replies and support metrics.",
      features: [
        "Unified inbox: WhatsApp, web, Instagram and Facebook",
        "AI chatbot and automated replies",
        "Conversation routing per agent",
        "Response time and satisfaction reports",
      ],
      audience: "Ideal for sales and customer service teams.",
      intro:
        "When support is spread across one rep's WhatsApp, marketing's Instagram and the service mailbox, someone always slips through. Our business chat brings every channel into a single shared inbox, with an AI chatbot that handles the repetitive questions and escalates to a person when needed.",
      benefits: [
        {
          title: "No conversation left unanswered",
          description:
            "Automatic routing, wait-time alerts and reassignment when a rep isn't available.",
        },
        {
          title: "History stays with the company",
          description:
            "Conversations and contacts live in the platform, not on one person's phone.",
        },
        {
          title: "24/7 coverage without hiring",
          description:
            "The chatbot answers FAQs, quotes and books appointments while your team sleeps.",
        },
      ],
      modules: [
        "Shared multichannel inbox with tags and filters",
        "AI chatbot trained on your catalog and policies",
        "Quick replies, templates and approved broadcasts",
        "Contact record with full history per customer",
        "Metrics dashboard: first response, resolution and CSAT",
        "Roles, shifts and business hours per team",
      ],
      faqs: [
        {
          q: "Do I need a new WhatsApp line?",
          a: "Not necessarily. We can migrate your current number to the WhatsApp Business API or set up a new line; we explain the implications of each option before deciding.",
        },
        {
          q: "How many agents does it support?",
          a: "From 1 to hundreds. Licensing scales with the number of connected agents and you can move up or down by season.",
        },
        {
          q: "Does the chatbot make things up?",
          a: "No. It's trained only on your information and configured to recognize its limits and hand the conversation to a person when it doesn't have the answer.",
        },
      ],
    },
  },
  {
    slug: "crm-ventas",
    icon: "Handshake",
    accent: "blue",
    category: "atencion-ventas",
    image: "/images/svc-marketing-digital.jpg",
    es: {
      title: "CRM de Ventas",
      tagline: "Del primer contacto al cierre, sin perder oportunidades",
      description:
        "Gestiona prospectos, embudos y seguimiento comercial con recordatorios automáticos y reportes de conversión en tiempo real.",
      features: [
        "Embudos y etapas personalizables",
        "Historial completo por cliente",
        "Cotizaciones y recordatorios automáticos",
        "Tablero de metas y conversión por asesor",
      ],
      audience: "Ideal para equipos comerciales de 3 a 100 asesores.",
      intro:
        "La mayoría de las ventas no se pierden por precio, se pierden por falta de seguimiento. El CRM organiza cada oportunidad en un embudo visual, recuerda a tu equipo cuándo volver a llamar y te muestra en un tablero dónde se está quedando el dinero.",
      benefits: [
        {
          title: "Seguimiento que no se olvida",
          description:
            "Tareas y recordatorios automáticos por etapa: nadie vuelve a decir «se me pasó llamarlo».",
        },
        {
          title: "Pronóstico confiable",
          description:
            "Sabes cuánto vas a cerrar este mes con base en el embudo real, no en la intuición del equipo.",
        },
        {
          title: "Onboarding rápido de asesores",
          description:
            "Un asesor nuevo entra y ve exactamente qué hacer, con quién y cuándo.",
        },
      ],
      modules: [
        "Embudos múltiples con etapas y probabilidad de cierre",
        "Captura automática de leads desde web, WhatsApp y pauta",
        "Cotizador con plantillas, versiones y aprobación",
        "Agenda de actividades y recordatorios automáticos",
        "Metas por asesor, equipo y periodo",
        "Reportes de conversión, ciclo de venta y motivos de pérdida",
      ],
      faqs: [
        {
          q: "¿Se conecta con el formulario de mi web?",
          a: "Sí. Los leads del sitio, de WhatsApp y de las campañas de Google o Meta entran directo al embudo con su origen identificado.",
        },
        {
          q: "¿Puedo migrar mi base de datos actual?",
          a: "Sí. Importamos tus contactos y oportunidades desde Excel, Google Sheets u otro CRM, con revisión de duplicados incluida.",
        },
        {
          q: "¿Sirve si mi ciclo de venta es largo?",
          a: "Especialmente. Para ciclos de meses el valor está justo en el registro de interacciones y los recordatorios de seguimiento.",
        },
      ],
    },
    en: {
      title: "Sales CRM",
      tagline: "From first contact to close, with no leads lost",
      description:
        "Manage leads, pipelines and follow-ups with automatic reminders and real-time conversion reports.",
      features: [
        "Custom pipelines and stages",
        "Full history for every client",
        "Quotes and automated reminders",
        "Goal and conversion dashboard per rep",
      ],
      audience: "Ideal for sales teams of 3 to 100 reps.",
      intro:
        "Most deals aren't lost on price, they're lost on follow-up. The CRM organizes every opportunity in a visual pipeline, reminds your team when to call back, and shows you on one dashboard exactly where the money is stalling.",
      benefits: [
        {
          title: "Follow-up that never slips",
          description:
            "Automatic tasks and reminders per stage: nobody says \"I forgot to call them\" again.",
        },
        {
          title: "A forecast you can trust",
          description:
            "You know what you'll close this month based on the real pipeline, not gut feel.",
        },
        {
          title: "Fast rep onboarding",
          description:
            "A new rep logs in and sees exactly what to do, with whom and when.",
        },
      ],
      modules: [
        "Multiple pipelines with stages and win probability",
        "Automatic lead capture from web, WhatsApp and ads",
        "Quote builder with templates, versions and approval",
        "Activity calendar and automatic reminders",
        "Targets per rep, team and period",
        "Conversion, sales-cycle and loss-reason reports",
      ],
      faqs: [
        {
          q: "Does it connect to my website form?",
          a: "Yes. Leads from your site, WhatsApp and Google or Meta campaigns land straight in the pipeline with their source tagged.",
        },
        {
          q: "Can I migrate my current database?",
          a: "Yes. We import your contacts and opportunities from Excel, Google Sheets or another CRM, with duplicate checking included.",
        },
        {
          q: "Does it work if my sales cycle is long?",
          a: "Especially. For multi-month cycles the value is precisely in logged interactions and follow-up reminders.",
        },
      ],
    },
  },
  {
    slug: "mesa-ayuda",
    icon: "LifeBuoy",
    accent: "green",
    category: "atencion-ventas",
    image: "/images/svc-soporte-ti.jpg",
    es: {
      title: "Mesa de Ayuda",
      tagline: "Tickets, tiempos y soporte bajo control",
      description:
        "Recibe, prioriza y resuelve solicitudes con tickets, acuerdos de nivel de servicio (SLA) y base de conocimiento.",
      features: [
        "Tickets por correo, chat o portal web",
        "Prioridades, categorías y SLA",
        "Base de conocimiento y autoservicio",
        "Encuestas de satisfacción por caso",
      ],
      audience: "Ideal para áreas de TI, soporte y servicio postventa.",
      intro:
        "Soportar por correo y WhatsApp funciona hasta que tienes 40 casos abiertos y nadie sabe cuál es urgente. La mesa de ayuda convierte cada solicitud en un ticket con responsable, prioridad y reloj de SLA, y publica una base de conocimiento para que la mitad de los casos se resuelvan solos.",
      benefits: [
        {
          title: "Prioridades claras",
          description:
            "Cada ticket tiene categoría, impacto y tiempo límite: se atiende lo urgente antes de lo ruidoso.",
        },
        {
          title: "Menos casos repetidos",
          description:
            "El portal de autoservicio y la base de conocimiento reducen los tickets de siempre.",
        },
        {
          title: "Evidencia para negociar",
          description:
            "Reportes de volumen y cumplimiento de SLA que justifican personal, presupuesto o cambios de proceso.",
        },
      ],
      modules: [
        "Recepción de tickets por correo, chat, portal y teléfono",
        "Categorías, prioridades, SLA y escalamientos automáticos",
        "Base de conocimiento pública e interna",
        "Portal de autoservicio con seguimiento para el usuario",
        "Inventario de activos asociado a cada caso",
        "Encuestas de satisfacción y reportes de cumplimiento",
      ],
      faqs: [
        {
          q: "¿Sirve para soporte interno y externo?",
          a: "Sí. Puedes tener colas separadas: una para empleados (TI, nómina, mantenimiento) y otra para clientes, cada una con sus propios SLA.",
        },
        {
          q: "¿Qué pasa si se incumple un SLA?",
          a: "El sistema alerta antes de vencerse, escala al responsable siguiente y deja el incumplimiento registrado en el reporte.",
        },
        {
          q: "¿Se integra con el chat empresarial?",
          a: "Sí. Una conversación de WhatsApp o web puede convertirse en ticket con un clic, conservando todo el historial.",
        },
      ],
    },
    en: {
      title: "Help Desk",
      tagline: "Tickets, response times and support under control",
      description:
        "Receive, prioritize and resolve requests with tickets, service level agreements (SLA) and a knowledge base.",
      features: [
        "Tickets via email, chat or web portal",
        "Priorities, categories and SLAs",
        "Knowledge base and self-service",
        "Satisfaction surveys per case",
      ],
      audience: "Ideal for IT, support and after-sales teams.",
      intro:
        "Supporting by email and WhatsApp works until you have 40 open cases and nobody knows which one is urgent. The help desk turns every request into a ticket with an owner, a priority and an SLA clock, and publishes a knowledge base so half the cases resolve themselves.",
      benefits: [
        {
          title: "Clear priorities",
          description:
            "Every ticket has a category, impact and deadline: the urgent gets handled before the loud.",
        },
        {
          title: "Fewer repeat cases",
          description:
            "The self-service portal and knowledge base cut down the same old tickets.",
        },
        {
          title: "Evidence to negotiate with",
          description:
            "Volume and SLA compliance reports that justify headcount, budget or process changes.",
        },
      ],
      modules: [
        "Ticket intake via email, chat, portal and phone",
        "Categories, priorities, SLAs and automatic escalation",
        "Public and internal knowledge base",
        "Self-service portal with status tracking for users",
        "Asset inventory linked to each case",
        "Satisfaction surveys and compliance reports",
      ],
      faqs: [
        {
          q: "Does it work for internal and external support?",
          a: "Yes. You can run separate queues: one for employees (IT, payroll, facilities) and one for customers, each with its own SLAs.",
        },
        {
          q: "What happens if an SLA is breached?",
          a: "The system warns before it expires, escalates to the next owner and logs the breach in the report.",
        },
        {
          q: "Does it integrate with the business chat?",
          a: "Yes. A WhatsApp or web conversation can become a ticket in one click, keeping the full history.",
        },
      ],
    },
  },
  {
    slug: "sistema-pos",
    icon: "ScanBarcode",
    accent: "blue",
    category: "atencion-ventas",
    badge: "popular",
    image: "/images/svc-ecommerce.jpg",
    es: {
      title: "Sistema POS",
      tagline: "Vende rápido y controla todo tu punto de venta",
      description:
        "Facturación ágil, control de caja, inventario y reportes de ventas en tiempo real para uno o varios puntos.",
      features: [
        "Venta rápida con lector de códigos de barras",
        "Cierre de caja, turnos y arqueos",
        "Inventario y precios por sede",
        "Reportes de ventas en tiempo real",
      ],
      audience: "Ideal para tiendas, restaurantes y cadenas con varias sedes.",
      intro:
        "Un punto de venta se mide en segundos por transacción y en cuadres de caja que cierran. Nuestro POS está pensado para vender rápido incluso sin internet, controlar el efectivo turno por turno y darte el consolidado de todas tus sedes desde el celular.",
      benefits: [
        {
          title: "Vende aunque se caiga internet",
          description:
            "Modo offline: las ventas se registran localmente y se sincronizan cuando vuelve la conexión.",
        },
        {
          title: "Caja que cuadra",
          description:
            "Apertura, arqueos parciales y cierre por turno con diferencias identificadas y responsable asignado.",
        },
        {
          title: "Todas tus sedes en un tablero",
          description:
            "Ventas, margen y faltantes de cada punto en tiempo real, sin pedir reportes por WhatsApp.",
        },
      ],
      modules: [
        "Venta rápida con lector, balanza y pantalla de cliente",
        "Múltiples medios de pago y pagos divididos",
        "Turnos, arqueos y cierre de caja con auditoría",
        "Inventario, precios y promociones por sede",
        "Facturación electrónica integrada",
        "Programa de fidelización y notas de crédito",
      ],
      faqs: [
        {
          q: "¿Funciona con el hardware que ya tengo?",
          a: "En la mayoría de casos sí: lectores, impresoras térmicas, cajones y balanzas estándar. Revisamos tu equipo antes de la implementación.",
        },
        {
          q: "¿Sirve para restaurantes?",
          a: "Sí. Incluye mesas, comandas a cocina, división de cuentas y propinas. Lo configuramos según tu tipo de servicio.",
        },
        {
          q: "¿Emite factura electrónica?",
          a: "Sí, integrado con proveedores tecnológicos autorizados. La factura se emite y se envía al cliente en el momento de la venta.",
        },
      ],
    },
    en: {
      title: "POS System",
      tagline: "Sell fast and stay on top of every register",
      description:
        "Fast checkout, cash control, inventory and real-time sales reports for one location or many.",
      features: [
        "Fast checkout with barcode scanner",
        "Cash closing, shifts and reconciliation",
        "Inventory and pricing per location",
        "Real-time sales reports",
      ],
      audience: "Ideal for shops, restaurants and multi-location chains.",
      intro:
        "A point of sale is measured in seconds per transaction and cash counts that balance. Our POS is built to sell fast even without internet, control cash shift by shift, and give you the roll-up of every location from your phone.",
      benefits: [
        {
          title: "Keep selling when the internet drops",
          description:
            "Offline mode: sales are stored locally and synced as soon as the connection is back.",
        },
        {
          title: "Cash that balances",
          description:
            "Opening, mid-shift counts and closing per shift, with differences identified and an owner assigned.",
        },
        {
          title: "Every location on one dashboard",
          description:
            "Sales, margin and stock-outs per store in real time — no more asking for reports over WhatsApp.",
        },
      ],
      modules: [
        "Fast checkout with scanner, scale and customer display",
        "Multiple payment methods and split payments",
        "Shifts, cash counts and audited closing",
        "Inventory, pricing and promotions per location",
        "Integrated electronic invoicing",
        "Loyalty program and credit notes",
      ],
      faqs: [
        {
          q: "Does it work with the hardware I already have?",
          a: "In most cases yes: standard scanners, thermal printers, cash drawers and scales. We check your equipment before implementation.",
        },
        {
          q: "Does it work for restaurants?",
          a: "Yes. It includes tables, kitchen orders, split bills and tips. We configure it for your service style.",
        },
        {
          q: "Does it issue electronic invoices?",
          a: "Yes, integrated with authorized providers. The invoice is issued and sent to the customer at the moment of sale.",
        },
      ],
    },
  },
  {
    slug: "inventario-almacen",
    icon: "Boxes",
    accent: "green",
    category: "operacion-finanzas",
    image: "/images/svc-plataformas-web.jpg",
    es: {
      title: "Inventarios & Almacén",
      tagline: "Stock exacto en cada bodega y sede",
      description:
        "Controla entradas, salidas, traslados y conteos con códigos de barras, kardex y alertas de mínimos.",
      features: [
        "Kardex y trazabilidad por producto o lote",
        "Traslados entre bodegas y sedes",
        "Conteos cíclicos con código de barras",
        "Alertas automáticas de stock mínimo",
      ],
      audience: "Ideal para distribuidoras, retail y manufactura.",
      intro:
        "El inventario en Excel siempre está desactualizado y las diferencias aparecen cuando ya costaron dinero. Esta plataforma registra cada movimiento con código de barras, mantiene un kardex auditable por producto y lote, y te avisa antes de quedarte sin lo que más rota.",
      benefits: [
        {
          title: "Menos plata quieta en bodega",
          description:
            "Con rotación y mínimos reales compras lo que se vende y dejas de acumular lo que no.",
        },
        {
          title: "Diferencias explicables",
          description:
            "Cada faltante tiene un movimiento, una fecha y un usuario detrás. El conteo cíclico deja de ser una discusión.",
        },
        {
          title: "Trazabilidad completa",
          description:
            "Lotes, series y fechas de vencimiento para responder cualquier reclamo o auditoría en minutos.",
        },
      ],
      modules: [
        "Entradas, salidas, devoluciones y ajustes con soporte",
        "Kardex valorizado por producto, lote y serie",
        "Traslados entre bodegas con confirmación de recepción",
        "Conteos cíclicos e inventario físico con app móvil",
        "Alertas de stock mínimo, máximo y vencimientos",
        "Reportes de rotación, obsoletos y valorización",
      ],
      faqs: [
        {
          q: "¿Necesito comprar lectores de código de barras?",
          a: "No es obligatorio: la app móvil usa la cámara del celular. Si tu volumen es alto, un lector inalámbrico acelera bastante el conteo.",
        },
        {
          q: "¿Maneja productos con vencimiento?",
          a: "Sí. Controla lotes con fecha de vencimiento, aplica salida por FIFO/FEFO y alerta con la anticipación que configures.",
        },
        {
          q: "¿Se integra con mi facturación o mi ERP?",
          a: "Sí. Sincronizamos productos, saldos y movimientos con tu sistema de facturación o ERP para no digitar dos veces.",
        },
      ],
    },
    en: {
      title: "Inventory & Warehouse",
      tagline: "Accurate stock in every warehouse and location",
      description:
        "Track receipts, issues, transfers and counts with barcodes, stock ledger and low-stock alerts.",
      features: [
        "Stock ledger and traceability by product or batch",
        "Transfers between warehouses and locations",
        "Cycle counts with barcode scanning",
        "Automatic low-stock alerts",
      ],
      audience: "Ideal for distributors, retail and manufacturing.",
      intro:
        "Inventory in a spreadsheet is always out of date, and the discrepancies show up after they've already cost money. This platform records every movement by barcode, keeps an auditable ledger per product and batch, and warns you before you run out of what sells.",
      benefits: [
        {
          title: "Less cash sitting in the warehouse",
          description:
            "With real turnover and reorder points you buy what sells and stop stockpiling what doesn't.",
        },
        {
          title: "Explainable discrepancies",
          description:
            "Every shortage has a movement, a date and a user behind it. Cycle counting stops being an argument.",
        },
        {
          title: "Full traceability",
          description:
            "Batches, serials and expiry dates so you can answer any claim or audit in minutes.",
        },
      ],
      modules: [
        "Receipts, issues, returns and adjustments with documentation",
        "Valued stock ledger by product, batch and serial",
        "Inter-warehouse transfers with receipt confirmation",
        "Cycle counts and physical inventory via mobile app",
        "Minimum, maximum and expiry alerts",
        "Turnover, obsolescence and valuation reports",
      ],
      faqs: [
        {
          q: "Do I need to buy barcode scanners?",
          a: "Not mandatory: the mobile app uses the phone camera. If your volume is high, a wireless scanner speeds counting up considerably.",
        },
        {
          q: "Does it handle products with expiry dates?",
          a: "Yes. It tracks batches with expiry dates, applies FIFO/FEFO picking and alerts as far ahead as you configure.",
        },
        {
          q: "Does it integrate with my invoicing or ERP?",
          a: "Yes. We sync products, balances and movements with your invoicing system or ERP so nothing is typed twice.",
        },
      ],
    },
  },
  {
    slug: "facturacion-electronica",
    icon: "ReceiptText",
    accent: "blue",
    category: "operacion-finanzas",
    image: "/images/svc-data-analytics.jpg",
    es: {
      title: "Facturación Electrónica",
      tagline: "Factura, envía y archiva sin dolores de cabeza",
      description:
        "Emisión y envío automático de documentos electrónicos, integrado con proveedores tecnológicos autorizados y con trazabilidad completa.",
      features: [
        "Emisión y envío automático al cliente",
        "Integración con proveedores autorizados",
        "Notas crédito, débito y anulaciones",
        "Historial y reportes descargables",
      ],
      audience: "Ideal para empresas que facturan de forma recurrente.",
      intro:
        "Facturar debería tomar segundos y no depender de que alguien recuerde enviar el PDF. La plataforma emite el documento electrónico, lo reporta al proveedor tecnológico autorizado, lo envía al cliente y guarda la representación gráfica y el XML con su trazabilidad completa.",
      benefits: [
        {
          title: "Cero facturas pendientes de enviar",
          description:
            "La emisión y el envío al correo del cliente son automáticos, con reintentos si el correo rebota.",
        },
        {
          title: "Tranquilidad ante una revisión",
          description:
            "XML, acuse y representación gráfica archivados con la retención que exige la norma, descargables por rango de fechas.",
        },
        {
          title: "Cobras más rápido",
          description:
            "Facturación recurrente, recordatorios de vencimiento y enlace de pago en el mismo documento.",
        },
      ],
      modules: [
        "Factura de venta, notas crédito y débito, y anulaciones",
        "Facturación recurrente para planes y suscripciones",
        "Envío automático por correo con acuse de recibo",
        "Cartera: vencimientos, recordatorios y estado de cuenta",
        "Reportes de ventas, impuestos y retenciones",
        "Integración con POS, inventario y contabilidad",
      ],
      faqs: [
        {
          q: "¿Ustedes son el proveedor tecnológico autorizado?",
          a: "No. Nos integramos con proveedores autorizados vigentes: tú eliges o te recomendamos uno, y nosotros construimos la integración y la interfaz de trabajo.",
        },
        {
          q: "¿Puedo facturar en dólares o a clientes del exterior?",
          a: "Sí. Manejamos multimoneda y los documentos de exportación que apliquen a tu operación.",
        },
        {
          q: "¿Qué pasa si el proveedor rechaza un documento?",
          a: "El sistema muestra el motivo del rechazo, permite corregir y reenviar, y deja el rastro completo de intentos.",
        },
      ],
    },
    en: {
      title: "E-Invoicing",
      tagline: "Issue, send and archive invoices without headaches",
      description:
        "Automatic issuing and delivery of electronic documents, integrated with authorized providers and fully traceable.",
      features: [
        "Automatic issuing and delivery to the client",
        "Integration with authorized providers",
        "Credit notes, debit notes and voids",
        "History and downloadable reports",
      ],
      audience: "Ideal for companies that invoice on a recurring basis.",
      intro:
        "Invoicing should take seconds and shouldn't depend on someone remembering to email the PDF. The platform issues the electronic document, reports it to the authorized provider, sends it to the customer and stores the visual representation and XML with full traceability.",
      benefits: [
        {
          title: "No invoices left unsent",
          description:
            "Issuing and delivery to the customer's inbox are automatic, with retries if the email bounces.",
        },
        {
          title: "Peace of mind in an audit",
          description:
            "XML, acknowledgement and visual representation archived for the legally required retention period, downloadable by date range.",
        },
        {
          title: "Get paid faster",
          description:
            "Recurring invoicing, due-date reminders and a payment link inside the document itself.",
        },
      ],
      modules: [
        "Sales invoices, credit and debit notes, and voids",
        "Recurring invoicing for plans and subscriptions",
        "Automatic email delivery with read receipts",
        "Receivables: due dates, reminders and statements",
        "Sales, tax and withholding reports",
        "Integration with POS, inventory and accounting",
      ],
      faqs: [
        {
          q: "Are you the authorized e-invoicing provider?",
          a: "No. We integrate with currently authorized providers: you pick one or we recommend one, and we build the integration and the working interface.",
        },
        {
          q: "Can I invoice in US dollars or to foreign clients?",
          a: "Yes. We handle multi-currency and the export documents that apply to your operation.",
        },
        {
          q: "What if the provider rejects a document?",
          a: "The system shows the rejection reason, lets you correct and resend, and keeps a full trail of attempts.",
        },
      ],
    },
  },
  {
    slug: "gestion-proyectos",
    icon: "SquareKanban",
    accent: "green",
    category: "operacion-finanzas",
    badge: "popular",
    image: "/images/svc-consultoria-tech.jpg",
    es: {
      title: "Gestión de Proyectos",
      tagline: "Tableros, tiempos y entregas bajo control",
      description:
        "Planea, asigna y mide el avance de tus proyectos con tableros, cronogramas, registro de horas y reportes de rentabilidad.",
      features: [
        "Tableros kanban y cronograma tipo Gantt",
        "Tareas, responsables y dependencias",
        "Registro de horas y costos por proyecto",
        "Reportes de avance y rentabilidad",
      ],
      audience: "Ideal para agencias, constructoras y equipos de TI.",
      intro:
        "Entregar a tiempo es solo la mitad del problema: la otra es saber si el proyecto dejó plata. Esta plataforma une la planeación (tablero y cronograma) con el registro de horas y costos, para que veas avance y rentabilidad en la misma pantalla.",
      benefits: [
        {
          title: "Sabes si el proyecto es rentable",
          description:
            "Horas y costos reales contra lo presupuestado, proyecto por proyecto y cliente por cliente.",
        },
        {
          title: "Se ven los cuellos de botella",
          description:
            "Carga por persona y dependencias visibles: sabes a quién sobrecargaste antes de que se retrase la entrega.",
        },
        {
          title: "El cliente ve el avance",
          description:
            "Portal opcional para que tu cliente consulte hitos y entregables sin pedir informes.",
        },
      ],
      modules: [
        "Tableros kanban configurables por tipo de proyecto",
        "Cronograma tipo Gantt con dependencias e hitos",
        "Registro de horas por tarea con aprobación",
        "Presupuesto, costos y facturación por hito",
        "Carga de trabajo y disponibilidad del equipo",
        "Portal de cliente con avance y entregables",
      ],
      faqs: [
        {
          q: "¿Mi equipo tiene que registrar horas todos los días?",
          a: "Es lo ideal, pero se puede simplificar: temporizador de un clic, registro semanal o estimación por tarea. Configuramos el nivel de detalle que tu equipo sí vaya a sostener.",
        },
        {
          q: "¿Sirve para obra o proyectos físicos?",
          a: "Sí. Constructoras lo usan con capítulos, avance de obra por porcentaje y control de costos por actividad.",
        },
        {
          q: "¿Se integra con facturación?",
          a: "Sí. Los hitos aprobados pueden generar la factura directamente, con las horas y gastos asociados.",
        },
      ],
    },
    en: {
      title: "Project Management",
      tagline: "Boards, timelines and deliveries under control",
      description:
        "Plan, assign and measure progress with boards, timelines, time tracking and profitability reports.",
      features: [
        "Kanban boards and Gantt-style timeline",
        "Tasks, owners and dependencies",
        "Time and cost tracking per project",
        "Progress and profitability reports",
      ],
      audience: "Ideal for agencies, construction firms and IT teams.",
      intro:
        "Delivering on time is only half the problem: the other half is knowing whether the project made money. This platform joins planning (board and timeline) with time and cost tracking, so you see progress and profitability on the same screen.",
      benefits: [
        {
          title: "You know if the project is profitable",
          description:
            "Real hours and costs against budget, project by project and client by client.",
        },
        {
          title: "Bottlenecks become visible",
          description:
            "Workload per person and visible dependencies: you spot who's overloaded before the delivery slips.",
        },
        {
          title: "The client sees progress",
          description:
            "An optional portal so your client can check milestones and deliverables without asking for reports.",
        },
      ],
      modules: [
        "Configurable kanban boards per project type",
        "Gantt-style timeline with dependencies and milestones",
        "Time logging per task with approval",
        "Budget, costs and milestone billing",
        "Team workload and availability",
        "Client portal with progress and deliverables",
      ],
      faqs: [
        {
          q: "Does my team have to log hours every day?",
          a: "Ideally yes, but it can be simplified: one-click timer, weekly logging or per-task estimates. We configure the level of detail your team will actually sustain.",
        },
        {
          q: "Does it work for construction or physical projects?",
          a: "Yes. Construction firms use it with work packages, percentage-of-completion tracking and cost control per activity.",
        },
        {
          q: "Does it integrate with invoicing?",
          a: "Yes. Approved milestones can generate the invoice directly, with the associated hours and expenses.",
        },
      ],
    },
  },
  {
    slug: "gestion-documental",
    icon: "FileSignature",
    accent: "blue",
    category: "operacion-finanzas",
    image: "/images/svc-ciberseguridad.jpg",
    es: {
      title: "Gestión Documental & Firma",
      tagline: "Documentos organizados, firmados y trazables",
      description:
        "Repositorio con permisos por rol, control de versiones, flujos de aprobación y firma electrónica con evidencia de auditoría.",
      features: [
        "Repositorio con permisos por rol",
        "Control de versiones y vencimientos",
        "Flujos de revisión y aprobación",
        "Firma electrónica con trazabilidad",
      ],
      audience: "Ideal para áreas legales, de calidad y administrativas.",
      intro:
        "Cuando los contratos viven en carpetas compartidas nadie sabe cuál es la versión vigente ni quién la aprobó. Esta plataforma centraliza los documentos con permisos por rol, versiona cada cambio, ejecuta el flujo de aprobación y cierra con firma electrónica y evidencia de auditoría.",
      benefits: [
        {
          title: "Una sola versión vigente",
          description:
            "Versionado automático y documento vigente marcado: se acaban los «contrato_final_v3_definitivo».",
        },
        {
          title: "Firmas en horas, no en semanas",
          description:
            "Firma electrónica remota con orden de firmantes, recordatorios automáticos y constancia legal.",
        },
        {
          title: "Nada se vence por descuido",
          description:
            "Alertas de vencimiento de contratos, pólizas y certificados con la anticipación que definas.",
        },
      ],
      modules: [
        "Repositorio con carpetas, metadatos y búsqueda por contenido",
        "Permisos por rol, área y documento",
        "Versionado con comparación de cambios",
        "Flujos de revisión y aprobación configurables",
        "Firma electrónica con evidencia y sello de tiempo",
        "Alertas de vencimiento y tablas de retención",
      ],
      faqs: [
        {
          q: "¿La firma electrónica tiene validez legal?",
          a: "Sí, cuando se cumplen los requisitos de identificación y evidencia. La plataforma guarda la trazabilidad completa (identidad, IP, sello de tiempo y documento firmado).",
        },
        {
          q: "¿Puedo buscar dentro del contenido de los PDF?",
          a: "Sí. Aplicamos reconocimiento de texto (OCR) para que encuentres documentos por lo que dicen, no solo por el nombre del archivo.",
        },
        {
          q: "¿Dónde quedan alojados los documentos?",
          a: "Donde tú decidas: en nuestra infraestructura administrada o en el servidor y la nube de tu empresa.",
        },
      ],
    },
    en: {
      title: "Document Management & Signing",
      tagline: "Documents organized, signed and traceable",
      description:
        "A repository with role-based permissions, version control, approval workflows and e-signature with audit evidence.",
      features: [
        "Repository with role-based permissions",
        "Version control and expiry alerts",
        "Review and approval workflows",
        "E-signature with full traceability",
      ],
      audience: "Ideal for legal, quality and administrative teams.",
      intro:
        "When contracts live in shared folders, nobody knows which version is current or who approved it. This platform centralizes documents with role-based permissions, versions every change, runs the approval workflow and closes with e-signature and audit evidence.",
      benefits: [
        {
          title: "One current version",
          description:
            "Automatic versioning with the active document flagged: no more \"contract_final_v3_definitive\".",
        },
        {
          title: "Signatures in hours, not weeks",
          description:
            "Remote e-signature with signer order, automatic reminders and legal evidence.",
        },
        {
          title: "Nothing expires by accident",
          description:
            "Expiry alerts for contracts, policies and certificates as far ahead as you define.",
        },
      ],
      modules: [
        "Repository with folders, metadata and full-text search",
        "Permissions per role, department and document",
        "Versioning with change comparison",
        "Configurable review and approval workflows",
        "E-signature with evidence and timestamping",
        "Expiry alerts and retention schedules",
      ],
      faqs: [
        {
          q: "Is the e-signature legally valid?",
          a: "Yes, when identification and evidence requirements are met. The platform stores the full trail (identity, IP, timestamp and signed document).",
        },
        {
          q: "Can I search inside PDF content?",
          a: "Yes. We apply text recognition (OCR) so you find documents by what they say, not just by file name.",
        },
        {
          q: "Where are documents hosted?",
          a: "Wherever you decide: on our managed infrastructure or on your company's own server and cloud.",
        },
      ],
    },
  },
  {
    slug: "intranet",
    icon: "Network",
    accent: "green",
    category: "equipos-instituciones",
    image: "/images/about-office.jpg",
    es: {
      title: "Intranet Corporativa",
      tagline: "El centro digital de tu empresa",
      description:
        "Comunicados, documentos, directorio y solicitudes internas en un portal privado, seguro y con la identidad de tu marca.",
      features: [
        "Noticias y comunicados internos",
        "Directorio y perfiles del equipo",
        "Documentos y políticas centralizadas",
        "Solicitudes y aprobaciones en línea",
      ],
      audience: "Ideal para empresas con equipos distribuidos o varias sedes.",
      intro:
        "Los comunicados por WhatsApp se pierden y las políticas nadie las encuentra. La intranet reúne noticias, documentos, directorio y solicitudes internas en un portal con tu marca, donde cada persona ve lo que le corresponde según su área y su rol.",
      benefits: [
        {
          title: "La información no se pierde",
          description:
            "Comunicados con confirmación de lectura y un solo lugar oficial para políticas y formatos vigentes.",
        },
        {
          title: "Menos correos y menos filas",
          description:
            "Certificados, permisos y solicitudes se piden y se aprueban en línea, con estado visible.",
        },
        {
          title: "Cultura también en remoto",
          description:
            "Directorio con caras y roles, cumpleaños, reconocimientos y espacios de la compañía.",
        },
      ],
      modules: [
        "Muro de noticias y comunicados segmentados por área",
        "Biblioteca de documentos, políticas y formatos",
        "Directorio con organigrama y perfiles",
        "Solicitudes internas con flujo de aprobación",
        "Calendario corporativo y reserva de salas",
        "Encuestas, reconocimientos y buzón de sugerencias",
      ],
      faqs: [
        {
          q: "¿Se puede entrar desde fuera de la oficina?",
          a: "Sí. Es un portal web seguro accesible desde cualquier lugar, con opción de doble factor y restricción por IP si lo necesitas.",
        },
        {
          q: "¿Usa las cuentas de correo que ya tenemos?",
          a: "Sí. Integramos inicio de sesión con Google Workspace o Microsoft 365 para que nadie tenga otra contraseña más.",
        },
        {
          q: "¿Quién administra el contenido?",
          a: "Tu equipo. Se definen editores por área para que cada uno publique lo suyo sin depender de sistemas ni de nosotros.",
        },
      ],
    },
    en: {
      title: "Corporate Intranet",
      tagline: "The digital hub of your company",
      description:
        "Announcements, documents, directory and internal requests in a private, secure portal branded as your own.",
      features: [
        "Internal news and announcements",
        "Team directory and profiles",
        "Centralized documents and policies",
        "Online requests and approvals",
      ],
      audience: "Ideal for companies with distributed teams or several offices.",
      intro:
        "Announcements over WhatsApp get lost and nobody can find the policies. The intranet brings news, documents, directory and internal requests into one branded portal where each person sees what applies to their department and role.",
      benefits: [
        {
          title: "Information doesn't get lost",
          description:
            "Announcements with read confirmation and a single official home for current policies and forms.",
        },
        {
          title: "Fewer emails, fewer queues",
          description:
            "Certificates, time off and internal requests are submitted and approved online, with visible status.",
        },
        {
          title: "Culture, even remotely",
          description:
            "A directory with faces and roles, birthdays, recognition and company spaces.",
        },
      ],
      modules: [
        "News wall and announcements segmented by department",
        "Library of documents, policies and forms",
        "Directory with org chart and profiles",
        "Internal requests with approval workflow",
        "Corporate calendar and room booking",
        "Surveys, recognition and suggestion box",
      ],
      faqs: [
        {
          q: "Can people access it from outside the office?",
          a: "Yes. It's a secure web portal accessible from anywhere, with optional two-factor authentication and IP restrictions if you need them.",
        },
        {
          q: "Does it use the email accounts we already have?",
          a: "Yes. We integrate single sign-on with Google Workspace or Microsoft 365 so nobody has one more password.",
        },
        {
          q: "Who manages the content?",
          a: "Your team. We define editors per department so each one publishes their own content without depending on IT or on us.",
        },
      ],
    },
  },
  {
    slug: "talento-humano",
    icon: "UsersRound",
    accent: "blue",
    category: "equipos-instituciones",
    image: "/images/about-team.jpg",
    es: {
      title: "Talento Humano & Nómina",
      tagline: "Tu equipo organizado, de la contratación al pago",
      description:
        "Hojas de vida, contratos, vacaciones, permisos y liquidación de nómina en un solo sistema, con portal de autogestión.",
      features: [
        "Expediente digital de cada empleado",
        "Vacaciones, permisos e incapacidades",
        "Liquidación de nómina y soportes",
        "Portal de autogestión para empleados",
      ],
      audience: "Ideal para empresas de 10 a 500 empleados.",
      intro:
        "Nómina en Excel y contratos en una carpeta física es una combinación que tarde o temprano cuesta caro. Esta plataforma centraliza el expediente de cada persona, controla ausencias y vacaciones, liquida la nómina con sus soportes y le da al empleado un portal para resolver solo lo que hoy pregunta por WhatsApp.",
      benefits: [
        {
          title: "Nómina sin sustos",
          description:
            "Cálculo de devengados, deducciones, seguridad social y prestaciones con soportes descargables y trazabilidad.",
        },
        {
          title: "Recursos Humanos deja de ser mesa de ayuda",
          description:
            "El empleado descarga su certificado laboral, su desprendible y solicita vacaciones sin escribirle a nadie.",
        },
        {
          title: "Listos para una auditoría",
          description:
            "Contratos, otrosí, exámenes y documentos con vencimiento controlado y organizados por persona.",
        },
      ],
      modules: [
        "Expediente digital con contratos y documentos por vencer",
        "Vacaciones, permisos, incapacidades y calendario de ausencias",
        "Liquidación de nómina, prestaciones y liquidación final",
        "Portal de autogestión con desprendibles y certificados",
        "Selección: vacantes, candidatos y etapas",
        "Evaluación de desempeño y planes de formación",
      ],
      faqs: [
        {
          q: "¿Reemplaza a mi contador?",
          a: "No. Le entrega la información lista y organizada: el sistema liquida y genera soportes, y tu contador valida y presenta. Se ahorra la digitación y los errores de traspaso.",
        },
        {
          q: "¿Maneja varios tipos de contrato?",
          a: "Sí: término fijo e indefinido, obra o labor, aprendices y prestación de servicios, cada uno con sus reglas de liquidación.",
        },
        {
          q: "¿Puede generar los archivos para el pago en banco?",
          a: "Sí. Generamos el archivo plano de dispersión para tu banco y el archivo de aportes a seguridad social.",
        },
      ],
    },
    en: {
      title: "HR & Payroll",
      tagline: "Your team organized, from hiring to payday",
      description:
        "Résumés, contracts, vacations, leave and payroll processing in a single system, with an employee self-service portal.",
      features: [
        "Digital record for every employee",
        "Vacations, leave and sick days",
        "Payroll processing and payslips",
        "Employee self-service portal",
      ],
      audience: "Ideal for companies with 10 to 500 employees.",
      intro:
        "Payroll in a spreadsheet and contracts in a filing cabinet is a combination that eventually gets expensive. This platform centralizes each person's record, tracks absences and vacations, runs payroll with its supporting documents, and gives employees a portal to answer for themselves what they ask over WhatsApp today.",
      benefits: [
        {
          title: "Payroll without surprises",
          description:
            "Earnings, deductions, social security and benefits calculated with downloadable documentation and full traceability.",
        },
        {
          title: "HR stops being a help desk",
          description:
            "Employees download their employment certificate and payslip and request time off without messaging anyone.",
        },
        {
          title: "Audit-ready",
          description:
            "Contracts, amendments, medical exams and expiring documents tracked and organized per person.",
        },
      ],
      modules: [
        "Digital record with contracts and expiring documents",
        "Vacations, leave, sick days and absence calendar",
        "Payroll, benefits and final settlement processing",
        "Self-service portal with payslips and certificates",
        "Recruiting: openings, candidates and stages",
        "Performance reviews and training plans",
      ],
      faqs: [
        {
          q: "Does it replace my accountant?",
          a: "No. It hands them information ready and organized: the system calculates and generates documentation, your accountant validates and files. You save the data entry and the transfer errors.",
        },
        {
          q: "Does it handle several contract types?",
          a: "Yes: fixed-term and indefinite, project-based, apprentices and service contracts, each with its own calculation rules.",
        },
        {
          q: "Can it generate bank payment files?",
          a: "Yes. We generate the flat file for your bank's payment run and the social security contribution file.",
        },
      ],
    },
  },
  {
    slug: "sistema-colegios",
    icon: "GraduationCap",
    accent: "green",
    category: "equipos-instituciones",
    badge: "new",
    image: "/images/about-meeting.jpg",
    es: {
      title: "Sistema para Colegios",
      tagline: "Toda la comunidad educativa en una plataforma",
      description:
        "Matrículas, notas, asistencia, horarios, cartera y comunicación con las familias, con portal para docentes, estudiantes y acudientes.",
      features: [
        "Matrículas, notas y boletines",
        "Asistencia, horarios y observador",
        "Portal para acudientes y estudiantes",
        "Cartera, pagos y comunicados",
      ],
      audience: "Ideal para colegios, institutos y centros de formación.",
      intro:
        "Un colegio maneja al mismo tiempo lo académico, lo convivencial y lo financiero, y casi siempre en sistemas distintos. Esta plataforma los une: el docente registra notas y asistencia, el acudiente consulta desde el celular, y la administración ve la cartera y la matrícula en tiempo real.",
      benefits: [
        {
          title: "Docentes con menos carga administrativa",
          description:
            "Notas, asistencia y observador desde el celular o el computador, con boletines que se generan solos.",
        },
        {
          title: "Familias informadas al día",
          description:
            "Los acudientes ven notas, asistencia, tareas y estado de cuenta sin llamar a la secretaría.",
        },
        {
          title: "Cartera bajo control",
          description:
            "Facturación de pensiones, recaudo en línea y recordatorios automáticos de pago.",
        },
      ],
      modules: [
        "Matrícula y renovación en línea con documentos",
        "Notas, escalas de valoración y boletines por periodo",
        "Asistencia, retardos y observador del estudiante",
        "Horarios, cargas académicas y planeador de clase",
        "Cartera: pensiones, otros conceptos y pagos en línea",
        "Comunicados, circulares y citaciones a acudientes",
      ],
      faqs: [
        {
          q: "¿Se adapta a nuestro modelo de evaluación?",
          a: "Sí. Configuramos periodos, escalas (numéricas o cualitativas), porcentajes por componente y las reglas de promoción de la institución.",
        },
        {
          q: "¿Los acudientes necesitan instalar una app?",
          a: "No es obligatorio: el portal funciona en el navegador del celular. También podemos entregar la app móvil si la institución la prefiere.",
        },
        {
          q: "¿Se puede implementar a mitad de año?",
          a: "Sí. Migramos estudiantes, notas de los periodos ya cursados y cartera al día para arrancar sin perder historia.",
        },
      ],
    },
    en: {
      title: "School Management System",
      tagline: "Your whole school community on one platform",
      description:
        "Enrollment, grades, attendance, schedules, billing and family communication, with portals for teachers, students and guardians.",
      features: [
        "Enrollment, grades and report cards",
        "Attendance, schedules and student records",
        "Portal for guardians and students",
        "Billing, payments and announcements",
      ],
      audience: "Ideal for schools, institutes and training centers.",
      intro:
        "A school runs academics, student conduct and finances at the same time, and almost always in separate systems. This platform joins them: teachers log grades and attendance, guardians check from their phone, and administration sees receivables and enrollment in real time.",
      benefits: [
        {
          title: "Less admin load on teachers",
          description:
            "Grades, attendance and student notes from phone or computer, with report cards generated automatically.",
        },
        {
          title: "Families kept up to date",
          description:
            "Guardians see grades, attendance, homework and account status without calling the office.",
        },
        {
          title: "Receivables under control",
          description:
            "Tuition billing, online collection and automatic payment reminders.",
        },
      ],
      modules: [
        "Online enrollment and renewal with documents",
        "Grades, grading scales and report cards per term",
        "Attendance, tardiness and student conduct records",
        "Schedules, teaching loads and lesson planner",
        "Receivables: tuition, other fees and online payments",
        "Announcements, circulars and guardian meeting requests",
      ],
      faqs: [
        {
          q: "Does it adapt to our assessment model?",
          a: "Yes. We configure terms, scales (numeric or qualitative), component weights and the institution's promotion rules.",
        },
        {
          q: "Do guardians need to install an app?",
          a: "Not required: the portal works in the phone browser. We can also deliver the mobile app if the school prefers it.",
        },
        {
          q: "Can it be rolled out mid-year?",
          a: "Yes. We migrate students, grades from completed terms and current receivables so you start without losing history.",
        },
      ],
    },
  },
  {
    slug: "agenda-citas",
    icon: "CalendarClock",
    accent: "blue",
    category: "equipos-instituciones",
    image: "/images/svc-apps-moviles.jpg",
    es: {
      title: "Agenda & Citas",
      tagline: "Agenda llena, ausencias al mínimo",
      description:
        "Reserva de citas en línea 24/7, recordatorios automáticos por WhatsApp y gestión de agendas por profesional, sede y servicio.",
      features: [
        "Reserva en línea 24/7 desde tu web",
        "Recordatorios automáticos por WhatsApp",
        "Agendas por profesional, sede y servicio",
        "Historial y notas de cada atención",
      ],
      audience:
        "Ideal para clínicas, consultorios, spas y centros de servicios.",
      intro:
        "Cada cita que no se presenta es una hora que no se factura. Esta plataforma deja que tu cliente reserve solo a cualquier hora, confirma y recuerda por WhatsApp, y le da a cada profesional su agenda con el historial de la persona que va a atender.",
      benefits: [
        {
          title: "Menos ausencias",
          description:
            "Recordatorios automáticos con confirmación por WhatsApp y liberación del cupo cuando alguien cancela.",
        },
        {
          title: "Reservas mientras estás cerrado",
          description:
            "Más de la mitad de las reservas en línea ocurren fuera del horario de atención. Ese cupo hoy se está perdiendo.",
        },
        {
          title: "Agenda ordenada de verdad",
          description:
            "Duración por servicio, tiempos de preparación y bloqueos: se acaban los cruces y los huecos muertos.",
        },
      ],
      modules: [
        "Reserva en línea desde web, WhatsApp y redes",
        "Agendas por profesional, sede, sala y equipo",
        "Recordatorios y confirmaciones automáticas",
        "Historial del cliente con notas y adjuntos",
        "Pagos o abonos en línea al reservar",
        "Reportes de ocupación, ausencias y servicios más pedidos",
      ],
      faqs: [
        {
          q: "¿Se sincroniza con Google Calendar?",
          a: "Sí. Cada profesional puede sincronizar su agenda en dos vías para que sus compromisos personales bloqueen cupos automáticamente.",
        },
        {
          q: "¿Puedo cobrar al momento de reservar?",
          a: "Sí. Puedes exigir el pago total, un abono o dejar el pago para el momento de la atención, según el servicio.",
        },
        {
          q: "¿Sirve para atención virtual?",
          a: "Sí. Genera el enlace de videollamada al confirmar y lo envía en el recordatorio.",
        },
      ],
    },
    en: {
      title: "Booking & Appointments",
      tagline: "A full calendar with minimal no-shows",
      description:
        "24/7 online booking, automatic WhatsApp reminders and calendar management per professional, location and service.",
      features: [
        "24/7 online booking from your website",
        "Automatic WhatsApp reminders",
        "Calendars per professional, location and service",
        "History and notes for every appointment",
      ],
      audience:
        "Ideal for clinics, private practices, spas and service centers.",
      intro:
        "Every no-show is an hour you don't bill. This platform lets your client book on their own at any hour, confirms and reminds over WhatsApp, and gives each professional their calendar along with the history of the person they're about to see.",
      benefits: [
        {
          title: "Fewer no-shows",
          description:
            "Automatic reminders with WhatsApp confirmation and slot release when someone cancels.",
        },
        {
          title: "Bookings while you're closed",
          description:
            "More than half of online bookings happen outside business hours. That slot is being lost today.",
        },
        {
          title: "A calendar that actually holds",
          description:
            "Duration per service, prep time and blocks: no more double-bookings or dead gaps.",
        },
      ],
      modules: [
        "Online booking from web, WhatsApp and social",
        "Calendars per professional, location, room and equipment",
        "Automatic reminders and confirmations",
        "Client history with notes and attachments",
        "Online payment or deposit at booking",
        "Occupancy, no-show and top-service reports",
      ],
      faqs: [
        {
          q: "Does it sync with Google Calendar?",
          a: "Yes. Each professional can two-way sync their calendar so personal commitments block slots automatically.",
        },
        {
          q: "Can I charge at the time of booking?",
          a: "Yes. You can require full payment, a deposit, or leave payment for the appointment itself, per service.",
        },
        {
          q: "Does it work for virtual appointments?",
          a: "Yes. It generates the video call link on confirmation and includes it in the reminder.",
        },
      ],
    },
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productCopy(product: Product, locale: Locale): ProductCopy {
  return product[locale];
}

export function productsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

/** Categoría a la que pertenece un producto (para migas de pan y relacionados). */
export function productCategoryOf(
  product: Product,
): ProductCategoryMeta | undefined {
  return productCategories.find((c) => c.key === product.category);
}
