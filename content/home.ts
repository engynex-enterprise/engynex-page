import type { Locale } from "@/i18n/config";

const es = {
  today: "Hoy es {date}",
  todo: "Pendientes",
  todoHint: "Lo que necesita atención ahora.",
  todoItems: {
    green: "Leads verdes sin contactar",
    chats: "Chats esperando respuesta",
    tickets: "Solicitudes abiertas",
    tasks: "Tus tareas para hoy o vencidas",
    meetings: "Reuniones de hoy",
  },
  allClear: "¡Todo al día! No hay pendientes urgentes.",
  kpis: "Últimos 30 días",
  kpiItems: { leads: "Leads", green: "Leads verdes", meetings: "Reuniones agendadas", won: "Ventas ganadas", value: "Valor ganado" },
  vsPrev: "vs. 30 días anteriores",
  funnel: "Embudo de ventas",
  funnelHint: "Leads por etapa del CRM.",
  activity: "Actividad reciente",
  noActivity: "Sin actividad todavía.",
  upcoming: "Próximas reuniones",
  noMeetings: "No hay reuniones agendadas.",
  seeAll: "Ver todo",
  table: "Ver como tabla",
  stage: "Etapa",
  count: "Leads",
  automations: "Automatizaciones activas",
  automationsHint: "{n} reglas trabajando por ti",
};

export type HomeCopy = typeof es;

const en: HomeCopy = {
  today: "Today is {date}",
  todo: "To-do",
  todoHint: "What needs attention now.",
  todoItems: {
    green: "Green leads not contacted",
    chats: "Chats waiting for a reply",
    tickets: "Open requests",
    tasks: "Your tasks due today or overdue",
    meetings: "Today's meetings",
  },
  allClear: "All caught up! Nothing urgent.",
  kpis: "Last 30 days",
  kpiItems: { leads: "Leads", green: "Green leads", meetings: "Meetings booked", won: "Deals won", value: "Value won" },
  vsPrev: "vs. previous 30 days",
  funnel: "Sales funnel",
  funnelHint: "Leads by CRM stage.",
  activity: "Recent activity",
  noActivity: "No activity yet.",
  upcoming: "Upcoming meetings",
  noMeetings: "No meetings scheduled.",
  seeAll: "See all",
  table: "Show as table",
  stage: "Stage",
  count: "Leads",
  automations: "Active automations",
  automationsHint: "{n} rules working for you",
};

export const homeCopy: Record<Locale, HomeCopy> = { es, en };
