import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { GenerateReportButton } from "@/components/portal/GenerateReportButton";
import { StatTile } from "@/components/analytics/Charts";
import { automationCopy } from "@/content/automation";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { WeeklyReport } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Data = Record<string, unknown> & {
  by_tier?: Record<string, number>;
  sources?: { source: string; leads: number }[];
};

/** Lunes de la semana pasada (hora de Colombia), aaaa-mm-dd. */
function lastMonday(now: Date) {
  const bogota = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const day = (bogota.getDay() + 6) % 7;
  bogota.setDate(bogota.getDate() - day - 7);
  return `${bogota.getFullYear()}-${String(bogota.getMonth() + 1).padStart(2, "0")}-${String(bogota.getDate()).padStart(2, "0")}`;
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = automationCopy[locale].reports;
  const { r } = await searchParams;

  const { data } = await supabase.from("weekly_reports").select("*").order("week_start", { ascending: false }).limit(52);
  const reports = (data ?? []) as WeeklyReport[];
  const selected = reports.find((x) => x.id === r) ?? reports[0] ?? null;
  const d = (selected?.data ?? {}) as Data;
  const weekLabel = (iso: string) =>
    t.week.replace("{date}", new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`)));
  const num = (k: string) => (typeof d[k] === "number" ? (d[k] as number).toLocaleString(locale) : "—");
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(d.won_value ?? 0));
  const prev = Number(d.leads_prev ?? 0);
  const delta = prev ? Math.round(((Number(d.leads ?? 0) - prev) / prev) * 100) : null;
  const seconds = typeof d.chat_first_response_s === "number" ? d.chat_first_response_s : null;
  const firstResponse = seconds == null ? "—" : seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${(seconds / 3600).toFixed(1)} h`;
  const tiers = d.by_tier ?? {};

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={profile.role === "admin" ? <GenerateReportButton weekStart={lastMonday(new Date())} label={t.generate} busyLabel={t.generating} /> : undefined}
      />
      {!selected ? (
        <p className="rounded-3xl bg-surface p-10 text-center text-sm text-muted ring-1 ring-line dark:bg-card">{t.empty}</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label={t.title} className="flex gap-1.5 overflow-x-auto xl:flex-col">
            {reports.map((x) => (
              <Link
                key={x.id}
                href={`?r=${x.id}`}
                aria-current={x.id === selected.id ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold",
                  x.id === selected.id ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading hover:bg-surface",
                )}
              >
                {weekLabel(x.week_start)}
              </Link>
            ))}
          </nav>
          <div className="grid content-start gap-6">
            <h2 className="text-xl text-heading">{weekLabel(selected.week_start)}</h2>
            <section>
              <h3 className="mb-3 text-sm font-bold text-muted">{t.sections.sales}</h3>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label={t.metrics.leads} value={num("leads")} hint={delta !== null ? t.vsPrev.replace("{delta}", `${delta >= 0 ? "+" : ""}${delta}%`) : undefined} />
                <StatTile label={t.tiers} value={`${tiers.green ?? 0} / ${tiers.yellow ?? 0} / ${tiers.red ?? 0}`} />
                <StatTile label={t.metrics.meetings} value={num("meetings")} />
                <StatTile label={t.metrics.won} value={num("won")} hint={money} />
                <StatTile label={t.metrics.pipeline_open} value={num("pipeline_open")} />
                <StatTile label={t.metrics.visitors} value={num("visitors")} />
              </dl>
            </section>
            <section>
              <h3 className="mb-3 text-sm font-bold text-muted">{t.sections.service}</h3>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label={t.metrics.chats} value={num("chats")} hint={d.chats_answered_pct != null ? `${d.chats_answered_pct}% ${t.metrics.chats_answered_pct.toLowerCase()}` : undefined} />
                <StatTile label={t.metrics.chat_first_response_s} value={firstResponse} />
                <StatTile label={t.metrics.chat_rating} value={d.chat_rating != null ? `${d.chat_rating} / 5` : "—"} />
                <StatTile label={t.metrics.tickets_opened} value={num("tickets_opened")} hint={`${num("tickets_resolved")} · ${t.metrics.tickets_resolved.toLowerCase()}`} />
              </dl>
            </section>
            <section>
              <h3 className="mb-3 text-sm font-bold text-muted">{t.sections.marketing}</h3>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label={t.metrics.wa_sent} value={num("wa_sent")} hint={`${num("wa_read")} · ${t.metrics.wa_read.toLowerCase()}`} />
                <StatTile label={t.metrics.wa_replied} value={num("wa_replied")} />
                <StatTile label={t.metrics.emails_sent} value={num("emails_sent")} />
              </dl>
              {d.sources && d.sources.length > 0 && (
                <p className="mt-4 text-sm text-body">
                  <span className="font-semibold text-heading">{t.sources}:</span> {d.sources.map((s) => `${s.source} (${s.leads})`).join(" · ")}
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
