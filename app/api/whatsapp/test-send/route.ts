import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { sendTemplate, whatsappMissing } from "@/lib/whatsapp";

/**
 * Mensaje de prueba de una plantilla a un número (el del propio equipo),
 * antes de enviar la campaña. No queda registrado en ninguna campaña.
 */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "marketing"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if ((await whatsappMissing()).length) return NextResponse.json({ error: "not_configured" }, { status: 409 });

  const { template, phone, values } = (await request.json().catch(() => ({}))) as { template?: string; phone?: string; values?: string[] };
  let to = (phone ?? "").replace(/\D/g, "");
  if (to.length === 10) to = `57${to}`;
  if (!template || to.length < 11 || to.length > 15) return NextResponse.json({ error: "invalid" }, { status: 422 });

  // Leída con la sesión: RLS confirma que puede verla.
  const { data: tpl } = await session.supabase.from("wa_templates").select("name, language, status").eq("id", template).maybeSingle();
  if (!tpl || tpl.status !== "APPROVED") return NextResponse.json({ error: "template_not_approved" }, { status: 422 });
  try {
    await sendTemplate(to, tpl.name, tpl.language, (values ?? []).map((v) => String(v).slice(0, 200) || "-"));
    return NextResponse.json({ ok: true, to: `+${to}` });
  } catch (error) {
    return NextResponse.json({ error: "send_failed", detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
