"use client";

import { useMemo, useState } from "react";
import { Check, CloudDownload, Copy, Globe, Link2, Mail, Megaphone, MousePointerClick, Search, Share2, Tag } from "lucide-react";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { analyticsProCopy } from "@/content/analyticsPro";
import { analyticsAcquisitionCopy } from "@/content/analyticsAcquisition";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type AcqChannel = { channel: string; visitors: number; sessions: number; leads: number; green: number; won_value: number };
export type AcqSource = { source: string; visitors: number; leads: number; green: number };
export type AcqCampaign = { campaign: string; visitors: number; leads: number; green: number; won_value: number };

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
const th = "px-3 py-3 font-medium";
const td = "px-3 py-2 tabular-nums";
const field =
  "h-10 w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]";

/** Ícono por canal (la identidad no depende del color). */
const channelIcon: Record<string, typeof Globe> = {
  direct: Link2,
  organic: Search,
  paid: Megaphone,
  social: Share2,
  email: Mail,
  referral: Globe,
  campaign: Tag,
};

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "—");

/** Descarga un CSV (con BOM para que Excel lea las tildes). */
function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function CardHeader({ title, hint, onCsv, csvLabel }: { title: string; hint?: string; onCsv?: () => void; csvLabel: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {onCsv && (
        <button type="button" onClick={onCsv} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
          <CloudDownload className="h-4 w-4" aria-hidden />
          {csvLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Adquisición: canales (con conversión y valor ganado), fuentes, campañas
 * UTM y un generador de enlaces UTM. Cada tabla se exporta a CSV.
 */
export function AcquisitionView({
  locale,
  channels,
  sources,
  campaigns,
}: {
  locale: Locale;
  channels: AcqChannel[];
  sources: AcqSource[];
  campaigns: AcqCampaign[];
}) {
  const t = analyticsAcquisitionCopy[locale].acq;
  const pro = analyticsProCopy[locale];
  const money = (v: number) =>
    v ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v) : "—";
  const num = (v: number) => v.toLocaleString(locale);
  const channelLabel = (c: string) => pro.channels[c] ?? c;
  const sourceLabel = (s: string) => (s === "direct" ? pro.channels.direct : s === "google-ads" ? "Google Ads" : s);
  const sortedChannels = [...channels].sort((a, b) => b.visitors - a.visitors);

  return (
    <div className="grid gap-6">
      {/* Canales */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={card}>
          <CardHeader
            title={t.channels}
            hint={t.channelsHint}
            csvLabel={t.csv}
            onCsv={
              channels.length
                ? () =>
                    downloadCsv(
                      "canales.csv",
                      [t.cols.channel, t.cols.visitors, t.cols.sessions, t.cols.leads, t.cols.conversion, t.cols.green, t.cols.won],
                      sortedChannels.map((c) => [channelLabel(c.channel), c.visitors, c.sessions, c.leads, pct(c.leads, c.visitors), c.green, c.won_value]),
                    )
                : undefined
            }
          />
          {channels.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-[0.92rem]">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className={th}>{t.cols.channel}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.visitors}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.sessions}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.leads}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.conversion}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.green}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.won}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChannels.map((c) => {
                    const Icon = channelIcon[c.channel] ?? MousePointerClick;
                    return (
                      <tr key={c.channel} className="h-14 border-b border-line">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card-soft text-heading dark:bg-white/[0.08]">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="font-medium text-heading">{channelLabel(c.channel)}</span>
                          </span>
                        </td>
                        <td className={cn(td, "text-right text-heading")}>{num(c.visitors)}</td>
                        <td className={cn(td, "text-right text-body")}>{num(c.sessions)}</td>
                        <td className={cn(td, "text-right font-semibold text-heading")}>{num(c.leads)}</td>
                        <td className={cn(td, "text-right text-body")}>{pct(c.leads, c.visitors)}</td>
                        <td className={cn(td, "text-right text-body")}>{num(c.green)}</td>
                        <td className={cn(td, "text-right text-body")}>{money(c.won_value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className={card}>
          <CardHeader title={t.share} csvLabel={t.csv} />
          {channels.some((c) => c.visitors > 0) ? (
            <HBarChart rows={sortedChannels.filter((c) => c.visitors > 0).map((c) => ({ label: channelLabel(c.channel), value: c.visitors }))} valueLabel={t.cols.visitors} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
          )}
        </section>
      </div>

      {/* Fuentes */}
      <section className={card}>
        <CardHeader
          title={t.sources}
          hint={t.sourcesHint}
          csvLabel={t.csv}
          onCsv={
            sources.length
              ? () =>
                  downloadCsv(
                    "fuentes.csv",
                    [t.cols.source, t.cols.visitors, t.cols.leads, t.cols.conversion, t.cols.green],
                    sources.map((s) => [sourceLabel(s.source), s.visitors, s.leads, pct(s.leads, s.visitors), s.green]),
                  )
              : undefined
          }
        />
        {sources.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-[0.92rem]">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className={th}>{t.cols.source}</th>
                  <th scope="col" className={cn(th, "text-right")}>{t.cols.visitors}</th>
                  <th scope="col" className={cn(th, "text-right")}>{t.cols.leads}</th>
                  <th scope="col" className={cn(th, "text-right")}>{t.cols.conversion}</th>
                  <th scope="col" className={cn(th, "text-right")}>{t.cols.green}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="h-12 border-b border-line">
                    <td className="max-w-[18rem] truncate px-3 py-2 font-medium text-heading">{sourceLabel(s.source)}</td>
                    <td className={cn(td, "text-right text-heading")}>{num(s.visitors)}</td>
                    <td className={cn(td, "text-right font-semibold text-heading")}>{num(s.leads)}</td>
                    <td className={cn(td, "text-right text-body")}>{pct(s.leads, s.visitors)}</td>
                    <td className={cn(td, "text-right text-body")}>{num(s.green)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Campañas UTM + generador */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={card}>
          <CardHeader
            title={t.campaigns}
            hint={t.campaignsHint}
            csvLabel={t.csv}
            onCsv={
              campaigns.length
                ? () =>
                    downloadCsv(
                      "campanas-utm.csv",
                      [t.cols.campaign, t.cols.visitors, t.cols.leads, t.cols.conversion, t.cols.green, t.cols.won],
                      campaigns.map((c) => [c.campaign, c.visitors, c.leads, pct(c.leads, c.visitors), c.green, c.won_value]),
                    )
                : undefined
            }
          />
          {campaigns.length === 0 ? (
            <div className="rounded-xl bg-card-soft p-5 text-sm text-body dark:bg-white/[0.04]">
              <p>{t.noCampaigns}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.06em] text-muted">{t.example}</p>
              <code className="mt-1 block break-all font-mono text-xs text-heading">
                https://engynex.com/es/planes?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=promo-noviembre
              </code>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-[0.92rem]">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className={th}>{t.cols.campaign}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.visitors}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.leads}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.conversion}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.green}</th>
                    <th scope="col" className={cn(th, "text-right")}>{t.cols.won}</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.campaign} className="h-12 border-b border-line">
                      <td className="max-w-[16rem] truncate px-3 py-2 font-mono text-[0.85rem] text-heading">{c.campaign}</td>
                      <td className={cn(td, "text-right text-heading")}>{num(c.visitors)}</td>
                      <td className={cn(td, "text-right font-semibold text-heading")}>{num(c.leads)}</td>
                      <td className={cn(td, "text-right text-body")}>{pct(c.leads, c.visitors)}</td>
                      <td className={cn(td, "text-right text-body")}>{num(c.green)}</td>
                      <td className={cn(td, "text-right text-body")}>{money(c.won_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <UtmBuilder locale={locale} />
      </div>
    </div>
  );
}

/** Generador de enlaces UTM para anuncios, redes y correos. */
function UtmBuilder({ locale }: { locale: Locale }) {
  const t = analyticsAcquisitionCopy[locale].acq.builder;
  const [form, setForm] = useState({ url: `https://engynex.com/${locale}`, source: "", medium: "", campaign: "", content: "" });
  const [copied, setCopied] = useState(false);
  const slug = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "-");

  const result = useMemo(() => {
    try {
      const url = new URL(form.url.trim());
      if (url.protocol !== "https:") return null;
      const pairs: [string, string][] = [
        ["utm_source", form.source],
        ["utm_medium", form.medium],
        ["utm_campaign", form.campaign],
        ["utm_content", form.content],
      ];
      for (const [k, v] of pairs) {
        if (slug(v)) url.searchParams.set(k, slug(v));
      }
      return url.toString();
    } catch {
      return null;
    }
  }, [form]);

  const input = (key: keyof typeof form, label: string, placeholder?: string) => (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={field} />
    </label>
  );

  return (
    <section className={card}>
      <h2 className="text-[0.98rem] font-semibold text-heading">{t.title}</h2>
      <p className="mb-4 text-xs text-muted">{t.hint}</p>
      <div className="grid gap-3">
        {input("url", t.url)}
        <div className="grid gap-3 sm:grid-cols-2">
          {input("source", t.source, t.sourcePh)}
          {input("medium", t.medium, t.mediumPh)}
          {input("campaign", t.campaign, t.campaignPh)}
          {input("content", t.content, t.contentPh)}
        </div>
        <div>
          <span className="text-xs font-medium text-muted">{t.result}</span>
          {result ? (
            <div className="mt-1 flex items-start gap-2 rounded-[10px] bg-[var(--meta-active)]/60 p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-heading">{result}</code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(result);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-heading ring-1 ring-line hover:bg-surface"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t.invalid}</p>
          )}
        </div>
      </div>
    </section>
  );
}
