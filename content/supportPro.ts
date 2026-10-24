import type { Locale } from "@/i18n/config";

/** Textos comunes de la mesa de ayuda (pestañas, SLA, etiquetas). */
const es = {
  title: "Soporte",
  nav: { inbox: "Bandeja", reports: "Reportes", macros: "Respuestas rápidas", settings: "Ajustes" },
  newTicket: "Nueva solicitud",
  sla: {
    first: "Primera respuesta",
    resolve: "Resolución",
    breached: "Vencida hace {t}",
    left: "Vence en {t}",
    met: "A tiempo",
    late: "Fuera de tiempo",
    none: "Sin SLA",
    paused: "En pausa (esperando al cliente)",
  },
  units: { m: "{n} min", h: "{n} h", d: "{n} d" },
  csat: { label: "Satisfacción", none: "Sin calificar", stars: "{n} de 5" },
  merged: "Unida a #{n}",
  sources: { web: "Web", portal: "Portal", chat: "Chat" } as Record<string, string>,
};

export type SupportProCopy = typeof es;

const en: SupportProCopy = {
  title: "Support",
  nav: { inbox: "Inbox", reports: "Reports", macros: "Canned replies", settings: "Settings" },
  newTicket: "New request",
  sla: {
    first: "First response",
    resolve: "Resolution",
    breached: "Overdue by {t}",
    left: "Due in {t}",
    met: "On time",
    late: "Late",
    none: "No SLA",
    paused: "Paused (waiting on customer)",
  },
  units: { m: "{n} min", h: "{n} h", d: "{n} d" },
  csat: { label: "Satisfaction", none: "Not rated", stars: "{n} of 5" },
  merged: "Merged into #{n}",
  sources: { web: "Web", portal: "Portal", chat: "Chat" },
};

export const supportProCopy: Record<Locale, SupportProCopy> = { es, en };
