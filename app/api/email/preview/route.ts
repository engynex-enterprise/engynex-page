import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import { sendEmail } from "@/lib/email/send";
import {
  abandoned,
  bookingConfirmation,
  customEmail,
  followup,
  newLeadAlert,
  type Rendered,
  type TemplateLead,
} from "@/lib/email/templates";
import { normalizeFollowupConfig } from "@/content/followupDefaults";

/** Lead de ejemplo para ver cómo queda un correo de la secuencia. */
const sampleLead = (locale: string): TemplateLead => ({
  id: "00000000-0000-0000-0000-000000000000",
  name: locale === "en" ? "Maria Smith" : "María Gómez",
  email: "maria@example.com",
  phone: "3001234567",
  company: locale === "en" ? "Example Store" : "Tienda Ejemplo",
  locale,
  tier: "yellow",
  score: 55,
  problem_category: "web",
  problem_text: null,
  booking_token: "00000000-0000-0000-0000-000000000000",
  email_token: "00000000-0000-0000-0000-000000000000",
  appointment: { starts_at: new Date(Date.now() + 2 * 86_400_000).toISOString(), channel: "meet" },
});

type Body = {
  mode?: "step" | "abandoned" | "queue";
  step?: number;
  locale?: string;
  config?: unknown;
  id?: number;
  /** Enviar la vista previa al correo del usuario. */
  test?: boolean;
};

/**
 * Vista previa de un correo: un paso de la secuencia o el recordatorio con
 * los textos que se están editando (sin guardar), o un correo de la cola tal
 * como saldrá. Con test=true se envía al correo de quien lo pide.
 */
export async function POST(request: Request) {
  const session = await apiProfile(["admin", "sales", "marketing"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Body;
  const locale = body.locale === "en" ? "en" : "es";
  let rendered: Rendered | null = null;

  if (body.mode === "step") {
    const config = normalizeFollowupConfig(body.config);
    rendered = followup(Math.min(Math.max(Number(body.step) || 1, 1), 5), sampleLead(locale), config);
  } else if (body.mode === "abandoned") {
    rendered = abandoned({ name: sampleLead(locale).name, token: "00000000-0000-0000-0000-000000000000", locale }, normalizeFollowupConfig(body.config));
  } else if (body.mode === "queue" && body.id) {
    // Leído con la sesión del asesor (RLS).
    const { data: row } = await session.supabase
      .from("email_queue")
      .select("id, kind, payload, lead_id, draft_id")
      .eq("id", body.id)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const [{ data: lead }, { data: draft }, { data: settings }] = await Promise.all([
      row.lead_id
        ? session.supabase
            .from("leads")
            .select("id, name, email, phone, company, locale, tier, score, problem_category, problem_text, booking_token, email_token")
            .eq("id", row.lead_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      row.draft_id
        ? session.supabase.from("lead_drafts").select("name, token, locale").eq("id", row.draft_id).maybeSingle()
        : Promise.resolve({ data: null }),
      session.supabase.from("followup_settings").select("config").maybeSingle(),
    ]);
    const config = normalizeFollowupConfig(settings?.config);
    let appointment: TemplateLead["appointment"] = null;
    if (lead && row.kind === "booking_confirmation") {
      const { data: a } = await session.supabase
        .from("appointments")
        .select("starts_at, channel")
        .eq("lead_id", lead.id)
        .eq("status", "scheduled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      appointment = a;
    }
    const full = lead ? ({ ...lead, appointment } as unknown as TemplateLead) : null;
    if (row.kind.startsWith("followup_") && full) rendered = followup(Number(row.kind.slice(-1)), full, config);
    else if (row.kind === "booking_confirmation" && full) rendered = bookingConfirmation(full);
    else if (row.kind === "new_lead_alert" && full) rendered = newLeadAlert(full);
    else if (row.kind === "abandoned" && draft) rendered = abandoned(draft, config);
    else if (row.kind === "custom" && row.payload) rendered = customEmail(row.payload as Parameters<typeof customEmail>[0]);
  }
  if (!rendered) return NextResponse.json({ error: "no_preview" }, { status: 422 });

  if (body.test) {
    if (!hasSecretKey()) return NextResponse.json({ error: "not_configured" }, { status: 409 });
    const c = await getIntegrations();
    if (!c.resend_api_key || !c.email_from) return NextResponse.json({ error: "not_configured" }, { status: 409 });
    try {
      await sendEmail(c.resend_api_key, {
        from: c.email_from,
        to: [session.profile.email],
        subject: `[Prueba] ${rendered.subject}`,
        html: rendered.html,
        text: rendered.text,
      });
      return NextResponse.json({ ok: true, to: session.profile.email });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
    }
  }
  return NextResponse.json({ subject: rendered.subject, html: rendered.html });
}
