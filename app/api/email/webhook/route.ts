import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegrations } from "@/lib/integrations";

/**
 * Webhook de Resend: entregado, abierto, clic, rebote y queja de cada correo.
 * Resend firma con Svix: HMAC-SHA256 de "id.timestamp.cuerpo" con el secreto
 * (whsec_…, en Integraciones). Se rechaza lo que no venga firmado o tenga más
 * de 5 minutos.
 */
function validSvix(raw: string, headers: Headers, secret: string) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64"));
  return signatures.split(" ").some((part) => {
    const [, sig] = part.split(",");
    const given = Buffer.from(sig ?? "");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = { type?: string; created_at?: string; data?: { email_id?: string } };

export async function POST(request: Request) {
  const { resend_webhook_secret } = await getIntegrations();
  if (!resend_webhook_secret) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (!validSvix(raw, request.headers, resend_webhook_secret)) return new Response("Invalid signature", { status: 401 });

  let event: ResendEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (event.type && event.data?.email_id) {
    const { error } = await createAdminClient().rpc("email_event", {
      p_provider_id: event.data.email_id,
      p_type: event.type,
      p_at: event.created_at ?? new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
