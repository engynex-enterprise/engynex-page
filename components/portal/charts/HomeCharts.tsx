"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "./theme";
import { cn } from "@/lib/utils";

/* ---------------- Minigráfica de las métricas ---------------- */

export function KpiSpark({ data, label }: { data: number[]; label: string }) {
  const c = useChartTheme();
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-11 w-28 shrink-0" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`spark-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.25} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={c.accent}
            strokeWidth={2}
            fill={`url(#spark-${label.replace(/\W/g, "")})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Tooltip común ---------------- */

function Tip({
  active,
  payload,
  label,
  format,
  title,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown; name?: unknown; color?: string }>;
  label?: unknown;
  format?: (v: number) => string;
  title?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + Number(p.value ?? 0), 0);
  return (
    <div className="rounded-lg bg-[#18181b] px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-[#18181b]">
      <p className="mb-1 font-semibold">{title ? title(String(label)) : String(label)}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="opacity-80">{String(p.name)}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{format ? format(Number(p.value)) : String(p.value)}</span>
        </p>
      ))}
      {payload.length > 1 && (
        <p className="mt-1 border-t border-white/20 pt-1 font-semibold tabular-nums dark:border-black/10">Total: {total}</p>
      )}
    </div>
  );
}

/* ---------------- Leads por día, apilados por color ---------------- */

export type DailyRow = { day: string; green: number; yellow: number; red: number };

export function LeadsByDayChart({
  data,
  labels,
  locale,
  tableLabel,
  dayLabel,
}: {
  data: DailyRow[];
  labels: { green: string; yellow: string; red: string };
  locale: string;
  tableLabel: string;
  dayLabel: string;
}) {
  const c = useChartTheme();
  const [table, setTable] = useState(false);
  const fmtDay = (d: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));
  const keys = ["green", "yellow", "red"] as const;
  const totals = Object.fromEntries(keys.map((k) => [k, data.reduce((s, r) => s + r[k], 0)])) as Record<(typeof keys)[number], number>;

  return (
    <div>
      {/* Leyenda con totales (la identidad nunca va solo por color) */}
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {keys.map((k) => (
          <li key={k} className="flex items-center gap-2 text-body">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.tiers[k] }} aria-hidden />
            {labels[k]} <span className="font-semibold tabular-nums text-heading">{totals[k]}</span>
          </li>
        ))}
      </ul>
      <div className="h-64" role="img" aria-label={`${labels.green}, ${labels.yellow}, ${labels.red}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap={data.length > 40 ? 1 : 3}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="day"
              tickFormatter={fmtDay}
              tick={{ fill: c.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(2, Math.ceil(max * 1.25))]} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: c.grid, opacity: 0.6 }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} title={fmtDay} />} />
            {keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={labels[k]}
                stackId="tier"
                fill={c.tiers[k]}
                stroke={c.surface}
                strokeWidth={1}
                radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="mt-2 text-xs font-semibold text-muted hover:text-heading">
        {tableLabel}
      </button>
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{dayLabel}</th>
              {keys.map((k) => (
                <th key={k} scope="col" className="py-1 text-right font-semibold">{labels[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.filter((r) => r.green + r.yellow + r.red > 0).map((r) => (
              <tr key={r.day}>
                <td className="py-1 text-body">{fmtDay(r.day)}</td>
                {keys.map((k) => (
                  <td key={k} className="py-1 text-right tabular-nums text-heading">{r[k]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Barras horizontales (un solo tono) ---------------- */

export function HBarChart({
  rows,
  valueLabel,
  currency,
  highlight,
}: {
  rows: { label: string; value: number; sub?: string }[];
  valueLabel: string;
  /** Muestra los valores como pesos colombianos abreviados. */
  currency?: boolean;
  /** Resalta una barra (p. ej. "Ganado") con el acento; el resto en un tono. */
  highlight?: string;
}) {
  const c = useChartTheme();
  const height = Math.max(120, rows.length * 40);
  const format = currency
    ? (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v)
    : undefined;
  return (
    <div style={{ height }} role="img" aria-label={rows.map((r) => `${r.label}: ${r.value}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={112} tick={{ fill: c.axis, fontSize: 13 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: c.grid, opacity: 0.6 }} content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} format={format} />} />
          <Bar dataKey="value" name={valueLabel} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} background={{ fill: c.grid, radius: 4 }}>
            {rows.map((r) => (
              <Cell key={r.label} fill={r.label === highlight ? c.accent : c.single} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => (format ? format(Number(v)) : String(v))} style={{ fill: "currentColor", fontSize: 13, fontWeight: 600 }} className={cn("text-heading")} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
