import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { LeadsTrend, TrafficTrend, type OverviewDay } from "@/components/analytics/OverviewCharts";
import { HBarChart, KpiSpark } from "@/components/portal/charts/HomeCharts";
import { analyticsProCopy } from "@/content/analyticsPro";
import { analyticsOverviewCopy } from "@/content/analyticsOverview";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { analyticsRange } from "@/lib/analyticsRange";
import { cn } from "@/lib/utils";

type Kpis = {
  visitors: number;
  new_visitors: number;
  sessions: number;
  page_views: number;
  pages_per_session: number | null;
  avg_session_ms: number;
  bounce_rate: number | null;
  leads: number;
  green: number;
  tracked_leads: number;
};
type Overview = { kpis: Kpis; prev: Kpis; daily: OverviewDay[]; live: number };
type Acquisition = { channels: { channel: string; visitors: number; leads: number }[] };
type Behavior = { pages: { path: string; views: number }[]; devices: Record<string, number> };
type Funnel = { visitors: number; leads: number; qualified: number; meetings: number; won: number };

const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s} s`;
};

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { from, to } = analyticsRange((await searchParams).r);
  const t = analyticsOverviewCopy[locale];
  const pro = analyticsProCopy[locale];

  const [{ data: ov }, { data: acq }, { data: beh }, { data: fun }] = await Promise.all([
    supabase.rpc("analytics_overview", { p_from: from, p_to: to }),
    supabase.rpc("analytics_acquisition", { p_from: from, p_to: to }),
    supabase.rpc("analytics_behavior", { p_from: from, p_to: to }),
    supabase.rpc("analytics_funnel", { p_from: from, p_to: to }),
  ]);
  const o = ov as unknown as Overview;
  const a = (acq ?? { channels: [] }) as unknown as Acquisition;
  const b = (beh ?? { pages: [], devices: {} }) as unknown as Behavior;
  const f = (fun ?? {}) as unknown as Funnel;
  const k = o.kpis;
  const p = o.prev;

  const delta = (now: number | null, prev: number | null) => (prev ? Math.round((((now ?? 0) - prev) / prev) * 100) : null);
  const conv = (x: Kpis) => (x.visitors ? (x.tracked_leads / x.visitors) * 100 : null);
  const kpis = [
    { key: "visitors", value: k.visitors.toLocaleString(locale), d: delta(k.visitors, p.visitors), series: o.daily.map((x) => x.visitors) },
    { key: "newVisitors", value: k.new_visitors.toLocaleString(locale), d: delta(k.new_visitors, p.new_visitors) },
    { key: "sessions", value: k.sessions.toLocaleString(locale), d: delta(k.sessions, p.sessions) },
    { key: "pagesPerSession", value: k.pages_per_session != null ? String(k.pages_per_session) : "—", d: delta(k.pages_per_session, p.pages_per_session) },
    { key: "sessionTime", value: k.sessions ? duration(k.avg_session_ms) : "—", d: delta(k.avg_session_ms, p.avg_session_ms) },
    { key: "bounce", value: k.bounce_rate != null ? `${k.bounce_rate}%` : "—", d: delta(k.bounce_rate, p.bounce_rate), lowerIsBetter: true },
    { key: "leads", value: k.leads.toLocaleString(locale), d: delta(k.leads, p.leads), series: o.daily.map((x) => x.leads) },
    { key: "conversion", value: conv(k) != null ? `${conv(k)!.toFixed(1)}%` : "—", d: delta(conv(k), conv(p)) },
  ] as { key: keyof typeof t.kpis; value: string; d: number | null; lowerIsBetter?: boolean; series?: number[] }[];

  // Lo más importante, escrito.
  const insights: string[] = [];
  const dv = delta(k.visitors, p.visitors);
  if (dv != null && Math.abs(dv) >= 5) insights.push((dv > 0 ? t.insight.up : t.insight.down).replace("{n}", String(Math.abs(dv))));
  const best = [...a.channels].sort((x, y) => y.leads - x.leads)[0];
  if (best?.leads) insights.push(t.insight.bestChannel.replace("{channel}", pro.channels[best.channel] ?? best.channel).replace("{n}", String(best.leads)));
  if (b.pages[0]) insights.push(t.insight.topPage.replace("{path}", b.pages[0].path).replace("{n}", String(b.pages[0].views)));
  const devTotal = Object.values(b.devices).reduce((n, v) => n + v, 0);
  const mobile = devTotal ? Math.round(((b.devices.mobile ?? 0) / devTotal) * 100) : 0;
  if (mobile >= 50) insights.push(t.insight.mobile.replace("{n}", String(mobile)));
  if ((k.bounce_rate ?? 0) >= 60 && k.sessions >= 10) insights.push(t.insight.bounce.replace("{n}", String(k.bounce_rate)));
  if (k.visitors < 5) insights.push(t.insight.noData);

  const base = `/${locale}/portal/analitica`;
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const head = (title: string, href?: string, hint?: string) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline">
          {t.seeAll}
        </Link>
      )}
    </div>
  );
  const funnel = (["visitors", "leads", "qualified", "meetings", "won"] as const).map((key) => ({ label: t.funnelSteps[key], value: f[key] ?? 0 }));

  return (
    <>
      <PageHeader title={pro.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AnalyticsNav locale={locale} live={o.live} />

        {/* Métricas */}
        <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((x) => {
            const good = x.d != null && (x.lowerIsBetter ? x.d <= 0 : x.d >= 0);
            return (
              <div key={x.key} className="flex items-center justify-between gap-3 border-b border-line px-6 py-4 sm:border-r lg:[&:nth-child(4n)]:border-r-0 lg:[&:nth-last-child(-n+4)]:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm text-muted">{t.kpis[x.key]}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-[1.7rem] font-semibold leading-none tabular-nums text-heading">{x.value}</span>
                    {x.d != null && (
                      <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {x.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                        {Math.abs(x.d)}%
                      </span>
                    )}
                  </p>
                  {x.d != null && <p className="mt-1 text-xs text-muted">{pro.vsPrev}</p>}
                </div>
                {x.series && x.series.some((n) => n > 0) && <KpiSpark data={x.series} label={t.kpis[x.key]} />}
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 px-4 py-6 sm:px-6 xl:grid-cols-3">
          <section className={cn(card, "xl:col-span-2")}>
            {head(t.traffic, undefined, t.trafficHint)}
            <TrafficTrend locale={locale} data={o.daily} labels={t.labels} />
          </section>

          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
              <Lightbulb className="h-4 w-4 text-accent" aria-hidden />
              {t.insights}
            </h2>
            <ul className="grid gap-2.5">
              {insights.map((text) => (
                <li key={text} className="rounded-xl bg-[var(--meta-active)]/50 px-3.5 py-2.5 text-sm leading-relaxed text-heading">
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">{pro.consentNote}</p>
          </section>

          <section className={cn(card, "xl:col-span-2")}>
            {head(t.leadsByDay, `${base}/conversiones`, t.leadsHint)}
            <LeadsTrend locale={locale} data={o.daily} labels={t.labels} />
          </section>

          <section className={card}>
            {head(t.funnel, `${base}/conversiones`)}
            {f.visitors ? <HBarChart rows={funnel} valueLabel={t.labels.visitors} highlight={t.funnelSteps.won} /> : <p className="text-sm text-muted">{t.noData}</p>}
          </section>

          <section className={card}>
            {head(t.channels, `${base}/adquisicion`)}
            {a.channels.length ? (
              <HBarChart rows={a.channels.slice(0, 6).map((c) => ({ label: pro.channels[c.channel] ?? c.channel, value: c.visitors }))} valueLabel={t.labels.visitors} />
            ) : (
              <p className="text-sm text-muted">{t.noData}</p>
            )}
          </section>

          <section className={card}>
            {head(t.topPages, `${base}/comportamiento`)}
            {b.pages.length ? (
              <ol className="grid gap-2">
                {b.pages.slice(0, 7).map((pg) => (
                  <li key={pg.path} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-mono text-[0.8rem] text-heading">{pg.path}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {pg.views.toLocaleString(locale)} {t.views}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">{t.noData}</p>
            )}
          </section>

          <section className={card}>
            {head(t.devices, `${base}/comportamiento`)}
            {devTotal ? (
              <HBarChart
                rows={Object.entries(b.devices)
                  .sort((x, y) => y[1] - x[1])
                  .map(([key, v]) => ({ label: pro.devices[key] ?? key, value: v }))}
                valueLabel={t.labels.visitors}
              />
            ) : (
              <p className="text-sm text-muted">{t.noData}</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
