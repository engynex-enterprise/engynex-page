import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import { suggestChatReply, summarizeChat, type ChatLine } from "@/lib/ai";

export const maxDuration = 60;

/**
 * IA en el chat del portal:
 * - action "suggest": propone la siguiente respuesta (el asesor la edita).
 * - action "summary": resume la conversación y la guarda (y en el lead).
 */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "support"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasSecretKey()) return NextResponse.json({ error: "not_configured" }, { status: 409 });
  const { anthropic_api_key } = await getIntegrations();
  if (!anthropic_api_key) return NextResponse.json({ error: "not_configured" }, { status: 409 });

  const { conversation, action } = (await request.json().catch(() => ({}))) as { conversation?: string; action?: string };
  if (!conversation || (action !== "suggest" && action !== "summary")) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  // Leído con la sesión del asesor: RLS confirma que puede verlo.
  const [{ data: conv }, { data: messages }] = await Promise.all([
    session.supabase.from("chat_conversations").select("id, locale").eq("id", conversation).maybeSingle(),
    session.supabase
      .from("chat_messages")
      .select("sender, body, internal")
      .eq("conversation_id", conversation)
      .neq("sender", "system")
      .order("id", { ascending: false })
      .limit(60),
  ]);
  if (!conv || !messages?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const lines: ChatLine[] = messages
    .reverse()
    .filter((m) => action === "summary" || !m.internal)
    .map((m) => ({
      who: m.internal ? "nota" : m.sender === "visitor" ? "cliente" : m.sender === "bot" ? "bot" : "asesor",
      text: m.body,
    }));

  try {
    if (action === "suggest") {
      const name = (session.profile.full_name ?? "el asesor").split(/\s+/)[0];
      const text = await suggestChatReply(anthropic_api_key, lines, name, conv.locale === "en");
      return text ? NextResponse.json({ text }) : NextResponse.json({ error: "refusal" }, { status: 422 });
    }
    const summary = await summarizeChat(anthropic_api_key, lines);
    if (!summary) return NextResponse.json({ error: "refusal" }, { status: 422 });
    const { error } = await session.supabase.rpc("chat_save_summary", { p_conversation: conv.id, p_summary: summary });
    if (error) throw new Error(error.message);
    return NextResponse.json({ text: summary });
  } catch (error) {
    const message =
      error instanceof Anthropic.AuthenticationError
        ? "invalid_api_key"
        : error instanceof Anthropic.RateLimitError
          ? "rate_limited"
          : error instanceof Error
            ? error.message
            : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
