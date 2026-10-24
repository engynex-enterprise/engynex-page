import type { Locale } from "@/i18n/config";

/** Textos comunes del módulo de campañas (pestañas, canales, métricas). */
const es = {
  nav: { campaigns: "Campañas", templates: "Plantillas de WhatsApp", segments: "Segmentos" },
  channels: { whatsapp: "WhatsApp", email: "Correo" },
  metrics: {
    recipients: "Destinatarios",
    sent: "Enviados",
    delivered: "Entregados",
    read: "Leídos",
    opened: "Abiertos",
    replied: "Respondieron",
    clicked: "Clics",
    failed: "Fallidos",
    pending: "Pendientes",
    unsubscribed: "Bajas",
  },
  newCampaign: "Nueva campaña",
  chooseChannel: "¿Por dónde quieres enviarla?",
  channelHints: {
    whatsapp: "Plantillas aprobadas por Meta, a quienes aceptaron WhatsApp.",
    email: "Correo con el diseño de Engynex y enlace de baja, a quienes no se han dado de baja.",
  },
};

export type CampaignsProCopy = typeof es;

const en: CampaignsProCopy = {
  nav: { campaigns: "Campaigns", templates: "WhatsApp templates", segments: "Segments" },
  channels: { whatsapp: "WhatsApp", email: "Email" },
  metrics: {
    recipients: "Recipients",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    opened: "Opened",
    replied: "Replied",
    clicked: "Clicks",
    failed: "Failed",
    pending: "Pending",
    unsubscribed: "Unsubscribes",
  },
  newCampaign: "New campaign",
  chooseChannel: "Which channel?",
  channelHints: {
    whatsapp: "Meta-approved templates, to people who accepted WhatsApp.",
    email: "Email with the Engynex design and unsubscribe link, to people who haven't unsubscribed.",
  },
};

export const campaignsProCopy: Record<Locale, CampaignsProCopy> = { es, en };
