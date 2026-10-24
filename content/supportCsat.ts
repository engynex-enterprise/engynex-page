import type { Locale } from "@/i18n/config";

/** Encuesta pública de satisfacción (enlace del correo al resolver). */
const es = {
  meta: "Califica la atención",
  title: "¿Cómo te atendimos?",
  hello: "Hola {name}, cuéntanos cómo fue la atención en tu solicitud #{number}: «{subject}».",
  question: "Tu calificación",
  options: ["Muy mala", "Mala", "Regular", "Buena", "Excelente"],
  comment: "¿Algo que quieras contarnos? (opcional)",
  commentPlaceholder: "Qué hicimos bien o qué podemos mejorar.",
  lowHint: "Lamentamos que no haya sido una buena experiencia. Cuéntanos qué pasó y lo revisamos.",
  submit: "Enviar calificación",
  required: "Elige una calificación.",
  error: "No pudimos guardarla. Intenta de nuevo.",
  thanks: "¡Gracias por tu calificación!",
  thanksText: "Nos ayuda a mejorar. Si algo sigue pendiente, responde en tu solicitud y la reabrimos.",
  already: "Ya calificaste esta solicitud",
  alreadyText: "Tu calificación fue de {n} de 5. Si quieres cambiarla, elige otra abajo.",
  bad: "El enlace no es válido",
  badText: "Puede que esté incompleto. Revisa el correo o escríbenos.",
  contact: "Contactarnos",
  home: "Ir al inicio",
};

export type SupportCsatCopy = typeof es;

const en: SupportCsatCopy = {
  meta: "Rate the service",
  title: "How did we do?",
  hello: "Hi {name}, tell us how the service was on your request #{number}: “{subject}”.",
  question: "Your rating",
  options: ["Very poor", "Poor", "Okay", "Good", "Excellent"],
  comment: "Anything you'd like to tell us? (optional)",
  commentPlaceholder: "What we did well or what we can improve.",
  lowHint: "We're sorry it wasn't a good experience. Tell us what happened and we'll look into it.",
  submit: "Send rating",
  required: "Choose a rating.",
  error: "We couldn't save it. Try again.",
  thanks: "Thanks for your rating!",
  thanksText: "It helps us improve. If something is still pending, reply on your request and we'll reopen it.",
  already: "You already rated this request",
  alreadyText: "Your rating was {n} out of 5. To change it, pick another one below.",
  bad: "The link isn't valid",
  badText: "It may be incomplete. Check the email or write to us.",
  contact: "Contact us",
  home: "Go home",
};

export const supportCsatCopy: Record<Locale, SupportCsatCopy> = { es, en };
