/**
 * Catálogo del centro de automatizaciones: disparadores, condiciones y
 * acciones que entiende el motor de la base de datos (automation_execute).
 */

export type RuleEntity = "lead" | "appointment" | "ticket" | "chat" | "task" | "deal" | "account";
export type TriggerKey =
  // Ventas
  | "lead_created"
  | "lead_not_contacted"
  | "lead_stale"
  | "lead_won"
  | "lead_lost"
  | "lead_status_changed"
  | "lead_assigned"
  | "lead_no_meeting"
  | "lead_reengage"
  | "email_clicked"
  | "email_bounced"
  // Reuniones
  | "appointment_booked"
  | "appointment_upcoming"
  | "appointment_cancelled"
  | "appointment_done"
  | "appointment_no_show"
  | "appointment_after"
  // Soporte
  | "ticket_created"
  | "ticket_no_reply"
  | "ticket_staff_reply"
  | "ticket_customer_reply"
  | "ticket_resolved"
  | "ticket_reopened"
  | "ticket_rated"
  | "ticket_sla_breached"
  | "ticket_waiting_customer"
  | "ticket_assigned"
  // Chat
  | "chat_started"
  | "chat_unanswered"
  | "chat_reply_offline"
  | "chat_closed"
  | "chat_rated"
  // Tareas
  | "task_completed"
  | "task_overdue"
  // Negocios
  | "deal_created"
  | "deal_stage_changed"
  | "deal_close_overdue"
  // Clientes
  | "account_created"
  | "account_renewal"
  | "account_inactive"
  | "document_uploaded";
export type ActionType =
  | "assign"
  | "task"
  | "notify"
  | "email"
  | "whatsapp"
  | "status"
  | "stage"
  | "priority"
  | "tag"
  | "note"
  | "followup"
  | "deal"
  | "webhook";
/** Listas (vacías = cualquiera) y condiciones sueltas. */
export type ConditionKey =
  | "tiers"
  | "statuses"
  | "problems"
  | "priorities"
  | "channels"
  | "sources"
  | "categories"
  | "stages"
  | "kinds"
  | "tags_any"
  | "min_score"
  | "min_value"
  | "max_rating"
  | "owner"
  | "business_hours"
  | "outside_hours";

export type RuleConditions = Partial<{
  tiers: string[];
  statuses: string[];
  problems: string[];
  priorities: string[];
  channels: string[];
  sources: string[];
  categories: string[];
  stages: string[];
  kinds: string[];
  tags_any: string[];
  min_score: number;
  min_value: number;
  max_rating: number;
  owner: "assigned" | "unassigned";
  business_hours: boolean;
  outside_hours: boolean;
}>;

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
  stage?: string;
  priority?: string;
  task_type?: string;
  tag?: string;
  template_id?: string;
  params?: string[];
  kind?: string;
  force?: boolean;
  /** followup: inscribir o sacar de la secuencia. */
  mode?: "enroll" | "stop";
  /** deal: valor y días para el cierre. */
  value?: number;
  close_days?: number;
  /** webhook */
  url?: string;
};

export type RuleGroup = "sales" | "meetings" | "service" | "chat" | "tasks" | "deals" | "accounts";

type ParamField = { key: "minutes" | "hours" | "days"; label: string; unit: string; default: number };

const LEAD_CONDS: ConditionKey[] = ["tiers", "statuses", "problems", "sources", "min_score", "owner", "business_hours", "outside_hours"];
const TICKET_CONDS: ConditionKey[] = ["priorities", "categories", "tags_any", "owner", "business_hours", "outside_hours"];
const CHAT_CONDS: ConditionKey[] = ["channels", "tags_any", "owner", "business_hours", "outside_hours"];

export const TRIGGERS: Record<
  TriggerKey,
  { entity: RuleEntity; group: RuleGroup; instant: boolean; param?: ParamField; conditions: ConditionKey[] }
