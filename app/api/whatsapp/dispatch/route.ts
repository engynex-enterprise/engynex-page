import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { whatsappMissing } from "@/lib/whatsapp";
import { dispatchWhatsApp } from "@/lib/whatsappDispatch";
import { getIntegrations } from "@/lib/integrations";

export const maxDuration = 60;

/** Margen para terminar antes del límite de la función. */
const BUDGET_MS = 50_000;

/**
 * Envía los mensajes de campaña pendientes (y arranca las programadas que ya
 * tocan). Dos formas de llamarla:
 * - Programada: GET/POST con `Authorization: Bearer <clave de tareas programadas>` (Integraciones) (Vercel Cron
 *   o pg_cron cada pocos minutos).
 * - "Enviar ahora" desde el portal: POST { campaign } con sesión de admin o
 *   marketing; primero arma la lista de destinatarios.
 */
async function run(request: Request) {
  const auth = request.headers.get("authorization");
  const { cron_secret } = await getIntegrations();
  const cron = !!cron_secret && auth === `Bearer ${cron_secret}`;

  if (!cron) {
    const session = await apiProfile(["admin", "marketing"]);
    if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const missing = await whatsappMissing();
    if (missing.length) return NextResponse.json({ error: "not_configured", missing }, { status: 409 });

    const body = (await request.json().catch(() => ({}))) as { campaign?: string };
    if (body.campaign) {
      const { error } = await session.supabase.rpc("wa_campaign_queue", { p_campaign: body.campaign });
      if (error) return NextResponse.json({ error: error.message }, { status: 422 });
    }
  } else if ((await whatsappMissing()).length) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  try {
    const { sent, failed } = await dispatchWhatsApp(BUDGET_MS);
    return NextResponse.json({ ok: true, sent, failed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
