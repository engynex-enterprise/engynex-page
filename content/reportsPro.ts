import type { Locale } from "@/i18n/config";

/** Textos comunes de los reportes (pestañas y periodos). */
const es = {
  title: "Reportes",
  nav: { panel: "Panel", team: "Equipo", trends: "Tendencias", saved: "Informes guardados" },
  periods: {
    this_week: "Esta semana",
    last_week: "Semana pasada",
    this_month: "Este mes",
    last_month: "Mes pasado",
    this_quarter: "Este trimestre",
    last_90: "Últimos 90 días",
    this_year: "Este año",
    custom: "Personalizado",
  } as Record<string, string>,
  from: "Desde",
  to: "Hasta",
  apply: "Aplicar",
  vsPrev: "vs. periodo anterior",
  print: "Descargar PDF",
  csv: "Exportar CSV",
};

export type ReportsProCopy = typeof es;

const en: ReportsProCopy = {
  title: "Reports",
  nav: { panel: "Dashboard", team: "Team", trends: "Trends", saved: "Saved reports" },
  periods: {
    this_week: "This week",
    last_week: "Last week",
    this_month: "This month",
    last_month: "Last month",
    this_quarter: "This quarter",
    last_90: "Last 90 days",
    this_year: "This year",
    custom: "Custom",
  },
  from: "From",
  to: "To",
  apply: "Apply",
  vsPrev: "vs. previous period",
  print: "Download PDF",
  csv: "Export CSV",
};

export const reportsProCopy: Record<Locale, ReportsProCopy> = { es, en };
