"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { cn } from "@/lib/utils";

export type OverviewDay = { day: string; visitors: number; views: number; prev_visitors: number; leads: number; green: number };

type Labels = {
  visitors: string;
  views: string;
  previous: string;
  leads: string;
  green: string;
  others: string;
  day: string;
  table: string;
  chart: string;
};

const fmtDay = (locale: string, day: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

function Tip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; name?: unknown; color?: string }>;
  label?: unknown;
  locale: string;
}) {
  const c = useChartTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: c.tooltipBg, color: c.surface }}>
      <p className="mb-1 font-semibold">{fmtDay(locale, String(label))}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="flex-1">{String(p.name)}</span>
          <span className="font-semibold tabular-nums">{Number(p.value ?? 0).toLocaleString(locale)}</span>
        </p>
      ))}
    </div>
  );
}

/** Tráfico por día: visitantes (o vistas) y la línea del periodo anterior. */
export function TrafficTrend({ locale, data, labels }: { locale: string; data: OverviewDay[]; labels: Labels }) {
  const c = useChartTheme();
  const [metric, setMetric] = useState<"visitors" | "views">("visitors");
  const [table, setTable] = useState(false);
  const total = data.reduce((n, d) => n + d[metric], 0);
  const prevTotal = data.reduce((n, d) => n + d.prev_visitors, 0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]" role="group">
          {(["visitors", "views"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={cn("rounded-lg px-3 py-1 text-sm", metric === m ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted")}
            >
              {labels[m]}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap gap-4 text-sm">
          <li className="flex items-center gap-2 text-heading">
            <span className="h-0.5 w-5 rounded" style={{ background: c.single }} aria-hidden />
            {labels[metric]} <span className="font-semibold tabular-nums">{total.toLocaleString(locale)}</span>
          </li>
          {metric === "visitors" && (
            <li className="flex items-center gap-2 text-muted">
              <span className="w-5 border-t-2 border-dashed" style={{ borderColor: c.axis }} aria-hidden />
              {labels.previous} <span className="font-semibold tabular-nums">{prevTotal.toLocaleString(locale)}</span>
            </li>
          )}
        </ul>
      </div>
      {table ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="py-2">{labels.day}</th>
                <th className="py-2 text-right">{labels.visitors}</th>
                <th className="py-2 text-right">{labels.views}</th>
                <th className="py-2 text-right">{labels.previous}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="py-1.5">{fmtDay(locale, d.day)}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.visitors}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.views}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.prev_visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72" role="img" aria-label={`${labels[metric]}: ${total}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="day" tickFormatter={(d: string) => fmtDay(locale, d)} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={(p) => <Tip {...(p as object)} locale={locale} />} cursor={{ stroke: c.grid }} />
              {metric === "visitors" && (
                <Line type="monotone" dataKey="prev_visitors" name={labels.previous} stroke={c.axis} strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              )}
              <Line type="monotone" dataKey={metric} name={labels[metric]} stroke={c.single} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <button type="button" onClick={() => setTable((v) => !v)} className="mt-2 text-xs font-semibold text-heading hover:underline">
        {table ? labels.chart : labels.table}
      </button>
    </div>
  );
}

/** Leads por día: verdes y el resto, apilados. */
export function LeadsTrend({ locale, data, labels }: { locale: string; data: OverviewDay[]; labels: Labels }) {
  const c = useChartTheme();
  const rows = data.map((d) => ({ day: d.day, green: d.green, others: Math.max(0, d.leads - d.green) }));
  const green = rows.reduce((n, d) => n + d.green, 0);
  const others = rows.reduce((n, d) => n + d.others, 0);
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-2 text-heading">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.tiers.green }} aria-hidden />
          {labels.green} <span className="font-semibold tabular-nums">{green}</span>
        </li>
        <li className="flex items-center gap-2 text-heading">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.single }} aria-hidden />
          {labels.others} <span className="font-semibold tabular-nums">{others}</span>
        </li>
      </ul>
      <div className="h-56" role="img" aria-label={`${labels.leads}: ${green + others}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="day" tickFormatter={(d: string) => fmtDay(locale, d)} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={28} />
            <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={(p) => <Tip {...(p as object)} locale={locale} />} cursor={{ fill: c.grid, opacity: 0.4 }} />
            <Bar dataKey="green" name={labels.green} stackId="l" fill={c.tiers.green} stroke={c.surface} strokeWidth={1} isAnimationActive={false} />
            <Bar dataKey="others" name={labels.others} stackId="l" fill={c.single} stroke={c.surface} strokeWidth={1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
