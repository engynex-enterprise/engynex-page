import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import {
  detectIntent,
  rewriteDraft,
  suggestAlternatives,
  suggestChatReply,
  summarizeChat,
  translateDraft,
  type ChatLine,
  type RewriteMode,
} from "@/lib/ai";
import { llmErrorCode, PROVIDER_NAMES, resolveLlm } from "@/lib/llm";

export const maxDuration = 60;

type Action = "suggest" | "alternatives" | "summary" | "rewrite" | "translate" | "intent";
const ACTIONS: Action[] = ["suggest", "alternatives", "summary", "rewrite", "translate", "intent"];
const MODES: RewriteMode[] = ["formal", "friendly", "shorter", "fix"];

/**
 * IA en el chat del portal (con el proveedor configurado: Claude, OpenAI o Gemini):
 * - suggest: propone la siguiente respuesta (el asesor la edita).
 * - alternatives: tres respuestas con enfoques distintos.
 * - summary: resume la conversación y la guarda (y en el lead).
 * - rewrite: reescribe el borrador (formal, cercano, corto, ortografía).
 * - translate: traduce el borrador al idioma del cliente.
 * - intent: intención del cliente y servicio que encaja.
 */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "support"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasSecretKey()) return NextResponse.json({ error: "not_configured" }, { status: 409 });
  const llm = resolveLlm(await getIntegrations());
  if (!llm) return NextResponse.json({ error: "not_configured" }, { status: 409 });

  const { conversation, action, draft, mode } = (await request.json().catch(() => ({}))) as {
    conversation?: string;
    action?: Action;
    draft?: string;
    mode?: RewriteMode;
  };
  if (!conversation || !action || !ACTIONS.includes(action)) return NextResponse.json({ error: "invalid" }, { status: 422 });
  const text = (draft ?? "").trim().slice(0, 2000);
  if ((action === "rewrite" || action === "translate") && !text) return NextResponse.json({ error: "no_text" }, { status: 422 });
  if (action === "rewrite" && (!mode || !MODES.includes(mode))) return NextResponse.json({ error: "invalid" }, { status: 422 });

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
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const english = conv.locale === "en";
  const via = { provider: llm.provider, providerName: PROVIDER_NAMES[llm.provider] };

  try {
    if (action === "rewrite") return NextResponse.json({ text: (await rewriteDraft(llm, text, mode!)).text, ...via });
    if (action === "translate") return NextResponse.json({ text: (await translateDraft(llm, text, english ? "en" : "es")).text, ...via });

    if (!messages?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const lines: ChatLine[] = messages
      .reverse()
      .filter((m) => action === "summary" || !m.internal)
      .map((m) => ({
        who: m.internal ? "nota" : m.sender === "visitor" ? "cliente" : m.sender === "bot" ? "bot" : "asesor",
        text: m.body,
      }));
    const name = (session.profile.full_name ?? "el asesor").split(/\s+/)[0];

    if (action === "suggest") return NextResponse.json({ text: (await suggestChatReply(llm, lines, name, english)).text, ...via });
    if (action === "alternatives") return NextResponse.json({ options: (await suggestAlternatives(llm, lines, name, english)).options, ...via });
    if (action === "intent") {
      const r = await detectIntent(llm, lines);
      return NextResponse.json({ intent: { intent: r.intent, service: r.service, confidence: r.confidence, summary: r.summary }, ...via });
    }

    const summary = (await summarizeChat(llm, lines)).text;
    const { error } = await session.supabase.rpc("chat_save_summary", { p_conversation: conv.id, p_summary: summary });
    if (error) throw new Error(error.message);
    return NextResponse.json({ text: summary, ...via });
  } catch (error) {
    return NextResponse.json({ error: llmErrorCode(error) }, { status: 502 });
  }
}
