import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegrations, isOn } from "@/lib/integrations";
import { whatsappMissing } from "@/lib/whatsapp";
import { dispatchWhatsApp } from "@/lib/whatsappDispatch";
import { analyzeLead } from "@/lib/ai";
import { resolveLlm } from "@/lib/llm";
import { sendEmail } from "@/lib/email/send";
import { abandoned, bookingConfirmation, customEmail, followup, newLeadAlert, weeklyReport, type Rendered } from "@/lib/email/templates";
import { normalizeFollowupConfig } from "@/content/followupDefaults";
import { reconcileDomainOrders } from "@/lib/domainOrders";
import { reconcileInvoices } from "@/lib/invoices";

export type JobsSummary = {
  whatsapp?: { sent: number; failed: number } | string;
  weeklyReport?: string | null;
  monthlyReport?: string | null;
  abandoned?: number | string;
  ai?: { analyzed: number; failed: number } | string;
  emails?: { sent: number; failed: number; cancelled: number } | string;
  domains?: { registered: number; retried: number; confirmed: number; cancelled: number } | string;
  invoices?: { overdue: number; reminders: number; paid: number } | string;
};

type Claimed = {
  id: number;
  kind: string;
  to_email: string | null;
  lead: Parameters<typeof followup>[1] & { opted_out: boolean } | null;
  draft: { name: string | null; email: string; token: string; locale: string | null; completed: boolean } | null;
  report: { week_start: string; kind?: "week" | "month"; data: Record<string, unknown> } | null;
  payload: (Parameters<typeof customEmail>[0] & { internal?: boolean }) | null;
};

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Tareas programadas (cada 5 minutos): campañas de WhatsApp, informe semanal,
 * formularios abandonados, lectura con IA y cola de correos. Cada parte es
 * independiente: si una falla, las demás siguen.
 */
export async function runJobs(budgetMs = 50_000): Promise<JobsSummary> {
  const started = Date.now();
  const left = () => budgetMs - (Date.now() - started);
  const db = createAdminClient();
  const c = await getIntegrations();
  const summary: JobsSummary = {};

  // 1. WhatsApp
  if ((await whatsappMissing()).length === 0) {
    try {
      summary.whatsapp = await dispatchWhatsApp(Math.min(20_000, left()));
    } catch (e) {
      summary.whatsapp = errorText(e);
    }
  }

  // 2. Informe semanal (lunes desde las 8 a.m.)
  if (isOn(c, "weekly_report")) {
    const { data, error } = await db.rpc("jobs_weekly_report");
    summary.weeklyReport = error ? error.message : (data ?? null);
    // Y el mensual, el día 1 de cada mes.
    const { data: month, error: monthError } = await db.rpc("jobs_monthly_report");
    summary.monthlyReport = monthError ? monthError.message : (month ?? null);
  }

  // 3. Formularios abandonados con permiso
  if (isOn(c, "abandoned_recovery")) {
    const { data, error } = await db.rpc("jobs_enqueue_abandoned");
    summary.abandoned = error ? error.message : (data ?? 0);
  }

  // 4. Lectura con IA
  const llm = resolveLlm(c);
  if (llm && isOn(c, "ai_lead_insights") && left() > 15_000) {
    const { data: pending, error } = await db.rpc("ai_pending_leads", { p_limit: 5 });
    if (error) summary.ai = error.message;
    else {
      let analyzed = 0;
      let failed = 0;
      for (const lead of pending ?? []) {
        if (left() < 10_000) break;
        try {
          const insights = await analyzeLead(llm, lead);
          await db.rpc("ai_store", { p_lead: lead.id, p_insights: insights, p_error: insights ? null : "refusal" });
          analyzed++;
        } catch (e) {
          await db.rpc("ai_store", { p_lead: lead.id, p_insights: null, p_error: errorText(e) });
          failed++;
        }
      }
      summary.ai = { analyzed, failed };
    }
  }

  // 5. Dominios: registra pagados pendientes, reintenta y confirma en Hostinger.
  if (left() > 15_000) {
    try {
      summary.domains = await reconcileDomainOrders(Math.min(15_000, left() - 10_000));
    } catch (e) {
      summary.domains = errorText(e);
    }
  }

  // 5b. Facturas: vencidas, recordatorios y pagos pendientes en Wompi.
  if (left() > 12_000) {
    try {
      summary.invoices = await reconcileInvoices(Math.min(10_000, left() - 10_000));
    } catch (e) {
      summary.invoices = errorText(e);
    }
  }

  // 6. Correos (al final, para enviar también los que generaron los dominios)
  if (c.resend_api_key && c.email_from) {
    summary.emails = await sendQueuedEmails(c.resend_api_key, c.email_from, c, left);
  } else {
    summary.emails = "not_configured";
  }

  return summary;
}

