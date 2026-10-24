"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, MoreHorizontal, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignChannel, WaCampaign } from "@/lib/supabase/types";
import { campaignsCopy } from "@/content/campaigns";
import { campaignsListCopy } from "@/content/campaignsList";
import { campaignsProCopy } from "@/content/campaignsPro";
import { campaignStatusTone } from "@/lib/campaigns";
import { NewCampaignButton } from "./NewCampaignButton";
import { ChannelIcon, pct, type CampaignStats } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Tab = "all" | "draft" | "scheduled" | "active" | "sent" | "cancelled";
export type ListCampaign = Pick<
  WaCampaign,
  "id" | "name" | "channel" | "status" | "subject" | "template_id" | "scheduled_at" | "started_at" | "created_at" | "total"
>;

const inTab = (c: ListCampaign, tab: Tab) =>
  tab === "all" ||
  (tab === "active" ? c.status === "sending" || c.status === "paused" : c.status === tab);

const menu = "absolute right-0 z-30 mt-1 w-44 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const menuItem = "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-heading hover:bg-[var(--meta-hover)]";

/**
 * Lista de campañas de WhatsApp y correo: pestañas por estado, búsqueda,
 * filtro por canal, métricas por fila (entregados, leídos/abiertos,
 * respuestas/clics) y duplicar.
 */
export function CampaignsList({
  locale,
  campaigns,
  stats,
  templateNames,
}: {
  locale: Locale;
  campaigns: ListCampaign[];
  stats: CampaignStats[];
  templateNames: Record<string, string>;
}) {
  const t = campaignsListCopy[locale];
  const c = campaignsCopy[locale];
  const pro = campaignsProCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("all");
  const [channel, setChannel] = useState<"" | CampaignChannel>("");
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Las campañas en curso se refrescan solas mientras envían.
  const sending = campaigns.some((x) => x.status === "sending");
  useEffect(() => {
    if (!sending) return;
    const id = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [sending, router]);

  useEffect(() => {
    if (!menuFor) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-row-menu]")) setMenuFor(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuFor]);

  const byId = useMemo(() => Object.fromEntries(stats.map((s) => [s.campaign_id, s])), [stats]);
  const base = campaigns.filter((x) => !channel || x.channel === channel);
  const counts = useMemo(
    () => Object.fromEntries((Object.keys(t.tabs) as Tab[]).map((k) => [k, base.filter((x) => inTab(x, k)).length])) as Record<Tab, number>,
    [base, t.tabs],
  );
  const q = query.trim().toLowerCase();
  const visible = base
    .filter((x) => inTab(x, tab))
    .filter((x) => !q || [x.name, x.subject, x.template_id ? templateNames[x.template_id] : null].some((v) => v?.toLowerCase().includes(q)));

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const relative = (iso: string) => {
    const diff = new Date(iso).getTime() - now;
    const m = Math.round(Math.abs(diff) / 60000);
    const text = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
    return (diff > 0 ? t.inTime : t.agoTime).replace("{t}", text);
  };

  const duplicate = async (id: string) => {
    setBusy(id);
    setError(null);
    const { data, error: e } = await supabase.rpc("campaign_duplicate", { p_campaign: id });
    setBusy(null);
    setMenuFor(null);
    if (e || !data) return setError(t.duplicateError.replace("{detail}", e?.message ?? "—"));
    router.push(`/${locale}/portal/campanas/${data}`);
  };

  return (
    <div>
      {/* Pestañas por estado */}
      <div role="tablist" aria-label={c.title} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
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
            {t.tabs[k]}
            {counts[k] > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[k]}</span>}
          </button>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <div className="flex items-center rounded-[10px] bg-card-soft p-0.5 dark:bg-white/[0.06]" role="group" aria-label={pro.channels.whatsapp}>
          {(["", "whatsapp", "email"] as const).map((k) => (
            <button
              key={k || "all"}
              type="button"
              aria-pressed={channel === k}
              onClick={() => setChannel(k)}
              className={cn("h-9 rounded-lg px-3 text-sm", channel === k ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
            >
              {k ? pro.channels[k] : t.channelAll}
            </button>
          ))}
        </div>
        {error && (
          <span role="alert" className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </span>
        )}
        <div className="ml-auto">
          <NewCampaignButton locale={locale} />
        </div>
      </div>

      {/* Tabla */}
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">{q ? t.noResults : t.empty[tab]}</p>
          {!q && (tab === "all" || tab === "draft") && (
            <div className="mt-4 flex justify-center">
              <NewCampaignButton locale={locale} />
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-[0.92rem]">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.campaign}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.when}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{t.cols.recipients}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{t.cols.delivered}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{t.cols.opened}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{t.cols.engaged}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.status}</th>
                <th scope="col" className="w-12"><span className="sr-only">{t.menu.more}</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((x) => {
                const s = byId[x.id];
                const when = x.scheduled_at ?? x.started_at ?? x.created_at;
                const sub = x.channel === "email" ? x.subject : x.template_id ? templateNames[x.template_id] : null;
                const done = (s?.sent ?? 0) + (s?.failed ?? 0);
                const href = `/${locale}/portal/campanas/${x.id}`;
                const started = x.status !== "draft" && x.status !== "scheduled";
                return (
                  <tr key={x.id} className="h-[3.75rem] border-b border-line transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      <Link href={href} className="flex items-center gap-3">
                        <ChannelIcon channel={x.channel} />
                        <span className="min-w-0">
                          <span className="block max-w-[22rem] truncate font-medium text-heading hover:underline">{x.name}</span>
                          {sub && <span className={cn("block max-w-[22rem] truncate text-xs text-muted", x.channel === "whatsapp" && "font-mono")}>{sub}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="block text-heading">{fmt(when)}</span>
                      <span className="block text-xs text-muted">{relative(when)}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-heading">{started ? x.total.toLocaleString(locale) : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-heading">{started ? pct(s?.delivered, x.total) : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-heading">{started ? pct(s?.opened, s?.delivered || s?.sent) : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-heading">{started ? pct(s?.engaged, s?.delivered || s?.sent) : "—"}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", campaignStatusTone[x.status])}>{c.status[x.status]}</span>
                      {(x.status === "sending" || x.status === "paused") && x.total > 0 && (
                        <span className="mt-1.5 block w-28">
                          <span className="block h-1.5 overflow-hidden rounded-full bg-card-soft dark:bg-white/10">
                            <span className="block h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${Math.min(100, (done / x.total) * 100)}%` }} />
                          </span>
                          <span className="mt-0.5 block text-[0.7rem] text-muted">{t.progress.replace("{done}", String(done)).replace("{total}", String(x.total))}</span>
                        </span>
                      )}
                    </td>
                    <td className="relative px-1 py-2" data-row-menu>
                      <button
                        type="button"
                        onClick={() => setMenuFor((v) => (v === x.id ? null : x.id))}
                        aria-expanded={menuFor === x.id}
                        aria-label={t.menu.more}
                        className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                      >
                        {busy === x.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MoreHorizontal className="h-4 w-4" aria-hidden />}
                      </button>
                      {menuFor === x.id && (
                        <div className={menu}>
                          <Link href={href} className={menuItem}>
                            <ExternalLink className="h-4 w-4" aria-hidden />
                            {t.menu.open}
                          </Link>
                          <button type="button" onClick={() => void duplicate(x.id)} className={menuItem}>
                            <Copy className="h-4 w-4" aria-hidden />
                            {t.menu.duplicate}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
