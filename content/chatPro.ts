import type { Locale } from "@/i18n/config";

/** Textos comunes del módulo de chat (pestañas y adjuntos). */
const es = {
  nav: {
    inbox: "Bandeja",
    visitors: "Visitantes en vivo",
    team: "Equipo",
    reports: "Reportes",
    replies: "Respuestas guardadas",
    settings: "Ajustes",
  },
  attach: {
    button: "Adjuntar archivo",
    uploading: "Subiendo…",
    errors: {
      too_big: "El archivo pesa más de 10 MB.",
      type: "Tipo de archivo no permitido (imágenes, PDF, Office, texto o ZIP).",
      upload: "No se pudo subir el archivo.",
    } as Record<string, string>,
  },
  channels: { web: "Sitio web", whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" } as Record<string, string>,
  bot: "Asistente",
};

export type ChatProCopy = typeof es;

const en: ChatProCopy = {
  nav: {
    inbox: "Inbox",
    visitors: "Live visitors",
    team: "Team",
    reports: "Reports",
    replies: "Saved replies",
    settings: "Settings",
  },
  attach: {
    button: "Attach file",
    uploading: "Uploading…",
    errors: {
      too_big: "The file is larger than 10 MB.",
      type: "File type not allowed (images, PDF, Office, text or ZIP).",
      upload: "The file couldn't be uploaded.",
    },
  },
  channels: { web: "Website", whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" },
  bot: "Assistant",
};

export const chatProCopy: Record<Locale, ChatProCopy> = { es, en };
