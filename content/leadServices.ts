import type { Locale } from "@/i18n/config";
import { services } from "@/content/services";

/**
 * Tipo de solicitud de un lead para el CRM: el servicio pedido (leads.service)
 * o, si no hay, la necesidad que marcó en el formulario (problem_category).
 */
const needs = {
  es: { sales: "Más ventas", web: "Sitio web", automation: "Automatización", system: "Sistema o plataforma", support: "Soporte TI", other: "Otra necesidad", none: "Explorando" },
  en: { sales: "More sales", web: "Website", automation: "Automation", system: "System or platform", support: "IT support", other: "Other need", none: "Exploring" },
} as const;

export const leadServicesCopy = {
  es: { column: "Solicitud", all: "Todas las solicitudes", filterLabel: "Tipo de solicitud", csv: "Servicio" },
  en: { column: "Request", all: "All requests", filterLabel: "Request type", csv: "Service" },
} as const;

/** Clave de agrupación: `svc:<slug>` o `need:<categoría>`. */
export function requestKey(l: { service: string | null; problem_category: string }) {
  return l.service ? `svc:${l.service}` : `need:${l.problem_category}`;
}

/** Nombre legible de una clave de solicitud. */
export function requestLabel(key: string, locale: Locale) {
  const [kind, value] = key.split(":");
  if (kind === "svc") return services.find((s) => s.slug === value)?.[locale].title ?? value;
  return needs[locale][value as keyof (typeof needs)["es"]] ?? value;
}
