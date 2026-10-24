"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CloudDownload, Search } from "lucide-react";
import type { CampaignChannel } from "@/lib/supabase/types";
import { campaignReportCopy } from "@/content/campaignReport";
import type { RecipientRow } from "./recipients";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type { RecipientRow } from "./recipients";

type Tab = "all" | "delivered" | "engaged" | "acted" | "failed" | "pending";

const tone: Record<string, string> = {
  queued: "bg-card-soft text-muted dark:bg-white/[0.06]",
  sending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sent: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  delivered: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  read: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  opened: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  clicked: "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green/40",
  replied: "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green/40",
  bounced: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-card-soft text-muted dark:bg-white/[0.06]",
};

const inTab = (r: RecipientRow, tab: Tab) =>
  tab === "all" ||
  (tab === "delivered" && !!r.delivered_at) ||
  (tab === "engaged" && !!r.engaged_at) ||
  (tab === "acted" && !!r.acted_at) ||
  (tab === "failed" && (r.status === "failed" || r.status === "bounced")) ||
  (tab === "pending" && (r.status === "queued" || r.status === "sending"));

/**
 * Tabla de destinatarios: pestañas por resultado, búsqueda y exportación a
 * CSV (se arma en el navegador con lo que está cargado).
 */
export function CampaignRecipients({
  locale,
  channel,
  rows,
  campaignName,
}: {
  locale: Locale;
  channel: CampaignChannel;
  rows: RecipientRow[];
  campaignName: string;
}) {
  const t = campaignReportCopy[locale].recipients;
  const email = channel === "email";
  const tabs = { ...t.tabs, ...(email ? t.tabsEmail : {}) };
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => Object.fromEntries((Object.keys(t.tabs) as Tab[]).map((k) => [k, rows.filter((r) => inTab(r, k)).length])) as Record<Tab, number>,
    [rows, t.tabs],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => inTab(r, tab)).filter((r) => !q || [r.name, r.contact].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, tab, query]);

  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso)) : "—";
  const engagedLabel = email ? t.cols.openedCol : t.cols.engaged;
  const actedLabel = email ? t.cols.clicked : t.cols.acted;

  const exportCsv = () => {
    const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [t.cols.contact, email ? t.cols.email : t.cols.channel, t.cols.status, t.cols.sent, engagedLabel, actedLabel, "error"];
    const lines = visible.map((r) =>
      [r.name, r.contact, t.status[r.status] ?? r.status, r.sent_at, r.engaged_at, r.acted_at, r.error].map(esc).join(","),
    );
    const blob = new Blob([`﻿${[header.map(esc).join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${campaignName.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-destinatarios.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section aria-label={t.title}>
      <div role="tablist" aria-label={t.title} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
        {(Object.keys(t.tabs) as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[0.94rem] transition-colors",
              tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {tabs[k]}
            {counts[k] > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[k]}</span>}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
            />
          </label>
          <span className="text-xs text-muted">{t.showing.replace("{n}", visible.length.toLocaleString(locale))}</span>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50"
          >
            <CloudDownload className="h-4 w-4" aria-hidden />
            {t.export}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-[0.92rem]">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.contact}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.status}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.sent}</th>
                <th scope="col" className="px-3 py-3 font-medium">{engagedLabel}</th>
                <th scope="col" className="px-3 py-3 font-medium">{actedLabel}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted">{t.empty}</td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id} className="h-[3.5rem] border-b border-line transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]">
                  <td className="px-3 py-2">
                    {r.lead_id ? (
                      <Link href={`/${locale}/portal/crm/${r.lead_id}`} className="block truncate font-medium text-heading hover:underline">
                        {r.name ?? r.contact}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium text-heading">{r.name ?? r.contact}</span>
                    )}
                    <span className="block truncate font-mono text-xs text-muted">{r.contact}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", tone[r.status] ?? tone.queued)} title={r.error ?? undefined}>
                      {t.status[r.status] ?? r.status}
                    </span>
                    {r.error && r.error !== "bounced" && (
                      <span className="mt-0.5 block max-w-[16rem] truncate text-xs text-muted" title={r.error}>
                        {r.error}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-body">{fmt(r.sent_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-body">
                    {fmt(r.engaged_at)}
                    {email && r.engaged_at && (r.count ?? 0) > 1 && <span className="ml-1 text-xs text-muted">· {t.times.replace("{n}", String(r.count))}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-body">{fmt(r.acted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
