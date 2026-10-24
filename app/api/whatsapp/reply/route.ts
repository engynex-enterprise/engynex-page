import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText, whatsappMissing } from "@/lib/whatsapp";

/**
 * Respuesta de un asesor a una conversación de WhatsApp desde el chat del
 * portal. Meta solo permite texto libre dentro de las 24 h siguientes al
 * último mensaje del cliente.
 */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "support"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if ((await whatsappMissing()).length) return NextResponse.json({ error: "not_configured" }, { status: 409 });

  const { conversation, body } = (await request.json().catch(() => ({}))) as {
    conversation?: string;
    body?: string;
  };
  const text = body?.trim().slice(0, 2000);
  if (!conversation || !text) return NextResponse.json({ error: "invalid" }, { status: 422 });

  // Leída con la sesión del asesor: RLS confirma que puede verla.
  const { data: conv } = await session.supabase
    .from("chat_conversations")
    .select("id, channel, wa_phone, wa_window_until")
    .eq("id", conversation)
    .maybeSingle();
  if (!conv || conv.channel !== "whatsapp" || !conv.wa_phone) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!conv.wa_window_until || new Date(conv.wa_window_until) < new Date()) {
    return NextResponse.json({ error: "window_closed" }, { status: 409 });
  }

  try {
    const id = await sendText(conv.wa_phone, text);
    const { error } = await createAdminClient().rpc("wa_agent_message", {
      p_conversation: conv.id,
      p_author: session.profile.id,
      p_body: text,
      p_wa_id: id,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "send_failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
