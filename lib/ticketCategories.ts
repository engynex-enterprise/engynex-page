import { supportIssues } from "@/content/support";
import type { Locale } from "@/i18n/config";

/** Temas de solicitud: los mismos del centro de soporte público. */
export const ticketCategories = (locale: Locale) =>
  supportIssues.map((issue) => ({ value: issue.key, label: issue[locale].title }));

export const categoryLabel = (locale: Locale, key: string) =>
  supportIssues.find((issue) => issue.key === key)?.[locale].title ?? key;