> = {
  lead_created: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  lead_not_contacted: { entity: "lead", group: "sales", instant: false, param: { key: "minutes", label: "Minutos sin contacto", unit: "min", default: 15 }, conditions: LEAD_CONDS },
  lead_stale: { entity: "lead", group: "sales", instant: false, param: { key: "days", label: "Días sin actividad", unit: "días", default: 7 }, conditions: LEAD_CONDS },
  lead_won: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  lead_lost: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  lead_status_changed: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  lead_assigned: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  lead_no_meeting: { entity: "lead", group: "sales", instant: false, param: { key: "days", label: "Días sin reunión", unit: "días", default: 3 }, conditions: LEAD_CONDS },
  lead_reengage: { entity: "lead", group: "sales", instant: false, param: { key: "days", label: "Días desde que se perdió", unit: "días", default: 90 }, conditions: LEAD_CONDS },
  email_clicked: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  email_bounced: { entity: "lead", group: "sales", instant: true, conditions: LEAD_CONDS },
  appointment_booked: { entity: "appointment", group: "meetings", instant: true, conditions: ["tiers", "channels", "sources", "owner"] },
  appointment_upcoming: { entity: "appointment", group: "meetings", instant: false, param: { key: "hours", label: "Horas antes de la cita", unit: "h", default: 24 }, conditions: ["tiers", "channels", "owner"] },
  appointment_cancelled: { entity: "appointment", group: "meetings", instant: true, conditions: ["tiers", "channels"] },
  appointment_done: { entity: "appointment", group: "meetings", instant: true, conditions: ["tiers", "channels"] },
  appointment_no_show: { entity: "appointment", group: "meetings", instant: true, conditions: ["tiers", "channels"] },
  appointment_after: { entity: "appointment", group: "meetings", instant: false, param: { key: "hours", label: "Horas después de la cita", unit: "h", default: 2 }, conditions: ["tiers", "channels"] },
  ticket_created: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  ticket_no_reply: { entity: "ticket", group: "service", instant: false, param: { key: "hours", label: "Horas sin respuesta", unit: "h", default: 4 }, conditions: TICKET_CONDS },
  ticket_staff_reply: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  ticket_customer_reply: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  ticket_resolved: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  ticket_reopened: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  ticket_rated: { entity: "ticket", group: "service", instant: true, conditions: ["max_rating", ...TICKET_CONDS] },
  ticket_sla_breached: { entity: "ticket", group: "service", instant: false, conditions: TICKET_CONDS },
  ticket_waiting_customer: { entity: "ticket", group: "service", instant: false, param: { key: "days", label: "Días esperando al cliente", unit: "días", default: 3 }, conditions: TICKET_CONDS },
  ticket_assigned: { entity: "ticket", group: "service", instant: true, conditions: TICKET_CONDS },
  chat_started: { entity: "chat", group: "chat", instant: true, conditions: CHAT_CONDS },
  chat_unanswered: { entity: "chat", group: "chat", instant: false, param: { key: "minutes", label: "Minutos esperando", unit: "min", default: 5 }, conditions: CHAT_CONDS },
  chat_reply_offline: { entity: "chat", group: "chat", instant: false, conditions: [] },
  chat_closed: { entity: "chat", group: "chat", instant: true, conditions: CHAT_CONDS },
  chat_rated: { entity: "chat", group: "chat", instant: true, conditions: ["max_rating", ...CHAT_CONDS] },
  task_completed: { entity: "task", group: "tasks", instant: true, conditions: ["priorities", "tags_any"] },
  task_overdue: { entity: "task", group: "tasks", instant: false, param: { key: "minutes", label: "Minutos después del vencimiento", unit: "min", default: 60 }, conditions: ["priorities", "tags_any", "owner"] },
  deal_created: { entity: "deal", group: "deals", instant: true, conditions: ["stages", "min_value", "tiers", "sources"] },
  deal_stage_changed: { entity: "deal", group: "deals", instant: true, conditions: ["stages", "min_value", "tiers"] },
  deal_close_overdue: { entity: "deal", group: "deals", instant: false, param: { key: "days", label: "Días de atraso", unit: "días", default: 1 }, conditions: ["stages", "min_value"] },
  account_created: { entity: "account", group: "accounts", instant: true, conditions: ["kinds"] },
  account_renewal: { entity: "account", group: "accounts", instant: false, param: { key: "days", label: "Días antes de la renovación", unit: "días", default: 30 }, conditions: ["stages", "min_value", "tags_any", "kinds"] },
  account_inactive: { entity: "account", group: "accounts", instant: false, param: { key: "days", label: "Días sin entrar al portal", unit: "días", default: 30 }, conditions: ["stages", "tags_any"] },
  document_uploaded: { entity: "account", group: "accounts", instant: true, conditions: ["kinds", "stages"] },
};

