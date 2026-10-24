/**
 * Catálogo del centro de automatizaciones: disparadores, condiciones y
 * acciones que entiende el motor de la base de datos (automation_execute).
 */

export type RuleEntity = "lead" | "appointment" | "ticket" | "chat";
export type TriggerKey =
  | "lead_created"
  | "lead_not_contacted"
  | "lead_stale"
  | "lead_won"
  | "appointment_booked"
  | "appointment_upcoming"
  | "ticket_created"
  | "ticket_no_reply"
  | "ticket_staff_reply"
  | "chat_started"
  | "chat_unanswered"
  | "chat_reply_offline";
export type ActionType = "assign" | "task" | "notify" | "email" | "whatsapp" | "status" | "tag";
export type ConditionKey = "tiers" | "statuses" | "problems" | "priorities" | "channels";

export type RuleAction = {
  type: ActionType;
  roles?: string[];
  user_id?: string;
  to?: "owner" | "roles" | "user" | "contact" | "team";
  title?: string;
  body?: string;
  subject?: string;
  cta_label?: string;
  cta_url?: string;
  due_minutes?: number;
  assign_to?: "owner" | "user";
  status?: string;
  tag?: string;
  template_id?: string;
  params?: string[];
  kind?: string;
};

type ParamField = { key: "minutes" | "hours" | "days"; label: string; unit: string; default: number };

export const TRIGGERS: Record<
  TriggerKey,
  { entity: RuleEntity; group: "sales" | "meetings" | "service" | "chat"; instant: boolean; param?: ParamField; conditions: ConditionKey[] }
> = {
  lead_created: { entity: "lead", group: "sales", instant: true, conditions: ["tiers", "problems"] },
  lead_not_contacted: { entity: "lead", group: "sales", instant: false, param: { key: "minutes", label: "Minutos sin contacto", unit: "min", default: 15 }, conditions: ["tiers", "problems"] },
  lead_stale: { entity: "lead", group: "sales", instant: false, param: { key: "days", label: "Días sin actividad", unit: "días", default: 7 }, conditions: ["tiers", "statuses", "problems"] },
  lead_won: { entity: "lead", group: "sales", instant: true, conditions: ["tiers", "problems"] },
  appointment_booked: { entity: "appointment", group: "meetings", instant: true, conditions: ["tiers"] },
  appointment_upcoming: { entity: "appointment", group: "meetings", instant: false, param: { key: "hours", label: "Horas antes de la cita", unit: "h", default: 24 }, conditions: ["tiers"] },
  ticket_created: { entity: "ticket", group: "service", instant: true, conditions: ["priorities"] },
  ticket_no_reply: { entity: "ticket", group: "service", instant: false, param: { key: "hours", label: "Horas sin respuesta", unit: "h", default: 4 }, conditions: ["priorities"] },
  ticket_staff_reply: { entity: "ticket", group: "service", instant: true, conditions: ["priorities"] },
  chat_started: { entity: "chat", group: "chat", instant: true, conditions: ["channels"] },
  chat_unanswered: { entity: "chat", group: "chat", instant: false, param: { key: "minutes", label: "Minutos esperando", unit: "min", default: 5 }, conditions: ["channels"] },
  chat_reply_offline: { entity: "chat", group: "chat", instant: false, conditions: [] },
};

export const ACTIONS_BY_ENTITY: Record<RuleEntity, ActionType[]> = {
  lead: ["assign", "task", "notify", "email", "whatsapp", "status"],
  appointment: ["assign", "task", "notify", "email", "whatsapp", "status"],
  ticket: ["assign", "task", "notify", "email", "status"],
  chat: ["assign", "task", "notify", "email", "whatsapp", "tag"],
};

/** Variables que se pueden usar en los textos, por tipo de elemento. */
export const VARIABLES: Record<RuleEntity, string[]> = {
  lead: ["nombre", "primer_nombre", "empresa", "correo", "telefono", "puntaje", "color", "problema"],
  appointment: ["nombre", "primer_nombre", "empresa", "fecha", "canal", "correo", "telefono"],
  ticket: ["nombre", "primer_nombre", "numero", "asunto", "prioridad", "ultima_respuesta", "correo"],
  chat: ["nombre", "primer_nombre", "mensaje", "ultima_respuesta", "correo", "telefono"],
};

