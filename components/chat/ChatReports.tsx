import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import { HBarChart, KpiSpark } from "@/components/portal/charts/HomeCharts";
import { ConversationsByDay, FirstResponseByDay, HeatMap, type HeatCell, type ReportDaily } from "./charts/ChatCharts";
import { chatReportsCopy, fmtDuration } from "@/content/chatReports";
import { chatProCopy } from "@/content/chatPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type ChatReport = {
  kpis: {
    conversations: number;
    conversations_prev: number;
    answered_pct: number | null;
    median_first_response_s: number | null;
    median_first_response_prev_s: number | null;
    rating_avg: number | null;
    ratings: number;
    leads: number;
    leads_pct: number | null;
    bot_answers: number;
    auto_closed: number;
  };
  daily: ReportDaily[];
  heat: HeatCell[];
  agents: { id: string; name: string; conversations: number; rating_avg: number | null; ratings: number; first_response_s: number | null; leads: number }[];
  channels: Record<string, number>;
  tags: { tag: string; n: number }[];
};

/**
 * Reportes del chat: métricas del periodo frente al anterior, volumen por
 * canal, primera respuesta, mapa de calor, asesores, etiquetas y canales.
 */
export function ChatReports({ locale, report: r, days }: { locale: Locale; report: ChatReport; days: number }) {
  const t = chatReportsCopy[locale].reports;
  const channelNames = chatProCopy[locale].channels;
  const base = `/${locale}/portal/chat/reportes`;
  const k = r.kpis;

  // Variación en %; "lowerIsBetter" pinta en verde cuando baja (tiempos).
  const delta = (now: number | null, prev: number | null, lowerIsBetter = false) => {
    if (now == null || prev == null || prev === 0) return null;
    const d = Math.round(((now - prev) / prev) * 1000) / 10;
    return { d, good: lowerIsBetter ? d <= 0 : d >= 0 };
  };

  const kpis = [
    {
      key: "conversations",
      value: k.conversations.toLocaleString(locale),
      delta: delta(k.conversations, k.conversations_prev),
      hint: null as string | null,
      series: r.daily.map((d) => d.web + d.whatsapp + d.social),
    },
    {
      key: "firstResponse",
      value: fmtDuration(locale, k.median_first_response_s),
      delta: delta(k.median_first_response_s, k.median_first_response_prev_s, true),
      hint: null,
      series: r.daily.map((d) => d.first_response_s ?? 0),
    },
    { key: "answered", value: k.answered_pct == null ? "—" : `${k.answered_pct}%`, delta: null, hint: null, series: null },
    {
      key: "rating",
      value: k.rating_avg == null ? "—" : `${k.rating_avg}`,
      delta: null,
      hint: t.ratingsN.replace("{n}", String(k.ratings)),
      series: null,
      star: k.rating_avg != null,
    },
    { key: "leads", value: k.leads_pct == null ? "—" : `${k.leads_pct}%`, delta: null, hint: t.leadsN.replace("{n}", String(k.leads)), series: null },
    { key: "bot", value: k.bot_answers.toLocaleString(locale), delta: null, hint: k.auto_closed ? t.autoClosed.replace("{n}", String(k.auto_closed)) : null, series: null },
  ] as const;

  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const cardTitle = (title: string, hint?: string) => (
    <div className="mb-4">
      <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
  const channelRows = Object.entries(r.channels)
    .map(([ch, n]) => ({ label: channelNames[ch] ?? ch, value: n }))
    .sort((a, b) => b.value - a.value);
  const tagRows = r.tags.map((x) => ({ label: `#${x.tag}`, value: x.n }));

  return (
    <>
      <div className="-mx-4 sm:-mx-6">
        {/* Periodo */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-line px-4 py-3 sm:px-6">
          <nav aria-label={t.range} className="flex rounded-[10px] bg-card-soft p-0.5">
            {(["7", "30", "90"] as const).map((x) => (
              <Link
                key={x}
                href={x === "30" ? base : `${base}?r=${x}`}
                aria-current={String(days) === x ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  String(days) === x ? "bg-surface text-heading shadow-[0_1px_2px_rgba(16,24,40,0.08)] dark:bg-card" : "text-muted hover:text-heading",
                )}
              >
                {t.ranges[x]}
              </Link>
            ))}
          </nav>
        </div>

        {/* Métricas */}
        <dl className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 [&>div]:border-b 2xl:[&>div]:border-b-0">
          {kpis.map((m) => (
            <div key={m.key} className="flex min-w-0 items-center justify-between gap-3 border-line px-6 py-5 sm:border-r 2xl:last:border-r-0">
              <div className="min-w-0">
                <dt className="truncate text-sm text-muted">{t.kpis[m.key]}</dt>
                <dd className="mt-1 flex items-baseline gap-2">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap text-[1.75rem] font-semibold leading-none tabular-nums text-heading">
                    {"star" in m && m.star && <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />}
                    {m.value}
                  </span>
                  {m.delta && (
                    <span
                      className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", m.delta.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                      title={t.vsPrev.replace("{n}", String(days))}
                    >
                      {m.delta.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                      {Math.abs(m.delta.d)}%
                    </span>
                  )}
                </dd>
                {m.hint && <dd className="mt-1 truncate text-xs text-muted">{m.hint}</dd>}
              </div>
              {m.series && m.series.some((v) => v > 0) && (
                <span className="2xl:hidden">
                  <KpiSpark data={[...m.series]} label={t.kpis[m.key]} />
                </span>
              )}
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className={card}>
          {cardTitle(t.byDay, t.byDayHint)}
          {k.conversations === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <ConversationsByDay data={r.daily} locale={locale} />}
        </section>
        <section className={card}>
          {cardTitle(t.firstByDay, t.firstByDayHint)}
          <FirstResponseByDay data={r.daily} locale={locale} />
        </section>
        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.heat, t.heatHint)}
          <HeatMap cells={r.heat} locale={locale} />
        </section>
        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.agents, t.agentsHint)}
          {r.agents.length === 0 ? (
            <p className="text-sm text-muted">{t.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-3 font-medium">{t.cols.agent}</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">{t.cols.conversations}</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">{t.cols.first}</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">{t.cols.rating}</th>
                    <th scope="col" className="py-2.5 pl-3 text-right font-medium">{t.cols.leads}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.agents.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-deep-700/10 text-[0.7rem] font-bold text-deep-700 dark:bg-white/10 dark:text-white">
                            {a.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                          </span>
                          <span className="truncate font-medium text-heading">{a.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-heading">{a.conversations}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-body">{fmtDuration(locale, a.first_response_s)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-body">
                        {a.rating_avg == null ? (
                          "—"
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {a.rating_avg} <span className="text-xs text-muted">({a.ratings})</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right tabular-nums text-heading">{a.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className={card}>
          {cardTitle(t.tags, t.tagsHint)}
          {tagRows.length === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <HBarChart rows={tagRows} valueLabel={t.conversationsLabel} />}
        </section>
        <section className={card}>
          {cardTitle(t.split, t.splitHint)}
          {channelRows.length === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <HBarChart rows={channelRows} valueLabel={t.conversationsLabel} />}
        </section>
      </div>
    </>
  );
}
