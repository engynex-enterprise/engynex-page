"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Json, LeadTier, PageView } from "@/lib/supabase/types";
import { analyticsBehaviorCopy } from "@/content/analyticsBehavior";
import { analyticsProCopy } from "@/content/analyticsPro";
import { Select } from "@/components/ui/Select";
import { tierStyles } from "@/lib/tiers";
import { Journey } from "./Journey";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type VisitorRow = {
  id: string;
  first_seen: string;
  last_seen: string;
  first_landing: string | null;
  first_referrer: string | null;
  first_utm: Json | null;
  first_gclid: string | null;
  device: string | null;
  country: string | null;
  page_views: number;
  lead: { id: string; name: string; tier: LeadTier } | null;
};

type EventRow = { id: number; name: string; label: string | null; path: string | null; created_at: string };
type Filter = "all" | "leads" | "anonymous";
const PAGE = 50;

/** Canal de llegada (misma regla que analytics_channel en la base). */
function channelOf(v: VisitorRow) {
  const utm = (v.first_utm ?? {}) as Record<string, string>;
  const medium = (utm.utm_medium ?? "").toLowerCase();
  const source = (utm.utm_source ?? "").toLowerCase();
  const ref = (v.first_referrer ?? "").toLowerCase();
  if (v.first_gclid || ["cpc", "ppc", "paid", "paidsocial", "paid_social", "ads", "display"].includes(medium)) return "paid";
  if (["email", "e-mail", "newsletter"].includes(medium)) return "email";
  if (/(facebook|instagram|linkedin|tiktok|twitter|^x$|youtube|whatsapp)/.test(source) || /(facebook\.|instagram\.|linkedin\.|lnkd\.in|tiktok\.|t\.co\/|twitter\.|x\.com|youtube\.|whatsapp\.|wa\.me)/.test(ref)) return "social";
  if (/(google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|baidu\.|yandex\.)/.test(ref)) return "organic";
  if (source) return "campaign";
  if (!ref) return "direct";
  return "referral";
}

/** Fuente legible: utm_source, Google Ads o el dominio que lo trajo. */
function sourceOf(v: VisitorRow) {
  const utm = (v.first_utm ?? {}) as Record<string, string>;
  if (utm.utm_source) return utm.utm_source;
  if (v.first_gclid) return "Google Ads";
  if (v.first_referrer) {
    try {
      return new URL(v.first_referrer).hostname.replace(/^www\./, "");
    } catch {
      return v.first_referrer;
    }
  }
  return null;
}

const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";

/**
 * Visitantes medidos: búsqueda, filtros (con lead, canal, dispositivo) y
 * paginación. Al abrir uno se ve su recorrido y sus eventos.
 */
