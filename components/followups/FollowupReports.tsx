import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MailOpen, PlugZap } from "lucide-react";
import { HBarChart, KpiSpark } from "@/components/portal/charts/HomeCharts";
import { SentByDay, type SentDaily } from "./charts/FollowupCharts";
import { followupReportsCopy, pct } from "@/content/followupReports";
import { automationCopy } from "@/content/automation";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type FollowupReport = {
  kpis: {
    sent: number;
    sent_prev: number;
    delivered: number;
    opened: number;
    opened_prev: number;
    clicked: number;
    bounced: number;
    complained: number;
    tracked: number;
    queued: number;
    failed: number;
    unsubscribed: number;
  };
  daily: SentDaily[];
  by_kind: { kind: string; sent: number; delivered: number; opened: number; clicked: number; bounced: number }[];
  sequence: {
    enrolled: number;
    steps: { step: number; sent: number; opened: number; clicked: number }[];
    booked: number;
    advanced: number;
    unsubscribed: number;
  };
  abandoned: { drafts: number; reminded: number; recovered: number };
};

/**
 * Reportes del seguimiento por correo: envíos frente al periodo anterior,
 * aperturas y clics (si el webhook de Resend está activo), envíos por día,
 * embudo de la secuencia, rendimiento por correo y formularios recuperados.
 */
