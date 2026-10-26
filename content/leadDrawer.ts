import type { Locale } from "@/i18n/config";

/** Textos de las pestañas del drawer "Perfil del cliente" del CRM. */
const es = {
  tabs: {
    answers: "Respuestas",
    activity: "Historial",
    notes: "Notas",
    tasks: "Tareas",
    meetings: "Citas",
    chat: "Chat",
    emails: "Correos",
    deals: "Negocios",
    docs: "Documentos",
    ai: "IA",
    journey: "Recorrido",
    origin: "Origen",
  },
  tabsLabel: "Secciones del lead",
  loading: "Cargando…",
  service: "Servicio",
  chat: {
    empty: "Este lead no tiene conversaciones de chat ni de WhatsApp.",
    open: "Abrir en el chat",
    channels: { web: "Chat web", whatsapp: "WhatsApp" } as Record<string, string>,
    statuses: { open: "Abierta", pending: "Pendiente", closed: "Cerrada" } as Record<string, string>,
    messagesEmpty: "Sin mensajes.",
    internal: "Nota interna",
    visitor: "Cliente",
    agent: "Equipo",
    bot: "Asistente",
    system: "Sistema",
    campaigns: "Mensajes de campañas de WhatsApp",
    waStatuses: { queued: "En cola", sending: "Enviando", sent: "Enviado", delivered: "Entregado", read: "Leído", failed: "Falló" } as Record<string, string>,
    replied: "Respondió",
  },
  emails: {
    empty: "No hay correos para este lead.",
    open: "Ver en Seguimiento",
    opened: "Abierto",
    clicked: "Clic",
    bounced: "Rebotó",
  },
  meetings: { empty: "Sin citas agendadas.", join: "Unirse" },
  origin: { title: "Origen" },
};

type LeadDrawerCopy = typeof es;

const en: LeadDrawerCopy = {
  tabs: {
    answers: "Answers",
    activity: "History",
    notes: "Notes",
    tasks: "Tasks",
    meetings: "Meetings",
    chat: "Chat",
    emails: "Emails",
    deals: "Deals",
    docs: "Documents",
    ai: "AI",
    journey: "Journey",
    origin: "Origin",
  },
  tabsLabel: "Lead sections",
  loading: "Loading…",
  service: "Service",
  chat: {
    empty: "This lead has no chat or WhatsApp conversations.",
    open: "Open in chat",
    channels: { web: "Web chat", whatsapp: "WhatsApp" },
    statuses: { open: "Open", pending: "Pending", closed: "Closed" },
    messagesEmpty: "No messages.",
    internal: "Internal note",
    visitor: "Customer",
    agent: "Team",
    bot: "Assistant",
    system: "System",
    campaigns: "WhatsApp campaign messages",
    waStatuses: { queued: "Queued", sending: "Sending", sent: "Sent", delivered: "Delivered", read: "Read", failed: "Failed" },
    replied: "Replied",
  },
  emails: {
    empty: "No emails for this lead.",
    open: "View in Follow-ups",
    opened: "Opened",
    clicked: "Clicked",
    bounced: "Bounced",
  },
  meetings: { empty: "No meetings scheduled.", join: "Join" },
  origin: { title: "Origin" },
};

export const leadDrawerCopy: Record<Locale, LeadDrawerCopy> = { es, en };
