import type { Locale } from "@/i18n/config";

/** Textos de los reportes del seguimiento por correo. */
const es = {
  range: "Periodo",
  ranges: { "7": "7 días", "30": "30 días", "90": "90 días" },
  vsPrev: "frente a los {n} días anteriores",
  kpis: {
    sent: "Enviados",
    openRate: "Tasa de apertura",
    clickRate: "Tasa de clics",
    bounced: "Rebotes",
    unsubscribed: "Bajas",
    queued: "En cola",
  },
  openedN: "{n} abiertos",
  clickedN: "{n} con clic",
  bouncedPct: "{pct} de los enviados",
  failedN: "{n} fallidos en el periodo",
  noTracking: {
    title: "Faltan las métricas de apertura y clics",
    body: "Los correos salen, pero Resend aún no nos avisa cuándo se entregan, se abren o hacen clic. Configura el webhook de Resend y activa Open/Click tracking en tu dominio.",
    cta: "Ir a Integraciones",
  },
  byDay: "Correos enviados por día",
  byDayHint: "Según el tipo de correo",
  series: { sequence: "Secuencia", automation: "Automáticos y confirmaciones", internal: "Avisos internos" },
  funnel: "Embudo de la secuencia",
  funnelHint: "Leads que entraron a la secuencia en el periodo y hasta dónde llegaron",
  funnelRows: {
    enrolled: "Inscritos",
    step: "Correo {n}",
    advanced: "Avanzaron",
    booked: "Agendaron",
  },
  unsubscribedNote: "{n} se dieron de baja durante la secuencia.",
  leadsLabel: "Leads",
  performance: "Rendimiento por correo",
  performanceHint: "Enviados en el periodo y cómo respondieron",
  cols: { kind: "Correo", sent: "Enviados", delivered: "Entregados", opened: "Apertura", clicked: "Clics", bounced: "Rebotes" },
  extraKinds: {
    followup_4: "Seguimiento 4",
    followup_5: "Seguimiento 5",
    manual: "Correo escrito a mano",
  } as Record<string, string>,
  drafts: "Recuperación de formularios",
  draftsHint: "Formularios sin terminar y cuántos volvieron tras el recordatorio",
  draftsRows: { drafts: "Sin terminar", reminded: "Recordados", recovered: "Recuperados" },
  recovery: "{pct} recuperados",
  noData: "Aún no hay datos en este periodo.",
  emptyTitle: "Todavía no se han enviado correos",
  emptyBody: "Cuando la secuencia o las automatizaciones envíen correos, aquí verás cuántos se abren, cuántos hacen clic y cuántos leads terminan agendando.",
  table: "Ver como tabla",
  hideTable: "Ocultar tabla",
  day: "Día",
};

export type FollowupReportsCopy = typeof es;

const en: FollowupReportsCopy = {
  range: "Period",
  ranges: { "7": "7 days", "30": "30 days", "90": "90 days" },
  vsPrev: "vs. the previous {n} days",
  kpis: {
    sent: "Sent",
    openRate: "Open rate",
    clickRate: "Click rate",
    bounced: "Bounces",
    unsubscribed: "Unsubscribes",
    queued: "Queued",
  },
  openedN: "{n} opened",
  clickedN: "{n} clicked",
  bouncedPct: "{pct} of sent",
  failedN: "{n} failed in the period",
  noTracking: {
    title: "Open and click metrics are missing",
    body: "Emails go out, but Resend isn't telling us yet when they're delivered, opened or clicked. Set up the Resend webhook and enable Open/Click tracking on your domain.",
    cta: "Go to Integrations",
  },
  byDay: "Emails sent per day",
  byDayHint: "By email type",
  series: { sequence: "Sequence", automation: "Automations and confirmations", internal: "Internal alerts" },
  funnel: "Sequence funnel",
  funnelHint: "Leads that entered the sequence in the period and how far they got",
  funnelRows: {
    enrolled: "Enrolled",
    step: "Email {n}",
    advanced: "Advanced",
    booked: "Booked",
  },
  unsubscribedNote: "{n} unsubscribed during the sequence.",
  leadsLabel: "Leads",
  performance: "Performance by email",
  performanceHint: "Sent in the period and how people responded",
  cols: { kind: "Email", sent: "Sent", delivered: "Delivered", opened: "Opens", clicked: "Clicks", bounced: "Bounces" },
  extraKinds: {
    followup_4: "Follow-up 4",
    followup_5: "Follow-up 5",
    manual: "Hand-written email",
  },
  drafts: "Form recovery",
  draftsHint: "Unfinished forms and how many came back after the reminder",
  draftsRows: { drafts: "Unfinished", reminded: "Reminded", recovered: "Recovered" },
  recovery: "{pct} recovered",
  noData: "No data in this period yet.",
  emptyTitle: "No emails have been sent yet",
  emptyBody: "Once the sequence or automations send emails, you'll see how many get opened, clicked and how many leads end up booking.",
  table: "View as table",
  hideTable: "Hide table",
  day: "Day",
};

export const followupReportsCopy: Record<Locale, FollowupReportsCopy> = { es, en };

/** Porcentaje legible ("—" si no hay base). */
export const pct = (n: number, base: number) => (base > 0 ? `${Math.round((n / base) * 1000) / 10}%` : "—");
