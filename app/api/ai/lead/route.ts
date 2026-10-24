import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import { analyzeLead } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

/** "Analizar con IA" desde la ficha del lead. */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "marketing"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasSecretKey()) return NextResponse.json({ error: "not_configured" }, { status: 409 });
  const { anthropic_api_key } = await getIntegrations();
  if (!anthropic_api_key) return NextResponse.json({ error: "not_configured" }, { status: 409 });

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  // Leído con la sesión del asesor: RLS confirma que puede verlo.
  const { data: lead } = await session.supabase
    .from("leads")
    .select("id, name, company, problem_category, problem_text, budget, decision, timeline, tier")
    .eq("id", id ?? "")
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!lead.problem_text?.trim()) return NextResponse.json({ error: "no_text" }, { status: 422 });

  const db = createAdminClient();
  try {
    const insights = await analyzeLead(anthropic_api_key, { ...lead, problem_text: lead.problem_text });
    await db.rpc("ai_store", { p_lead: lead.id, p_insights: insights, p_error: insights ? null : "refusal" });
    return insights ? NextResponse.json({ insights }) : NextResponse.json({ error: "refusal" }, { status: 422 });
  } catch (error) {
    const message =
      error instanceof Anthropic.AuthenticationError
        ? "invalid_api_key"
        : error instanceof Anthropic.RateLimitError
          ? "rate_limited"
          : error instanceof Anthropic.APIError
            ? `${error.status ?? ""} ${error.message}`.trim()
            : error instanceof Error
              ? error.message
              : String(error);
    await db.rpc("ai_store", { p_lead: lead.id, p_insights: null, p_error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
