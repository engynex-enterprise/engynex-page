"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { supportProCopy } from "@/content/supportPro";
import { supportReportsCopy } from "@/content/supportReports";
import { ticketsCopy } from "@/content/tickets";
import type { Locale } from "@/i18n/config";
import { shortDuration } from "@/lib/supportSla";
import { ticketPriorities } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export type SupportKpis = {
  open: number;
  created: number;
  created_prev: number;
  resolved: number;
  first_response_s: number | null;
  first_response_prev_s: number | null;
  resolution_s: number | null;
  sla_met_pct: number | null;
  csat: number | null;
  csat_count: number;
  daily: { day: string; created: number; resolved: number }[] | null;
  by_category: { category: string; n: number }[];
  by_priority: Record<string, number>;
  agents: { id: string; name: string; open: number; resolved: number; first_response_s: number | null; csat: number | null }[];
};

const fmtDay = (locale: string, day: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

/** Reportes de la mesa de ayuda: métricas del periodo, tendencia diaria, temas, prioridades y equipo. */
export function SupportReports({ locale, data, categories }: { locale: Locale; data: SupportKpis; categories: { value: string; label: string }[] }) {
  const t = supportReportsCopy[locale];
  const pro = supportProCopy[locale];
  const tc = ticketsCopy[locale];
  const dur = (s: number | null) => (s == null ? "—" : shortDuration(s * 1000, pro.units));
  const delta = (now: number | null, prev: number | null) => (now != null && prev ? Math.round(((now - prev) / prev) * 100) : null);
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const catLabel = (key: string) => categories.find((c) => c.value === key)?.label ?? key;

  const kpis = [
    { key: "created", value: String(data.created ?? 0), d: delta(data.created, data.created_prev), neutral: true, prev: String(data.created_prev ?? 0) },
    { key: "resolved", value: String(data.resolved ?? 0) },
    { key: "firstResponse", value: dur(data.first_response_s), d: delta(data.first_response_s, data.first_response_prev_s), lowerIsBetter: true, prev: data.first_response_prev_s != null ? dur(data.first_response_prev_s) : undefined },
    { key: "resolution", value: dur(data.resolution_s) },
    { key: "slaMet", value: data.sla_met_pct != null ? `${data.sla_met_pct}%` : "—", hint: t.hints.slaHint },
    { key: "csat", value: data.csat != null ? `${data.csat} / 5` : "—", hint: data.csat_count ? t.hints.ratings.replace("{n}", String(data.csat_count)) : t.hints.noRatings },
  ] as { key: keyof typeof t.kpis; value: string; d?: number | null; lowerIsBetter?: boolean; neutral?: boolean; prev?: string; hint?: string }[];

  const priorities = ticketPriorities.map((p) => ({ label: tc.priority[p], value: data.by_priority?.[p] ?? 0 })).filter((r) => r.value > 0);
  // Etiquetas cortas: el eje tiene ancho fijo.
  const short = (s: string) => (s.length > 15 ? `${s.slice(0, 14).trimEnd()}…` : s);
  const cats = (data.by_category ?? []).slice(0, 8).map((c) => ({ label: short(catLabel(c.category)), value: c.n }));

  return (
    <div>
      <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((x) => {
          const good = x.d != null && (x.lowerIsBetter ? x.d <= 0 : x.d >= 0);
          return (
            <div key={x.key} className="border-b border-line px-6 py-4 sm:border-r xl:border-b-0 sm:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:[&:nth-child(6n)]:border-r-0">
              <p className="text-sm text-muted">{t.kpis[x.key]}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-[1.6rem] font-semibold leading-none tabular-nums text-heading">{x.value}</span>
                {x.d != null && x.d !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-sm font-semibold",
                      x.neutral ? "text-muted" : good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {x.d > 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                    {Math.abs(x.d)}%
                  </span>
                )}
              </p>
              <p className="mt-1 truncate text-xs text-muted">{x.hint ?? (x.prev != null ? t.hints.prev.replace("{v}", x.prev) : " ")}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 px-4 py-6 sm:px-6 xl:grid-cols-3">
        <section className={cn(card, "xl:col-span-2")}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.daily}</h2>
          <p className="mb-4 text-xs text-muted">{t.dailyHint}</p>
          <DailyChart locale={locale} rows={data.daily ?? []} />
        </section>

        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.byPriority}</h2>
          {priorities.length ? <HBarChart rows={priorities} valueLabel={t.requests} highlight={tc.priority.critical} /> : <p className="text-sm text-muted">{t.noData}</p>}
        </section>

        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.byCategory}</h2>
          {cats.length ? <HBarChart rows={cats} valueLabel={t.requests} /> : <p className="text-sm text-muted">{t.noData}</p>}
        </section>

        <section className={cn(card, "xl:col-span-2")}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.agents}</h2>
          <p className="mb-3 text-xs text-muted">{t.agentsHint}</p>
          {data.agents?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    {(["name", "open", "resolved", "firstResponse", "csat"] as const).map((c) => (
                      <th key={c} scope="col" className={cn("py-2.5 font-medium", c !== "name" && "text-right")}>
                        {t.agentCols[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 font-medium text-heading">{a.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{a.open}</td>
                      <td className="py-2.5 text-right tabular-nums">{a.resolved}</td>
                      <td className="py-2.5 text-right tabular-nums">{dur(a.first_response_s)}</td>
                      <td className="py-2.5 text-right tabular-nums">{a.csat != null ? `${a.csat} / 5` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">{t.noData}</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** Recibidas (barras) y resueltas (línea con puntos): forma distinta además del color. */
function DailyChart({ locale, rows }: { locale: Locale; rows: { day: string; created: number; resolved: number }[] }) {
  const t = supportReportsCopy[locale];
  const c = useChartTheme();
  const [table, setTable] = useState(false);
  const created = rows.reduce((n, d) => n + d.created, 0);
  const resolved = rows.reduce((n, d) => n + d.resolved, 0);
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-2 text-heading">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.single }} aria-hidden />
          {t.created} <span className="font-semibold tabular-nums">{created}</span>
        </li>
        <li className="flex items-center gap-2 text-heading">
          <span className="relative h-0.5 w-5 rounded" style={{ background: c.tiers.green }} aria-hidden>
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: c.tiers.green }} />
          </span>
          {t.resolvedSeries} <span className="font-semibold tabular-nums">{resolved}</span>
        </li>
      </ul>
      {table ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="py-2">{t.day}</th>
                <th className="py-2 text-right">{t.created}</th>
                <th className="py-2 text-right">{t.resolvedSeries}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="py-1.5">{fmtDay(locale, d.day)}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.created}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64" role="img" aria-label={`${t.created}: ${created}. ${t.resolvedSeries}: ${resolved}.`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="day" tickFormatter={(d: string) => fmtDay(locale, d)} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: c.grid, opacity: 0.4 }}
                content={(p) =>
                  p.active && p.payload?.length ? (
                    <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: c.tooltipBg, color: c.surface }}>
                      <p className="mb-1 font-semibold">{fmtDay(locale, String(p.label))}</p>
                      {p.payload.map((s) => (
                        <p key={String(s.name)} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                          <span className="flex-1">{String(s.name)}</span>
                          <span className="font-semibold tabular-nums">{Number(s.value ?? 0)}</span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="created" name={t.created} fill={c.single} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="resolved"
                name={t.resolvedSeries}
                stroke={c.tiers.green}
                strokeWidth={2}
                dot={{ r: 3, fill: c.tiers.green, stroke: c.surface, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <button type="button" onClick={() => setTable((v) => !v)} className="mt-2 text-xs font-semibold text-heading hover:underline">
        {table ? t.chart : t.table}
      </button>
    </div>
  );
}
