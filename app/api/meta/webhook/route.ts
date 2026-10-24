import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { socialName, type SocialChannel } from "@/lib/meta";
import { validSignature, verifyToken } from "@/lib/whatsapp";

/**
 * Webhook de Messenger e Instagram (Meta). Se registra en la misma app de
 * Meta que WhatsApp, con la URL https://<sitio>/api/meta/webhook y el mismo
 * token de verificación, suscrito a "messages", "message_deliveries" y
 * "message_reads" (Messenger) y "messages" (Instagram).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = await verifyToken();
  if (expected && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === expected) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type Messaging = {
  sender?: { id: string };
  timestamp?: number;
  message?: { mid: string; text?: string; is_echo?: boolean; attachments?: { type?: string }[] };
  postback?: { mid?: string; title?: string };
  read?: { watermark?: number };
  delivery?: { watermark?: number };
};
type Payload = { object?: string; entry?: { messaging?: Messaging[] }[] };

const textOf = (m: NonNullable<Messaging["message"]>) =>
  m.text ?? (m.attachments?.length ? m.attachments.map((a) => `[${a.type ?? "adjunto"}]`).join(" ") : "[mensaje]");

export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await validSignature(raw, request.headers.get("x-hub-signature-256")))) {
    return new Response("Invalid signature", { status: 401 });
  }
  let payload: Payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const channel: SocialChannel | null = payload.object === "page" ? "messenger" : payload.object === "instagram" ? "instagram" : null;
  if (!channel) return NextResponse.json({ ok: true });

  const db = createAdminClient();
  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const user = event.sender?.id;
      if (!user) continue;
      // Lo que envía la propia página llega como "eco": ya está guardado.
      if (event.message && !event.message.is_echo) {
        const { data: existing } = await db
          .from("chat_conversations")
          .select("id")
          .eq("channel", channel)
          .eq("external_id", user)
          .maybeSingle();
        const name = existing ? null : await socialName(channel, user);
        await db.rpc("meta_inbound", { p_channel: channel, p_user: user, p_name: name, p_body: textOf(event.message), p_mid: event.message.mid });
      } else if (event.postback?.title) {
        await db.rpc("meta_inbound", {
          p_channel: channel,
          p_user: user,
          p_name: null,
          p_body: event.postback.title,
          p_mid: event.postback.mid ?? `pb-${user}-${event.timestamp ?? Date.now()}`,
        });
      } else if (event.read || event.delivery) {
        const watermark = event.read?.watermark ?? event.delivery?.watermark ?? event.timestamp ?? Date.now();
        await db.rpc("meta_seen", {
          p_channel: channel,
          p_user: user,
          p_status: event.read ? "read" : "delivered",
          p_until: new Date(watermark).toISOString(),
        });
      }
    }
  }
  // Meta reintenta si no recibe 200: se responde siempre que la firma sea válida.
  return NextResponse.json({ ok: true });
}