export function FollowupReports({ locale, report: r, days }: { locale: Locale; report: FollowupReport; days: number }) {
  const t = followupReportsCopy[locale];
  const kinds = automationCopy[locale].followups.kinds;
  const base = `/${locale}/portal/seguimiento/reportes`;
  const k = r.kpis;
  const tracked = k.tracked > 0;
  // Las tasas se calculan sobre lo entregado (si se mide) o lo enviado.
  const openBase = k.delivered > 0 ? k.delivered : k.sent;

  // Variación relativa en %.
  const delta = (now: number | null, prev: number | null) => {
    if (now == null || prev == null || prev === 0) return null;
    const d = Math.round(((now - prev) / prev) * 1000) / 10;
    return { d, good: d >= 0 };
  };
  const rateNow = tracked && openBase > 0 ? k.opened / openBase : null;
  const ratePrev = k.sent_prev > 0 && k.opened_prev > 0 ? k.opened_prev / k.sent_prev : null;

  const kpis = [
    { key: "sent", value: k.sent.toLocaleString(locale), delta: delta(k.sent, k.sent_prev), hint: null as string | null, series: r.daily.map((d) => d.sequence + d.automation + d.internal) },
    { key: "openRate", value: tracked ? pct(k.opened, openBase) : "—", delta: delta(rateNow, ratePrev), hint: tracked ? t.openedN.replace("{n}", String(k.opened)) : null, series: tracked ? r.daily.map((d) => d.opened) : null },
    { key: "clickRate", value: tracked ? pct(k.clicked, k.sent) : "—", delta: null, hint: tracked ? t.clickedN.replace("{n}", String(k.clicked)) : null, series: null },
    { key: "bounced", value: tracked ? k.bounced.toLocaleString(locale) : "—", delta: null, hint: tracked && k.sent ? t.bouncedPct.replace("{pct}", pct(k.bounced, k.sent)) : null, series: null },
    { key: "unsubscribed", value: k.unsubscribed.toLocaleString(locale), delta: null, hint: null, series: null },
    { key: "queued", value: k.queued.toLocaleString(locale), delta: null, hint: k.failed ? t.failedN.replace("{n}", String(k.failed)) : null, series: null },
  ] as const;

  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const cardTitle = (title: string, hint?: string) => (
    <div className="mb-4">
      <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );

  const seq = r.sequence;
  const funnelRows = [
    { label: t.funnelRows.enrolled, value: seq.enrolled },
    ...seq.steps.map((s) => ({ label: t.funnelRows.step.replace("{n}", String(s.step)), value: s.sent })),
    { label: t.funnelRows.advanced, value: seq.advanced },
    { label: t.funnelRows.booked, value: seq.booked },
  ];
  const kindLabel = (kind: string) => kinds[kind] ?? t.extraKinds[kind] ?? kind;
  const ab = r.abandoned;

  return (
    <>
      <div className="-mx-4 sm:-mx-6">
        {/* Periodo */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-line px-4 py-3 sm:px-6">
          <nav aria-label={t.range} className="flex rounded-[10px] bg-card-soft p-0.5">
            {(["7", "30", "90"] as const).map((x) => (
              <Link
                key={x}
                href={x === "30" ? base : `${base}?r=${x}`}
                aria-current={String(days) === x ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  String(days) === x ? "bg-surface text-heading shadow-[0_1px_2px_rgba(16,24,40,0.08)] dark:bg-card" : "text-muted hover:text-heading",
                )}
              >
                {t.ranges[x]}
              </Link>
            ))}
          </nav>
        </div>

        {/* Métricas */}
        <dl className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 [&>div]:border-b 2xl:[&>div]:border-b-0">
          {kpis.map((m) => (
            <div key={m.key} className="flex min-w-0 items-center justify-between gap-3 border-line px-6 py-5 sm:border-r 2xl:last:border-r-0">
              <div className="min-w-0">
                <dt className="truncate text-sm text-muted">{t.kpis[m.key]}</dt>
                <dd className="mt-1 flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-[1.75rem] font-semibold leading-none tabular-nums text-heading">{m.value}</span>
                  {m.delta && (
                    <span
                      className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", m.delta.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                      title={t.vsPrev.replace("{n}", String(days))}
                    >
                      {m.delta.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                      {Math.abs(m.delta.d)}%
                    </span>
                  )}
                </dd>
                {m.hint && <dd className="mt-1 truncate text-xs text-muted">{m.hint}</dd>}
              </div>
              {m.series && m.series.some((v) => v > 0) && (
                <span className="2xl:hidden">
                  <KpiSpark data={[...m.series]} label={t.kpis[m.key]} />
                </span>
              )}
            </div>
          ))}
        </dl>
      </div>

      {/* Sin webhook: los correos salen pero no hay aperturas ni clics. */}
      {k.sent > 0 && !tracked && (
        <div className="mt-6 flex flex-wrap items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
            <PlugZap className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-100">{t.noTracking.title}</p>
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">{t.noTracking.body}</p>
          </div>
          <Link href={`/${locale}/portal/integraciones`} className="self-center rounded-[10px] px-3.5 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100 dark:text-amber-100 dark:ring-amber-500/40 dark:hover:bg-amber-500/20">
            {t.noTracking.cta}
          </Link>
        </div>
      )}

      {/* Aún no sale ningún correo. */}
      {k.sent === 0 && (
        <div className="mt-6 flex items-start gap-4 rounded-xl border border-dashed border-line p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--meta-active)] text-accent">
            <MailOpen className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold text-heading">{t.emptyTitle}</p>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t.emptyBody}</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.byDay, t.byDayHint)}
          {k.sent === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <SentByDay data={r.daily} locale={locale} />}
        </section>

        <section className={card}>
          {cardTitle(t.funnel, t.funnelHint)}
          {seq.enrolled === 0 ? (
            <p className="text-sm text-muted">{t.noData}</p>
          ) : (
            <>
              <HBarChart rows={funnelRows} valueLabel={t.leadsLabel} highlight={t.funnelRows.booked} />
              {seq.unsubscribed > 0 && <p className="mt-3 text-xs text-muted">{t.unsubscribedNote.replace("{n}", String(seq.unsubscribed))}</p>}
            </>
          )}
        </section>

        <section className={card}>
          {cardTitle(t.drafts, t.draftsHint)}
          <dl className="grid grid-cols-3 gap-3">
            {(["drafts", "reminded", "recovered"] as const).map((key) => (
              <div key={key} className="rounded-lg bg-card-soft px-4 py-3 dark:bg-white/[0.04]">
                <dt className="text-xs text-muted">{t.draftsRows[key]}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-heading">{ab[key]}</dd>
              </div>
            ))}
          </dl>
          {ab.reminded > 0 ? (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-card-soft dark:bg-white/[0.06]" aria-hidden>
                <div className="h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${Math.round((ab.recovered / ab.reminded) * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm font-medium text-heading">{t.recovery.replace("{pct}", pct(ab.recovered, ab.reminded))}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">{t.noData}</p>
          )}
        </section>

        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.performance, t.performanceHint)}
          {r.by_kind.length === 0 ? (
            <p className="text-sm text-muted">{t.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-3 font-medium">{t.cols.kind}</th>
                    {(["sent", "delivered", "opened", "clicked", "bounced"] as const).map((c) => (
                      <th key={c} scope="col" className="px-3 py-2.5 text-right font-medium last:pr-0">{t.cols[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.by_kind.map((row) => {
                    const b = row.delivered > 0 ? row.delivered : row.sent;
                    return (
                      <tr key={row.kind} className="border-b border-line last:border-0">
                        <td className="py-3 pr-3 font-medium text-heading">{kindLabel(row.kind)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-heading">{row.sent}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-body">{tracked ? pct(row.delivered, row.sent) : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-body">{tracked ? pct(row.opened, b) : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-body">{tracked ? pct(row.clicked, row.sent) : "—"}</td>
                        <td className={cn("py-3 pl-3 text-right tabular-nums", row.bounced > 0 ? "text-red-600 dark:text-red-400" : "text-body")}>
                          {tracked ? pct(row.bounced, row.sent) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
