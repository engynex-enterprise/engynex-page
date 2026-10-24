"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { Select } from "@/components/ui/Select";
import { automationsProCopy } from "@/content/automationsPro";
import { rulesCopy, type ActionType } from "@/content/rules";
import type { Locale } from "@/i18n/config";

export type AutomationStatsData = {
  total: number;
  failed: number;
  pending: number;
  daily: { day: string; done: number; failed: number }[];
  by_rule: { rule_id: string; runs: number; failed: number }[];
  by_action: Record<string, number>;
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

/** Estadísticas: ejecuciones por día, reglas que más trabajan y acciones realizadas. */
export function AutomationStats({
  locale,
  days,
  data,
  rules,
}: {
  locale: Locale;
  days: number;
  data: AutomationStatsData;
  rules: { id: string; name: string }[];
}) {
  const t = automationsProCopy[locale];
  const r = rulesCopy;
  const c = useChartTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [table, setTable] = useState(false);
  const names = Object.fromEntries(rules.map((x) => [x.id, x.name]));
  const done = data.total - data.failed;
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const actions = Object.entries(data.by_action)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: r.actions.types[k as ActionType]?.label ?? k, value: v }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        <div className="w-48">
          <Select
            size="sm"
            label={t.stats.period}
            value={String(days)}
            onChange={(v) => router.push(`${pathname}?tab=estadisticas${v === "30" ? "" : `&d=${v}`}`)}
            options={["7", "30", "90"].map((v) => ({ value: v, label: t.stats.periods[v] }))}
          />
        </div>
      </div>

      <div className="grid gap-5 px-4 py-6 sm:px-6 xl:grid-cols-3">
        <section className={`${card} xl:col-span-2`}>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[0.98rem] font-semibold text-heading">{t.stats.daily}</h2>
              <p className="text-xs text-muted">{t.stats.dailyHint}</p>
            </div>
            <ul className="flex flex-wrap gap-4 text-sm">
              <li className="flex items-center gap-2 text-heading">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.single }} aria-hidden />
                {t.stats.done} <span className="font-semibold tabular-nums">{done.toLocaleString(locale)}</span>
              </li>
              <li className="flex items-center gap-2 text-heading">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.tiers.red }} aria-hidden />
                {t.stats.failed} <span className="font-semibold tabular-nums">{data.failed.toLocaleString(locale)}</span>
              </li>
            </ul>
          </div>
          {data.total === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.stats.noData}</p>
          ) : table ? (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                  <tr>
                    <th className="py-2">{t.stats.day}</th>
                    <th className="py-2 text-right">{t.stats.done}</th>
                    <th className="py-2 text-right">{t.stats.failed}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.day} className="border-t border-line">
                      <td className="py-1.5">{fmtDay(locale, d.day)}</td>
                      <td className="py-1.5 text-right tabular-nums">{d.done}</td>
                      <td className="py-1.5 text-right tabular-nums">{d.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64" role="img" aria-label={`${t.stats.daily}: ${data.total}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="20%">
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="day" tickFormatter={(d: string) => fmtDay(locale, d)} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <Tip {...(p as object)} locale={locale} />} cursor={{ fill: c.grid, opacity: 0.4 }} />
                  <Bar dataKey="done" name={t.stats.done} stackId="r" fill={c.single} stroke={c.surface} strokeWidth={1} isAnimationActive={false} />
                  <Bar dataKey="failed" name={t.stats.failed} stackId="r" fill={c.tiers.red} stroke={c.surface} strokeWidth={1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.total > 0 && (
            <button type="button" onClick={() => setTable((v) => !v)} className="mt-2 text-xs font-semibold text-heading hover:underline">
              {table ? t.stats.chart : t.stats.table}
            </button>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.stats.byAction}</h2>
          {actions.length ? <HBarChart rows={actions} valueLabel={t.stats.actions} /> : <p className="text-sm text-muted">{t.stats.noData}</p>}
        </section>

        <section className={`${card} xl:col-span-3`}>
          <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.stats.topRules}</h2>
          {data.by_rule.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t.stats.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 font-medium">{t.stats.cols.rule}</th>
                    <th scope="col" className="py-2.5 text-right font-medium">{t.stats.cols.runs}</th>
                    <th scope="col" className="py-2.5 text-right font-medium">{t.stats.cols.failed}</th>
                    <th scope="col" className="py-2.5 text-right font-medium">{t.stats.cols.rate}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_rule.slice(0, 15).map((x) => (
                    <tr key={x.rule_id} className="border-b border-line last:border-0">
                      <td className="py-2.5">
                        {names[x.rule_id] ? (
                          <Link href={`/${locale}/portal/automatizaciones/${x.rule_id}`} className="font-medium text-heading hover:underline">
                            {names[x.rule_id]}
                          </Link>
                        ) : (
                          <span className="text-muted">{t.stats.deleted}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{x.runs.toLocaleString(locale)}</td>
                      <td className={`py-2.5 text-right tabular-nums ${x.failed ? "text-red-600 dark:text-red-400" : ""}`}>{x.failed}</td>
                      <td className="py-2.5 text-right tabular-nums">{Math.round(((x.runs - x.failed) / x.runs) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
