import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey, type IntegrationKey } from "@/lib/integrations";
import { integrationBySlug } from "@/lib/integrationCatalog";
import { phoneInfo, whatsappMissing } from "@/lib/whatsapp";

type Result = { ok: boolean; detail?: string; missing?: string[] };

const TEAM_CHANNEL: Record<string, string> = { slack: "slack", "microsoft-teams": "teams", "google-chat": "google_chat" };

/** Mensaje de error corto de una respuesta HTTP de un tercero. */
async function httpError(res: Response) {
  const body = (await res.json().catch(() => null)) as { message?: string; error?: { message?: string } | string; name?: string } | null;
  const msg = typeof body?.error === "string" ? body.error : body?.error?.message ?? body?.message ?? body?.name;
  return `${res.status}${msg ? ` · ${msg}` : ""}`.slice(0, 200);
}

async function check(slug: string, supabase: NonNullable<Awaited<ReturnType<typeof apiProfile>>>["supabase"]): Promise<Result> {
  const def = integrationBySlug(slug);
  if (!def) return { ok: false, detail: "unknown" };

  // Chat del equipo: la base de datos envía un mensaje real al canal.
  if (TEAM_CHANNEL[slug]) {
    const { data, error } = await supabase.rpc("team_alert_test", { p_channel: TEAM_CHANNEL[slug] });
    if (error) return { ok: false, detail: error.message };
    return data ? { ok: true, detail: "mensaje enviado" } : { ok: false, missing: def.required };
  }

  if (!hasSecretKey()) return { ok: false, missing: ["SUPABASE_SECRET_KEY"] };
  const c = await getIntegrations();
  const missing = def.required.filter((k) => !c[k as IntegrationKey]);

  if (slug === "whatsapp") {
    const wa = await whatsappMissing();
    if (wa.length) return { ok: false, missing: wa };
    const info = await phoneInfo();
    return { ok: true, detail: `${info.verified_name} · ${info.display_phone_number}` };
  }
  if (missing.length) return { ok: false, missing };

  if (slug === "resend") {
    const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${c.resend_api_key}` }, cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { data?: { name: string; status: string }[] };
      const domains = (body.data ?? []).map((d) => `${d.name} (${d.status})`);
      return { ok: true, detail: domains.length ? domains.join(", ") : "sin dominios verificados" };
    }
    // Una clave solo de envío no puede listar dominios, pero es válida.
    const err = await httpError(res);
    if (res.status === 401 && err.includes("restricted")) return { ok: true, detail: "clave con permiso solo de envío" };
    return { ok: false, detail: err };
  }

  if (slug === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=5", {
      headers: { "x-api-key": c.anthropic_api_key ?? "", "anthropic-version": "2023-06-01" },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, detail: await httpError(res) };
    const body = (await res.json()) as { data?: { id: string }[] };
    return { ok: true, detail: `${body.data?.length ?? 0}+ modelos disponibles` };
  }

  if (slug === "messenger-instagram") {
    const version = c.whatsapp_graph_version || "v23.0";
    const url = `https://graph.facebook.com/${version}/${c.meta_page_id}?fields=name${c.instagram_account_id ? ",instagram_business_account{username}" : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${c.meta_page_token}` }, cache: "no-store" });
    if (!res.ok) return { ok: false, detail: await httpError(res) };
    const body = (await res.json()) as { name?: string; instagram_business_account?: { username?: string } };
    return { ok: true, detail: [body.name, body.instagram_business_account?.username && `@${body.instagram_business_account.username}`].filter(Boolean).join(" · ") };
  }

  // Etiquetas e IDs: se validan al guardar; aquí basta con que estén.
  return { ok: true, detail: "datos guardados con formato válido" };
}

/** "Probar conexión" de cada integración. Deja constancia en el registro. */
export async function POST(request: Request) {
  const session = await apiProfile(["admin"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { slug } = (await request.json().catch(() => ({}))) as { slug?: string };
  if (!slug || !integrationBySlug(slug)) return NextResponse.json({ error: "unknown" }, { status: 400 });

  let result: Result;
  try {
    result = await check(slug, session.supabase);
  } catch (error) {
    result = { ok: false, detail: (error instanceof Error ? error.message : String(error)).slice(0, 200) };
  }
  if (!result.missing) {
    await session.supabase.from("integration_audit").insert({
      key: slug,
      action: result.ok ? "test_ok" : "test_failed",
      detail: result.detail?.slice(0, 300) ?? null,
      actor: session.profile.id,
    });
  }
  return NextResponse.json(result, { status: result.ok ? 200 : result.missing ? 409 : 502 });
}
