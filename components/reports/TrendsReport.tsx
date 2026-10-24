"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { reportsTeamCopy } from "@/content/reportsTeam";
import { crmCopy, pipeline as statusOrder } from "@/content/crm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type TrendRow = { month: string; visitors: number; leads: number; green: number; meetings: number; won: number; won_value: number };
export type PipelineData = {
  stages: { stage: string; deals: number; value: number; weighted: number }[];
  open_value: number;
  weighted: number;
  closing_month: number;
  overdue_close: number;
  leads_by_status: Record<string, number>;
  win_rate: number | null;
};

type Series = { key: string; name: string; color: string };

function Tip({
  active,
  payload,
  label,
  title,
  format,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown; name?: unknown; color?: string }>;
  label?: unknown;
  title: (l: string) => string;
  format: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#18181b] px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-[#18181b]">
      <p className="mb-1 font-semibold">{title(String(label))}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="opacity-80">{String(p.name)}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

/** Tarjeta con gráfica y su alternativa en tabla. */
function ChartCard({
  title,
  hint,
  legend,
  rows,
  columns,
  table,
  chart,
}: {
  title: string;
  hint?: string;
  legend?: ReactNode;
  rows: TrendRow[];
  columns: { label: string; value: (r: TrendRow) => string }[];
  table: { show: string; hide: string; head: string; month: (m: string) => string };
  chart: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="break-inside-avoid rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {legend && <div className="mt-3">{legend}</div>}
      {asTable ? (
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{table.head}</th>
              {columns.map((c) => (
                <th key={c.label} scope="col" className="py-1 text-right font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.month}>
                <td className="py-1 text-body">{table.month(r.month)}</td>
                {columns.map((c) => (
                  <td key={c.label} className="py-1 text-right tabular-nums text-heading">{c.value(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-3 h-60">{chart}</div>
      )}
      <button type="button" onClick={() => setAsTable((v) => !v)} aria-expanded={asTable} className="mt-2 text-xs font-semibold text-muted hover:text-heading print:hidden">
        {asTable ? table.hide : table.show}
      </button>
    </section>
  );
}

function Legend({ items }: { items: { name: string; color: string; value: string; line?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2 text-body">
          <span className={i.line ? "h-0.5 w-4 rounded" : "h-2.5 w-2.5 rounded-sm"} style={{ background: i.color }} aria-hidden />
          {i.name} <span className="font-semibold tabular-nums text-heading">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Tendencias por mes (leads, valor ganado, visitantes y conversión) y el
 * pipeline con su pronóstico ponderado.
 */
export function TrendsReport({ locale, rows, pipeline }: { locale: Locale; rows: TrendRow[]; pipeline: PipelineData | null }) {
  const t = reportsTeamCopy[locale].trends;
  const crm = crmCopy[locale];
  const c = useChartTheme();

  const monthLabel = (m: string) => {
    const s = new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const monthLong = (m: string) => {
    const s = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "COP", currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 1 }).format(n);
  const num = (n: number) => n.toLocaleString(locale);
  const conv = (r: TrendRow) => (r.visitors ? Math.round((r.leads / r.visitors) * 1000) / 10 : null);

  const data = rows.map((r) => ({ ...r, others: Math.max(0, r.leads - r.green), conversion: conv(r) }));
  const last = rows.at(-1);
  const prev = rows.at(-2);
  const total = (k: keyof TrendRow) => rows.reduce((s, r) => s + Number(r[k]), 0);
  const tableLabels = { show: t.table, hide: t.chart, head: t.labels.month, month: monthLong };
  const othersName = `${crm.tier.yellow} / ${crm.tier.red}`;

  const axis = { tick: { fill: c.axis, fontSize: 12 }, axisLine: false, tickLine: false } as const;
  const margin = { top: 4, right: 8, bottom: 0, left: -12 };

  const kpis = (["leads", "green", "meetings", "won", "won_value"] as const).map((k) => {
    const now = last?.[k] ?? 0;
    const before = prev?.[k] ?? 0;
    return { key: k, value: k === "won_value" ? money(now) : num(now), d: before ? Math.round(((now - before) / before) * 100) : null };
  });

  const leadSeries: Series[] = [
    { key: "green", name: t.labels.green, color: c.tiers.green },
    { key: "others", name: othersName, color: c.single },
  ];

  return (
    <div className="grid gap-5">
      {/* Este mes frente al anterior */}
      <div className="-mx-4 grid border-y border-line sm:-mx-6 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.key} className="border-line px-6 py-4 sm:border-r xl:last:border-r-0">
            <p className="text-sm text-muted">
              {t.kpis[k.key]} · {t.thisMonth.toLowerCase()}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[1.7rem] font-semibold leading-none tabular-nums text-heading">{k.value}</span>
              {k.d != null && (
                <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", k.d >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {k.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                  {Math.abs(k.d)}%
                </span>
              )}
            </p>
            {k.d != null && <p className="mt-1 text-xs text-muted">{t.vsLast}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title={t.leadsTitle}
          hint={`${t.leadsHint} · ${t.labels.leads}: ${num(total("leads"))}`}
          rows={rows}
          table={tableLabels}
          legend={
            <Legend
              items={[
                { name: t.labels.green, color: c.tiers.green, value: num(total("green")) },
                { name: othersName, color: c.single, value: num(total("leads") - total("green")) },
              ]}
            />
          }
          columns={[
            { label: t.labels.leads, value: (r) => num(r.leads) },
            { label: t.labels.green, value: (r) => num(r.green) },
          ]}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={margin}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={8} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip cursor={{ fill: c.grid, opacity: 0.6 }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} title={monthLong} format={num} />} />
                {leadSeries.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} stackId="l" fill={s.color} stroke={c.surface} strokeWidth={1} radius={i === leadSeries.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={32} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          }
        />

        <ChartCard
          title={t.valueTitle}
          hint={t.valueHint.replace("{total}", money(total("won_value")))}
          rows={rows}
          table={tableLabels}
          columns={[{ label: t.labels.value, value: (r) => money(r.won_value) }]}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ ...margin, left: 4 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={8} />
                <YAxis tickFormatter={(v: number) => money(v)} {...axis} width={64} />
                <Tooltip cursor={{ fill: c.grid, opacity: 0.6 }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} title={monthLong} format={money} />} />
                <Bar dataKey="won_value" name={t.labels.value} fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          }
        />

        <ChartCard
          title={t.visitorsTitle}
          rows={rows}
          table={tableLabels}
          columns={[{ label: t.labels.visitors, value: (r) => num(r.visitors) }]}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={margin}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={8} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip cursor={{ stroke: c.grid }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} title={monthLong} format={num} />} />
                <Line type="monotone" dataKey="visitors" name={t.labels.visitors} stroke={c.single} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          }
        />

        <ChartCard
          title={t.conversionTitle}
          hint={t.conversionHint}
          rows={rows}
          table={tableLabels}
          columns={[{ label: t.labels.conversion, value: (r) => (conv(r) == null ? "—" : `${conv(r)}%`) }]}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={margin}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} minTickGap={8} />
                <YAxis tickFormatter={(v: number) => `${v}%`} {...axis} />
                <Tooltip cursor={{ stroke: c.grid }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} title={monthLong} format={(v) => `${v}%`} />} />
                <Line type="monotone" dataKey="conversion" name={t.labels.conversion} stroke={c.accent} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Pipeline y pronóstico */}
      <section className="break-inside-avoid rounded-xl border border-line bg-surface p-5 dark:bg-card">
        <h2 className="text-[0.98rem] font-semibold text-heading">{t.pipeline}</h2>
        <p className="text-xs text-muted">{t.pipelineHint}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: t.open, value: money(pipeline?.open_value ?? 0) },
            { label: t.weighted, value: money(pipeline?.weighted ?? 0), accent: true },
            { label: t.closing, value: money(pipeline?.closing_month ?? 0) },
            { label: t.overdue, value: num(pipeline?.overdue_close ?? 0), hint: t.overdueHint, warn: (pipeline?.overdue_close ?? 0) > 0 },
            { label: t.winRate, value: pipeline?.win_rate != null ? `${pipeline.win_rate}%` : "—" },
          ].map((x) => (
            <div key={x.label} className={cn("rounded-xl px-4 py-3", x.accent ? "bg-[var(--meta-active)]" : "bg-card-soft dark:bg-white/[0.05]")}>
              <dt className="text-xs text-muted">{x.label}</dt>
              <dd className={cn("mt-1 text-xl font-semibold tabular-nums text-heading", x.warn && "text-red-600 dark:text-red-400")}>{x.value}</dd>
              {x.hint && <dd className="text-[0.7rem] text-muted">{x.hint}</dd>}
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-heading">{t.stagesTitle}</h3>
            {pipeline?.stages.length ? (
              <>
                <HBarChart rows={pipeline.stages.map((s) => ({ label: t.stages[s.stage] ?? s.stage, value: s.value }))} valueLabel={t.stageValue} currency />
                <table className="mt-3 w-full text-left text-xs">
                  <thead className="text-muted">
                    <tr>
                      <th scope="col" className="py-1 font-semibold" />
                      <th scope="col" className="py-1 text-right font-semibold">{t.stageValue}</th>
                      <th scope="col" className="py-1 text-right font-semibold">{t.stageWeighted}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {pipeline.stages.map((s) => (
                      <tr key={s.stage}>
                        <td className="py-1 text-body">
                          {t.stages[s.stage] ?? s.stage} <span className="text-muted">· {t.deals.replace("{n}", String(s.deals))}</span>
                        </td>
                        <td className="py-1 text-right tabular-nums text-heading">{money(s.value)}</td>
                        <td className="py-1 text-right tabular-nums text-heading">{money(s.weighted)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="rounded-xl bg-card-soft px-4 py-3 text-sm text-muted dark:bg-white/[0.05]">{t.noDeals}</p>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-heading">{t.byStatus}</h3>
            {pipeline && Object.keys(pipeline.leads_by_status).length ? (
              <HBarChart
                rows={statusOrder.map((s) => ({ label: crm.status[s], value: pipeline.leads_by_status[s] ?? 0 }))}
                valueLabel={t.labels.leads}
                highlight={crm.status.won}
              />
            ) : (
              <p className="text-sm text-muted">{t.noData}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
