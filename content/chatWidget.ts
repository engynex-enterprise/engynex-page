import type { Locale } from "@/i18n/config";

/** Textos nuevos del widget del chat (los de siempre están en content/liveChat). */
const es = {
  system: {
    auto_closed: "La conversación se cerró por inactividad. Si escribes de nuevo, la reabrimos.",
  } as Record<string, string>,
  errors: {
    disabled: "El chat no está disponible en este momento. Escríbenos por WhatsApp o correo.",
    invalid: "Revisa los datos: falta algún campo obligatorio.",
    emailRequired: "Escribe tu correo.",
    phoneRequired: "Escribe tu celular.",
  },
  phoneOptional: "Celular (opcional)",
  phoneRequired: "Celular",
  emailOptional: "Correo (opcional)",
  contactEmail: "Déjanos tu correo para poder responderte si te desconectas.",
  contactPhone: "Déjanos tu celular para poder responderte si te desconectas.",
  agentsHere: "Asesores en línea: {names}",
  attach: "Adjuntar archivo",
  aiBot: "Asistente con IA",
  quickReplies: "Respuestas rápidas",
};

export type ChatWidgetCopy = typeof es;

const en: ChatWidgetCopy = {
  system: {
    auto_closed: "The conversation was closed due to inactivity. Write again and we'll reopen it.",
  },
  errors: {
    disabled: "Chat isn't available right now. Reach us on WhatsApp or by email.",
    invalid: "Please check your details: a required field is missing.",
    emailRequired: "Enter your email.",
    phoneRequired: "Enter your mobile number.",
  },
  phoneOptional: "Mobile (optional)",
  phoneRequired: "Mobile",
  emailOptional: "Email (optional)",
  contactEmail: "Leave your email so we can reply if you disconnect.",
  contactPhone: "Leave your mobile number so we can reply if you disconnect.",
  agentsHere: "Advisors online: {names}",
  attach: "Attach file",
  aiBot: "AI assistant",
  quickReplies: "Quick replies",
};

export const chatWidgetCopy: Record<Locale, ChatWidgetCopy> = { es, en };
