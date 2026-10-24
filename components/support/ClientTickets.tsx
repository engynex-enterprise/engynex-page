"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, LifeBuoy, Plus, Search, Star } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { ticketsCopy } from "@/content/tickets";
import { supportClientCopy } from "@/content/supportClient";
import type { Locale } from "@/i18n/config";
import { ticketStatusTone } from "@/lib/tickets";
import type { Ticket } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Tab = "active" | "waiting" | "done";

/**
 * Vista del cliente o proveedor: sus solicitudes con métricas arriba, pestañas
 * (activas, esperando tu respuesta, resueltas), búsqueda y el enlace para
 * calificar la atención de las resueltas.
 */
export function ClientTickets({ locale, tickets }: { locale: Locale; tickets: Ticket[] }) {
  const t = ticketsCopy[locale];
  const c = supportClientCopy[locale];
  const base = `/${locale}/portal/soporte`;
  const [tab, setTab] = useState<Tab>(tickets.some((x) => x.status === "waiting") ? "waiting" : "active");
  const [q, setQ] = useState("");
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  const groups: Record<Tab, Ticket[]> = {
    active: tickets.filter((x) => x.status === "open" || x.status === "in_progress"),
    waiting: tickets.filter((x) => x.status === "waiting"),
    done: tickets.filter((x) => x.status === "resolved" || x.status === "closed"),
  };
  const term = q.trim().toLowerCase();
  const rows = groups[tab].filter((x) => !term || x.subject.toLowerCase().includes(term) || String(x.number).includes(term.replace("#", "")));
  const rated = tickets.filter((x) => x.csat_rating != null);
  const kpis = [
    { key: "active", value: groups.active.length },
    { key: "waiting", value: groups.waiting.length, alert: groups.waiting.length > 0 },
    { key: "done", value: groups.done.length },
    { key: "csat", value: rated.length ? `${(rated.reduce((n, x) => n + (x.csat_rating ?? 0), 0) / rated.length).toFixed(1)} / 5` : "—" },
  ] as const;

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r lg:border-b-0 lg:[&:nth-child(4n)]:border-r-0">
            <p className="text-sm text-muted">{c.kpis[k.key]}</p>
            <p className={cn("mt-1 text-[1.7rem] font-semibold leading-none tabular-nums", "alert" in k && k.alert ? "text-violet-700 dark:text-violet-300" : "text-heading")}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav aria-label={t.client.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(["active", "waiting", "done"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {c.tabs[key]}
              <span className="rounded-full bg-[var(--meta-active)] px-1.5 text-xs tabular-nums text-heading">{groups[key].length}</span>
            </button>
          ))}
        </nav>
        <div className="my-2 flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label className="sr-only" htmlFor="my-ticket-search">{c.search}</label>
            <input
              id="my-ticket-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={c.search}
              className="h-9 w-56 rounded-[10px] bg-transparent pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
            />
          </div>
          <Link href={`${base}/nueva`} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.client.new}
          </Link>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {tickets.length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--meta-active)] text-heading">
              <LifeBuoy className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-4 text-sm text-muted">{t.client.empty}</p>
            <Link href={`${base}/nueva`} className={cn(buttonClasses("primary", "md"), "mt-5")}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.client.new}
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{c.empty[tab]}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface dark:bg-card">
            {rows.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--meta-hover)]">
                <Link href={`${base}/${x.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="w-14 font-mono text-sm text-muted">#{x.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] font-semibold text-heading">{x.subject}</span>
                    <span className="block text-xs text-muted">{c.updated.replace("{date}", fmt(x.last_activity_at))}</span>
                  </span>
                  <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", ticketStatusTone[x.status])}>{t.status[x.status]}</span>
                </Link>
                {tab === "done" && x.status === "resolved" && x.csat_rating == null ? (
                  <Link href={`/${locale}/soporte/encuesta?t=${x.csat_token}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline">
                    <Star className="h-4 w-4" aria-hidden />
                    {c.rate}
                  </Link>
                ) : x.csat_rating != null ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm tabular-nums text-muted" aria-label={c.ratedAria.replace("{n}", String(x.csat_rating))}>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {x.csat_rating}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">{c.hint}</p>
      </div>
    </div>
  );
}