export const ACTIONS_BY_ENTITY: Record<RuleEntity, ActionType[]> = {
  lead: ["assign", "task", "notify", "email", "whatsapp", "status", "note", "followup", "deal", "webhook"],
  appointment: ["assign", "task", "notify", "email", "whatsapp", "status", "note", "followup", "webhook"],
  ticket: ["assign", "task", "notify", "email", "status", "priority", "tag", "note", "stage", "webhook"],
  chat: ["assign", "task", "notify", "email", "whatsapp", "status", "tag", "webhook"],
  task: ["assign", "notify", "email", "status", "priority", "tag", "webhook"],
  deal: ["assign", "task", "notify", "email", "stage", "note", "webhook"],
  account: ["assign", "task", "notify", "email", "stage", "tag", "note", "webhook"],
};

/** Variables que se pueden usar en los textos, por tipo de elemento. */
export const VARIABLES: Record<RuleEntity, string[]> = {
  lead: ["nombre", "primer_nombre", "empresa", "correo", "telefono", "puntaje", "color", "problema", "fuente", "asesor", "motivo_perdida", "enlace"],
  appointment: ["nombre", "primer_nombre", "empresa", "fecha", "canal", "enlace_reunion", "enlace_agenda", "resultado", "asesor", "correo", "telefono"],
  ticket: ["nombre", "primer_nombre", "numero", "asunto", "prioridad", "ultima_respuesta", "ultimo_mensaje", "calificacion", "comentario", "asesor", "enlace_cliente", "enlace_encuesta", "correo"],
  chat: ["nombre", "primer_nombre", "mensaje", "ultima_respuesta", "calificacion", "comentario", "asesor", "correo", "telefono"],
  task: ["titulo", "vence", "asesor", "nombre", "empresa", "enlace"],
  deal: ["titulo", "valor", "etapa", "probabilidad", "cierre", "nombre", "primer_nombre", "empresa", "asesor", "correo"],
  account: ["nombre", "primer_nombre", "empresa", "plan", "valor_mensual", "renovacion", "etapa", "documento", "asesor", "correo", "telefono", "enlace"],
};

/** Opciones de las condiciones con lista. */
export const CONDITION_OPTIONS: Partial<Record<ConditionKey, string[]>> = {
  tiers: ["green", "yellow", "red"],
  statuses: ["new", "contacted", "meeting", "proposal", "won", "lost"],
  priorities: ["critical", "high", "medium", "low", "urgent"],
  channels: ["web", "whatsapp", "messenger", "instagram", "meet", "call", "in_person"],
  sources: ["web", "chat", "whatsapp", "referral", "ads", "import", "manual", "campaign"],
  stages: ["onboarding", "active", "at_risk", "paused", "churned", "prospecting", "proposal", "negotiation", "won", "lost"],
  kinds: ["client", "provider"],
};

