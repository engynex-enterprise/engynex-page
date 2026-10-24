import type { Locale } from "@/i18n/config";

/**
 * Variables de las campañas. Las reemplaza la base de datos al enviar
 * (campaign_vars / campaign_render); aquí están para el editor y la vista
 * previa. Todas admiten un valor por si falta: {empresa|tu empresa}.
 */
export const CAMPAIGN_VARS = [
  { key: "nombre", es: "Nombre", en: "First name", sample: "María", fallback: "" },
  { key: "nombre_completo", es: "Nombre completo", en: "Full name", sample: "María Gómez", fallback: "" },
  { key: "empresa", es: "Empresa", en: "Company", sample: "Tienda Ejemplo", fallback: "tu empresa" },
  { key: "necesidad", es: "Lo que necesita", en: "What they need", sample: "tu página web", fallback: "" },
  { key: "asesor", es: "Su asesor", en: "Their advisor", sample: "Laura", fallback: "el equipo de Engynex" },
  { key: "correo", es: "Correo", en: "Email", sample: "maria@example.com", fallback: "" },
  { key: "telefono", es: "Teléfono", en: "Phone", sample: "300 123 4567", fallback: "" },
  { key: "enlace_agenda", es: "Enlace para agendar", en: "Booking link", sample: "https://engynex.com/es/agendar?t=…", fallback: "" },
  { key: "enlace_cotizar", es: "Enlace para cotizar", en: "Quote link", sample: "https://engynex.com/es/cotizar", fallback: "" },
] as const;

export type CampaignVarKey = (typeof CAMPAIGN_VARS)[number]["key"];

/** El texto que se inserta: {var} o {var|valor por defecto}. */
export const varToken = (key: string, fallback?: string) => (fallback ? `{${key}|${fallback}}` : `{${key}}`);

/** Reemplaza {var} y {var|valor si falta} (igual que campaign_render en la base). */
export function renderVars(text: string, values: Partial<Record<string, string>>) {
  return text.replace(/\{([a-z_]+)(?:\|([^}]*))?\}/g, (match, key: string, fallback?: string) => {
    if (!(key in values)) return match;
    const value = values[key]?.trim();
    return value ? value : (fallback ?? "");
  });
}

/** Valores de ejemplo para la vista previa. */
export const sampleVars = (locale: Locale) =>
  Object.fromEntries(CAMPAIGN_VARS.map((v) => [v.key, locale === "en" && v.key === "necesidad" ? "your website" : v.sample]));
