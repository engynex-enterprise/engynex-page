"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, CalendarPlus, CloudDownload, FileText, Loader2, Mail, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WeeklyReport } from "@/lib/supabase/types";
import { reportsSavedCopy } from "@/content/reportsSaved";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Data = Record<string, unknown> & {
  by_tier?: Record<string, number>;
  sources?: { source: string; leads: number }[];
};
type Kind = "week" | "month";
type Tile = { label: string; value: string; hint?: string | null; delta?: number | null };

const softBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";

/**
 * Informes guardados: lista de semanales y mensuales a la izquierda y el
 * informe elegido a la derecha (reenviar por correo, PDF y CSV). El
 * administrador puede generar la semana o el mes pasado.
 */
export function SavedReports({
  locale,
  reports,
  selectedId,
  isAdmin,
  lastMonday,
  lastMonth,
}: {
  locale: Locale;
  reports: WeeklyReport[];
  selectedId: string | null;
  isAdmin: boolean;
  /** aaaa-mm-dd calculados en el servidor (hora de Colombia). */
  lastMonday: string;
  lastMonth: string;
}) {
  const t = reportsSavedCopy[locale];
  const m = t.metrics;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const initial = reports.find((x) => x.id === selectedId) ?? reports[0] ?? null;
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "week");
  const [busy, setBusy] = useState<"week" | "month" | "send" | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const list = reports.filter((x) => (x.kind ?? "week") === kind);
  const selected = list.find((x) => x.id === selectedId) ?? list[0] ?? null;
  const counts = { week: reports.filter((x) => (x.kind ?? "week") === "week").length, month: reports.filter((x) => x.kind === "month").length };

  const label = (r: WeeklyReport) => {
    const date = new Date(`${r.week_start}T12:00:00Z`);
    if (r.kind === "month") {
      const s = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
      return t.month.replace("{date}", s.charAt(0).toUpperCase() + s.slice(1));
    }
    return t.week.replace("{date}", new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date));
  };

  const flash = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast((c) => (c?.text === text ? null : c)), 5000);
  };

  const generate = async (which: Kind) => {
    setBusy(which);
    const { data, error } =
      which === "week"
        ? await supabase.rpc("report_generate", { p_week_start: lastMonday, p_email: false })
        : await supabase.rpc("report_generate_month", { p_month_start: lastMonth, p_email: false });
    setBusy(null);
    if (error) return flash(t.error.replace("{detail}", error.message), true);
    setKind(which);
    router.push(`?r=${data}`);
    router.refresh();
  };

  const send = async () => {
    if (!selected) return;
    setBusy("send");
    const { error } = await supabase.rpc("report_send", { p_report: selected.id });
    setBusy(null);
    flash(error ? t.error.replace("{detail}", error.message) : t.queued, !!error);
  };

  /* ---------------- Métricas del informe elegido ---------------- */

  const d = (selected?.data ?? {}) as Data;
  const has = (k: string) => typeof d[k] === "number";
  const n = (k: string) => (has(k) ? (d[k] as number).toLocaleString(locale) : "—");
  const money = (v: unknown) =>
    typeof v === "number" ? new Intl.NumberFormat(locale, { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v) : "—";
  const prev = Number(d.leads_prev ?? 0);
  const leadsDelta = prev && has("leads") ? Math.round(((Number(d.leads) - prev) / prev) * 100) : null;
  const seconds = has("chat_first_response_s") ? (d.chat_first_response_s as number) : null;
  const firstResponse = seconds == null ? "—" : seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${(seconds / 3600).toFixed(1)} h`;
  const tiers = d.by_tier ?? {};

  const sections: { key: keyof typeof t.sections; tiles: Tile[] }[] = [
    {
      key: "sales",
      tiles: [
        { label: m.leads, value: n("leads"), delta: leadsDelta },
        { label: m.qualified, value: n("qualified") },
        { label: m.tiers, value: `${tiers.green ?? 0} / ${tiers.yellow ?? 0} / ${tiers.red ?? 0}` },
        { label: m.contacted, value: n("contacted") },
        { label: m.first_contact_h, value: has("first_contact_h") ? t.units.h.replace("{n}", String(d.first_contact_h)) : "—" },
        {
          label: m.meetings,
          value: n("meetings"),
          hint: has("meetings_done") ? m.meetings_hint.replace("{done}", n("meetings_done")).replace("{no_show}", n("meetings_no_show")) : null,
        },
        { label: m.won, value: n("won") },
        { label: m.won_value, value: money(d.won_value) },
        { label: m.avg_deal, value: money(d.avg_deal) },
        { label: m.cycle_days, value: has("cycle_days") ? t.units.days.replace("{n}", String(d.cycle_days)) : "—" },
        { label: m.lost, value: n("lost") },
        { label: m.pipeline_open, value: n("pipeline_open") },
      ],
    },
    {
      key: "marketing",
      tiles: [
        { label: m.visitors, value: n("visitors") },
        { label: m.conversion, value: has("conversion") ? `${d.conversion}%` : "—" },
        { label: m.wa_sent, value: n("wa_sent"), hint: has("wa_read") ? m.wa_hint.replace("{read}", n("wa_read")).replace("{replied}", n("wa_replied")) : null },
        { label: m.emails_sent, value: n("emails_sent"), hint: has("emails_opened") ? m.emails_hint.replace("{n}", n("emails_opened")) : null },
        { label: m.campaigns, value: n("campaigns") },
      ],
    },
    {
      key: "service",
      tiles: [
        { label: m.chats, value: n("chats"), hint: has("chats_answered_pct") ? m.chats_hint.replace("{n}", String(d.chats_answered_pct)) : null },
        { label: m.chat_first_response_s, value: firstResponse },
        { label: m.chat_rating, value: has("chat_rating") ? `${d.chat_rating} / 5` : "—" },
        {
          label: m.tickets_opened,
          value: n("tickets_opened"),
          hint: has("tickets_resolved") ? m.tickets_hint.replace("{resolved}", n("tickets_resolved")).replace("{open}", n("tickets_open")) : null,
        },
      ],
    },
    {
      key: "ops",
      tiles: [
        { label: m.tasks_done, value: n("tasks_done") },
        { label: m.tasks_overdue, value: n("tasks_overdue") },
      ],
    },
  ];

  const exportCsv = () => {
    if (!selected) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [[t.csvCols.section, t.csvCols.metric, t.csvCols.value]];
    for (const s of sections) for (const tile of s.tiles) rows.push([t.sections[s.key], tile.label, tile.value]);
    for (const src of d.sources ?? []) rows.push([t.sections.marketing, `${m.sources}: ${src.source}`, String(src.leads)]);
    const blob = new Blob([`﻿${rows.map((r) => r.map(esc).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `informe-${selected.kind}-${selected.week_start}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const generateButtons = isAdmin && (
    <div className="flex flex-wrap gap-2 print:hidden">
      {(["week", "month"] as const).map((k) => (
        <button key={k} type="button" disabled={!!busy} onClick={() => void generate(k)} className={softBtn}>
          {busy === k ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarPlus className="h-4 w-4" aria-hidden />}
          {busy === k ? t.generating : k === "week" ? t.generateWeek : t.generateMonth}
        </button>
      ))}
    </div>
  );

  if (reports.length === 0) {
    return (
      <div className="grid place-items-center px-4 py-20 text-center sm:px-6">
        <FileText className="h-10 w-10 text-muted" aria-hidden />
        <p className="mt-4 text-base font-semibold text-heading">{t.empty}</p>
        <p className="mt-2 max-w-xl text-sm text-muted">{t.emptyHint}</p>
        <div className="mt-6">{generateButtons}</div>
        {toast && <p className={cn("mt-4 text-sm", toast.error ? "text-red-600" : "text-emerald-700")}>{toast.text}</p>}
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] print:block lg:grid-cols-[19rem_minmax(0,1fr)]">
      {/* Lista */}
      <aside className="border-line print:hidden lg:border-r">
        <div role="tablist" aria-label={t.tabs.week} className="flex gap-1 border-b border-line px-4">
          {(["week", "month"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-2 py-3 text-sm transition-colors",
                kind === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[k]}
              <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[k]}</span>
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">{t.emptyTab}</p>
        ) : (
          <ul className="max-h-[70vh] overflow-y-auto p-2">
            {list.map((r) => {
              const data = r.data as Data;
              const leads = Number(data.leads ?? 0);
              const p = Number(data.leads_prev ?? 0);
              const delta = p ? Math.round(((leads - p) / p) * 100) : null;
              const active = selected?.id === r.id;
              return (
                <li key={r.id}>
                  <Link
                    href={`?r=${r.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center justify-between gap-3 rounded-xl px-3 py-2.5", active ? "bg-[var(--meta-active)]" : "hover:bg-[var(--meta-hover)]")}
                  >
                    <span className="min-w-0">
                      <span className={cn("block truncate text-sm", active ? "font-semibold text-heading" : "text-heading")}>{label(r)}</span>
                      <span className="block text-xs text-muted">{t.leads.replace("{n}", String(leads))}</span>
                    </span>
                    {delta != null && (
                      <span className={cn("shrink-0 text-xs font-semibold tabular-nums", delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {delta >= 0 ? "+" : ""}
                        {delta}%
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Detalle */}
      <section className="min-w-0">
        {selected ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-heading">{label(selected)}</h2>
                <p className="text-xs text-muted">
                  {t.generated.replace(
                    "{date}",
                    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(selected.created_at)),
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {toast && (
                  <span role="status" className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", toast.error ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300")}>
                    {toast.text}
                  </span>
                )}
                {isAdmin && (
                  <button type="button" onClick={() => void send()} disabled={!!busy} className={softBtn}>
                    {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
                    {t.resend}
                  </button>
                )}
                <button type="button" onClick={() => window.print()} className={softBtn}>
                  <Printer className="h-4 w-4" aria-hidden />
                  {t.print}
                </button>
                <button type="button" onClick={exportCsv} className={softBtn}>
                  <CloudDownload className="h-4 w-4" aria-hidden />
                  {t.csv}
                </button>
                {generateButtons}
              </div>
            </div>

            {sections.map((s) => (
              <div key={s.key} className="break-inside-avoid">
                <h3 className="px-4 pb-2 pt-5 text-xs font-medium uppercase tracking-[0.06em] text-muted sm:px-6">{t.sections[s.key]}</h3>
                <dl className="grid border-y border-line sm:grid-cols-2 xl:grid-cols-4">
                  {s.tiles.map((tile) => (
                    <div key={tile.label} className="border-b border-line px-4 py-4 sm:border-r sm:px-6 xl:[&:nth-child(4n)]:border-r-0">
                      <dt className="text-sm text-muted">{tile.label}</dt>
                      <dd className="mt-1 flex items-baseline gap-2">
                        <span className="text-[1.5rem] font-semibold leading-none tabular-nums text-heading">{tile.value}</span>
                        {tile.delta != null && (
                          <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", tile.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            {tile.delta >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                            {Math.abs(tile.delta)}%
                          </span>
                        )}
                      </dd>
                      {tile.hint && <p className="mt-1 text-xs text-muted">{tile.hint}</p>}
                      {tile.delta != null && <p className="mt-1 text-xs text-muted">{t.vsPrev.replace("{delta}", `${tile.delta >= 0 ? "+" : ""}${tile.delta}%`)}</p>}
                    </div>
                  ))}
                </dl>
                {s.key === "marketing" && (d.sources?.length ?? 0) > 0 && (
                  <div className="px-4 py-4 sm:px-6">
                    <p className="mb-2 text-sm font-semibold text-heading">{m.sources}</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {d.sources!.map((src) => (
                        <li key={src.source} className="rounded-lg bg-card-soft px-2.5 py-1 text-sm text-heading dark:bg-white/[0.08]">
                          {src.source} <span className="font-semibold tabular-nums">{src.leads}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="grid place-items-center px-4 py-20 text-center">
            <p className="text-sm text-muted">{t.emptyTab}</p>
            <p className="mt-2 max-w-md text-xs text-muted">{t.emptyHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