/** Entidad a la que se puede ir desde el historial. */
export const ENTITY_LINK: Record<RuleEntity, (id: string) => string> = {
  lead: (id) => `crm/${id}`,
  appointment: () => "agenda",
  ticket: (id) => `soporte/${id}`,
  chat: (id) => `chat?c=${id}`,
  task: (id) => `tareas?t=${id}`,
  deal: () => "crm",
  account: (id) => `clientes/${id}`,
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
  groups: { sales: "Ventas", meetings: "Reuniones", service: "Soporte", chat: "Chat", tasks: "Tareas", deals: "Negocios", accounts: "Clientes" } as Record<RuleGroup, string>,
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
    lead_lost: { label: "Se pierde una venta", desc: "Un lead pasa a «Perdido»." },
    lead_status_changed: { label: "Cambia la etapa del lead", desc: "Cualquier cambio de etapa (filtra la nueva etapa en «Solo si…»)." },
    lead_assigned: { label: "Se asigna un lead", desc: "Un lead recibe responsable o cambia de asesor." },
    lead_no_meeting: { label: "Lead sin reunión", desc: "Lleva X días sin reunión agendada (nuevo o contactado)." },
    lead_reengage: { label: "Recuperar lead perdido", desc: "Pasaron X días desde que se perdió la venta." },
    email_clicked: { label: "El lead hace clic en un correo", desc: "Abrió un enlace de un correo nuestro: señal de interés." },
    email_bounced: { label: "Rebota un correo", desc: "El correo del lead no existe o no recibe mensajes." },
    appointment_cancelled: { label: "Se cancela una reunión", desc: "La reunión pasa a «Cancelada»." },
    appointment_done: { label: "Se realiza una reunión", desc: "La reunión se marca como realizada." },
    appointment_no_show: { label: "El cliente no asiste", desc: "La reunión se marca como «No asistió»." },
    appointment_after: { label: "Después de una reunión", desc: "Pasaron X horas desde que terminó la reunión." },
    ticket_customer_reply: { label: "El cliente responde una solicitud", desc: "El cliente escribe en su solicitud." },
    ticket_resolved: { label: "Se resuelve una solicitud", desc: "La solicitud pasa a «Resuelta»." },
    ticket_reopened: { label: "Se reabre una solicitud", desc: "Una solicitud resuelta o cerrada vuelve a abrirse." },
    ticket_rated: { label: "El cliente califica la atención", desc: "Llega una respuesta de la encuesta de satisfacción." },
    ticket_sla_breached: { label: "Solicitud fuera de tiempo (SLA)", desc: "Se venció el plazo de primera respuesta o de resolución." },
    ticket_waiting_customer: { label: "Esperando al cliente", desc: "La solicitud lleva X días esperando respuesta del cliente." },
    ticket_assigned: { label: "Se asigna una solicitud", desc: "La solicitud recibe responsable o cambia de responsable." },
    chat_closed: { label: "Se cierra un chat", desc: "La conversación pasa a cerrada." },
    chat_rated: { label: "El visitante califica el chat", desc: "Llega una calificación del chat." },
    task_completed: { label: "Se completa una tarea", desc: "Una tarea se marca como hecha." },
    task_overdue: { label: "Tarea vencida", desc: "Pasaron X minutos desde el vencimiento y sigue pendiente." },
    deal_created: { label: "Se crea un negocio", desc: "Un negocio nuevo en el CRM." },
    deal_stage_changed: { label: "Cambia la etapa de un negocio", desc: "Prospección, propuesta, negociación, ganado o perdido." },
    deal_close_overdue: { label: "Negocio con cierre vencido", desc: "La fecha esperada de cierre pasó hace X días." },
    account_created: { label: "Se crea una cuenta de cliente", desc: "Un cliente o proveedor recibe acceso al portal." },
    account_renewal: { label: "Se acerca una renovación", desc: "Faltan X días para la fecha de renovación de la cuenta." },
    account_inactive: { label: "Cliente inactivo", desc: "El cliente lleva X días sin entrar al portal." },
    document_uploaded: { label: "Se sube un documento", desc: "Aparece un documento nuevo en la cuenta." },
  } as Record<TriggerKey, { label: string; desc: string }>,
  conditions: {
    title: "Solo si…",
    hint: "Opcional. Sin condiciones, la regla aplica a todos.",
    tiers: "Color del lead",
    statuses: "Etapa del CRM",
    problems: "Necesidad",
    priorities: "Prioridad",
    channels: "Canal",
    sources: "Fuente",
    categories: "Tema",
    stages: "Etapa",
    kinds: "Tipo de cuenta",
    tags_any: "Con alguna etiqueta",
    min_score: "Puntaje mínimo",
    min_value: "Valor mínimo (COP)",
    max_rating: "Calificación máxima",
    owner: "Responsable",
    business_hours: "Solo en horario laboral",
    outside_hours: "Solo fuera de horario",
    hoursHint: "Lunes a viernes, 8:00 a. m. a 6:00 p. m. (Bogotá).",
    ownerOptions: { assigned: "Con responsable", unassigned: "Sin responsable" } as Record<string, string>,
    channelNames: { web: "Chat del sitio", whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram", meet: "Videollamada", call: "Llamada", in_person: "Presencial" } as Record<string, string>,
    priorityNames: { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja", urgent: "Urgente" } as Record<string, string>,
    tierNames: { green: "Verde", yellow: "Amarillo", red: "Rojo" } as Record<string, string>,
    statusNames: { new: "Nuevo", contacted: "Contactado", meeting: "Reunión", proposal: "Propuesta", won: "Ganado", lost: "Perdido" } as Record<string, string>,
    sourceNames: { web: "Sitio web", chat: "Chat", whatsapp: "WhatsApp", referral: "Referido", ads: "Anuncios", import: "Importado", manual: "Manual", campaign: "Campaña" } as Record<string, string>,
    stageNames: {
      onboarding: "Incorporación", active: "Activo", at_risk: "En riesgo", paused: "En pausa", churned: "Perdido",
      prospecting: "Prospección", proposal: "Propuesta", negotiation: "Negociación", won: "Ganado", lost: "Perdido",
    } as Record<string, string>,
    kindNames: { client: "Cliente", provider: "Proveedor" } as Record<string, string>,
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
      tag: { label: "Agregar etiqueta", desc: "Etiqueta la solicitud, el chat, la tarea o la cuenta." },
      stage: { label: "Cambiar etapa", desc: "Etapa de la cuenta del cliente o del negocio." },
      priority: { label: "Cambiar prioridad", desc: "De la solicitud o de la tarea." },
      note: { label: "Agregar nota", desc: "Nota interna en el lead, la solicitud o la cuenta." },
      followup: { label: "Secuencia de seguimiento", desc: "Inscribe al lead en la secuencia de correos o lo saca." },
      deal: { label: "Crear negocio", desc: "Abre un negocio en el CRM para el lead (si no tiene uno abierto)." },
      webhook: { label: "Enviar a otra app (webhook)", desc: "Envía los datos a Zapier, Make, n8n o tu sistema (HTTPS)." },
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
    toOwnerEmail: "El correo del responsable",
    toUserEmail: "El correo de una persona",
    force: "Reasignar aunque ya tenga responsable",
    priority: "Prioridad",
    taskType: "Tipo de tarea",
    taskTypes: { call: "Llamada", email: "Correo", whatsapp: "WhatsApp", meeting: "Reunión", follow_up: "Seguimiento", other: "Otra" } as Record<string, string>,
    taskBody: "Detalle (opcional)",
    stage: "Nueva etapa",
    noteBody: "Nota",
    followupMode: "Qué hacer",
    followupModes: { enroll: "Inscribir en la secuencia", stop: "Sacar de la secuencia" } as Record<string, string>,
    dealTitle: "Nombre del negocio",
    dealValue: "Valor (COP, opcional)",
    dealClose: "Cierre esperado en (días)",
    webhookUrl: "URL (https://…)",
    webhookHint: "Enviamos un POST con JSON: regla, disparador y los datos del elemento.",
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
    errors: { name: "Ponle un nombre.", actions: "Agrega al menos una acción.", generic: "No se pudo guardar.", webhook: "La URL del webhook debe empezar por https://." },
    delay: "Esperar antes de actuar",
    delayHint: "Las acciones se ejecutan después de este tiempo (y solo si aún cumple las condiciones).",
    delayOptions: { "0": "No esperar", "15": "15 minutos", "60": "1 hora", "120": "2 horas", "240": "4 horas", "1440": "1 día", "2880": "2 días", "4320": "3 días", "10080": "1 semana" } as Record<string, string>,
    maxPerDay: "Máximo de ejecuciones por día",
    maxPerDayHint: "Vacío = sin límite.",
    folder: "Carpeta",
    preview: "Probar con un elemento real",
    previewHint: "Elige un elemento: te mostramos si cumple y cómo quedan los textos. No se envía nada.",
    previewMatch: "Cumple las condiciones",
    previewNoMatch: "No cumple las condiciones",
    runOn: "Ejecutar ahora sobre este elemento",
    runOnConfirm: "Se ejecutarán las acciones de verdad (correos, tareas, avisos). ¿Continuar?",
    ran: "Ejecutada",
    notRan: "No se ejecutó (no cumple o llegó al límite del día)",
  },
  history: {
    empty: "Todavía no se ha ejecutado ninguna automatización.",
    cols: { when: "Fecha", rule: "Automatización", item: "Elemento", result: "Resultado" },
    done: "Hecho",
    failed: "Error",
    entities: { lead: "Lead", appointment: "Reunión", ticket: "Solicitud", chat: "Chat" } as Record<string, string>,
  },
};
