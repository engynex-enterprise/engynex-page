import type { Locale } from "@/i18n/config";

/**
 * Textos del formulario de calificación y de la agenda.
 *
 * Las claves de las opciones (sales, lt2, self, week…) son las mismas que
 * valida la base de datos en `submit_lead` y que puntúa `scoring_config`:
 * si agregas o quitas una opción, cámbiala también en la migración.
 */

export const problemKeys = [
  "sales",
  "web",
  "automation",
  "system",
  "support",
  "other",
  "none",
] as const;
export const budgetKeys = [
  "lt2",
  "2to5",
  "5to15",
  "15to40",
  "gt40",
  "monthly",
  "unknown",
] as const;
export const decisionKeys = ["self", "shared", "other"] as const;
export const timelineKeys = ["week", "month", "browsing"] as const;
export const channelKeys = ["meet", "call", "whatsapp", "in_person"] as const;

export type ProblemKey = (typeof problemKeys)[number];
export type BudgetKey = (typeof budgetKeys)[number];
export type DecisionKey = (typeof decisionKeys)[number];
export type TimelineKey = (typeof timelineKeys)[number];
export type ChannelKey = (typeof channelKeys)[number];

/** Páginas útiles según el problema, para los amarillos y rojos. */
export const resourcesByProblem: Record<ProblemKey, string[]> = {
  sales: ["servicios/marketing-digital", "servicios/ecommerce", "portafolio"],
  web: ["servicios/desarrollo-web", "planes#desarrollo-web", "portafolio"],
  automation: ["servicios/ia-automatizacion", "productos", "portafolio"],
  system: ["servicios/plataformas-web", "productos", "portafolio"],
  support: ["servicios/soporte-ti", "servicios/ciberseguridad", "planes#soporte-ti"],
  other: ["servicios", "portafolio", "ayuda"],
  none: ["portafolio", "ayuda", "servicios"],
};

