import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { BarList, DailyBars, StatTile, seriesTone } from "@/components/analytics/Charts";
import { analyticsCopy } from "@/content/analytics";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { bogotaRange } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface Summary {
  visitors: number;
  sessions: number;
  page_views: number;
  avg_duration_ms: number;
  leads: number;
  leads_by_tier: Record<string, number>;
  daily: { day: string; visitors: number; views: number; leads: number }[];
  top_pages: { path: string; views: number; visitors: number; avg_scroll: number }[];
  sources: { source: string; visitors: number; leads: number }[];
  devices: Record<string, number>;
  countries: { country: string; visitors: number }[];
  lead_pages: { path: string | null; leads: number; green: number }[];
  live: number;
}

const RANGES = ["7", "30", "90"] as const;

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { range: raw } = await searchParams;
  const range = RANGES.includes(raw as (typeof RANGES)[number]) ? (raw as (typeof RANGES)[number]) : "30";
  const t = analyticsCopy[locale];

  const { from, to } = bogotaRange(Number(range));
  const [{ data }, { data: tracked }] = await Promise.all([
    supabase.rpc("analytics_summary", { p_from: from, p_to: to }),
    supabase.rpc("analytics_tracked_leads", { p_from: from, p_to: to }),
  ]);
  const s = data as unknown as Summary;

  const fmtDay = (day: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  const seconds = Math.round(s.avg_duration_ms / 1000);
  const avgTime = seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : `${seconds} ${t.seconds}`;
  // Leads de visitantes medidos / visitantes medidos (los que no aceptaron
  // analítica no cuentan en ninguno de los dos lados).
  const conversion = s.visitors ? `${(((tracked ?? 0) / s.visitors) * 100).toFixed(1)}%` : "—";
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line dark:bg-card">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t.live.replace("{n}", String(s.live))}
            </span>
            <Link href={`/${locale}/portal/analitica/visitantes`} className="inline-flex items-center gap-1 text-sm font-semibold text-heading hover:underline">
              {t.visitorsLink}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        }
      />

      {/* Filtro de periodo: una sola fila arriba de las gráficas */}
      <nav aria-label="Periodo" className="mb-6 flex gap-1.5">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/${locale}/portal/analitica?range=${r}`}
            aria-current={r === range ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              r === range ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface",
            )}
          >
            {t.ranges[r]}
          </Link>
        ))}
      </nav>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label={t.kpis.visitors} value={s.visitors.toLocaleString(locale)} />
        <StatTile label={t.kpis.sessions} value={s.sessions.toLocaleString(locale)} />
        <StatTile label={t.kpis.pageViews} value={s.page_views.toLocaleString(locale)} />
        <StatTile label={t.kpis.avgTime} value={s.page_views ? avgTime : "—"} />
        <StatTile label={t.kpis.leads} value={s.leads.toLocaleString(locale)} />
        <StatTile label={t.kpis.conversion} value={conversion} hint={t.kpis.conversionHint} />
      </dl>

      {/* Dos gráficas con el mismo eje de días (nunca dos escalas en una) */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DailyBars
          title={t.dailyVisitors}
          data={s.daily.map((d) => ({ day: d.day, value: d.visitors }))}
          tone={seriesTone.visitors}
          formatDay={fmtDay}
          tableLabel={t.showTable}
          dayLabel={t.day}
        />
        <DailyBars
          title={t.dailyLeads}
          data={s.daily.map((d) => ({ day: d.day, value: d.leads }))}
          tone={seriesTone.leads}
          formatDay={fmtDay}
          tableLabel={t.showTable}
          dayLabel={t.day}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BarList
          title={t.topPages}
          valueLabel={t.views}
          extra={t.scroll}
          empty={t.empty}
          rows={s.top_pages.map((p) => ({ label: p.path, value: p.views, extra: `${p.avg_scroll}%` }))}
        />
        <BarList
          title={t.sources}
          valueLabel={t.visitorsCol}
          extra={t.leadsCol}
          empty={t.empty}
          rows={s.sources.map((r) => ({
            label: t.sourceNames[r.source] ?? r.source,
            value: r.visitors,
            extra: String(r.leads),
          }))}
        />
        <BarList
          title={t.leadPages}
          valueLabel={t.leadsCol}
          extra={t.greenCol}
          tone={seriesTone.leads}
          empty={t.empty}
          rows={s.lead_pages.map((r) => ({ label: r.path ?? "—", value: r.leads, extra: String(r.green) }))}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <BarList
            title={t.devices}
            valueLabel={t.visitorsCol}
            empty={t.empty}
            rows={Object.entries(s.devices)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => ({ label: t.deviceNames[k] ?? k, value: v }))}
          />
          <BarList
            title={t.countries}
            valueLabel={t.visitorsCol}
            empty={t.noCountry}
            rows={s.countries.map((c) => ({ label: regionNames.of(c.country) ?? c.country, value: c.visitors }))}
          />
        </div>
      </div>
    </>
  );
}
