"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GitMerge, KanbanSquare, List, ListFilter, Loader2, Search, Tag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import { QueueBoard, initials } from "./QueueBoard";
import { supportProCopy } from "@/content/supportPro";
import { supportQueueCopy } from "@/content/supportQueue";
import { ticketsCopy } from "@/content/tickets";
import type { Locale } from "@/i18n/config";
import { shortDuration, slaState, slaTone } from "@/lib/supportSla";
import { ticketPriorities, ticketPriorityTone, ticketStatuses, ticketStatusTone } from "@/lib/tickets";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Tab = "active" | "mine" | "unassigned" | "breached" | "waiting" | "done" | "all";
type View = "list" | "board";
type Filters = { priority: string; category: string; agent: string; tag: string; source: string };

const TABS: Tab[] = ["active", "mine", "unassigned", "breached", "waiting", "done", "all"];
const ACTIVE = new Set<TicketStatus>(["open", "in_progress", "waiting"]);
const RANK: Record<TicketPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const NO_FILTERS: Filters = { priority: "", category: "", agent: "", tag: "", source: "" };

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
const menu = "absolute z-30 mt-2 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const bulkBtn = "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70 disabled:opacity-50";

/**
 * Bandeja del equipo: pestañas (activas, mías, vencidas…), búsqueda, filtros,
 * lista con cuenta regresiva del SLA o tablero por estado, y acciones en lote
 * (asignar, estado, prioridad, etiquetar, unir duplicadas).
 */
