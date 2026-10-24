import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { FollowupNav } from "@/components/followups/FollowupNav";
import { EmailQueue, type QueueRow } from "@/components/followups/EmailQueue";
import { automationCopy } from "@/content/automation";
import { followupQueueCopy } from "@/content/followupQueue";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { integrationStatus } from "@/lib/integrations";
import { cn } from "@/lib/utils";

type Kpis = {
  sent: number;
  sent_prev: number;
  delivered: number;
  opened: number;
  opened_prev: number;
  clicked: number;
  tracked: number;
  queued: number;
  failed: number;
  unsubscribed: number;
};

const COLUMNS =
  "id, kind, lead_id, draft_id, report_id, to_email, send_at, status, error, provider_id, sent_at, created_at, payload, delivered_at, opened_at, clicked_at, bounced_at, complained_at, open_count, click_count, created_by, leads(name, email, tier)";

export default async function FollowupsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = followupQueueCopy[locale];

  const [{ data: upcoming }, { data: recent }, { data: report }, status, employees] = await Promise.all([
    supabase.from("email_queue").select(COLUMNS).in("status", ["queued", "sending"]).order("send_at").limit(500),
    supabase.from("email_queue").select(COLUMNS).in("status", ["sent", "failed", "cancelled"]).order("created_at", { ascending: false }).limit(500),
    supabase.rpc("followup_report", { p_days: 30 }),
    integrationStatus(supabase),
    listEmployees(supabase),
  ]);
  const rows = [...(upcoming ?? []), ...(recent ?? [])] as unknown as QueueRow[];
  const k = ((report as { kpis?: Kpis } | null)?.kpis ?? {}) as Partial<Kpis>;
  const emailReady = !!status.resend_api_key && !!status.email_from;
  const tracking = !!status.resend_webhook_secret;

  const pct = (a = 0, b = 0) => (b > 0 ? Math.round((a / b) * 100) : null);
  const delta = (now = 0, prev = 0) => (prev > 0 ? Math.round(((now - prev) / prev) * 100) : null);
  const base = (k.tracked ?? 0) > 0 ? k.delivered || k.sent : 0;
  const openRate = pct(k.opened, base);
  const openPrev = delta(k.opened, k.opened_prev);
  const kpis = [
    { key: "sent", value: String(k.sent ?? 0), delta: delta(k.sent, k.sent_prev) },
    { key: "openRate", value: tracking && openRate != null ? `${openRate}%` : "—", delta: tracking ? openPrev : null, hint: tracking ? null : t.noTracking },
    { key: "clickRate", value: tracking && base ? `${pct(k.clicked, base)}%` : "—", delta: null, hint: tracking ? null : t.noTracking },
    { key: "queued", value: String(k.queued ?? 0), delta: null },
    { key: "failed", value: String(rows.filter((r) => r.status === "failed" || r.bounced_at).length), delta: null },
    { key: "unsubscribed", value: String(k.unsubscribed ?? 0), delta: null },
  ] as { key: keyof typeof t.kpis; value: string; delta: number | null; hint?: string | null }[];

  const notices = [!emailReady && t.notices.email, emailReady && !tracking && t.notices.tracking].filter(Boolean) as string[];

  return (
    <>
      <PageHeader title={automationCopy[locale].followups.title} count={k.queued ?? 0} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        {/* Métricas */}
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((x) => (
            <div key={x.key} className="border-line px-6 py-4 sm:border-r xl:last:border-r-0">
              <p className="text-sm text-muted">{t.kpis[x.key]}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-[1.7rem] font-semibold leading-none tabular-nums text-heading">{x.value}</span>
                {x.delta != null && (
                  <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", x.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {x.delta >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                    {Math.abs(x.delta)}%
                  </span>
                )}
              </p>
              {x.hint && <p className="mt-1 text-xs text-muted">{x.hint}</p>}
            </div>
          ))}
        </div>

        <FollowupNav locale={locale} />

        {notices.length > 0 && (
          <div className="grid gap-2 px-4 pt-4 sm:px-6">
            {notices.map((n) => (
              <p key={n} className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{n}</span>
                <Link href={`/${locale}/portal/integraciones`} className="shrink-0 font-semibold underline">
                  {t.notices.go}
                </Link>
              </p>
            ))}
          </div>
        )}

        <EmailQueue locale={locale} rows={rows} employees={employees} canAct />
      </div>
    </>
  );
}
