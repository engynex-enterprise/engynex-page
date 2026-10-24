import type { Locale } from "@/i18n/config";

/**
 * Secuencia de seguimiento: ajustes (tabla followup_settings) y textos
 * predeterminados de los correos. Los textos guardados en el portal mandan;
 * si un campo queda vacío se usa el de aquí.
 *
 * Formato del cuerpo: párrafos separados por una línea en blanco.
 * Variables: {nombre}, {empresa}, {recursos} (lista de enlaces útiles según
 * lo que pidió; va sola en su párrafo), {portafolio} y {cotizar} (enlaces).
 */

export type EmailTexts = { subject: string; title: string; body: string; cta: string };
export type StepConfig = {
  enabled: boolean;
  delay_minutes: number;
  texts?: Partial<Record<Locale, Partial<EmailTexts>>>;
};
export type FollowupConfig = {
  tiers: ("green" | "yellow" | "red")[];
  steps: StepConfig[];
  window: { enabled: boolean; days: string[]; from: string; to: string };
  abandoned_delay_minutes: number;
  abandoned_texts?: Partial<Record<Locale, Partial<EmailTexts>>>;
};

export const MAX_STEPS = 5;
export const FOLLOWUP_VARIABLES = ["{nombre}", "{empresa}", "{recursos}", "{portafolio}", "{cotizar}"] as const;

export const defaultFollowupConfig: FollowupConfig = {
  tiers: ["yellow"],
  steps: [
    { enabled: true, delay_minutes: 10 },
    { enabled: true, delay_minutes: 4320 },
    { enabled: true, delay_minutes: 10080 },
  ],
  window: { enabled: false, days: ["1", "2", "3", "4", "5"], from: "08:00", to: "18:00" },
  abandoned_delay_minutes: 60,
};

/** Une lo guardado con los valores predeterminados (por si faltan claves). */
export function normalizeFollowupConfig(raw: unknown): FollowupConfig {
  const c = (raw ?? {}) as Partial<FollowupConfig>;
  return {
    tiers: Array.isArray(c.tiers) && c.tiers.length ? c.tiers : defaultFollowupConfig.tiers,
    steps: Array.isArray(c.steps) && c.steps.length ? c.steps.slice(0, MAX_STEPS) : defaultFollowupConfig.steps,
    window: { ...defaultFollowupConfig.window, ...(c.window ?? {}) },
    abandoned_delay_minutes: c.abandoned_delay_minutes ?? defaultFollowupConfig.abandoned_delay_minutes,
    abandoned_texts: c.abandoned_texts,
  };
}

export const defaultStepTexts: Record<Locale, EmailTexts[]> = {
  es: [
    {
      subject: "{nombre}, esto te puede servir para tu proyecto",
      title: "Hola, {nombre}",
      body: "Gracias por contarnos lo que necesitas. Mientras preparamos ideas para tu caso, te dejamos esto:\n\n{recursos}\n\nSi prefieres hablarlo de una vez, agenda 20 minutos con un asesor:",
      cta: "Agendar una llamada",
    },
    {
      subject: "¿Revisamos tu idea en 20 minutos?",
      title: "{nombre}, ¿lo vemos juntos?",
      body: "En una llamada corta te decimos qué haríamos, cuánto tomaría y en qué rango de inversión estaría. Sin compromiso.\n\nTambién puedes ver proyectos parecidos que ya hicimos en {portafolio}.",
      cta: "Elegir horario",
    },
    {
      subject: "¿Seguimos o lo dejamos para más adelante?",
      title: "{nombre}, una última pregunta",
      body: "No queremos llenarte el correo. ¿Tu proyecto sigue en pie? Responde este correo con un «sí» y te escribimos, o con un «más adelante» y te dejamos tranquilo.\n\nEste es el último correo de esta serie.",
      cta: "Agendar ahora",
    },
    {
      subject: "{nombre}, ¿te ayudamos con algo más?",
      title: "Seguimos atentos, {nombre}",
      body: "Si tu proyecto cambió o tienes nuevas dudas, cuéntanos respondiendo este correo. Con gusto lo revisamos contigo.",
      cta: "Hablar con un asesor",
    },
    {
      subject: "Un último saludo de Engynex",
      title: "Gracias, {nombre}",
      body: "No te escribiremos más sobre este tema. Cuando quieras retomarlo, aquí estaremos.",
      cta: "Escribirnos",
    },
  ],
  en: [
    {
      subject: "{nombre}, this may help with your project",
      title: "Hi {nombre}",
      body: "Thanks for telling us what you need. While we prepare ideas for your case, here's something useful:\n\n{recursos}\n\nIf you'd rather talk it through now, book 20 minutes with an advisor:",
      cta: "Book a call",
    },
    {
      subject: "Shall we review your idea in 20 minutes?",
      title: "{nombre}, shall we look at it together?",
      body: "In a short call we'll tell you what we'd do, how long it would take and the investment range. No commitment.\n\nYou can also see similar projects we've done in {portafolio}.",
      cta: "Pick a time",
    },
    {
      subject: "Keep going or leave it for later?",
      title: "{nombre}, one last question",
      body: "We don't want to flood your inbox. Is your project still on? Reply \"yes\" and we'll reach out, or \"later\" and we'll leave you be.\n\nThis is the last email in this series.",
      cta: "Book now",
    },
    {
      subject: "{nombre}, can we help with anything else?",
      title: "Still here for you, {nombre}",
      body: "If your project changed or you have new questions, just reply to this email. We'll gladly review it with you.",
      cta: "Talk to an advisor",
    },
    {
      subject: "A last hello from Engynex",
      title: "Thank you, {nombre}",
      body: "We won't write about this again. Whenever you want to pick it up, we'll be here.",
      cta: "Write to us",
    },
  ],
};

export const defaultAbandonedTexts: Record<Locale, EmailTexts> = {
  es: {
    subject: "{nombre}, tu cotización quedó a medio camino",
    title: "¿Terminamos tu cotización?",
    body: "Guardamos lo que alcanzaste a contarnos. Termínala en un minuto y, si tu proyecto encaja, eliges de una vez el horario para hablar.\n\nTe escribimos porque marcaste que podíamos ayudarte si no terminabas. No te enviaremos más recordatorios.",
    cta: "Continuar donde quedé",
  },
  en: {
    subject: "{nombre}, your quote is halfway done",
    title: "Shall we finish your quote?",
    body: "We saved what you told us. Finish it in a minute and, if your project fits, pick a time to talk right away.\n\nYou're getting this because you said we could help if you didn't finish. We won't send more reminders.",
    cta: "Continue where I left off",
  },
};

/** Textos efectivos de un paso (lo guardado o lo predeterminado, campo por campo). */
export function stepTexts(config: FollowupConfig, index: number, locale: Locale): EmailTexts {
  const base = defaultStepTexts[locale][index] ?? defaultStepTexts[locale][defaultStepTexts[locale].length - 1];
  const saved = config.steps[index]?.texts?.[locale] ?? {};
  return {
    subject: saved.subject?.trim() || base.subject,
    title: saved.title?.trim() || base.title,
    body: saved.body?.trim() || base.body,
    cta: saved.cta?.trim() || base.cta,
  };
}

export function abandonedTexts(config: FollowupConfig, locale: Locale): EmailTexts {
  const base = defaultAbandonedTexts[locale];
  const saved = config.abandoned_texts?.[locale] ?? {};
  return {
    subject: saved.subject?.trim() || base.subject,
    title: saved.title?.trim() || base.title,
    body: saved.body?.trim() || base.body,
    cta: saved.cta?.trim() || base.cta,
  };
}