export const rulesCopy = {
  title: "Automatizaciones",
  subtitle: "Reglas «cuando pase esto → haz aquello» que trabajan solas: asignan, avisan, recuerdan y hacen seguimiento.",
  create: "Crear automatización",
  tabs: { rules: "Tus automatizaciones", history: "Historial" },
  stats: { active: "Activas", runs: "Ejecuciones (30 días)", failed: "Con error (30 días)", last: "Última ejecución" },
  empty: "Aún no hay automatizaciones.",
  on: "Activa",
  off: "Pausada",
  runs: "{n} ejecuciones",
  never: "Nunca se ha ejecutado",
  lastRun: "Última: {date}",
  edit: "Editar",
  duplicate: "Duplicar",
  delete: "Eliminar",
  confirmDelete: "¿Eliminar esta automatización?",
  readOnly: "Solo administradores y marketing pueden crear o editar automatizaciones.",
  runNow: "Revisar ahora",
  running: "Revisando…",
  ranResult: "{n} acciones ejecutadas",
  scheduleNote: "Las reglas por tiempo se revisan solas cada 5 minutos.",
  groups: { sales: "Ventas", meetings: "Reuniones", service: "Soporte", chat: "Chat" },
  triggers: {
    lead_created: { label: "Llega un lead nuevo", desc: "Apenas alguien envía el formulario o se crea desde el chat." },
    lead_not_contacted: { label: "Lead sin contactar", desc: "Nadie ha registrado llamada, nota o mensaje después de X minutos." },
    lead_stale: { label: "Lead sin actividad", desc: "Un lead abierto lleva X días sin movimiento." },
    lead_won: { label: "Se gana una venta", desc: "Un lead pasa a «Ganado»." },
    appointment_booked: { label: "Se agenda una reunión", desc: "El lead elige día y hora en la agenda." },
    appointment_upcoming: { label: "Reunión próxima", desc: "Faltan X horas para una reunión agendada." },
    ticket_created: { label: "Llega una solicitud de soporte", desc: "Desde el centro de soporte o el portal del cliente." },
    ticket_no_reply: { label: "Solicitud sin respuesta", desc: "El cliente espera respuesta hace X horas." },
    ticket_staff_reply: { label: "El equipo responde una solicitud", desc: "Una respuesta visible para el cliente (no las notas internas)." },
    chat_started: { label: "Empieza un chat", desc: "Un visitante abre una conversación o escribe por WhatsApp." },
    chat_unanswered: { label: "Chat sin responder", desc: "El visitante lleva X minutos esperando la primera respuesta." },
    chat_reply_offline: { label: "Respuesta cuando el visitante ya se fue", desc: "Respondiste en el chat y el visitante no volvió a verlo." },
  } as Record<TriggerKey, { label: string; desc: string }>,
  conditions: {
    title: "Solo si…",
    hint: "Opcional. Sin condiciones, la regla aplica a todos.",
    tiers: "Color del lead",
    statuses: "Etapa del CRM",
    problems: "Necesidad",
    priorities: "Prioridad",
    channels: "Canal",
    channelNames: { web: "Chat del sitio", whatsapp: "WhatsApp" } as Record<string, string>,
    priorityNames: { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" } as Record<string, string>,
  },
  actions: {
    title: "Entonces…",
    add: "Agregar acción",
    remove: "Quitar acción",
    types: {
      assign: { label: "Asignar responsable", desc: "Por turnos entre un equipo o a una persona." },
      task: { label: "Crear tarea", desc: "Con vencimiento, para el responsable o alguien en particular." },
      notify: { label: "Avisar al equipo", desc: "Aparece en la campana de notificaciones." },
      email: { label: "Enviar correo", desc: "Al cliente o al equipo (con Resend)." },
      whatsapp: { label: "Enviar WhatsApp", desc: "Con una plantilla aprobada por Meta." },
      status: { label: "Cambiar estado", desc: "Etapa del lead o estado de la solicitud." },
      tag: { label: "Etiquetar conversación", desc: "Agrega una etiqueta al chat." },
    } as Record<ActionType, { label: string; desc: string }>,
    roundRobin: "Por turnos entre",
    person: "Una persona",
    to: "Para",
    toOwner: "El responsable",
    toRoles: "Un equipo",
    toUser: "Una persona",
    toContact: "El cliente",
    toTeam: "Los correos del equipo",
    roles: { admin: "Gerencia", sales: "Ventas", marketing: "Marketing", support: "Soporte" } as Record<string, string>,
    titleLabel: "Título",
    bodyLabel: "Mensaje",
    subject: "Asunto",
    ctaLabel: "Texto del botón (opcional)",
    ctaUrl: "Enlace del botón",
    taskTitle: "Tarea",
    due: "Vence en",
    dueOptions: { "60": "1 hora", "240": "4 horas", "1440": "1 día", "4320": "3 días", "10080": "1 semana" } as Record<string, string>,
    status: "Nuevo estado",
    tag: "Etiqueta",
    template: "Plantilla de WhatsApp",
    noTemplates: "No hay plantillas aprobadas (sincronízalas en Campañas).",
    templateParam: "Variable {{n}}",
    variables: "Variables",
    variablesHint: "Haz clic para insertar en el último campo de texto usado.",
  },
  editor: {
    newTitle: "Nueva automatización",
    editTitle: "Editar automatización",
    back: "Volver a automatizaciones",
    when: "Cuando…",
    name: "Nombre",
    namePlaceholder: "Ej.: Avisar a ventas por cada lead verde",
    description: "Descripción (opcional)",
    save: "Guardar",
    saving: "Guardando…",
    saved: "Guardado",
    summary: "Resumen",
    enabled: "Activa",
    instant: "Al instante",
    periodic: "Se revisa cada 5 minutos",
    errors: { name: "Ponle un nombre.", actions: "Agrega al menos una acción.", generic: "No se pudo guardar." },
  },
  history: {
    empty: "Todavía no se ha ejecutado ninguna automatización.",
    cols: { when: "Fecha", rule: "Automatización", item: "Elemento", result: "Resultado" },
    done: "Hecho",
    failed: "Error",
    entities: { lead: "Lead", appointment: "Reunión", ticket: "Solicitud", chat: "Chat" } as Record<string, string>,
  },
};
