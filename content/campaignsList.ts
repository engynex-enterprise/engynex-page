import type { Locale } from "@/i18n/config";

/** Textos de la página principal de campañas (métricas, lista y segmentos). */
const es = {
  kpis: {
    campaigns: "Campañas enviadas (30 días)",
    reachable: "Contactables",
    reachableHint: "WhatsApp {wa} · correo {email}",
    waRead: "WhatsApp: leídos",
    waHint: "respondieron {pct}",
    emailOpen: "Correo: apertura",
    emailHint: "clics {pct}",
    unsubscribed: "Bajas (30 días)",
  },
  notices: {
    whatsapp: "WhatsApp Business aún no está conectado: puedes preparar campañas, pero no enviarlas.",
    email: "El correo (Resend) no está configurado: las campañas por correo quedan en cola hasta configurarlo.",
    go: "Ir a Integraciones",
  },
  tabs: { all: "Todas", draft: "Borradores", scheduled: "Programadas", active: "En curso", sent: "Enviadas", cancelled: "Canceladas" },
  search: "Buscar campaña",
  channelAll: "Todos",
  cols: { campaign: "Campaña", when: "Fecha", recipients: "Destinatarios", delivered: "Entregados", opened: "Leídos / abiertos", engaged: "Respuestas / clics", status: "Estado" },
  menu: { more: "Más acciones", open: "Abrir", duplicate: "Duplicar" },
  progress: "{done} de {total}",
  inTime: "en {t}",
  agoTime: "hace {t}",
  empty: {
    all: "Aún no hay campañas. Crea la primera para escribirles a tus leads por WhatsApp o correo.",
    draft: "No hay borradores.",
    scheduled: "No hay campañas programadas.",
    active: "No hay campañas enviándose ahora.",
    sent: "Aún no has enviado campañas.",
    cancelled: "No hay campañas canceladas.",
  },
  noResults: "Ninguna campaña coincide con la búsqueda.",
  duplicateError: "No se pudo duplicar: {detail}",
  segments: {
    intro: "Segmentos guardados de audiencia. Se crean desde el editor de campañas con «Guardar segmento» y se reutilizan en cualquier campaña.",
    empty: "Aún no hay segmentos guardados.",
    cols: { name: "Segmento", filters: "Filtros", wa: "WhatsApp", email: "Correo", created: "Creado" },
    all: "Todos los leads",
    days: "creados en los últimos {n} días",
    exclude: "sin campañas en {n} días",
    owners: "Responsable: {names}",
    delete: "Eliminar",
    confirm: "¿Eliminar el segmento «{name}»? Las campañas que lo usaron no cambian.",
  },
  newDialog: { cancel: "Cancelar" },
};

export type CampaignsListCopy = typeof es;

const en: CampaignsListCopy = {
  kpis: {
    campaigns: "Campaigns sent (30 days)",
    reachable: "Reachable",
    reachableHint: "WhatsApp {wa} · email {email}",
    waRead: "WhatsApp: read",
    waHint: "replied {pct}",
    emailOpen: "Email: open rate",
    emailHint: "clicks {pct}",
    unsubscribed: "Unsubscribes (30 days)",
  },
  notices: {
    whatsapp: "WhatsApp Business isn't connected yet: you can prepare campaigns but not send them.",
    email: "Email (Resend) isn't set up: email campaigns stay queued until it is.",
    go: "Go to Integrations",
  },
  tabs: { all: "All", draft: "Drafts", scheduled: "Scheduled", active: "In progress", sent: "Sent", cancelled: "Cancelled" },
  search: "Search campaign",
  channelAll: "All",
  cols: { campaign: "Campaign", when: "Date", recipients: "Recipients", delivered: "Delivered", opened: "Read / opened", engaged: "Replies / clicks", status: "Status" },
  menu: { more: "More actions", open: "Open", duplicate: "Duplicate" },
  progress: "{done} of {total}",
  inTime: "in {t}",
  agoTime: "{t} ago",
  empty: {
    all: "No campaigns yet. Create the first one to reach your leads by WhatsApp or email.",
    draft: "No drafts.",
    scheduled: "No scheduled campaigns.",
    active: "No campaigns sending right now.",
    sent: "You haven't sent campaigns yet.",
    cancelled: "No cancelled campaigns.",
  },
  noResults: "No campaign matches the search.",
  duplicateError: "Couldn't duplicate: {detail}",
  segments: {
    intro: "Saved audience segments. Create them from the campaign editor with “Save segment” and reuse them in any campaign.",
    empty: "No saved segments yet.",
    cols: { name: "Segment", filters: "Filters", wa: "WhatsApp", email: "Email", created: "Created" },
    all: "All leads",
    days: "created in the last {n} days",
    exclude: "no campaigns in {n} days",
    owners: "Owner: {names}",
    delete: "Delete",
    confirm: "Delete the segment “{name}”? Campaigns that used it don't change.",
  },
  newDialog: { cancel: "Cancel" },
};

export const campaignsListCopy: Record<Locale, CampaignsListCopy> = { es, en };