export function VisitorsView({ locale, rows, initialSelected }: { locale: Locale; rows: VisitorRow[]; initialSelected: string | null }) {
  const t = analyticsBehaviorCopy[locale].visitors;
  const p = analyticsProCopy[locale];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [channel, setChannel] = useState("");
  const [device, setDevice] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(initialSelected);

  const enriched = useMemo(() => rows.map((v) => ({ ...v, channel: channelOf(v), source: sourceOf(v) })), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter((v) => filter === "all" || (filter === "leads" ? !!v.lead : !v.lead))
      .filter((v) => !channel || v.channel === channel)
      .filter((v) => !device || (v.device ?? "unknown") === device)
      .filter((v) => !q || [v.lead?.name, v.first_landing, v.source, v.id].some((x) => x?.toLowerCase().includes(q)));
  }, [enriched, filter, channel, device, query]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const current = Math.min(page, pages - 1);
  const slice = visible.slice(current * PAGE, current * PAGE + PAGE);
  const counts = useMemo(
    () => ({ all: enriched.length, leads: enriched.filter((v) => v.lead).length, anonymous: enriched.filter((v) => !v.lead).length }),
    [enriched],
  );

  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
  const open = (id: string | null) => {
    setSelected(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("v", id);
    else url.searchParams.delete("v");
    window.history.replaceState(null, "", url);
  };
  const visitor = enriched.find((v) => v.id === selected) ?? null;

  return (
    <div className="px-4 py-4 sm:px-6">
      <div role="tablist" aria-label={t.cols.visitor} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
        {(Object.keys(t.filters) as Filter[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={filter === k}
            onClick={() => {
              setFilter(k);
              setPage(0);
            }}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[0.94rem] transition-colors",
              filter === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.filters[k]}
            <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t.search}
            className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
          />
        </label>
        <div className="w-48">
          <Select
            size="sm"
            label={t.channel}
            value={channel}
            onChange={(v) => {
              setChannel(v);
              setPage(0);
            }}
            options={[{ value: "", label: t.allChannels }, ...Object.entries(p.channels).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <div className="w-40">
          <Select
            size="sm"
            label={t.device}
            value={device}
            onChange={(v) => {
              setDevice(v);
              setPage(0);
            }}
            options={[{ value: "", label: t.allDevices }, ...Object.entries(p.devices).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <span className="ml-auto text-sm text-muted">{t.count.replace("{n}", visible.length.toLocaleString(locale))}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-left text-[0.9rem]">
          <thead>
            <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
              {(["visitor", "channel", "landing", "pages", "first", "last", "country"] as const).map((k) => (
                <th key={k} scope="col" className={cn("px-3 py-3 font-medium", k === "pages" && "text-right")}>
                  {t.cols[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-muted">
                  {t.empty}
                </td>
              </tr>
            )}
            {slice.map((v) => (
              <tr
                key={v.id}
                onClick={() => open(v.id)}
                className={cn("h-[3.5rem] cursor-pointer border-b border-line transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]", selected === v.id && "bg-[var(--meta-active)]/60")}
              >
                <td className="px-3 py-2">
                  {v.lead ? (
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", tierStyles[v.lead.tier].dot)} aria-hidden />
                      <span className="font-medium text-heading">{v.lead.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted">
                      {t.anonymous} · <span className="font-mono text-xs">{v.id.slice(0, 6)}</span>
                    </span>
                  )}
                  <span className="block text-xs text-muted">{p.devices[v.device ?? "unknown"]}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="block text-heading">{p.channels[v.channel]}</span>
                  {v.source && <span className="block max-w-[12rem] truncate text-xs text-muted">{v.source}</span>}
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2 font-mono text-[0.8rem] text-body">{v.first_landing ?? "—"}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-heading">{v.page_views}</td>
                <td className="whitespace-nowrap px-3 py-2 text-body">{fmt.format(new Date(v.first_seen))}</td>
                <td className="whitespace-nowrap px-3 py-2 text-body">{fmt.format(new Date(v.last_seen))}</td>
                <td className="px-3 py-2 text-body">
                  {v.country ? (
                    <span title={v.country}>
                      {flag(v.country)} {v.country}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted">{t.page.replace("{n}", String(current + 1)).replace("{total}", String(pages))}</span>
          <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="h-9 rounded-[10px] px-3 font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-40">
            {t.prev}
          </button>
          <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="h-9 rounded-[10px] px-3 font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-40">
            {t.next}
          </button>
        </div>
      )}

      {visitor && <VisitorDrawer key={visitor.id} locale={locale} visitor={visitor} onClose={() => open(null)} />}
    </div>
  );
}

/** Panel de un visitante: datos de llegada, recorrido y eventos. */
function VisitorDrawer({
  locale,
  visitor: v,
  onClose,
}: {
  locale: Locale;
  visitor: VisitorRow & { channel: string; source: string | null };
  onClose: () => void;
}) {
  const t = analyticsBehaviorCopy[locale].visitors;
  const d = t.drawer;
  const p = analyticsProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [views, setViews] = useState<PageView[] | null>(null);
  const [events, setEvents] = useState<EventRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      supabase.from("page_views").select("*").eq("visitor_id", v.id).order("created_at").limit(300),
      supabase.from("analytics_events").select("id, name, label, path, created_at").eq("visitor_id", v.id).order("created_at", { ascending: false }).limit(100),
    ]).then(([pv, ev]) => {
      if (!alive) return;
      setViews((pv.data ?? []) as PageView[]);
      setEvents((ev.data ?? []) as EventRow[]);
    });
    return () => {
      alive = false;
    };
  }, [supabase, v.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
  const facts: [string, string][] = [
    [d.first, fmt.format(new Date(v.first_seen))],
    [d.last, fmt.format(new Date(v.last_seen))],
    [d.source, `${p.channels[v.channel]}${v.source ? ` · ${v.source}` : ""}`],
    [d.landing, v.first_landing ?? "—"],
    [d.device, p.devices[v.device ?? "unknown"]],
    [d.country, v.country ? `${flag(v.country)} ${v.country}` : "—"],
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={v.lead?.name ?? `${t.anonymous} ${v.id.slice(0, 6)}`}
        className="fixed inset-y-3 right-3 z-50 flex w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-heading">
              {v.lead?.name ?? (
                <>
                  {t.anonymous} · <span className="font-mono text-base">{v.id.slice(0, 6)}</span>
                </>
              )}
            </h2>
            {v.lead && (
              <Link href={`/${locale}/portal/crm/${v.lead.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                {d.openLead}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={d.close} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line px-5 py-4">
            {facts.map(([k, val]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="truncate text-sm text-heading" title={val}>{val}</dd>
              </div>
            ))}
          </dl>
          <section className="border-b border-line px-5 py-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted">{d.journey}</h3>
            {views === null ? <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden /> : <Journey locale={locale} views={views} />}
          </section>
          <section className="px-5 py-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted">{d.events}</h3>
            {events === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
            ) : events.length === 0 ? (
              <p className="text-sm text-muted">{d.noEvents}</p>
            ) : (
              <ul className="grid gap-2">
                {events.map((e) => (
                  <li key={e.id} className="text-sm">
                    <span className="font-medium text-heading">{p.events[e.name] ?? e.name}</span>
                    {e.label && <span className="text-muted"> · {e.label}</span>}
                    <span className="block text-xs text-muted">
                      {fmt.format(new Date(e.created_at))}
                      {e.path ? ` · ${e.path}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
