"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Copy, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import type { WaCampaign, WaParam, WaTemplate } from "@/lib/supabase/types";
import { campaignsCopy } from "@/content/campaigns";
import { campaignsProCopy } from "@/content/campaignsPro";
import { campaignReportCopy } from "@/content/campaignReport";
import { campaignStatusTone } from "@/lib/campaigns";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { CampaignLive } from "./CampaignLive";
import { CampaignRecipients } from "./CampaignRecipients";
import { TemplatePreview } from "./TemplatePreview";
import { ChannelIcon, pct, type CampaignStats } from "./shared";
import type { RecipientRow } from "./recipients";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type CampaignReportData = { hourly: { hour: number; n: number }[]; meetings: number; advanced: number; won: number; won_value: number };
type Action = "pause" | "resume" | "cancel" | "retry";

const softBtn = "inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";
const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

/**
 * Informe de una campaña ya lanzada (WhatsApp o correo): acciones (pausar,
 * reanudar, cancelar pendientes, reintentar, duplicar), métricas, embudo,
 * interacción por hora, resultados de negocio, el mensaje y los destinatarios.
 */
export function CampaignReport({
  locale,
  campaign: c,
  stats,
  report,
  recipients,
  template,
  ab,
}: {
  locale: Locale;
  campaign: WaCampaign;
  stats: CampaignStats | null;
  report: CampaignReportData | null;
  recipients: RecipientRow[];
  template: WaTemplate | null;
  /** Prueba A/B del asunto (solo correo). */
  ab?: Record<"a" | "b", { sent: number; opened: number; clicked: number; subject: string }> | null;
}) {
  const t = campaignReportCopy[locale];
  const base = campaignsCopy[locale];
  const m = campaignsProCopy[locale].metrics;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<Action | "duplicate" | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const email = c.channel === "email";
  const s = stats ?? { sent: 0, delivered: 0, opened: 0, engaged: 0, failed: 0, pending: 0, unsubscribed: 0, campaign_id: c.id };
  const total = c.total;
  const processed = s.sent + s.failed;

  const flash = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast((x) => (x?.text === text ? null : x)), 4000);
  };

  const act = async (action: Action) => {
    if (action === "cancel" && !window.confirm(t.actions.confirmCancel.replace("{n}", String(s.pending)))) return;
    setBusy(action);
    const { data, error } = await supabase.rpc("campaign_action", { p_campaign: c.id, p_action: action });
    setBusy(null);
    if (error) return flash(t.actions.errors[error.message] ?? t.actions.errors.generic.replace("{detail}", error.message), true);
    flash(t.actions.done[action].replace("{n}", String(data ?? 0)));
    router.refresh();
  };

  const duplicate = async () => {
    setBusy("duplicate");
    const { data, error } = await supabase.rpc("campaign_duplicate", { p_campaign: c.id });
    setBusy(null);
    if (error || !data) return flash(t.actions.errors.generic.replace("{detail}", error?.message ?? "—"), true);
    router.push(`/${locale}/portal/campanas/${data}`);
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const engagedLabel = email ? m.opened : m.read;
  const actedLabel = email ? m.clicked : m.replied;

  const kpis = [
    { label: m.recipients, value: total.toLocaleString(locale), hint: null },
    { label: m.sent, value: s.sent.toLocaleString(locale), hint: pct(s.sent, total) },
    { label: m.delivered, value: pct(s.delivered, s.sent), hint: s.delivered.toLocaleString(locale) },
    { label: engagedLabel, value: pct(s.opened, s.delivered || s.sent), hint: s.opened.toLocaleString(locale) },
    { label: actedLabel, value: pct(s.engaged, s.delivered || s.sent), hint: s.engaged.toLocaleString(locale) },
    { label: m.failed, value: s.failed.toLocaleString(locale), hint: s.failed ? pct(s.failed, total) : null, bad: s.failed > 0 },
    { label: m.unsubscribed, value: s.unsubscribed.toLocaleString(locale), hint: null },
  ];
  const funnel = [
    { label: m.recipients, value: total },
    { label: m.sent, value: s.sent },
    { label: m.delivered, value: s.delivered },
    { label: engagedLabel, value: s.opened },
    { label: actedLabel, value: s.engaged },
  ];
  const noTracking = email && s.sent > 0 && s.delivered === 0;

  // Vista previa del mensaje de WhatsApp con valores de ejemplo de las variables.
  const sampleValues = ((c.params as WaParam[] | null) ?? []).map((p) =>
    p.source === "static" ? (p.value ?? "") : p.source === "company" ? p.fallback || "Acme S.A.S." : p.source === "name" ? "Laura Gómez" : "Laura",
  );

  return (
    <div>
      <CampaignLive id={c.id} active={c.status === "sending"} />

      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
        <ChannelIcon channel={c.channel} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-heading">
            {email ? c.subject : template ? t.template.replace("{name}", template.name) : "—"}
          </p>
          <p className="text-xs text-muted">
            {c.started_at && t.started.replace("{date}", fmt(c.started_at))}
            {c.finished_at && ` · ${t.finished.replace("{date}", fmt(c.finished_at))}`}
          </p>
        </div>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", campaignStatusTone[c.status])}>{base.status[c.status]}</span>
        {toast && (
          <span
            role="status"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              toast.error ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
            )}
          >
            {toast.text}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          {c.status === "sending" && (
            <button type="button" onClick={() => void act("pause")} disabled={!!busy} className={softBtn}>
              {busy === "pause" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
              {t.actions.pause}
            </button>
          )}
          {c.status === "paused" && (
            <button type="button" onClick={() => void act("resume")} disabled={!!busy} className={softBtn}>
              {busy === "resume" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {t.actions.resume}
            </button>
          )}
          {(c.status === "sending" || c.status === "paused") && s.pending > 0 && (
            <button type="button" onClick={() => void act("cancel")} disabled={!!busy} className={cn(softBtn, "text-red-600 dark:text-red-400")}>
              {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Ban className="h-4 w-4" aria-hidden />}
              {t.actions.cancel}
            </button>
          )}
          {s.failed > 0 && c.status !== "cancelled" && (
            <button type="button" onClick={() => void act("retry")} disabled={!!busy} className={softBtn}>
              {busy === "retry" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
              {t.actions.retry}
            </button>
          )}
          <button type="button" onClick={() => void duplicate()} disabled={!!busy} className={softBtn}>
            {busy === "duplicate" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {t.actions.duplicate}
          </button>
        </div>
      </div>

      {/* Progreso */}
      {(c.status === "sending" || c.status === "paused") && total > 0 && (
        <div className="border-b border-line px-4 py-3 sm:px-6">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>{t.progress.replace("{done}", processed.toLocaleString(locale)).replace("{total}", total.toLocaleString(locale))}</span>
            <span className="tabular-nums">{pct(processed, total)}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-card-soft dark:bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={processed}
          >
            <div
              className={cn("h-full rounded-full transition-[width]", c.status === "paused" ? "bg-violet-500" : "bg-brand-green-dark dark:bg-brand-green")}
              style={{ width: `${Math.min(100, (processed / total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid border-b border-line sm:grid-cols-4 xl:grid-cols-7">
        {kpis.map((k) => (
          <div key={k.label} className="border-line px-6 py-4 sm:border-r xl:last:border-r-0">
            <p className="text-sm text-muted">{k.label}</p>
            <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums text-heading", k.bad && "text-red-600 dark:text-red-400")}>{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-muted">{k.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-5 px-4 py-5 sm:px-6 xl:grid-cols-2">
        {/* Embudo */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.funnel}</h2>
          <p className="mb-4 text-xs text-muted">{t.funnelHint}</p>
          <HBarChart rows={funnel} valueLabel={m.recipients} highlight={actedLabel} />
          {noTracking && <p className="mt-3 text-xs text-muted">{t.noTracking}</p>}
        </section>

        {/* Interacción por hora */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.hourly}</h2>
          <p className="mb-4 text-xs text-muted">{email ? t.hourlyHintEmail : t.hourlyHintWa}</p>
          <HourlyChart locale={locale} data={report?.hourly ?? []} label={engagedLabel} />
        </section>

        {/* Resultados de negocio */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.business}</h2>
          <p className="mb-4 text-xs text-muted">{t.businessHint}</p>
          <dl className="grid grid-cols-2 gap-3">
            {[
              [t.meetings, (report?.meetings ?? 0).toLocaleString(locale)],
              [t.advanced, (report?.advanced ?? 0).toLocaleString(locale)],
              [t.won, (report?.won ?? 0).toLocaleString(locale)],
              [
                t.wonValue,
                new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(report?.won_value ?? 0),
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-card-soft px-4 py-3 dark:bg-white/[0.05]">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-heading">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Prueba A/B */}
        {ab?.a && ab?.b && (
          <section className={card}>
            <h2 className="text-[0.98rem] font-semibold text-heading">{t.ab.title}</h2>
            <p className="mb-4 text-xs text-muted">{t.ab.hint}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["a", "b"] as const).map((k) => {
                const v = ab[k];
                const rate = (n: number) => (v.sent ? Math.round((n / v.sent) * 100) : 0);
                const other = ab[k === "a" ? "b" : "a"];
                const wins = v.sent > 0 && other.sent > 0 && v.opened / v.sent > other.opened / other.sent;
                return (
                  <div key={k} className={cn("rounded-xl p-4 ring-1", wins ? "bg-[var(--meta-active)] ring-brand-green/50" : "ring-line")}>
                    <p className="flex items-center justify-between text-xs font-semibold text-muted">
                      {t.ab.variant.replace("{v}", k.toUpperCase())}
                      {wins && <span className="rounded-md bg-brand-green-dark px-1.5 py-0.5 text-[0.65rem] text-white dark:bg-brand-green dark:text-deep-950">{t.ab.winner}</span>}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-heading">{v.subject}</p>
                    <p className="mt-3 text-2xl font-semibold tabular-nums text-heading">{rate(v.opened)}%</p>
                    <p className="text-xs text-muted">{t.ab.stats.replace("{sent}", String(v.sent)).replace("{clicked}", String(rate(v.clicked)))}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Mensaje */}
        <section className={card}>
          <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.message}</h2>
          {email ? (
            <div className="rounded-lg ring-1 ring-line">
              <p className="border-b border-line px-4 py-2.5 text-sm">
                <span className="text-muted">{t.emailSubject}:</span> <span className="font-medium text-heading">{c.subject}</span>
              </p>
              <div className="grid gap-3 px-4 py-4 text-sm leading-relaxed text-body">
                {(c.body ?? "")
                  .split(/\n{2,}/)
                  .filter((p) => p.trim())
                  .map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                {c.cta_label && (
                  <span className="mt-1 inline-flex w-fit items-center rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-deep-950" title={c.cta_url ?? undefined}>
                    {c.cta_label}
                  </span>
                )}
                {c.cta_url && <p className="break-all font-mono text-xs text-muted">{c.cta_url}</p>}
              </div>
            </div>
          ) : template ? (
            <TemplatePreview template={template} values={sampleValues} caption={template.name} />
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </section>
      </div>

      <div className="border-t border-line">
        <CampaignRecipients locale={locale} channel={c.channel} rows={recipients} campaignName={c.name} />
      </div>
    </div>
  );
}

/** Barras por hora desde que empezó el envío (un solo tono). */
function HourlyChart({ locale, data, label }: { locale: Locale; data: { hour: number; n: number }[]; label: string }) {
  const t = campaignReportCopy[locale];
  const c = useChartTheme();
  const [table, setTable] = useState(false);
  // Horas sin interacción también se muestran (en cero), mínimo un día.
  const last = Math.max(23, ...data.map((d) => d.hour));
  const rows = Array.from({ length: Math.min(last, 71) + 1 }, (_, hour) => ({ hour, n: data.find((d) => d.hour === hour)?.n ?? 0 }));
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted">{t.noHourly}</p>;
  return (
    <div>
      <div className="h-56" role="img" aria-label={`${t.hourly}: ${data.reduce((s, d) => s + d.n, 0)} ${label.toLowerCase()}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap={1}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="hour" tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} interval={5} tickFormatter={(h: number) => `${h}h`} />
            <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: c.grid, opacity: 0.6 }}
              content={(p) =>
                p.active && p.payload?.length ? (
                  <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: c.tooltipBg, color: c.surface }}>
                    <p className="font-semibold">{t.hourAxis.replace("{n}", String(p.label))}</p>
                    <p className="mt-0.5">
                      {label}: <span className="font-semibold tabular-nums">{String(p.payload[0].value)}</span>
                    </p>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="n" name={label} fill={c.single} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
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
              <th scope="col" className="py-1 font-semibold">{t.hours}</th>
              <th scope="col" className="py-1 text-right font-semibold">{label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.hour}>
                <td className="py-1 text-body">{t.hourAxis.replace("{n}", String(d.hour))}</td>
                <td className="py-1 text-right tabular-nums text-heading">{d.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
