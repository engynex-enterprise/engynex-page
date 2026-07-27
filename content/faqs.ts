/**
 * Preguntas frecuentes adicionales por servicio.
 *
 * Se suman a las que ya trae cada servicio en `content/services.ts` y a las
 * preguntas comunes del diccionario (`servicesPage.commonFaqs`), que aplican a
 * todos los servicios por igual (formas de pago, garantía, contratos…).
 */

export interface Faq {
  q: string;
  a: string;
}

export const extraServiceFaqs: Record<string, { es: Faq[]; en: Faq[] }> = {
  "desarrollo-web": {
    es: [
      {
        q: "¿Qué diferencia hay entre el plan por suscripción y el pago único?",
        a: "En la suscripción no pagas cuota inicial: nosotros ponemos el dominio, el hosting, el SSL y el mantenimiento mientras el plan esté activo. En el pago único el sitio queda a tu nombre desde el primer día y el hosting es opcional.",
      },
      {
        q: "Si cancelo la suscripción, ¿pierdo mi página?",
        a: "El dominio queda a tu nombre y te lo transferimos. El sitio deja de estar publicado en nuestra infraestructura, pero puedes migrar a un plan de pago único pagando la diferencia del desarrollo.",
      },
      {
        q: "¿La página va a aparecer en Google?",
        a: "Entregamos el sitio con SEO técnico, sitemap y analítica configurados, que es la base para posicionar. El posicionamiento por palabras clave competidas requiere además trabajo continuo de contenidos y enlaces.",
      },
    ],
    en: [
      {
        q: "What's the difference between the subscription and the one-time payment?",
        a: "With the subscription there is no setup fee: we provide the domain, hosting, SSL and maintenance for as long as the plan is active. With the one-time payment the site is yours from day one and hosting is optional.",
      },
      {
        q: "If I cancel the subscription, do I lose my website?",
        a: "The domain is registered in your name and we transfer it to you. The site stops being published on our infrastructure, but you can move to a one-time plan by paying the difference for the development.",
      },
      {
        q: "Will my site show up on Google?",
        a: "We deliver the site with technical SEO, sitemap and analytics configured, which is the foundation for ranking. Ranking for competitive keywords also requires ongoing content and link building.",
      },
    ],
  },

  "plataformas-web": {
    es: [
      {
        q: "¿Puedo empezar con un MVP y crecer después?",
        a: "Es lo que más recomendamos. Construimos la base con arquitectura escalable, la validas con usuarios reales y luego agregamos módulos por fases, sin rehacer lo ya construido.",
      },
      {
        q: "¿Quién es dueño de los datos y del código?",
        a: "Tú. Al cierre del proyecto entregamos el repositorio, la documentación y las credenciales. Los datos siempre viven en la infraestructura que tú elijas.",
      },
      {
        q: "¿Cómo manejan los cambios durante el desarrollo?",
        a: "Trabajamos por sprints con entregas quincenales. Los cambios menores entran en el sprint siguiente; los que amplían el alcance se cotizan aparte y tú decides si entran ahora o después.",
      },
    ],
    en: [
      {
        q: "Can I start with an MVP and grow later?",
        a: "That's what we recommend most. We build the base with a scalable architecture, you validate it with real users, and then we add modules in phases without rebuilding what already exists.",
      },
      {
        q: "Who owns the data and the code?",
        a: "You do. At project close we hand over the repository, documentation and credentials. Your data always lives on the infrastructure you choose.",
      },
      {
        q: "How do you handle changes during development?",
        a: "We work in sprints with deliveries every two weeks. Minor changes go into the next sprint; anything that expands scope is quoted separately and you decide whether it goes in now or later.",
      },
    ],
  },

  "apps-moviles": {
    es: [
      {
        q: "¿Las cuentas de App Store y Google Play son mías?",
        a: "Sí, y lo recomendamos: las apps se publican bajo tu cuenta de desarrollador para que la propiedad sea tuya. Si no la tienes, te ayudamos a crearla (Apple cuesta USD 99 al año y Google USD 25 por única vez).",
      },
      {
        q: "¿Qué pasa cuando iOS o Android sacan una versión nueva?",
        a: "Con un plan de mantenimiento nos encargamos de mantener la app compatible y publicar las actualizaciones. Sin plan, cotizamos la actualización cuando la necesites.",
      },
      {
        q: "¿Puedo ver avances antes de la entrega final?",
        a: "Sí. Desde las primeras semanas te damos acceso a versiones de prueba (TestFlight y APK) para que uses la app mientras la construimos.",
      },
    ],
    en: [
      {
        q: "Are the App Store and Google Play accounts mine?",
        a: "Yes, and we recommend it: apps are published under your developer account so ownership stays with you. If you don't have one, we help you create it (Apple costs USD 99 per year, Google USD 25 once).",
      },
      {
        q: "What happens when iOS or Android release a new version?",
        a: "With a maintenance plan we keep the app compatible and publish the updates. Without a plan, we quote the update whenever you need it.",
      },
      {
        q: "Can I see progress before the final delivery?",
        a: "Yes. From the first weeks you get access to test builds (TestFlight and APK) so you can use the app while we build it.",
      },
    ],
  },

  ecommerce: {
    es: [
      {
        q: "¿Cuánto cobran las pasarelas de pago por transacción?",
        a: "Las comisiones las define cada pasarela (en Colombia suelen estar entre 2,5% y 3,5% más IVA por transacción). Nosotros no cobramos comisión sobre tus ventas.",
      },
      {
        q: "¿Puedo vender también por WhatsApp y redes?",
        a: "Sí. Conectamos el catálogo con WhatsApp Business, Instagram y Facebook Shops para que vendas por el canal que prefiera tu cliente.",
      },
      {
        q: "¿Me ayudan a cargar los productos?",
        a: "En el plan Start cargamos hasta 100 productos con la información que nos entregues. Para catálogos más grandes hacemos una importación masiva desde tu Excel o tu ERP.",
      },
    ],
    en: [
      {
        q: "How much do payment gateways charge per transaction?",
        a: "Fees are set by each gateway (in Colombia they usually range from 2.5% to 3.5% plus VAT per transaction). We don't take any commission on your sales.",
      },
      {
        q: "Can I also sell through WhatsApp and social media?",
        a: "Yes. We connect your catalog with WhatsApp Business, Instagram and Facebook Shops so you sell on whichever channel your customer prefers.",
      },
      {
        q: "Do you help me upload the products?",
        a: "In the Starter plan we upload up to 100 products with the information you provide. For larger catalogs we run a bulk import from your spreadsheet or ERP.",
      },
    ],
  },

  "ux-ui-branding": {
    es: [
      {
        q: "¿Cuántas propuestas de logo incluye?",
        a: "Presentamos 3 propuestas distintas y desarrollamos a fondo la que elijas, con hasta 2 rondas de ajustes incluidas.",
      },
      {
        q: "¿Entregan los archivos editables?",
        a: "Sí. Recibes los archivos fuente (Figma, vectores y versiones para web e impresión) junto con el manual de uso de la marca.",
      },
      {
        q: "¿Pueden rediseñar una marca que ya existe?",
        a: "Sí. Hacemos rediseños y actualizaciones respetando el reconocimiento que ya ganaste, y te acompañamos en la transición visual.",
      },
    ],
    en: [
      {
        q: "How many logo concepts are included?",
        a: "We present 3 distinct concepts and fully develop the one you choose, with up to 2 rounds of revisions included.",
      },
      {
        q: "Do you hand over the editable files?",
        a: "Yes. You receive the source files (Figma, vectors and web/print versions) along with the brand usage guidelines.",
      },
      {
        q: "Can you redesign an existing brand?",
        a: "Yes. We handle redesigns and refreshes while preserving the recognition you've already earned, and we guide you through the visual transition.",
      },
    ],
  },

  "marketing-digital": {
    es: [
      {
        q: "¿La inversión en pauta está incluida en el plan?",
        a: "No. El plan cubre la estrategia, la creación de piezas y la gestión de campañas; el presupuesto de pauta lo defines tú y se paga directo a Google o Meta. Recomendamos empezar desde $600.000 COP al mes.",
      },
      {
        q: "¿Hay permanencia mínima?",
        a: "Sugerimos mínimo 3 meses, porque los primeros 30 días se van en configuración y aprendizaje de las campañas. No hay cláusulas de penalización.",
      },
      {
        q: "¿Cómo mido si está funcionando?",
        a: "Configuramos analítica y seguimiento de conversiones desde el día uno, y recibes un informe mensual con costo por lead, alcance y ventas atribuidas.",
      },
    ],
    en: [
      {
        q: "Is ad spend included in the plan?",
        a: "No. The plan covers strategy, creative production and campaign management; the ad budget is set by you and paid directly to Google or Meta. We recommend starting at around $600,000 COP per month.",
      },
      {
        q: "Is there a minimum commitment?",
        a: "We suggest at least 3 months, since the first 30 days go into setup and campaign learning. There are no penalty clauses.",
      },
      {
        q: "How do I know it's working?",
        a: "We set up analytics and conversion tracking from day one, and you get a monthly report with cost per lead, reach and attributed sales.",
      },
    ],
  },

  "produccion-audiovisual": {
    es: [
      {
        q: "¿El precio incluye desplazamiento a otras ciudades?",
        a: "Los planes cubren producción en el área metropolitana. Para otras ciudades cotizamos aparte los viáticos y el transporte del equipo.",
      },
      {
        q: "¿Quién consigue las locaciones y los modelos?",
        a: "Podemos encargarnos del casting y la locación como servicio adicional, o grabar en tus instalaciones y con tu equipo, que suele ser lo más auténtico.",
      },
      {
        q: "¿En cuánto tiempo entregan el video editado?",
        a: "Entre 7 y 15 días hábiles después de la grabación, según la complejidad de la edición y las rondas de ajustes.",
      },
    ],
    en: [
      {
        q: "Does the price include travel to other cities?",
        a: "The plans cover production within the metro area. For other cities we quote travel and crew transport separately.",
      },
      {
        q: "Who arranges locations and talent?",
        a: "We can handle casting and locations as an add-on, or shoot at your facilities with your own team, which usually feels most authentic.",
      },
      {
        q: "How long until the edited video is delivered?",
        a: "Between 7 and 15 business days after the shoot, depending on editing complexity and rounds of revisions.",
      },
    ],
  },

  "ia-automatizacion": {
    es: [
      {
        q: "¿Cuánto cuesta operar la IA cada mes?",
        a: "Además del desarrollo hay un consumo de los modelos (tokens) que suele estar entre $80.000 y $400.000 COP mensuales según el volumen de conversaciones. Te lo estimamos antes de empezar.",
      },
      {
        q: "¿Mis datos se usan para entrenar modelos públicos?",
        a: "No. Trabajamos con proveedores y configuraciones que no reutilizan tu información para entrenamiento, y podemos desplegar modelos privados si tu política lo exige.",
      },
      {
        q: "¿Qué pasa si el asistente no sabe responder?",
        a: "Se configura para reconocer sus límites y escalar la conversación a una persona de tu equipo, dejando registro del caso para seguir entrenándolo.",
      },
    ],
    en: [
      {
        q: "How much does it cost to run the AI each month?",
        a: "On top of development there is model usage (tokens), usually between $80,000 and $400,000 COP per month depending on conversation volume. We estimate it before we start.",
      },
      {
        q: "Is my data used to train public models?",
        a: "No. We work with providers and configurations that don't reuse your information for training, and we can deploy private models if your policy requires it.",
      },
      {
        q: "What happens if the assistant doesn't know an answer?",
        a: "It's configured to recognize its limits and hand the conversation to someone on your team, logging the case so we can keep training it.",
      },
    ],
  },

  "cloud-devops": {
    es: [
      {
        q: "¿El plan incluye lo que cobra AWS, Google o Azure?",
        a: "No. El consumo del proveedor se factura a tu cuenta y tú mantienes el control; nuestro plan cubre el diseño, la operación y la optimización de esa infraestructura.",
      },
      {
        q: "¿Cuánto se puede ahorrar optimizando la nube?",
        a: "En la mayoría de auditorías encontramos entre 20% y 40% de ahorro con dimensionamiento correcto, instancias reservadas y apagado de recursos ociosos.",
      },
      {
        q: "¿Pueden trabajar con el equipo de TI que ya tengo?",
        a: "Sí. Nos integramos como equipo de apoyo, documentamos todo y capacitamos a tu gente para que no dependas de nosotros.",
      },
    ],
    en: [
      {
        q: "Does the plan include what AWS, Google or Azure charge?",
        a: "No. Provider usage is billed to your account and you keep control; our plan covers the design, operation and optimization of that infrastructure.",
      },
      {
        q: "How much can cloud optimization save?",
        a: "In most audits we find 20% to 40% savings through right-sizing, reserved instances and shutting down idle resources.",
      },
      {
        q: "Can you work with my existing IT team?",
        a: "Yes. We join as a support team, document everything and train your people so you don't depend on us.",
      },
    ],
  },

  ciberseguridad: {
    es: [
      {
        q: "¿La auditoría puede afectar mi operación?",
        a: "No. Acordamos ventanas de trabajo y usamos técnicas no destructivas. Las pruebas que implican riesgo se ejecutan en ambientes de pruebas o fuera del horario crítico.",
      },
      {
        q: "¿Firman acuerdo de confidencialidad?",
        a: "Siempre. Firmamos NDA antes de recibir cualquier acceso y los hallazgos se comparten únicamente con las personas que tú autorices.",
      },
      {
        q: "¿Corrigen ustedes las vulnerabilidades encontradas?",
        a: "Podemos hacerlo o acompañar a tu equipo. En el plan de pentesting incluimos un retest para verificar que las correcciones quedaron bien aplicadas.",
      },
    ],
    en: [
      {
        q: "Can the audit disrupt my operation?",
        a: "No. We agree on testing windows and use non-destructive techniques. Anything risky runs in test environments or outside critical hours.",
      },
      {
        q: "Do you sign a confidentiality agreement?",
        a: "Always. We sign an NDA before receiving any access, and findings are shared only with the people you authorize.",
      },
      {
        q: "Do you fix the vulnerabilities you find?",
        a: "We can fix them or support your team. The pentesting plan includes a retest to verify the fixes were applied correctly.",
      },
    ],
  },

  "hosting-mantenimiento": {
    es: [
      {
        q: "¿El dominio está incluido en el plan?",
        a: "El plan cubre el hosting, el SSL y el mantenimiento. El dominio se puede incluir por un costo adicional aproximado de $90.000 COP al año para un .com o .co.",
      },
      {
        q: "¿Qué pasa si mi sitio se cae o lo hackean?",
        a: "Restauramos desde la última copia de seguridad sin costo adicional dentro del plan, y hacemos el análisis para cerrar la puerta que se usó.",
      },
      {
        q: "¿Los cambios de contenido incluidos qué cubren?",
        a: "Cambios de textos, imágenes, precios, publicaciones o secciones existentes. Las funcionalidades nuevas se cotizan como desarrollo aparte.",
      },
    ],
    en: [
      {
        q: "Is the domain included in the plan?",
        a: "The plan covers hosting, SSL and maintenance. The domain can be added for roughly $90,000 COP per year for a .com or .co.",
      },
      {
        q: "What if my site goes down or gets hacked?",
        a: "We restore from the latest backup at no extra cost within the plan, and we analyze the incident to close the door that was used.",
      },
      {
        q: "What do the included content updates cover?",
        a: "Changes to text, images, prices, posts or existing sections. Brand-new functionality is quoted as separate development.",
      },
    ],
  },

  "consultoria-tech": {
    es: [
      {
        q: "¿Sirve si mi empresa es pequeña?",
        a: "Sí. De hecho es donde más impacto tiene: evita que inviertas en la herramienta equivocada. Ajustamos el alcance y el precio al tamaño de tu operación.",
      },
      {
        q: "¿Puedo contratar solo el diagnóstico?",
        a: "Claro. Muchos clientes empiezan por el diagnóstico y luego deciden si siguen con la hoja de ruta o ejecutan por su cuenta.",
      },
      {
        q: "¿Recomiendan solo tecnologías que ustedes desarrollan?",
        a: "No. Si la mejor solución es una herramienta del mercado o un proveedor distinto, te lo decimos. Nuestro criterio es lo que más te conviene.",
      },
    ],
    en: [
      {
        q: "Does it make sense for a small company?",
        a: "Yes. That's where it has the most impact: it stops you from investing in the wrong tool. We adjust scope and price to the size of your operation.",
      },
      {
        q: "Can I hire only the assessment?",
        a: "Of course. Many clients start with the assessment and then decide whether to continue with the roadmap or execute on their own.",
      },
      {
        q: "Do you only recommend technologies you build?",
        a: "No. If the best solution is an off-the-shelf tool or a different vendor, we'll say so. Our criterion is what suits you best.",
      },
    ],
  },

  "data-analytics": {
    es: [
      {
        q: "¿Necesito comprar licencias de Power BI o similares?",
        a: "Depende de la herramienta. Looker Studio y Metabase pueden usarse sin licencia; Power BI cuesta alrededor de USD 14 por usuario al mes. Te recomendamos la opción más económica para tu caso.",
      },
      {
        q: "Mis datos están en Excel y en varios sistemas, ¿sirve igual?",
        a: "Sí. Parte del trabajo es justamente unificar hojas de cálculo, bases de datos y sistemas en un solo modelo confiable.",
      },
      {
        q: "¿Cada cuánto se actualizan los tableros?",
        a: "Lo definimos contigo: puede ser en tiempo real, cada hora o una vez al día, según la fuente y la criticidad del indicador.",
      },
    ],
    en: [
      {
        q: "Do I need to buy Power BI or similar licenses?",
        a: "It depends on the tool. Looker Studio and Metabase can be used without a license; Power BI costs around USD 14 per user per month. We recommend the most economical option for your case.",
      },
      {
        q: "My data is in Excel and several systems — does it still work?",
        a: "Yes. A big part of the job is exactly that: unifying spreadsheets, databases and systems into one reliable model.",
      },
      {
        q: "How often do the dashboards refresh?",
        a: "We define it with you: real time, hourly or once a day, depending on the source and how critical the indicator is.",
      },
    ],
  },

  "integraciones-apis": {
    es: [
      {
        q: "¿Qué pasa si el otro sistema no tiene API?",
        a: "Buscamos alternativas: exportaciones programadas, acceso directo a la base de datos o automatización de la interfaz. Lo evaluamos sin costo antes de cotizar.",
      },
      {
        q: "¿Cómo sé si una sincronización falló?",
        a: "Todas las integraciones incluyen registro de eventos, reintentos automáticos y alertas por correo o WhatsApp cuando algo no se procesa.",
      },
      {
        q: "¿Usan Zapier o Make?",
        a: "Cuando conviene, sí: son más rápidos y económicos para flujos simples. Para volúmenes altos o lógica compleja desarrollamos la integración a la medida.",
      },
    ],
    en: [
      {
        q: "What if the other system has no API?",
        a: "We look for alternatives: scheduled exports, direct database access or interface automation. We assess it at no cost before quoting.",
      },
      {
        q: "How do I know if a sync failed?",
        a: "Every integration includes event logging, automatic retries and email or WhatsApp alerts when something doesn't go through.",
      },
      {
        q: "Do you use Zapier or Make?",
        a: "When it fits, yes: they're faster and cheaper for simple flows. For high volumes or complex logic we build a custom integration.",
      },
    ],
  },

  "soporte-ti": {
    es: [
      {
        q: "¿Atienden fuera del horario laboral?",
        a: "Los planes estándar cubren horario hábil. La cobertura extendida o 24/7 se contrata en el plan de outsourcing o como adicional.",
      },
      {
        q: "¿El soporte es solo remoto?",
        a: "La mayoría de casos se resuelven remoto en minutos. El plan Pro incluye visitas presenciales programadas y podemos agregar visitas puntuales según tu ubicación.",
      },
      {
        q: "¿Qué pasa si supero los usuarios del plan?",
        a: "Te avisamos antes de que se convierta en un problema y ajustamos el plan al número real de usuarios, sin cobros sorpresa.",
      },
    ],
    en: [
      {
        q: "Do you provide support outside business hours?",
        a: "Standard plans cover business hours. Extended or 24/7 coverage is available in the outsourcing plan or as an add-on.",
      },
      {
        q: "Is support remote only?",
        a: "Most cases are solved remotely within minutes. The Pro plan includes scheduled on-site visits, and we can add one-off visits depending on your location.",
      },
      {
        q: "What if I exceed the users included in my plan?",
        a: "We let you know before it becomes a problem and adjust the plan to your actual number of users, with no surprise charges.",
      },
    ],
  },

  "alquiler-equipos": {
    es: [
      {
        q: "¿Es más conveniente alquilar que comprar?",
        a: "Depende del plazo. Si vas a usar el equipo más de 4 años y tienes caja disponible, comprar puede salir más barato. Si necesitas renovar cada 2–3 años, no quieres inmovilizar capital o prefieres que el soporte y la reposición estén incluidos, el alquiler suele ser mejor negocio. Te mostramos la comparación con números antes de decidir.",
      },
      {
        q: "¿Cuántos equipos mínimo debo alquilar?",
        a: "Desde 1 equipo. A partir de 10 equipos aplicamos tarifas por volumen y asignamos un responsable de cuenta para tu empresa.",
      },
      {
        q: "¿Los equipos son nuevos o usados?",
        a: "Ofrecemos ambas líneas: equipos nuevos con garantía de fábrica y equipos certificados (refurbished) revisados por nosotros, con una tarifa más económica. Tú eliges según presupuesto.",
      },
      {
        q: "¿Qué pasa con la información si devuelvo un equipo?",
        a: "Antes de retirar cualquier equipo hacemos borrado seguro certificado de los discos y te entregamos el acta correspondiente.",
      },
      {
        q: "¿Alquilan para eventos o proyectos cortos?",
        a: "Sí. Manejamos alquiler por días, semanas o meses para capacitaciones, ferias, auditorías, temporadas altas y proyectos temporales, con entrega e instalación en sitio.",
      },
    ],
    en: [
      {
        q: "Is renting better than buying?",
        a: "It depends on the term. If you'll use the device for more than 4 years and have cash available, buying can be cheaper. If you need to refresh every 2–3 years, don't want to tie up capital, or prefer support and replacement included, renting usually wins. We show you the comparison with real numbers before you decide.",
      },
      {
        q: "What's the minimum number of devices?",
        a: "From 1 device. From 10 devices onward we apply volume pricing and assign an account manager to your company.",
      },
      {
        q: "Is the equipment new or used?",
        a: "We offer both lines: brand-new devices with factory warranty, and certified refurbished units inspected by us at a lower rate. You choose based on budget.",
      },
      {
        q: "What happens to my data when I return a device?",
        a: "Before we pick up any device we perform certified secure erasure of the drives and hand you the corresponding certificate.",
      },
      {
        q: "Do you rent for events or short projects?",
        a: "Yes. We rent by day, week or month for training sessions, trade shows, audits, peak seasons and temporary projects, with on-site delivery and setup.",
      },
    ],
  },
};
