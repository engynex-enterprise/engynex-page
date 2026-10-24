import type { Locale } from "@/i18n/config";

/** Reportes de la mesa de ayuda. */
const es = {
  periods: { "7": "Últimos 7 días", "30": "Últimos 30 días", "90": "Últimos 90 días" } as Record<string, string>,
  period: "Periodo",
  vsPrev: "vs. periodo anterior",
  kpis: {
    created: "Solicitudes recibidas",
    resolved: "Resueltas",
    firstResponse: "1.ª respuesta (mediana)",
    resolution: "Resolución (mediana)",
    slaMet: "SLA cumplido",
    csat: "Satisfacción",
  },
  hints: { ratings: "{n} calificaciones", noRatings: "Sin calificaciones", slaHint: "Respuesta y resolución a tiempo", prev: "Antes: {v}" },
  daily: "Recibidas vs. resueltas por día",
  dailyHint: "Si las recibidas superan a las resueltas varios días, la bandeja crece.",
  created: "Recibidas",
  resolvedSeries: "Resueltas",
  day: "Día",
  table: "Ver como tabla",
  chart: "Ver gráfica",
  byCategory: "Por tema",
  byPriority: "Por prioridad",
  requests: "Solicitudes",
  agents: "Equipo",
  agentsHint: "Carga actual y desempeño en el periodo.",
  agentCols: { name: "Persona", open: "Abiertas", resolved: "Resueltas", firstResponse: "1.ª respuesta", csat: "Satisfacción" },
  noData: "Sin datos en este periodo.",
};

export type SupportReportsCopy = typeof es;

const en: SupportReportsCopy = {
  periods: { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" },
  period: "Period",
  vsPrev: "vs. previous period",
  kpis: {
    created: "Requests received",
    resolved: "Resolved",
    firstResponse: "First response (median)",
    resolution: "Resolution (median)",
    slaMet: "SLA met",
    csat: "Satisfaction",
  },
  hints: { ratings: "{n} ratings", noRatings: "No ratings", slaHint: "Response and resolution on time", prev: "Before: {v}" },
  daily: "Received vs. resolved per day",
  dailyHint: "If received outpaces resolved for several days, the backlog grows.",
  created: "Received",
  resolvedSeries: "Resolved",
  day: "Day",
  table: "View as table",
  chart: "View chart",
  byCategory: "By topic",
  byPriority: "By priority",
  requests: "Requests",
  agents: "Team",
  agentsHint: "Current load and performance in the period.",
  agentCols: { name: "Person", open: "Open", resolved: "Resolved", firstResponse: "First response", csat: "Satisfaction" },
  noData: "No data in this period.",
};

export const supportReportsCopy: Record<Locale, SupportReportsCopy> = { es, en };
