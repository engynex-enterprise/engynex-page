import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getIntegrations, hasSecretKey, type IntegrationKey } from "@/lib/integrations";

/**
 * Cliente mínimo de la API de WhatsApp Business (Cloud API de Meta).
 *
 * La configuración (IDs, token, secreto de la app, token de verificación) se
 * guarda desde el portal en Integraciones; ver lib/integrations.ts.
 * WHATSAPP_API_BASE (opcional) solo sirve para pruebas contra un servidor falso.
 */
const config = async () => {
  const c = await getIntegrations();
  return {
    token: c.whatsapp_access_token ?? "",
    phoneId: c.whatsapp_phone_number_id ?? "",
    wabaId: c.whatsapp_business_account_id ?? "",
    appSecret: c.whatsapp_app_secret ?? "",
    verifyToken: c.whatsapp_verify_token ?? "",
    base: process.env.WHATSAPP_API_BASE ?? "https://graph.facebook.com",
    version: c.whatsapp_graph_version || "v23.0",
  };
};

/** Nombres de los campos que faltan para poder enviar (vacío = listo). */
export function whatsappMissingFrom(status: Partial<Record<IntegrationKey, boolean>>, secretKey: boolean): string[] {
  const missing: string[] = WHATSAPP_REQUIRED.filter((key) => !status[key]);
  if (!secretKey) missing.push("SUPABASE_SECRET_KEY");
  return missing;
}

const WHATSAPP_REQUIRED: IntegrationKey[] = [
  "whatsapp_access_token",
  "whatsapp_phone_number_id",
  "whatsapp_business_account_id",
  "whatsapp_app_secret",
  "whatsapp_verify_token",
];

/** En el servidor: ¿está todo listo para enviar? */
export async function whatsappMissing(): Promise<string[]> {
  const c = await getIntegrations();
  const status = Object.fromEntries(WHATSAPP_REQUIRED.map((k) => [k, !!c[k]]));
  return whatsappMissingFrom(status, hasSecretKey());
}

type GraphError = { error?: { message?: string; code?: number; error_data?: { details?: string } } };

async function graph<T>(path: string, init?: RequestInit): Promise<T> {
  const e = await config();
  const res = await fetch(`${e.base}/${e.version}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${e.token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || data.error) {
    const err = data.error;
    throw new Error(
      [err?.code, err?.message ?? `HTTP ${res.status}`, err?.error_data?.details].filter(Boolean).join(" · "),
    );
  }
  return data;
}

type SendResult = { messages?: { id: string }[] };

/** Mensaje de plantilla (campañas y conversaciones fuera de la ventana de 24 h). */
export async function sendTemplate(to: string, template: string, language: string, params: string[]) {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: language },
      ...(params.length > 0 && {
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      }),
    },
  };
  const data = await graph<SendResult>(`${(await config()).phoneId}/messages`, { method: "POST", body: JSON.stringify(body) });
  const id = data.messages?.[0]?.id;
  if (!id) throw new Error("Meta no devolvió id de mensaje");
  return id;
}

/** Texto libre (solo dentro de las 24 h desde el último mensaje del cliente). */
export async function sendText(to: string, text: string) {
  const data = await graph<SendResult>(`${(await config()).phoneId}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text, preview_url: true } }),
  });
  const id = data.messages?.[0]?.id;
  if (!id) throw new Error("Meta no devolvió id de mensaje");
  return id;
}

export type MetaTemplate = {
  id: string;
  name: string;
  language: string;
  status: string;
  category?: string;
  components?: { type: string; format?: string; text?: string }[];
};

/** Plantillas de la cuenta (todas las páginas). */
export async function listTemplates(): Promise<MetaTemplate[]> {
  const { wabaId } = await config();
  const all: MetaTemplate[] = [];
  let path: string | null =
    `${wabaId}/message_templates?fields=id,name,language,status,category,components&limit=100`;
  while (path) {
    const page: { data: MetaTemplate[]; paging?: { next?: string; cursors?: { after?: string } } } =
      await graph(path);
    all.push(...page.data);
    const after = page.paging?.next ? page.paging.cursors?.after : undefined;
    path = after
      ? `${wabaId}/message_templates?fields=id,name,language,status,category,components&limit=100&after=${after}`
      : null;
    if (all.length > 2000) break;
  }
  return all;
}

/** Firma X-Hub-Signature-256 del webhook (HMAC-SHA256 del cuerpo con el secreto de la app). */
export async function validSignature(raw: string, header: string | null) {
  const secret = (await config()).appSecret;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const received = Buffer.from(header.slice(7));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export const verifyToken = async () => (await config()).verifyToken;

/** Prueba de conexión: datos del número configurado. */
export async function phoneInfo() {
  const { phoneId } = await config();
  return graph<{ display_phone_number?: string; verified_name?: string; quality_rating?: string }>(
    `${phoneId}?fields=display_phone_number,verified_name,quality_rating`,
  );
}

/** Cuántas variables {{n}} usa un texto. */
export const countVariables = (text: string) =>
  new Set([...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => m[1])).size;