const es = {
  stepOf: "Paso {n} de {total}",
  back: "Atrás",
  next: "Continuar",
  submit: "Enviar",
  sending: "Enviando…",
  required: "Este campo es obligatorio.",
  invalidEmail: "Escribe un correo válido.",
  invalidPhone: "Escribe un número de contacto válido.",
  recoveryOptIn:
    "Si no alcanzo a terminar, pueden escribirme a mi correo para ayudarme a completarlo (opcional).",
  whatsappOptIn:
    "Quiero recibir por WhatsApp novedades, consejos y ofertas de Engynex (opcional; puedes darte de baja respondiendo BAJA).",
  pickOne: "Elige una opción para continuar.",
  errors: {
    rate_limited: "Recibimos varios envíos seguidos. Espera unos minutos e inténtalo de nuevo.",
    generic: "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
  },
  steps: {
    contact: {
      title: "¿Cómo te contactamos?",
      subtitle: "Solo lo usamos para responderte.",
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Celular o WhatsApp",
      company: "Empresa (opcional)",
    },
    problem: {
      title: "¿Qué problema quieres resolver?",
      subtitle: "Así llegamos a la reunión sabiendo cómo ayudarte.",
      detail: "Cuéntanos un poco más (opcional, pero nos ayuda mucho)",
      detailPlaceholder:
        "Ej.: vendemos solo por WhatsApp y perdemos pedidos; queremos una tienda en línea conectada al inventario…",
      options: {
        sales: "Necesito vender más o conseguir clientes",
        web: "No tengo página web o la que tengo no funciona",
        automation: "Pierdo tiempo en tareas manuales y repetitivas",
        system: "Necesito un sistema o plataforma para mi operación",
        support: "Tengo problemas de tecnología, equipos o seguridad",
        other: "Otro problema",
        none: "Todavía no tengo un problema definido, solo estoy explorando",
      } satisfies Record<ProblemKey, string>,
    },
    budget: {
      title: "¿Cuánto piensas invertir?",
      subtitle: "Un rango aproximado está bien; no es un compromiso.",
      options: {
        lt2: "Menos de $2 millones",
        "2to5": "Entre $2 y $5 millones",
        "5to15": "Entre $5 y $15 millones",
        "15to40": "Entre $15 y $40 millones",
        gt40: "Más de $40 millones",
        monthly: "Prefiero pagar mes a mes",
        unknown: "Aún no lo sé",
      } satisfies Record<BudgetKey, string>,
    },
    decision: {
      title: "¿Quién toma la decisión?",
      subtitle: "Para invitar a la reunión a quien haga falta.",
      options: {
        self: "La tomo yo",
        shared: "La tomo con un socio o mi jefe",
        other: "La toma otra persona; yo estoy investigando",
      } satisfies Record<DecisionKey, string>,
    },
    timeline: {
      title: "¿Cuándo quieres empezar?",
      subtitle: "Nos ayuda a priorizar tu solicitud.",
      options: {
        week: "Esta semana",
        month: "Este mes",
        browsing: "Solo estoy mirando por ahora",
      } satisfies Record<TimelineKey, string>,
    },
  },
  results: {
    green: {
      title: "¡Hablemos ya, {name}!",
      subtitle:
        "Tu proyecto encaja con lo que hacemos. Elige el día, la hora y cómo prefieres que nos reunamos.",
    },
    yellow: {
      title: "Gracias, {name}",
      subtitle:
        "Recibimos tu solicitud. Un asesor te escribirá con información pensada para tu caso. Mientras tanto, esto te puede servir:",
    },
    red: {
      title: "Gracias por escribirnos, {name}",
      subtitle:
        "Cuando tengas un proyecto en mente, aquí estaremos. Te dejamos algunos recursos por si quieres conocernos mejor:",
    },
    resourceLabels: {
      "servicios/marketing-digital": "Marketing digital",
      "servicios/ecommerce": "Tiendas en línea",
      "servicios/desarrollo-web": "Desarrollo web",
      "planes#desarrollo-web": "Planes de página web",
      "servicios/ia-automatizacion": "IA y automatización",
      "servicios/plataformas-web": "Plataformas a la medida",
      productos: "Software listo para usar",
      "servicios/soporte-ti": "Soporte TI",
      "servicios/ciberseguridad": "Ciberseguridad",
      "planes#soporte-ti": "Planes de soporte",
      servicios: "Todos los servicios",
      portafolio: "Casos y portafolio",
      ayuda: "Centro de ayuda",
    } as Record<string, string>,
  },
  booking: {
    dayLabel: "Elige el día",
    timeLabel: "Elige la hora",
    timezone: "Hora de Colombia (GMT-5)",
    noSlots: "No hay horarios libres ese día. Prueba con otro.",
    noneAtAll:
      "No encontramos horarios libres en los próximos días. Un asesor te escribirá para coordinar.",
    channelLabel: "¿Cómo prefieres reunirte?",
    channels: {
      meet: "Videollamada",
      call: "Llamada telefónica",
      whatsapp: "WhatsApp",
      in_person: "Presencial",
    } satisfies Record<ChannelKey, string>,
    channelHints: {
      meet: "Te enviamos el enlace por correo",
      call: "Te llamamos a tu número",
      whatsapp: "Te escribimos por WhatsApp",
      in_person: "Acordamos el lugar contigo",
    } satisfies Record<ChannelKey, string>,
    notes: "¿Algo que debamos saber antes? (opcional)",
    confirm: "Confirmar reunión",
    confirming: "Confirmando…",
    taken: "Ese horario se acaba de ocupar. Elige otro, por favor.",
    expired: "El enlace para agendar venció. Escríbenos y la coordinamos.",
    error: "No pudimos agendar. Inténtalo de nuevo.",
    skip: "Prefiero que me escriban",
    skipped:
      "Listo. Un asesor te escribirá muy pronto para coordinar la reunión.",
    doneTitle: "¡Reunión agendada!",
    doneSubtitle: "Te esperamos. Si necesitas cambiarla, escríbenos por WhatsApp.",
    when: "Cuándo",
    how: "Cómo",
    addGoogle: "Agregar a Google Calendar",
    downloadIcs: "Descargar invitación (.ics)",
    eventTitle: "Reunión con Engynex",
  },
};

export type LeadFormCopy = typeof es;

