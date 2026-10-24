"use client";

import { ArrowDownRight, ArrowUpRight, CloudDownload } from "lucide-react";
import { reportsPanelCopy } from "@/content/reportsPanel";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Data = Record<string, unknown> & { by_tier?: Record<string, number> };
type Source = { source: string; leads: number; green: number; meetings: number; won: number; won_value: number };

/** Una métrica: cómo leerla y si subir es bueno. */
type Metric = { key: string; value: (d: Data) => number | null; format?: "money" | "pct" | "hours" | "days" | "duration" | "rating"; lowerIsBetter?: boolean; hint?: (d: Data) => string | null };

const n = (d: Data, k: string) => (typeof d[k] === "number" ? (d[k] as number) : null);

/**
 * Panel del periodo: métricas agrupadas (ventas, marketing, atención y
 * operación), cada una con el cambio frente al periodo anterior, y el retorno
 * por fuente de leads. Se puede exportar a CSV o imprimir (PDF).
 */
export function ReportPanel({
  locale,
  current,
  prev,
  sources,
  prevLabel,
}: {
  locale: Locale;
  current: Data;
  prev: Data;
  sources: Source[];
  prevLabel: string;
}) {
  const t = reportsPanelCopy[locale];
  const money = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "COP", notation: v >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: v >= 1_000_000 ? 1 : 0 }).format(v);
  const dur = (s: number) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);
  const fmt = (v: number | null, f?: Metric["format"]) => {
    if (v == null) return "—";
    if (f === "money") return money(v);
    if (f === "pct") return `${v}%`;
    if (f === "hours") return t.units.hours.replace("{n}", String(v));
    if (f === "days") return t.units.days.replace("{n}", String(v));
    if (f === "duration") return dur(v);
    if (f === "rating") return `${v} / 5`;
    return v.toLocaleString(locale);
  };
  const tiers = (d: Data) => d.by_tier ?? {};
  const pctOf = (a: number | null, b: number | null) => (a != null && b ? Math.round((a / b) * 100) : null);

  const sections: { key: keyof typeof t.sections; metrics: Metric[] }[] = [
    {
      key: "sales",
      metrics: [
        { key: "leads", value: (d) => n(d, "leads"), hint: (d) => t.hints.tiers.replace("{g}", String(tiers(d).green ?? 0)).replace("{y}", String(tiers(d).yellow ?? 0)).replace("{r}", String(tiers(d).red ?? 0)) },
        { key: "qualified", value: (d) => n(d, "qualified"), hint: () => t.hints.qualified },
        { key: "contacted", value: (d) => pctOf(n(d, "contacted"), n(d, "leads")), format: "pct" },
        { key: "first_contact_h", value: (d) => n(d, "first_contact_h"), format: "hours", lowerIsBetter: true },
        { key: "meetings", value: (d) => n(d, "meetings") },
        {
          key: "attendance",
          value: (d) => pctOf(n(d, "meetings_done"), (n(d, "meetings_done") ?? 0) + (n(d, "meetings_no_show") ?? 0)),
          format: "pct",
          hint: (d) => t.hints.attendance.replace("{d}", String(n(d, "meetings_done") ?? 0)).replace("{n}", String(n(d, "meetings_no_show") ?? 0)),
        },
        { key: "won", value: (d) => n(d, "won") },
        { key: "won_value", value: (d) => n(d, "won_value"), format: "money" },
        { key: "avg_deal", value: (d) => n(d, "avg_deal"), format: "money" },
        { key: "cycle_days", value: (d) => n(d, "cycle_days"), format: "days", lowerIsBetter: true },
        { key: "lost", value: (d) => n(d, "lost"), lowerIsBetter: true },
        { key: "pipeline_open", value: (d) => n(d, "pipeline_open") },
      ],
    },
    {
      key: "marketing",
      metrics: [
        { key: "visitors", value: (d) => n(d, "visitors") },
        { key: "conversion", value: (d) => n(d, "conversion"), format: "pct" },
        { key: "wa_sent", value: (d) => n(d, "wa_sent") },
        { key: "wa_read", value: (d) => pctOf(n(d, "wa_read"), n(d, "wa_sent")), format: "pct" },
        { key: "wa_replied", value: (d) => n(d, "wa_replied") },
        { key: "emails_sent", value: (d) => n(d, "emails_sent") },
        { key: "emails_opened", value: (d) => pctOf(n(d, "emails_opened"), n(d, "emails_sent")), format: "pct" },
        { key: "campaigns", value: (d) => n(d, "campaigns") },
      ],
    },
    {
      key: "service",
      metrics: [
        { key: "chats", value: (d) => n(d, "chats") },
        { key: "chats_answered_pct", value: (d) => n(d, "chats_answered_pct"), format: "pct" },
        { key: "chat_first_response_s", value: (d) => n(d, "chat_first_response_s"), format: "duration", lowerIsBetter: true },
        { key: "chat_rating", value: (d) => n(d, "chat_rating"), format: "rating" },
        { key: "tickets_opened", value: (d) => n(d, "tickets_opened") },
        { key: "tickets_resolved", value: (d) => n(d, "tickets_resolved") },
        { key: "tickets_open", value: (d) => n(d, "tickets_open"), lowerIsBetter: true },
      ],
    },
    {
      key: "ops",
      metrics: [
        { key: "tasks_done", value: (d) => n(d, "tasks_done") },
        { key: "tasks_overdue", value: (d) => n(d, "tasks_overdue"), lowerIsBetter: true },
      ],
    },
  ];

  const exportCsv = () => {
    const rows = [["seccion", "metrica", "valor", "anterior"]];
    for (const s of sections) {
      for (const m of s.metrics) rows.push([t.sections[s.key], t.m[m.key], fmt(m.value(current), m.format), fmt(m.value(prev), m.format)]);
    }
    rows.push([]);
    rows.push([t.cols.source, t.cols.leads, t.cols.green, t.cols.meetings, t.cols.won, t.cols.value]);
    for (const s of sources) rows.push([t.sourceNames[s.source] ?? s.source, String(s.leads), String(s.green), String(s.meetings), String(s.won), String(s.won_value)]);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <p className="text-sm text-muted">{t.compared.replace("{prev}", prevLabel)}</p>
        <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] print:hidden">
          <CloudDownload className="h-4 w-4" aria-hidden />
          {t.csv}
        </button>
      </div>

      {sections.map((s) => (
        <section key={s.key} className="break-inside-avoid">
          <h2 className="px-4 pb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted sm:px-6">{t.sections[s.key]}</h2>
          <div className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
            {s.metrics.map((m) => {
              const now = m.value(current);
              const before = m.value(prev);
              const d = now != null && before ? Math.round(((now - before) / before) * 100) : null;
              const good = d != null && (m.lowerIsBetter ? d <= 0 : d >= 0);
              const hint = m.hint?.(current);
              return (
                <div key={m.key} className="border-b border-line px-6 py-4 sm:border-r [&:nth-child(2n)]:sm:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0">
                  <p className="text-sm text-muted">{t.m[m.key]}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-[1.6rem] font-semibold leading-none tabular-nums text-heading">{fmt(now, m.format)}</span>
                    {d != null && d !== 0 && (
                      <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                        {Math.abs(d)}%
                      </span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">{hint ?? (before != null ? t.hints.before.replace("{v}", fmt(before, m.format)) : t.hints.noPrev)}</p>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="mx-4 mb-6 break-inside-avoid rounded-xl border border-line bg-surface p-5 sm:mx-6 dark:bg-card">
        <h2 className="text-[0.98rem] font-semibold text-heading">{t.sources}</h2>
        <p className="mb-3 text-xs text-muted">{t.sourcesHint}</p>
        {sources.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  {(["source", "leads", "green", "meetings", "won", "value", "rate"] as const).map((c) => (
                    <th key={c} scope="col" className={cn("py-2.5 font-medium", c !== "source" && "text-right")}>
                      {t.cols[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-b border-line last:border-0">
                    <td className="py-2.5 font-medium text-heading">{t.sourceNames[s.source] ?? s.source}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.leads}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.green}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.meetings}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.won}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.won_value ? money(s.won_value) : "—"}</td>
                    <td className="py-2.5 text-right tabular-nums">{s.leads ? `${Math.round((s.won / s.leads) * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
