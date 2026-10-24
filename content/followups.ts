import type { Locale } from "@/i18n/config";

/** Textos comunes del módulo de seguimiento (pestañas). */
const es = {
  nav: { queue: "Correos", sequence: "Secuencia", drafts: "Formularios sin terminar", reports: "Reportes" },
};

export type FollowupsCopy = typeof es;

const en: FollowupsCopy = {
  nav: { queue: "Emails", sequence: "Sequence", drafts: "Unfinished forms", reports: "Reports" },
};

export const followupsCopy: Record<Locale, FollowupsCopy> = { es, en };
