import "server-only";
import { getIntegrations, hasSecretKey, type IntegrationKey } from "@/lib/integrations";

/**
 * Messenger e Instagram (Direct) con la API de Meta, usando el token de la
 * página de Facebook. La app de Meta es la misma de WhatsApp: el webhook se
 * firma con su secreto y se verifica con su token (Integraciones).
 */
export type SocialChannel = "messenger" | "instagram";

const META_REQUIRED: IntegrationKey[] = ["meta_page_id", "meta_page_token", "whatsapp_app_secret", "whatsapp_verify_token"];

/** Nombres de los campos que faltan para poder responder (vacío = listo). */
export function metaMissingFrom(status: Partial<Record<IntegrationKey, boolean>>, secretKey: boolean): string[] {
  const missing: string[] = META_REQUIRED.filter((key) => !status[key]);
  if (!secretKey) missing.push("SUPABASE_SECRET_KEY");
  return missing;
}

export async function metaMissing(): Promise<string[]> {
  const c = await getIntegrations();
  return metaMissingFrom(Object.fromEntries(META_REQUIRED.map((k) => [k, !!c[k]])), hasSecretKey());
}

const config = async () => {
  const c = await getIntegrations();
  return {
    pageId: c.meta_page_id ?? "",
    token: c.meta_page_token ?? "",
    version: c.whatsapp_graph_version || "v23.0",
    base: process.env.WHATSAPP_API_BASE ?? "https://graph.facebook.com",
  };
};

type GraphError = { error?: { message?: string; code?: number } };

async function graph<T>(path: string, init?: RequestInit): Promise<T> {
  const e = await config();
  const url = new URL(`${e.base}/${e.version}/${path}`);
  url.searchParams.set("access_token", e.token);
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || data.error) {
    throw new Error([data.error?.code, data.error?.message ?? `HTTP ${res.status}`].filter(Boolean).join(" · "));
  }
  return data;
}

/** Texto a un usuario de Messenger (PSID) o Instagram (IGSID). Devuelve el id del mensaje. */
export async function sendSocialText(userId: string, text: string) {
  const { pageId } = await config();
  const data = await graph<{ message_id?: string }>(`${pageId}/messages`, {
    method: "POST",
    body: JSON.stringify({ recipient: { id: userId }, messaging_type: "RESPONSE", message: { text } }),
  });
  if (!data.message_id) throw new Error("Meta no devolvió el id del mensaje");
  return data.message_id;
}

/** Nombre visible del usuario (si Meta lo comparte). */
export async function socialName(channel: SocialChannel, userId: string): Promise<string | null> {
  try {
    if (channel === "messenger") {
      const p = await graph<{ first_name?: string; last_name?: string }>(`${userId}?fields=first_name,last_name`);
      return [p.first_name, p.last_name].filter(Boolean).join(" ") || null;
    }
    const p = await graph<{ name?: string; username?: string }>(`${userId}?fields=name,username`);
    return p.name || (p.username ? `@${p.username}` : null);
  } catch {
    return null;
  }
}

/** Nombre de la página conectada (para "Probar conexión"). */
export async function pageInfo() {
  const { pageId } = await config();
  return graph<{ name?: string; instagram_business_account?: { id: string } }>(`${pageId}?fields=name,instagram_business_account`);
}
