import type { Locale } from "@/i18n/config";

/** Vista del cliente: sus solicitudes. */
const es = {
  kpis: { active: "En curso", waiting: "Esperan tu respuesta", done: "Resueltas", csat: "Tu calificación promedio" },
  tabs: { active: "En curso", waiting: "Esperan tu respuesta", done: "Resueltas" },
  search: "Buscar por número o asunto",
  empty: {
    active: "No tienes solicitudes en curso.",
    waiting: "Nada pendiente de tu parte.",
    done: "Aún no hay solicitudes resueltas.",
  },
  updated: "Última actividad: {date}",
  rate: "Calificar",
  ratedAria: "Calificaste con {n} de 5",
  hint: "Te avisamos por correo cada vez que respondemos. Si una solicitud resuelta vuelve a fallar, escribe en ella y la reabrimos.",
};

export type SupportClientCopy = typeof es;

const en: SupportClientCopy = {
  kpis: { active: "In progress", waiting: "Waiting for you", done: "Resolved", csat: "Your average rating" },
  tabs: { active: "In progress", waiting: "Waiting for you", done: "Resolved" },
  search: "Search by number or subject",
  empty: {
    active: "You have no requests in progress.",
    waiting: "Nothing pending on your side.",
    done: "No resolved requests yet.",
  },
  updated: "Last activity: {date}",
  rate: "Rate",
  ratedAria: "You rated it {n} out of 5",
  hint: "We email you every time we reply. If a resolved request breaks again, write in it and we'll reopen it.",
};

export const supportClientCopy: Record<Locale, SupportClientCopy> = { es, en };