const en: LeadFormCopy = {
  stepOf: "Step {n} of {total}",
  back: "Back",
  next: "Continue",
  submit: "Send",
  sending: "Sending…",
  required: "This field is required.",
  invalidEmail: "Enter a valid email.",
  invalidPhone: "Enter a valid contact number.",
  recoveryOptIn: "If I don't get to finish, you can email me to help me complete it (optional).",
  whatsappOptIn:
    "I want to receive Engynex news, tips and offers on WhatsApp (optional; reply STOP to unsubscribe).",
  pickOne: "Choose an option to continue.",
  errors: {
    rate_limited: "We received several submissions in a row. Wait a few minutes and try again.",
    generic: "We couldn't send your request. Try again or message us on WhatsApp.",
  },
  steps: {
    contact: {
      title: "How can we reach you?",
      subtitle: "We only use it to reply to you.",
      name: "Full name",
      email: "Email",
      phone: "Mobile or WhatsApp",
      company: "Company (optional)",
    },
    problem: {
      title: "What problem do you want to solve?",
      subtitle: "So we come to the meeting knowing how to help.",
      detail: "Tell us a bit more (optional, but it helps a lot)",
      detailPlaceholder:
        "E.g.: we only sell through WhatsApp and lose orders; we want an online store connected to inventory…",
      options: {
        sales: "I need to sell more or get customers",
        web: "I don't have a website or mine doesn't work",
        automation: "I waste time on manual, repetitive tasks",
        system: "I need a system or platform for my operation",
        support: "I have technology, equipment or security problems",
        other: "Another problem",
        none: "I don't have a defined problem yet, I'm just exploring",
      },
    },
    budget: {
      title: "How much are you planning to invest?",
      subtitle: "An approximate range is fine; it's not a commitment.",
      options: {
        lt2: "Under COP 2 million",
        "2to5": "COP 2–5 million",
        "5to15": "COP 5–15 million",
        "15to40": "COP 15–40 million",
        gt40: "Over COP 40 million",
        monthly: "I prefer to pay monthly",
        unknown: "I don't know yet",
      },
    },
    decision: {
      title: "Who makes the decision?",
      subtitle: "So we can invite whoever needs to be there.",
      options: {
        self: "I do",
        shared: "I decide with a partner or my boss",
        other: "Someone else decides; I'm researching",
      },
    },
    timeline: {
      title: "When do you want to start?",
      subtitle: "It helps us prioritize your request.",
      options: {
        week: "This week",
        month: "This month",
        browsing: "I'm just looking for now",
      },
    },
  },
  results: {
    green: {
      title: "Let's talk now, {name}!",
      subtitle:
        "Your project is a great fit. Pick the day, time and how you'd like to meet.",
    },
    yellow: {
      title: "Thank you, {name}",
      subtitle:
        "We received your request. An advisor will write to you with information tailored to your case. Meanwhile, this may help:",
    },
    red: {
      title: "Thanks for reaching out, {name}",
      subtitle:
        "Whenever you have a project in mind, we'll be here. Here are some resources if you'd like to get to know us:",
    },
    resourceLabels: {
      "servicios/marketing-digital": "Digital marketing",
      "servicios/ecommerce": "Online stores",
      "servicios/desarrollo-web": "Web development",
      "planes#desarrollo-web": "Website plans",
      "servicios/ia-automatizacion": "AI and automation",
      "servicios/plataformas-web": "Custom platforms",
      productos: "Ready-to-use software",
      "servicios/soporte-ti": "IT support",
      "servicios/ciberseguridad": "Cybersecurity",
      "planes#soporte-ti": "Support plans",
      servicios: "All services",
      portafolio: "Case studies and portfolio",
      ayuda: "Help Center",
    },
  },
  booking: {
    dayLabel: "Pick a day",
    timeLabel: "Pick a time",
    timezone: "Colombia time (GMT-5)",
    noSlots: "No free times that day. Try another one.",
    noneAtAll:
      "We couldn't find free times in the coming days. An advisor will write to you to coordinate.",
    channelLabel: "How would you like to meet?",
    channels: {
      meet: "Video call",
      call: "Phone call",
      whatsapp: "WhatsApp",
      in_person: "In person",
    },
    channelHints: {
      meet: "We'll email you the link",
      call: "We'll call your number",
      whatsapp: "We'll message you on WhatsApp",
      in_person: "We'll agree on the place with you",
    },
    notes: "Anything we should know beforehand? (optional)",
    confirm: "Confirm meeting",
    confirming: "Confirming…",
    taken: "That time was just taken. Please choose another one.",
    expired: "The scheduling link expired. Message us and we'll arrange it.",
    error: "We couldn't schedule it. Please try again.",
    skip: "I'd rather you write to me",
    skipped: "Done. An advisor will write to you very soon to arrange the meeting.",
    doneTitle: "Meeting scheduled!",
    doneSubtitle: "See you then. If you need to change it, message us on WhatsApp.",
    when: "When",
    how: "How",
    addGoogle: "Add to Google Calendar",
    downloadIcs: "Download invite (.ics)",
    eventTitle: "Meeting with Engynex",
  },
};

export const leadFormCopy: Record<Locale, LeadFormCopy> = { es, en };
