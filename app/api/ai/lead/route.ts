import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import { analyzeLead } from "@/lib/ai";
import { llmErrorCode, LlmError, resolveLlm } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

/** "Analizar con IA" desde la ficha del lead (con el proveedor de IA configurado). */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "marketing"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasSecretKey()) return NextResponse.json({ error: "not_configured" }, { status: 409 });
  const llm = resolveLlm(await getIntegrations());
  if (!llm) return NextResponse.json({ error: "not_configured" }, { status: 409 });

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
    const insights = await analyzeLead(llm, { ...lead, problem_text: lead.problem_text });
    await db.rpc("ai_store", { p_lead: lead.id, p_insights: insights, p_error: insights ? null : "refusal" });
    return insights
      ? NextResponse.json({ insights, provider: llm.provider })
      : NextResponse.json({ error: "refusal" }, { status: 422 });
  } catch (error) {
    const message = error instanceof LlmError ? error.message : llmErrorCode(error);
    await db.rpc("ai_store", { p_lead: lead.id, p_insights: null, p_error: message });
    return NextResponse.json({ error: llmErrorCode(error) }, { status: 502 });
  }
}
