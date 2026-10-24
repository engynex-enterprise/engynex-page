import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText, validSignature, verifyToken } from "@/lib/whatsapp";

/**
 * Webhook de WhatsApp (Meta). Se registra en la app de Meta con la URL
 * https://<sitio>/api/whatsapp/webhook y el token de verificación (Integraciones), suscrito a
 * "messages".
 *
 * - GET: verificación inicial (Meta envía un reto y se devuelve tal cual).
 * - POST: estados de los mensajes enviados y mensajes que llegan. Solo se
 *   aceptan con la firma correcta (secreto de la app, en Integraciones).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = await verifyToken();
  if (
    expected &&
    url.searchParams.get("hub.mode") === "subscribe" &&
    url.searchParams.get("hub.verify_token") === expected
  ) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type Inbound = {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type Status = { id: string; status: string; errors?: { code?: number; title?: string; message?: string }[] };
type Payload = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: Inbound[];
        statuses?: Status[];
      };
    }[];
  }[];
};

const OPT_OUT_REPLY =
  "Listo, no te enviaremos más mensajes promocionales por WhatsApp. Si nos escribes, te seguimos atendiendo con gusto.";

/** Texto visible de un mensaje entrante (los adjuntos se anotan por tipo). */
function textOf(m: Inbound) {
  return (
    m.text?.body ??
    m.button?.text ??
    m.interactive?.button_reply?.title ??
    m.interactive?.list_reply?.title ??
    `[${m.type}]`
  );
}

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

  const db = createAdminClient();
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      for (const s of value.statuses ?? []) {
        const error = s.errors?.map((e) => [e.code, e.title, e.message].filter(Boolean).join(" · ")).join("; ");
        await db.rpc("wa_status_update", { p_wa_id: s.id, p_status: s.status, p_error: error || null });
      }

      for (const m of value.messages ?? []) {
        const name = value.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        const { data } = await db.rpc("wa_inbound", {
          p_phone: m.from,
          p_name: name,
          p_body: textOf(m),
          p_wa_id: m.id,
        });
        const result = (data ?? {}) as { opted_out?: boolean; conversation_id?: string };
        if (result.opted_out && result.conversation_id) {
          try {
            const id = await sendText(m.from, OPT_OUT_REPLY);
            await db.rpc("wa_agent_message", {
              p_conversation: result.conversation_id,
              p_author: null,
              p_body: OPT_OUT_REPLY,
              p_wa_id: id,
            });
          } catch (error) {
            console.error("[whatsapp] confirmación de baja", error);
          }
        }
      }
    }
  }

  // Meta reintenta si no recibe 200: se responde siempre que la firma sea válida.
  return NextResponse.json({ ok: true });
}
