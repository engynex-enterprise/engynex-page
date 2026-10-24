import type { Locale } from "@/i18n/config";

/** Ajustes de la mesa de ayuda. */
const es = {
  slaTitle: "Tiempos de atención (SLA)",
  slaHint: "Plazo máximo para la primera respuesta y para resolver, según la prioridad. Al vencer, avisamos al responsable (o a soporte si no tiene).",
  priority: "Prioridad",
  first: "Primera respuesta",
  resolve: "Resolución",
  hours: "horas",
  presets: { label: "Plantillas", strict: "Exigente", standard: "Estándar", relaxed: "Flexible" },
  autoTitle: "Cierre automático",
  autoHint: "Las solicitudes resueltas se cierran solas si el cliente no responde en estos días. Si escribe después, se reabren.",
  days: "días",
  autoOff: "0 = nunca cerrar automáticamente",
  csatTitle: "Encuesta de satisfacción",
  csatHint: "Al marcar una solicitud como resuelta, el cliente recibe un correo para calificar la atención de 1 a 5. Las calificaciones de 1 o 2 avisan al responsable.",
  csatOn: "Enviar encuesta al resolver",
  save: "Guardar cambios",
  saved: "Cambios guardados",
  error: "No se pudo guardar. Revisa los valores.",
  invalid: "La resolución no puede ser menor que la primera respuesta.",
  note: "Los nuevos plazos aplican a las solicitudes nuevas y a las que cambien de prioridad.",
  updated: "Última edición: {date}",
};

export type SupportSettingsCopy = typeof es;

const en: SupportSettingsCopy = {
  slaTitle: "Service levels (SLA)",
  slaHint: "Maximum time to first response and to resolution, by priority. When overdue, we alert the owner (or support if unassigned).",
  priority: "Priority",
  first: "First response",
  resolve: "Resolution",
  hours: "hours",
  presets: { label: "Presets", strict: "Strict", standard: "Standard", relaxed: "Relaxed" },
  autoTitle: "Auto-close",
  autoHint: "Resolved requests close on their own if the customer doesn't reply within these days. If they write later, it reopens.",
  days: "days",
  autoOff: "0 = never auto-close",
  csatTitle: "Satisfaction survey",
  csatHint: "When a request is resolved, the customer gets an email to rate the service from 1 to 5. Ratings of 1 or 2 alert the owner.",
  csatOn: "Send survey on resolve",
  save: "Save changes",
  saved: "Changes saved",
  error: "Couldn't save. Check the values.",
  invalid: "Resolution can't be shorter than first response.",
  note: "New targets apply to new requests and to those whose priority changes.",
  updated: "Last edited: {date}",
};

export const supportSettingsCopy: Record<Locale, SupportSettingsCopy> = { es, en };
