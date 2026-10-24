"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { ENTITY_LINK, rulesCopy, type ActionType, type RuleEntity } from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import type { Locale } from "@/i18n/config";
import type { AutomationRun } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type RuleStats = { total: number; failed: number; pending: number; daily: { day: string; done: number; failed: number }[] };

const fmtDay = (locale: string, day: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

/** Estadísticas de 30 días y últimas ejecuciones de una regla. */
export function RuleRunsPanel({ locale, stats, runs }: { locale: Locale; stats: RuleStats; runs: AutomationRun[] }) {
  const t = rulesCopy;
  const e = ruleEditorCopy;
  const c = useChartTheme();
  const [table, setTable] = useState(false);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const any = stats.daily.some((d) => d.done + d.failed > 0);

  return (
    <>
      <section className={card}>
        <h2 className="text-[0.98rem] font-semibold text-heading">{e.stats.title}</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          {(
            [
              ["total", stats.total],
              ["failed", stats.failed],
              ["pending", stats.pending],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{e.stats[k]}</dt>
              <dd className={cn("text-xl font-semibold tabular-nums", k === "failed" && v > 0 ? "text-red-600 dark:text-red-400" : "text-heading")}>{v.toLocaleString(locale)}</dd>
            </div>
          ))}
        </dl>
        {!any ? (
          <p className="mt-4 text-sm text-muted">{e.stats.empty}</p>
        ) : (
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-heading">{e.stats.chart}</p>
              <ul className="flex gap-3 text-xs text-heading">
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.single }} aria-hidden />
                  {e.stats.done}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.tiers.red }} aria-hidden />
                  {e.stats.errors}
                </li>
              </ul>
            </div>
            {table ? (
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted">
                    <tr>
                      <th className="py-1.5 font-medium">{e.stats.day}</th>
                      <th className="py-1.5 text-right font-medium">{e.stats.done}</th>
                      <th className="py-1.5 text-right font-medium">{e.stats.errors}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.daily.map((d) => (
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
              <div className="h-40" role="img" aria-label={`${e.stats.chart}: ${stats.total}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.daily} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="20%">
                    <CartesianGrid vertical={false} stroke={c.grid} />
                    <XAxis dataKey="day" tickFormatter={(d: string) => fmtDay(locale, d)} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: c.grid, opacity: 0.4 }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: c.tooltipBg, color: c.surface }}>
                            <p className="mb-1 font-semibold">{fmtDay(locale, String(label))}</p>
                            {payload.map((p) => (
                              <p key={String(p.name)} className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                                <span className="flex-1">{String(p.name)}</span>
                                <span className="font-semibold tabular-nums">{Number(p.value ?? 0)}</span>
                              </p>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="done" name={e.stats.done} stackId="r" fill={c.single} stroke={c.surface} strokeWidth={1} isAnimationActive={false} />
                    <Bar dataKey="failed" name={e.stats.errors} stackId="r" fill={c.tiers.red} stroke={c.surface} strokeWidth={1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <button type="button" onClick={() => setTable((v) => !v)} className="mt-2 text-xs font-semibold text-heading hover:underline">
              {table ? e.stats.chartView : e.stats.table}
            </button>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="text-[0.98rem] font-semibold text-heading">{e.runs.title}</h2>
        {runs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{e.runs.empty}</p>
        ) : (
          <ul className="mt-3 grid gap-1">
            {runs.map((r) => {
              const detail = (r.detail ?? {}) as { actions?: { type: ActionType }[]; error?: string };
              const link = ENTITY_LINK[r.entity as RuleEntity];
              const ok = r.status === "done";
              return (
                <li key={r.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--meta-hover)]">
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={e.runs.done} />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-label={e.runs.failed} />
                  )}
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-heading">{t.history.entities[r.entity] ?? r.entity}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted">{fmt(r.created_at)}</span>
                    </span>
                    <span className={cn("block truncate text-xs", ok ? "text-muted" : "text-red-600 dark:text-red-400")}>
                      {detail.error ?? ((detail.actions ?? []).map((a) => t.actions.types[a.type]?.label ?? a.type).join(" · ") || "—")}
                    </span>
                    {link && (
                      <Link href={`/${locale}/portal/${link(r.entity_id)}`} className="text-xs font-medium text-accent hover:underline">
                        {e.runs.open}
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