async function sendQueuedEmails(
  apiKey: string,
  from: string,
  c: Awaited<ReturnType<typeof getIntegrations>>,
  left: () => number,
) {
  const db = createAdminClient();
  const internal = (c.notify_emails ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  let sent = 0;
  let failed = 0;
  let cancelled = 0;

  const { data, error } = await db.rpc("email_claim", { p_limit: 50 });
  if (error) return error.message;
  // Textos y pasos de la secuencia editados en el portal.
  const { data: settings } = await db.from("followup_settings").select("config").maybeSingle();
  const followupConfig = normalizeFollowupConfig(settings?.config);

  for (const row of (data ?? []) as unknown as Claimed[]) {
    const cancel = async (reason: string) => {
      await db.rpc("email_mark", { p_id: row.id, p_status: "cancelled", p_error: reason });
      cancelled++;
    };
    if (left() < 3_000) {
      // Sin tiempo: vuelve a la cola en la próxima ejecución.
      await db.rpc("email_mark", { p_id: row.id, p_status: "queued" });
      continue;
    }

    let rendered: Rendered | null = null;
    let to: string[] = [];
    switch (row.kind) {
      case "followup_1":
      case "followup_2":
      case "followup_3":
      case "followup_4":
      case "followup_5":
        if (!isOn(c, "followup_sequence")) { await cancel("disabled"); continue; }
        if (!row.lead || row.lead.opted_out) { await cancel("opted_out"); continue; }
        rendered = followup(Number(row.kind.slice(-1)), row.lead, followupConfig);
        to = [row.lead.email];
        break;
      case "booking_confirmation":
        if (!row.lead) { await cancel("no_lead"); continue; }
        rendered = bookingConfirmation(row.lead);
        to = [row.lead.email];
        break;
      case "new_lead_alert":
        if (!row.lead) { await cancel("no_lead"); continue; }
        rendered = newLeadAlert(row.lead);
        to = internal;
        break;
      case "abandoned":
        if (!isOn(c, "abandoned_recovery")) { await cancel("disabled"); continue; }
        if (!row.draft || row.draft.completed) { await cancel("completed"); continue; }
        rendered = abandoned(row.draft, followupConfig);
        to = [row.draft.email];
        break;
      case "custom":
        // Correos de las automatizaciones (recordatorios, respuestas, avisos).
        if (!row.payload) { await cancel("no_content"); continue; }
        if (row.lead?.opted_out && !row.payload.internal) { await cancel("opted_out"); continue; }
        rendered = customEmail(row.payload);
        to = row.payload.internal ? internal : row.to_email ? [row.to_email] : [];
        break;
      case "weekly_report":
        if (!row.report) { await cancel("no_report"); continue; }
        rendered = weeklyReport(row.report);
        to = internal;
        break;
    }
    if (!rendered) { await cancel("no_content"); continue; }
    if (to.length === 0) { await cancel("no_recipients"); continue; }

    try {
      const id = await sendEmail(apiKey, {
        from,
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        unsubscribeUrl: rendered.unsubscribeUrl,
        // Las respuestas de los leads llegan al equipo.
        replyTo: internal[0],
      });
      await db.rpc("email_mark", { p_id: row.id, p_status: "sent", p_provider_id: id });
      sent++;
    } catch (e) {
      await db.rpc("email_mark", { p_id: row.id, p_status: "failed", p_error: errorText(e) });
      failed++;
    }
  }
  return { sent, failed, cancelled };
}