export function TicketQueue({
  locale,
  tickets,
  employees,
  categories,
  me,
  initialNow,
}: {
  locale: Locale;
  tickets: Ticket[];
  employees: { id: string; name: string }[];
  categories: { value: string; label: string }[];
  me: string;
  initialNow: string;
}) {
  const t = supportQueueCopy[locale];
  const pro = supportProCopy[locale];
  const tc = ticketsCopy[locale];
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const searchRef = useRef<HTMLInputElement>(null);

  // Copia local para cambios optimistas; se reemplaza cuando llegan datos nuevos.
  const [source, setSource] = useState(tickets);
  const [rows, setRows] = useState(tickets);
  if (source !== tickets) {
    setSource(tickets);
    setRows(tickets);
  }

  const [tab, setTab] = useState<Tab>(() => (TABS.includes(params.get("f") as Tab) ? (params.get("f") as Tab) : "active"));
  const [view, setView] = useState<View>(() => (params.get("v") === "board" ? "board" : "list"));
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagDraft, setTagDraft] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(() => new Date(initialNow).getTime());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // "/" enfoca la búsqueda; Escape quita la selección.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelected(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cerrar menús al hacer clic fuera.
  useEffect(() => {
    if (!filterOpen && !tagOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-menu]")) {
        setFilterOpen(false);
        setTagOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen, tagOpen]);

  const setUrl = (key: string, value: string | null) => {
    const q = new URLSearchParams(window.location.search);
    if (value) q.set(key, value);
    else q.delete(key);
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
  };

  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const allTags = useMemo(() => [...new Set(rows.flatMap((x) => x.tags ?? []))].sort(), [rows]);

  /** ¿La solicitud entra en la pestaña? `ignoreStatus` = para el tablero. */
  const inTab = (x: Ticket, s: Tab, ignoreStatus = false) => {
    if (s === "all") return true;
    if (x.merged_into) return false;
    const active = ignoreStatus || ACTIVE.has(x.status);
    switch (s) {
      case "active":
        return active;
      case "mine":
        return active && x.assigned_to === me;
      case "unassigned":
        return active && !x.assigned_to;
      case "breached":
        return !!slaState(x, now)?.breached;
      case "waiting":
        return ignoreStatus || x.status === "waiting";
      case "done":
        return ignoreStatus || x.status === "resolved" || x.status === "closed";
    }
  };

  const term = query.trim().toLowerCase();
  const matches = (x: Ticket) =>
    (!term ||
      String(x.number).includes(term.replace("#", "")) ||
      [x.subject, x.name, x.email, x.company ?? ""].some((v) => v.toLowerCase().includes(term))) &&
    (!filters.priority || x.priority === filters.priority) &&
    (!filters.category || x.category === filters.category) &&
    (!filters.agent || (filters.agent === "none" ? !x.assigned_to : x.assigned_to === filters.agent)) &&
    (!filters.tag || (x.tags ?? []).includes(filters.tag)) &&
    (!filters.source || x.source === filters.source);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((s) => [s, rows.filter((x) => inTab(x, s)).length])) as Record<Tab, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, now, me],
  );

  const sorted = (list: Ticket[]) =>
    [...list].sort((a, b) => {
      const aActive = ACTIVE.has(a.status) && !a.merged_into;
      const bActive = ACTIVE.has(b.status) && !b.merged_into;
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (!aActive) return b.last_activity_at.localeCompare(a.last_activity_at);
      const p = RANK[a.priority] - RANK[b.priority];
      if (p) return p;
      const da = slaState(a, now)?.due ?? "9999";
      const db = slaState(b, now)?.due ?? "9999";
      return da.localeCompare(db) || b.last_activity_at.localeCompare(a.last_activity_at);
    });

  const listRows = sorted(rows.filter((x) => inTab(x, tab) && matches(x)));
  const boardRows = sorted(rows.filter((x) => !x.merged_into && x.status !== "closed" && inTab(x, tab, true) && matches(x)));
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 4000);
  };

  const patchRows = (ids: string[], patch: Partial<Ticket> | ((x: Ticket) => Partial<Ticket>)) =>
    setRows((list) => list.map((x) => (ids.includes(x.id) ? { ...x, ...(typeof patch === "function" ? patch(x) : patch) } : x)));

  const update = async (ids: string[], patch: Partial<Pick<Ticket, "status" | "priority" | "assigned_to">>) => {
    if (!ids.length) return;
    const before = rows;
    patchRows(ids, patch);
    setBusy(true);
    const { error } = await supabase.from("tickets").update(patch).in("id", ids);
    setBusy(false);
    if (error) {
      setRows(before);
      flash(t.error);
      return;
    }
    router.refresh();
  };

  const addTag = async () => {
    const tag = tagDraft.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-").slice(0, 30);
    if (!tag) return;
    const ids = [...selected];
    setTagDraft("");
    setTagOpen(false);
    patchRows(ids, (x) => ({ tags: [...new Set([...(x.tags ?? []), tag])] }));
    setBusy(true);
    const results = await Promise.all(
      rows
        .filter((x) => ids.includes(x.id))
        .map((x) => supabase.from("tickets").update({ tags: [...new Set([...(x.tags ?? []), tag])] }).eq("id", x.id).then((r) => r.error)),
    );
    setBusy(false);
    if (results.some(Boolean)) flash(t.error);
    router.refresh();
  };

  const merge = async () => {
    const pair = rows.filter((x) => selected.has(x.id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (pair.length !== 2) return;
    const [target, src] = pair;
    if (!window.confirm(t.bulk.mergeConfirm.replaceAll("{source}", String(src.number)).replaceAll("{target}", String(target.number)))) return;
    setBusy(true);
    const { error } = await supabase.rpc("ticket_merge", { p_source: src.id, p_target: target.id });
    setBusy(false);
    if (error) {
      flash(t.error);
      return;
    }
    patchRows([src.id], { merged_into: target.id, status: "closed" });
    setSelected(new Set());
    router.refresh();
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allChecked = listRows.length > 0 && listRows.every((x) => selected.has(x.id));
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const slaLabel = (x: Ticket) => {
    const s = slaState(x, now);
    if (!s) return null;
    const when = shortDuration(s.left, pro.units);
    return { s, text: (s.breached ? pro.sla.breached : pro.sla.left).replace("{t}", when), kind: s.kind === "first" ? pro.sla.first : pro.sla.resolve };
  };

  return (
    <div className="px-4 py-4 sm:px-6">
      {/* Pestañas */}
      <div role="tablist" aria-label={pro.nav.inbox} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            onClick={() => {
              setTab(s);
              setSelected(new Set());
              setUrl("f", s === "active" ? null : s);
            }}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[0.94rem] transition-colors",
              tab === s ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.tabs[s]}
            {counts[s] > 0 && s !== "done" && s !== "all" && (
              <span
                className={cn(
                  "rounded-md px-1.5 text-xs tabular-nums",
                  s === "breached" ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-card-soft text-muted dark:bg-white/10",
                )}
              >
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            title={t.shortcuts}
            className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
          />
        </label>
        <div className="relative" data-menu>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-label={t.filter}
            title={t.filter}
            className={cn(iconBtn, "relative", activeFilters > 0 && "bg-[var(--meta-active)] text-accent")}
          >
            <ListFilter className="h-[18px] w-[18px]" aria-hidden />
            {activeFilters > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
          </button>
          {filterOpen && (
            <div className={cn(menu, "left-0 grid w-72 gap-3 p-3")}>
              <Select
                size="md"
                label={t.filters.priority}
                value={filters.priority}
                onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
                options={[{ value: "", label: t.filters.any }, ...ticketPriorities.map((x) => ({ value: x, label: tc.priority[x] }))]}
              />
              <Select
                size="md"
                label={t.filters.category}
                value={filters.category}
                onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
                options={[{ value: "", label: t.filters.any }, ...categories]}
              />
              <Select
                size="md"
                label={t.filters.agent}
                value={filters.agent}
                onChange={(v) => setFilters((f) => ({ ...f, agent: v }))}
                options={[{ value: "", label: t.filters.anyone }, { value: "none", label: t.filters.none }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
              <Select
                size="md"
                label={t.filters.source}
                value={filters.source}
                onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
                options={[{ value: "", label: t.filters.any }, ...Object.entries(pro.sources).map(([value, label]) => ({ value, label }))]}
              />
              {allTags.length > 0 && (
                <Select
                  size="md"
                  label={t.filters.tag}
                  value={filters.tag}
                  onChange={(v) => setFilters((f) => ({ ...f, tag: v }))}
                  options={[{ value: "", label: t.filters.any }, ...allTags.map((x) => ({ value: x, label: `#${x}` }))]}
                />
              )}
              {activeFilters > 0 && (
                <button type="button" onClick={() => setFilters(NO_FILTERS)} className="text-left text-sm font-semibold text-accent hover:underline">
                  {t.filters.clear}
                </button>
              )}
            </div>
          )}
        </div>
        {toast && (
          <span role="status" className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {toast}
          </span>
        )}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
        <div className="ml-auto flex items-center rounded-[10px] p-0.5" role="group" aria-label={t.views.list}>
          {(
            [
              ["list", List],
              ["board", KanbanSquare],
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                setSelected(new Set());
                setUrl("v", v === "list" ? null : v);
              }}
              aria-pressed={view === v}
              aria-label={t.views[v]}
              title={t.views[v]}
              className={cn(iconBtn, view === v && "bg-[var(--meta-hover)]")}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {/* Acciones en lote */}
      {selected.size > 0 && view === "list" && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--meta-active)] px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-heading">{t.selected.replace("{n}", String(selected.size))}</span>
          <div className="w-44">
            <Select
              size="sm"
              label={t.bulk.assign}
              placeholder={t.bulk.assign}
              value=""
              onChange={(v) => void update([...selected], { assigned_to: v === "none" ? null : v })}
              options={[{ value: me, label: t.bulk.me }, ...employees.filter((e) => e.id !== me).map((e) => ({ value: e.id, label: e.name })), { value: "none", label: t.unassigned }]}
            />
          </div>
          <div className="w-44">
            <Select
              size="sm"
              label={t.bulk.status}
              placeholder={t.bulk.status}
              value=""
              onChange={(v) => void update([...selected], { status: v as TicketStatus })}
              options={ticketStatuses.map((s) => ({ value: s, label: tc.staffStatus[s] }))}
            />
          </div>
          <div className="w-44">
            <Select
              size="sm"
              label={t.bulk.priority}
              placeholder={t.bulk.priority}
              value=""
              onChange={(v) => void update([...selected], { priority: v as TicketPriority })}
              options={ticketPriorities.map((p) => ({ value: p, label: tc.priority[p] }))}
            />
          </div>
          <div className="relative" data-menu>
            <button type="button" onClick={() => setTagOpen((v) => !v)} aria-expanded={tagOpen} className={bulkBtn}>
              <Tag className="h-4 w-4" aria-hidden />
              {t.bulk.tag}
            </button>
            {tagOpen && (
              <form
                className={cn(menu, "left-0 flex w-64 gap-2 p-2")}
                onSubmit={(e) => {
                  e.preventDefault();
                  void addTag();
                }}
              >
                <input
                  autoFocus
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder={t.bulk.tagPlaceholder}
                  list="ticket-tags"
                  aria-label={t.bulk.tag}
                  className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2.5 text-sm text-heading outline-none ring-1 ring-line focus:ring-line-strong"
                />
                <datalist id="ticket-tags">
                  {allTags.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
                <button type="submit" className="h-9 rounded-lg bg-[var(--meta-active)] px-3 text-sm font-semibold text-accent">
                  OK
                </button>
              </form>
            )}
          </div>
          <button type="button" onClick={() => void merge()} disabled={selected.size !== 2 || busy} title={selected.size !== 2 ? t.bulk.mergeHint : undefined} className={bulkBtn}>
            <GitMerge className="h-4 w-4" aria-hidden />
            {t.bulk.merge}
          </button>
          <button type="button" onClick={() => setSelected(new Set())} aria-label={t.bulk.clear} title={t.bulk.clear} className={cn(bulkBtn, "ml-auto px-2")}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {view === "board" ? (
        <QueueBoard
          locale={locale}
          tickets={boardRows}
          names={names}
          now={now}
          onMove={(id, status) => void update([id], { status })}
        />
      ) : listRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong py-14 text-center text-sm text-muted">{activeFilters || term ? t.emptyFiltered : t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-line text-[0.72rem] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th scope="col" className="w-10 py-3 pl-4">
                  <input
                    type="checkbox"
                    aria-label={t.selectAll}
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(listRows.map((x) => x.id)))}
                    className="h-4 w-4 accent-[#467316]"
                  />
                </th>
                {(["number", "subject", "priority", "status", "sla", "owner", "activity"] as const).map((k) => (
                  <th key={k} scope="col" className="px-3 py-3 font-medium">
                    {t.cols[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listRows.map((x) => {
                const sla = slaLabel(x);
                const owner = x.assigned_to ? names[x.assigned_to] ?? "—" : null;
                return (
                  <tr key={x.id} className={cn("hover:bg-[var(--meta-hover)]", selected.has(x.id) && "bg-[var(--meta-active)]/50")}>
                    <td className="py-3 pl-4">
                      <input
                        type="checkbox"
                        aria-label={t.selectRow.replace("{n}", String(x.number))}
                        checked={selected.has(x.id)}
                        onChange={() => toggle(x.id)}
                        className="h-4 w-4 accent-[#467316]"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-muted">#{x.number}</td>
                    <td className="max-w-[24rem] px-3 py-3">
                      <Link href={`/${locale}/portal/soporte/${x.id}`} className="block truncate font-semibold text-heading hover:underline">
                        {x.subject}
                      </Link>
                      <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span className="truncate">
                          {x.name}
                          {x.company ? ` · ${x.company}` : ""}
                        </span>
                        {x.merged_into && <span className="rounded bg-card-soft px-1.5 dark:bg-white/10">{t.merged}</span>}
                        {(x.tags ?? []).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setFilters((f) => ({ ...f, tag }))}
                            className="rounded bg-sky-50 px-1.5 text-sky-800 hover:underline dark:bg-sky-500/10 dark:text-sky-300"
                          >
                            #{tag}
                          </button>
                        ))}
                      </span>
                    </td>
                    <td className={cn("whitespace-nowrap px-3 py-3 font-semibold", ticketPriorityTone[x.priority])}>{tc.priority[x.priority]}</td>
                    <td className="px-3 py-3">
                      <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", ticketStatusTone[x.status])}>{tc.staffStatus[x.status]}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {sla ? (
                        <span className={cn("block font-medium tabular-nums", slaTone(sla.s))} title={fmt(sla.s.due)}>
                          {sla.text}
                          <span className="block text-xs font-normal text-muted">{sla.kind}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {owner ? (
                        <span className="flex items-center gap-2 text-heading">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-deep-700 text-[0.7rem] font-semibold text-white dark:bg-[#9fb0d8] dark:text-deep-700" aria-hidden>
                            {initials(owner)}
                          </span>
                          <span className="max-w-[9rem] truncate">{owner}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400">{t.unassigned}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmt(x.last_activity_at)}</td>
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
