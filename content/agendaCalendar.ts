import type { Locale } from "@/i18n/config";

/** Textos del calendario de la agenda (día, semana y mes). */
const es = {
  modes: { day: "Día", week: "Semana", month: "Mes" },
  today: "Hoy",
  prev: "Anterior",
  next: "Siguiente",
  view: "Vista del calendario",
  more: "+{n} más",
  createAt: "Agendar el {when}",
  blocked: "Bloqueado",
  unavailable: "Fuera del horario de atención",
  now: "Ahora",
  dragHint: "Arrastra una reunión para reprogramarla · clic en un hueco para agendar",
  moved: "Reunión movida al {when}.",
  event: "{name}, {when}, {status}",
  noLead: "Reunión",
  empty: "Sin reuniones",
};

export type AgendaCalendarCopy = typeof es;

const en: AgendaCalendarCopy = {
  modes: { day: "Day", week: "Week", month: "Month" },
  today: "Today",
  prev: "Previous",
  next: "Next",
  view: "Calendar view",
  more: "+{n} more",
  createAt: "Schedule on {when}",
  blocked: "Blocked",
  unavailable: "Outside business hours",
  now: "Now",
  dragHint: "Drag a meeting to reschedule · click a free slot to schedule",
  moved: "Meeting moved to {when}.",
  event: "{name}, {when}, {status}",
  noLead: "Meeting",
  empty: "No meetings",
};

export const agendaCalendarCopy: Record<Locale, AgendaCalendarCopy> = { es, en };
