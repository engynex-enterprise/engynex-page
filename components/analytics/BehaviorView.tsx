"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CloudDownload, ExternalLink, Search } from "lucide-react";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { analyticsBehaviorCopy } from "@/content/analyticsBehavior";
import { analyticsProCopy } from "@/content/analyticsPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type BehaviorData = {
  pages: { path: string; views: number; visitors: number; avg_ms: number; scroll: number; entries: number; exits: number; bounce: number | null }[];
  landings: { path: string; sessions: number; bounce: number | null; leads: number }[];
  events: { name: string; count: number; visitors: number }[];
  event_labels: { name: string; label: string; count: number }[];
  heat: { dow: number; hour: number; n: number }[];
  devices: Record<string, number>;
  browsers: { name: string; visitors: number }[];
  os: { name: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
  languages: Record<string, number>;
};

type PageRow = BehaviorData["pages"][number];
type SortKey = keyof Omit<PageRow, "path"> | "path";

/** Rampa secuencial de un solo tono (la misma del mapa de calor del chat). */
const HEAT = {
  light: ["#f4f4f5", "#e3f2d0", "#bfe39a", "#8fca5c", "#5c9a2c", "#3a6a17"],
  dark: ["#232326", "#2a3a1d", "#3f5a24", "#5f8a2f", "#82b83e", "#a8e05a"],
};

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
const mmss = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function CardTitle({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Comportamiento: páginas (ordenables, con búsqueda y CSV), páginas de
 * entrada con su conversión, eventos con detalle, mapa de calor por hora y
 * tecnología/ubicación de los visitantes.
 */
export function BehaviorView({ locale, data }: { locale: Locale; data: BehaviorData }) {
  const t = analyticsBehaviorCopy[locale].behavior;
  const p = analyticsProCopy[locale];
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "views", desc: true });
  const [eventOpen, setEventOpen] = useState<string | null>(data.events[0]?.name ?? null);

  const pages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.pages
      .filter((r) => !q || r.path.toLowerCase().includes(q))
      .sort((a, b) => {
        const x = a[sort.key] ?? 0;
        const y = b[sort.key] ?? 0;
        const cmp = typeof x === "string" ? x.localeCompare(String(y)) : Number(x) - Number(y);
        return sort.desc ? -cmp : cmp;
      });
  }, [data.pages, query, sort]);

  const exportCsv = () => {
    const head = ["path", "views", "visitors", "avg_seconds", "scroll", "entries", "exits", "bounce"];
    const lines = pages.map((r) => [r.path, r.views, r.visitors, Math.round(r.avg_ms / 1000), r.scroll, r.entries, r.exits, r.bounce ?? ""].join(","));
    const blob = new Blob([`﻿${[head.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "paginas.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cols: { key: SortKey; label: string; num: boolean }[] = [
    { key: "path", label: t.cols.path, num: false },
    { key: "views", label: t.cols.views, num: true },
    { key: "visitors", label: t.cols.visitors, num: true },
    { key: "avg_ms", label: t.cols.avg, num: true },
    { key: "scroll", label: t.cols.scroll, num: true },
    { key: "entries", label: t.cols.entries, num: true },
    { key: "exits", label: t.cols.exits, num: true },
    { key: "bounce", label: t.cols.bounce, num: true },
  ];
  const labels = data.event_labels.filter((l) => l.name === eventOpen);
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });

  if (data.pages.length === 0) return <p className="py-16 text-center text-sm text-muted">{t.empty}</p>;

  return (
    <div className="grid gap-6">
      {/* Páginas */}
      <section className={card}>
        <CardTitle
          title={t.pages}
          hint={t.pagesHint}
          action={
            <div className="flex items-center gap-2">
              <label className="relative block w-56">
                <span className="sr-only">{t.search}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  className="h-9 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
                />
              </label>
              <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                <CloudDownload className="h-4 w-4" aria-hidden />
                {t.export}
              </button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {cols.map((c) => {
                  const on = sort.key === c.key;
                  return (
                    <th key={c.key} scope="col" aria-sort={on ? (sort.desc ? "descending" : "ascending") : "none"} className={cn("px-3 py-2.5 font-medium", c.num && "text-right")}>
                      <button
                        type="button"
                        onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : c.num }))}
                        className={cn("inline-flex items-center gap-1 uppercase hover:text-heading", on && "text-heading")}
                      >
                        {c.label}
                        {on && (sort.desc ? <ArrowDown className="h-3 w-3" aria-hidden /> : <ArrowUp className="h-3 w-3" aria-hidden />)}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pages.map((r) => (
                <tr key={r.path} className="border-b border-line last:border-0 hover:bg-[#fafafa] dark:hover:bg-white/[0.03]">
                  <td className="max-w-[20rem] px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-mono text-[0.82rem] text-heading">{r.path}</span>
                      <a href={r.path} target="_blank" rel="noopener noreferrer" aria-label={`${t.open}: ${r.path}`} title={t.open} className="shrink-0 text-muted hover:text-heading">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-heading">{r.views.toLocaleString(locale)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-body">{r.visitors.toLocaleString(locale)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-body">{r.avg_ms ? mmss(r.avg_ms) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center justify-end gap-2">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-card-soft dark:bg-white/10" aria-hidden>
                        <span className="block h-full rounded-full bg-deep-700 dark:bg-[#9fb0d8]" style={{ width: `${r.scroll}%` }} />
                      </span>
                      <span className="w-9 text-right tabular-nums text-body">{r.scroll}%</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-body">{r.entries}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-body">{r.exits}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-body">{r.bounce != null ? `${r.bounce}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Páginas de entrada */}
        <section className={card}>
          <CardTitle title={t.landings} hint={t.landingsHint} />
          {data.landings.length === 0 ? (
            <p className="text-sm text-muted">{t.noData}</p>
          ) : (
            <table className="w-full text-left text-[0.9rem]">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">{t.cols.path}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t.cols.sessions}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t.cols.bounce}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t.cols.leads}</th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">{t.cols.conversion}</th>
                </tr>
              </thead>
              <tbody>
                {data.landings.map((r) => (
                  <tr key={r.path} className="border-b border-line last:border-0">
                    <td className="max-w-[14rem] truncate py-2 pr-3 font-mono text-[0.82rem] text-heading">{r.path}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-heading">{r.sessions}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-body">{r.bounce != null ? `${r.bounce}%` : "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-body">{r.leads}</td>
                    <td className={cn("py-2 pl-2 text-right font-semibold tabular-nums", r.leads ? "text-accent" : "text-muted")}>
                      {r.sessions ? `${((r.leads / r.sessions) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Eventos */}
        <section className={card}>
          <CardTitle title={t.events} hint={t.eventsHint} />
          {data.events.length === 0 ? (
            <p className="rounded-xl bg-card-soft px-4 py-3 text-sm text-muted dark:bg-white/[0.05]">{t.eventsEmpty}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <ul className="grid content-start gap-1" role="listbox" aria-label={t.events}>
                {data.events.map((ev) => (
                  <li key={ev.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={eventOpen === ev.name}
                      onClick={() => setEventOpen(ev.name)}
                      className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left", eventOpen === ev.name ? "bg-[var(--meta-active)]" : "hover:bg-[var(--meta-hover)]")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-heading">{p.events[ev.name] ?? ev.name}</span>
                        <span className="block text-xs text-muted">{t.people.replace("{n}", String(ev.visitors))}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-heading">{ev.count.toLocaleString(locale)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted">{t.topLabels}</p>
                {labels.length === 0 ? (
                  <p className="text-sm text-muted">{t.noLabels}</p>
                ) : (
                  <ul className="grid gap-1.5">
                    {labels.map((l) => (
                      <li key={l.label} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-body" title={l.label}>{l.label}</span>
                        <span className="tabular-nums text-heading">{l.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mapa de calor */}
      <section className={card}>
        <CardTitle title={t.heat} hint={t.heatHint} />
        <Heat locale={locale} cells={data.heat} />
      </section>

      {/* Tecnología */}
      <section className={card}>
        <CardTitle title={t.tech} />
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          <Mini title={t.devices} label={t.visitorsLabel} empty={t.noData} rows={Object.entries(data.devices).map(([k, v]) => ({ label: p.devices[k] ?? k, value: v }))} />
          <Mini title={t.browsers} label={t.visitorsLabel} empty={t.noData} rows={data.browsers.map((b) => ({ label: b.name, value: b.visitors }))} />
          <Mini title={t.os} label={t.visitorsLabel} empty={t.noData} rows={data.os.map((b) => ({ label: b.name, value: b.visitors }))} />
          <Mini
            title={t.countries}
            label={t.visitorsLabel}
            empty={t.noCountry}
            rows={data.countries.map((c) => ({ label: regionNames.of(c.country) ?? c.country, value: c.visitors }))}
          />
          <Mini
            title={t.languages}
            label={t.visitorsLabel}
            empty={t.noData}
            rows={Object.entries(data.languages).map(([k, v]) => ({ label: k === "es" ? "Español" : k === "en" ? "English" : k === "—" ? p.devices.unknown : k, value: v }))}
          />
        </div>
      </section>
    </div>
  );
}

function Mini({ title, label, empty, rows }: { title: string; label: string; empty: string; rows: { label: string; value: number }[] }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 8);
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-heading">{title}</h3>
      {sorted.length === 0 ? <p className="text-xs text-muted">{empty}</p> : <HBarChart rows={sorted} valueLabel={label} />}
    </div>
  );
}

/** Visitantes por día de la semana y hora (rampa de un solo tono). */
function Heat({ locale, cells }: { locale: Locale; cells: BehaviorData["heat"] }) {
  const t = analyticsBehaviorCopy[locale].behavior;
  const dark = useChartTheme().surface !== "#ffffff";
  const ramp = dark ? HEAT.dark : HEAT.light;
  const [table, setTable] = useState(false);
  const grid = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.n]));
  const max = Math.max(0, ...cells.map((c) => c.n));
  if (max === 0) return <p className="text-sm text-muted">{t.noData}</p>;
  const step = (n: number) => (n === 0 ? 0 : Math.min(5, Math.ceil((n / max) * 5)));
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[40rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px]" role="img" aria-label={t.heat}>
          <span />
          {hours.map((h) => (
            <span key={h} className="pb-1 text-center text-[0.65rem] tabular-nums text-muted">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {t.days.map((day, i) => (
            <div key={day} className="contents">
              <span className="pr-2 text-right text-xs leading-6 text-muted">{day}</span>
              {hours.map((h) => {
                const n = grid.get(`${i + 1}-${h}`) ?? 0;
                return (
                  <span
                    key={h}
                    title={t.heatCell.replace("{day}", day).replace("{hour}", String(h)).replace("{n}", String(n))}
                    className="h-6 rounded-[4px]"
                    style={{ background: ramp[step(n)] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
        {t.less}
        {ramp.map((color) => (
          <span key={color} className="h-3 w-3 rounded-[3px]" style={{ background: color }} aria-hidden />
        ))}
        {t.more}
        <span className="ml-1 tabular-nums">({t.max.replace("{n}", String(max))})</span>
      </div>
      <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="mt-2 text-xs font-semibold text-muted hover:text-heading">
        {table ? t.hideTable : t.table}
      </button>
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{t.day}</th>
              <th scope="col" className="py-1 font-semibold">{t.hour}</th>
              <th scope="col" className="py-1 text-right font-semibold">{t.visitorsLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...cells]
              .filter((c) => c.n > 0)
              .sort((a, b) => a.dow - b.dow || a.hour - b.hour)
              .map((c) => (
                <tr key={`${c.dow}-${c.hour}`}>
                  <td className="py-1 text-body">{t.days[c.dow - 1]}</td>
                  <td className="py-1 tabular-nums text-body">{c.hour}:00</td>
                  <td className={cn("py-1 text-right tabular-nums text-heading", c.n === max && "font-semibold")}>{c.n}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
