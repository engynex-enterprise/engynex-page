import type { Locale } from "@/i18n/config";

/** Textos comunes de la analítica (pestañas, rangos, canales y eventos). */
const es = {
  title: "Analítica",
  nav: { overview: "Resumen", acquisition: "Adquisición", behavior: "Comportamiento", conversions: "Conversiones", live: "En vivo", visitors: "Visitantes" },
  ranges: { "7": "7 días", "30": "30 días", "90": "90 días", "365": "12 meses" } as Record<string, string>,
  vsPrev: "vs. periodo anterior",
  live: "{n} en el sitio ahora",
  consentNote: "Solo se mide a quienes aceptan cookies de analítica; no se guarda la IP.",
  channels: {
    direct: "Directo",
    organic: "Búsqueda orgánica",
    paid: "Publicidad pagada",
    social: "Redes sociales",
    email: "Correo",
    referral: "Otros sitios",
    campaign: "Campañas (UTM)",
  } as Record<string, string>,
  events: {
    cta_click: "Clic en botón",
    whatsapp_click: "Clic a WhatsApp",
    phone_click: "Clic para llamar",
    email_click: "Clic a correo",
    outbound_click: "Enlace externo",
    file_download: "Descarga",
    form_start: "Inició el formulario",
    form_step: "Avanzó en el formulario",
    form_submit: "Envió el formulario",
    chat_start: "Inició chat",
    booking: "Agendó reunión",
  } as Record<string, string>,
  devices: { mobile: "Móvil", tablet: "Tableta", desktop: "Computador", unknown: "Desconocido" } as Record<string, string>,
};

export type AnalyticsProCopy = typeof es;

const en: AnalyticsProCopy = {
  title: "Analytics",
  nav: { overview: "Overview", acquisition: "Acquisition", behavior: "Behavior", conversions: "Conversions", live: "Live", visitors: "Visitors" },
  ranges: { "7": "7 days", "30": "30 days", "90": "90 days", "365": "12 months" },
  vsPrev: "vs. previous period",
  live: "{n} on the site now",
  consentNote: "Only visitors who accept analytics cookies are measured; IPs aren't stored.",
  channels: {
    direct: "Direct",
    organic: "Organic search",
    paid: "Paid ads",
    social: "Social",
    email: "Email",
    referral: "Other sites",
    campaign: "Campaigns (UTM)",
  },
  events: {
    cta_click: "Button click",
    whatsapp_click: "WhatsApp click",
    phone_click: "Call click",
    email_click: "Email click",
    outbound_click: "Outbound link",
    file_download: "Download",
    form_start: "Started the form",
    form_step: "Form step",
    form_submit: "Submitted the form",
    chat_start: "Started chat",
    booking: "Booked a meeting",
  },
  devices: { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" },
};

export const analyticsProCopy: Record<Locale, AnalyticsProCopy> = { es, en };
