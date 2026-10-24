"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CloudDownload, Trophy } from "lucide-react";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { reportsTeamCopy } from "@/content/reportsTeam";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type TeamRow = {
  id: string;
  name: string;
  role: string;
  leads: number;
  contacted: number;
  meetings: number;
  won: number;
  won_value: number;
  activities: number;
  tasks_done: number;
  tasks_overdue: number;
  chats: number;
  chat_first_s: number | null;
  tickets_resolved: number;
};

type Col = "name" | "leads" | "contacted" | "meetings" | "won" | "won_value" | "activities" | "tasks" | "chats" | "chat_first_s" | "tickets_resolved";
const COLS: Col[] = ["name", "leads", "contacted", "meetings", "won", "won_value", "activities", "tasks", "chats", "chat_first_s", "tickets_resolved"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const duration = (s: number | null) => (s == null ? "—" : s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);

/** Valor ordenable de una columna. */
const sortValue = (r: TeamRow, col: Col): number | string => {
  if (col === "name") return r.name.toLowerCase();
  if (col === "contacted") return r.leads ? r.contacted / r.leads : -1;
  if (col === "tasks") return r.tasks_done;
  if (col === "chat_first_s") return r.chat_first_s ?? Number.POSITIVE_INFINITY;
  return r[col];
};

/**
 * Rendimiento por asesor: tabla ordenable con totales del equipo, el mejor
 * vendedor resaltado, gráficas por persona y exportación a CSV.
 */
export function TeamReport({ locale, rows, periodLabel }: { locale: Locale; rows: TeamRow[]; periodLabel: string }) {
  const t = reportsTeamCopy[locale].team;
  const [sort, setSort] = useState<{ col: Col; desc: boolean }>({ col: "won_value", desc: true });

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const x = sortValue(a, sort.col);
      const y = sortValue(b, sort.col);
      const cmp = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
      return sort.desc ? -cmp : cmp;
    });
    return list;
  }, [rows, sort]);

  const total = useMemo(
    () =>
      rows.reduce(
        (s, r) => ({
          leads: s.leads + r.leads,
          contacted: s.contacted + r.contacted,
          meetings: s.meetings + r.meetings,
          won: s.won + r.won,
          won_value: s.won_value + r.won_value,
          activities: s.activities + r.activities,
          tasks_done: s.tasks_done + r.tasks_done,
          tasks_overdue: s.tasks_overdue + r.tasks_overdue,
          chats: s.chats + r.chats,
          tickets_resolved: s.tickets_resolved + r.tickets_resolved,
        }),
        { leads: 0, contacted: 0, meetings: 0, won: 0, won_value: 0, activities: 0, tasks_done: 0, tasks_overdue: 0, chats: 0, tickets_resolved: 0 },
      ),
    [rows],
  );
  // El mejor vendedor: más valor ganado (y, si empata, más ventas).
  const top = [...rows].sort((a, b) => b.won_value - a.won_value || b.won - a.won)[0];
  const topId = top && (top.won_value > 0 || top.won > 0) ? top.id : null;

  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "COP", currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 1 }).format(n);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  const exportCsv = () => {
    const head = [t.cols.name, "Rol", t.cols.leads, t.cols.contacted, t.cols.meetings, t.cols.won, t.cols.won_value, t.cols.activities, "Tareas hechas", "Tareas vencidas", t.cols.chats, t.cols.chat_first_s, t.cols.tickets_resolved];
    const lines = sorted.map((r) => [r.name, t.roles[r.role] ?? r.role, r.leads, r.contacted, r.meetings, r.won, r.won_value, r.activities, r.tasks_done, r.tasks_overdue, r.chats, r.chat_first_s ?? "", r.tickets_resolved]);
    const csv = [head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipo-${periodLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = "break-inside-avoid rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const numCls = "px-3 py-2 text-right tabular-nums";
  if (rows.length === 0) return <p className="py-16 text-center text-sm text-muted">{t.empty}</p>;

  return (
    <div className="grid gap-5">
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[0.98rem] font-semibold text-heading">{t.title}</h2>
            <p className="text-xs text-muted">
              {t.hint} · {periodLabel}
            </p>
          </div>
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] print:hidden">
            <CloudDownload className="h-4 w-4" aria-hidden />
            {t.csv}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                {COLS.map((col) => {
                  const active = sort.col === col;
                  return (
                    <th key={col} scope="col" aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"} className={cn("py-3 font-medium", col === "name" ? "pr-3" : "px-3 text-right")}>
                      <button
                        type="button"
                        onClick={() => setSort((s) => ({ col, desc: s.col === col ? !s.desc : col !== "name" && col !== "chat_first_s" }))}
                        title={t.sortBy.replace("{col}", t.cols[col])}
                        className={cn("inline-flex items-center gap-1 uppercase hover:text-heading", active && "text-heading")}
                      >
                        {t.cols[col]}
                        {active && (sort.desc ? <ArrowDown className="h-3 w-3" aria-hidden /> : <ArrowUp className="h-3 w-3" aria-hidden />)}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className={cn("h-14 border-b border-line", r.id === topId && "bg-[var(--meta-active)]/50")}>
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-deep-700/10 text-[0.7rem] font-bold text-deep-700 dark:bg-white/10 dark:text-white">{initials(r.name)}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 truncate font-medium text-heading">
                          {r.name}
                          {r.id === topId && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-green-dark px-1.5 py-0.5 text-[0.62rem] font-semibold text-white dark:bg-brand-green dark:text-deep-950">
                              <Trophy className="h-3 w-3" aria-hidden />
                              {t.top}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted">{t.roles[r.role] ?? r.role}</span>
                      </span>
                    </span>
                  </td>
                  <td className={numCls}>{r.leads}</td>
                  <td className={numCls}>
                    {r.contacted} <span className="text-xs text-muted">({pct(r.contacted, r.leads)})</span>
                  </td>
                  <td className={numCls}>{r.meetings}</td>
                  <td className={cn(numCls, "font-semibold text-heading")}>{r.won}</td>
                  <td className={cn(numCls, "font-semibold text-heading")}>{r.won_value ? money(r.won_value) : "—"}</td>
                  <td className={numCls}>{r.activities}</td>
                  <td className={numCls}>
                    {r.tasks_done}
                    {r.tasks_overdue > 0 && <span className="block text-xs font-medium text-red-600 dark:text-red-400">{t.overdue.replace("{n}", String(r.tasks_overdue))}</span>}
                  </td>
                  <td className={numCls}>{r.chats}</td>
                  <td className={numCls}>{duration(r.chat_first_s)}</td>
                  <td className={numCls}>{r.tickets_resolved}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-12 font-semibold text-heading">
                <td className="py-2 pr-3">{t.total}</td>
                <td className={numCls}>{total.leads}</td>
                <td className={numCls}>
                  {total.contacted} <span className="text-xs font-normal text-muted">({pct(total.contacted, total.leads)})</span>
                </td>
                <td className={numCls}>{total.meetings}</td>
                <td className={numCls}>{total.won}</td>
                <td className={numCls}>{total.won_value ? money(total.won_value) : "—"}</td>
                <td className={numCls}>{total.activities}</td>
                <td className={numCls}>
                  {total.tasks_done}
                  {total.tasks_overdue > 0 && <span className="block text-xs font-medium text-red-600 dark:text-red-400">{t.overdue.replace("{n}", String(total.tasks_overdue))}</span>}
                </td>
                <td className={numCls}>{total.chats}</td>
                <td className={numCls}>—</td>
                <td className={numCls}>{total.tickets_resolved}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Una gráfica por medida: nunca dos escalas en la misma. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.valueByAdvisor}</h2>
          {total.won_value ? (
            <HBarChart rows={[...rows].sort((a, b) => b.won_value - a.won_value).map((r) => ({ label: r.name, value: r.won_value }))} valueLabel={t.cols.won_value} currency />
          ) : (
            <p className="text-sm text-muted">{t.noData}</p>
          )}
        </section>
        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.salesByAdvisor}</h2>
          {total.won ? (
            <HBarChart rows={[...rows].sort((a, b) => b.won - a.won).map((r) => ({ label: r.name, value: r.won }))} valueLabel={t.cols.won} />
          ) : (
            <p className="text-sm text-muted">{t.noData}</p>
          )}
        </section>
        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.meetingsByAdvisor}</h2>
          {total.meetings ? (
            <HBarChart rows={[...rows].sort((a, b) => b.meetings - a.meetings).map((r) => ({ label: r.name, value: r.meetings }))} valueLabel={t.cols.meetings} />
          ) : (
            <p className="text-sm text-muted">{t.noData}</p>
          )}
        </section>
      </div>
    </div>
  );
}
