import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredSetting } from "@/components/integrations/IntegrationFields";
import type { IntegrationStatus } from "@/components/integrations/shared";
import { envOnlyKeys, type IntegrationKey } from "@/lib/integrations";
import { INTEGRATIONS, integrationState } from "@/lib/integrationCatalog";
import type { Database } from "@/lib/supabase/types";

export type { StoredSetting };

/** Lo guardado (sin secretos), lo que viene del .env y el estado de cada integración. */
export async function loadIntegrations(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.rpc("admin_get_integrations");
  const stored = (data ?? {}) as Record<string, StoredSetting>;
  const envOnly = envOnlyKeys(stored as Partial<Record<IntegrationKey, unknown>>);
  const set: Partial<Record<IntegrationKey, boolean>> = {};
  for (const [k, v] of Object.entries(stored)) if (v.set) set[k as IntegrationKey] = true;
  for (const k of envOnly) set[k] = true;
  const statuses: Record<string, IntegrationStatus> = {};
  for (const def of INTEGRATIONS) {
    const s = integrationState(def, set);
    statuses[def.slug] = s === "builtin" ? (def.via ? "via" : "builtin") : s;
  }
  return { stored, envOnly, set, statuses };
}
