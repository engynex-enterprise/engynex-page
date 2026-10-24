import type { Locale } from "@/i18n/config";

/** Textos comunes de Clientes y proveedores. */
const es = {
  title: "Clientes y proveedores",
  stages: { onboarding: "Incorporación", active: "Activo", at_risk: "En riesgo", paused: "En pausa", churned: "Perdido" } as Record<string, string>,
  kinds: { client: "Cliente", provider: "Proveedor" } as Record<string, string>,
  health: { label: "Salud", good: "Buena", fair: "Regular", poor: "En riesgo" },
  noteKinds: { note: "Nota", call: "Llamada", meeting: "Reunión", email: "Correo", visit: "Visita" } as Record<string, string>,
  monthly: "Valor mensual",
  renewal: "Renovación",
  owner: "Responsable",
  noOwner: "Sin responsable",
  renewIn: "en {n} d",
  renewOverdue: "vencida hace {n} d",
  never: "Nunca",
};

export type AccountsProCopy = typeof es;

const en: AccountsProCopy = {
  title: "Clients & providers",
  stages: { onboarding: "Onboarding", active: "Active", at_risk: "At risk", paused: "Paused", churned: "Churned" },
  kinds: { client: "Client", provider: "Provider" },
  health: { label: "Health", good: "Good", fair: "Fair", poor: "At risk" },
  noteKinds: { note: "Note", call: "Call", meeting: "Meeting", email: "Email", visit: "Visit" },
  monthly: "Monthly value",
  renewal: "Renewal",
  owner: "Owner",
  noOwner: "No owner",
  renewIn: "in {n} d",
  renewOverdue: "overdue by {n} d",
  never: "Never",
};

export const accountsProCopy: Record<Locale, AccountsProCopy> = { es, en };
