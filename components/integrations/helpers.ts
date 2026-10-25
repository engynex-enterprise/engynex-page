import type { IntegrationDef, IntegrationLink } from "@/lib/integrationCatalog";

/** Página propia de las integraciones incluidas en el portal. */
export const BUILTIN_PATH: Record<NonNullable<IntegrationDef["builtin"]>, string> = {
  webhooks: "webhooks",
  api: "api",
  calendar: "calendario",
};

/** Primer enlace del proveedor de alguno de los tipos dados (en ese orden). */
export const firstLink = (def: IntegrationDef, kinds: IntegrationLink["kind"][]) =>
  kinds.map((k) => def.links.find((l) => l.kind === k)).find(Boolean);
