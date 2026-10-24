"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { followupReportsCopy } from "@/content/followupReports";
import type { Locale } from "@/i18n/config";

/**
 * Tres series (secuencia, automáticos, internos) con la misma paleta de
 * canales del chat, ya validada con validate_palette.js en claro y oscuro.
 */
const SERIES_COLORS = {
  light: { sequence: "#3b5bdb", automation: "#1d8a73", internal: "#c2410c" },
  dark: { sequence: "#5b7be8", automation: "#1f9e78", internal: "#d2691e" },
};
const KEYS = ["sequence", "automation", "internal"] as const;

export type SentDaily = { day: string; sequence: number; automation: number; internal: number; opened: number };

const dayFmt = (locale: string) => (d: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));

/** Correos enviados por día, apilados por tipo. Leyenda con totales, tooltip y tabla. */
export function SentByDay({ data, locale }: { data: SentDaily[]; locale: Locale }) {
  const t = followupReportsCopy[locale];
  const c = useChartTheme();
  const colors = c.surface === "#ffffff" ? SERIES_COLORS.light : SERIES_COLORS.dark;
  const [table, setTable] = useState(false);
  const fmtDay = dayFmt(locale);
  const totals = Object.fromEntries(KEYS.map((k) => [k, data.reduce((s, r) => s + r[k], 0)])) as Record<(typeof KEYS)[number], number>;
  const keys = KEYS.filter((k) => k === "sequence" || totals[k] > 0);

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {keys.map((k) => (
          <li key={k} className="flex items-center gap-2 text-body">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[k] }} aria-hidden />
            {t.series[k]} <span className="font-semibold tabular-nums text-heading">{totals[k]}</span>
          </li>
        ))}
      </ul>
      <div className="h-60" role="img" aria-label={`${t.byDay}: ${keys.map((k) => `${t.series[k]} ${totals[k]}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap={data.length > 40 ? 1 : 3}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(2, Math.ceil((max * 1.2) / 2) * 2)]} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: c.grid, opacity: 0.6 }}
              content={(p) => {
                if (!p.active || !p.payload?.length) return null;
                const row = p.payload[0].payload as SentDaily;
                return (
                  <div className="rounded-lg bg-[#18181b] px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-[#18181b]">
                    <p className="mb-1 font-semibold">{fmtDay(String(p.label))}</p>
                    {keys.map((k) => (
                      <p key={k} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: colors[k] }} aria-hidden />
                        <span className="opacity-80">{t.series[k]}</span>
                        <span className="ml-auto pl-3 font-semibold tabular-nums">{row[k]}</span>
                      </p>
                    ))}
                    <p className="mt-1 border-t border-white/20 pt-1 font-semibold tabular-nums dark:border-black/10">
                      Total: {keys.reduce((s, k) => s + row[k], 0)}
                    </p>
                  </div>
                );
              }}
            />
            {keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={t.series[k]}
                stackId="sent"
                fill={colors[k]}
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
        {table ? t.hideTable : t.table}
      </button>
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{t.day}</th>
              {keys.map((k) => (
                <th key={k} scope="col" className="py-1 text-right font-semibold">{t.series[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.filter((r) => keys.some((k) => r[k] > 0)).map((r) => (
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
