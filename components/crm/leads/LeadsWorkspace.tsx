"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CloudDownload,
  CloudUpload,
  ExternalLink,
  KanbanSquare,
  List,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share,
  Star,
  Trash2,
  Trophy,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus, LeadTier } from "@/lib/supabase/types";
import { crmCopy, pipeline } from "@/content/crm";
import { crmPlus } from "@/content/crmPlus";
import { CrmBoard, type CrmLead, type Employee } from "@/components/crm/CrmBoard";
import { Select } from "@/components/ui/Select";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { leadServicesCopy, requestKey, requestLabel } from "@/content/leadServices";
import { leadSourceKey } from "@/lib/leadSource";
import { Sparkline } from "./Sparkline";
import { ScoreBars } from "./ScoreBars";
import { LeadDrawer } from "./LeadDrawer";
import { ImportDialog } from "./ImportDialog";
import { AddLeadDialog } from "./AddLeadDialog";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type WorkspaceLead = Pick<
  Lead,
  | "id"
  | "name"
  | "email"
  | "phone"
  | "company"
  | "tier"
  | "score"
  | "status"
  | "assigned_to"
  | "value_cop"
  | "created_at"
  | "last_activity_at"
  | "problem_category"
  | "problem_text"
  | "source"
  | "utm"
  | "gclid"
  | "referrer"
  | "service"
  | "request_summary"
>;

export type CrmKpis = {
  new: number;
  new_prev: number;
  qualified: number;
  qualified_prev: number;
  response_h: number | null;
  response_h_prev: number | null;
  hot: number;
  hot_prev: number;
  series: { day: string; new: number; qualified: number; response_h: number | null; hot: number }[];
};

type Tab = keyof typeof crmPlus.tabs;
type Sort = keyof typeof crmPlus.sorts;

const OPEN: LeadStatus[] = ["new", "contacted", "meeting", "proposal"];

/** CSV con comillas cuando hace falta. */
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * CRM de leads con el diseño de referencia: métricas con minigráficas,
 * pestañas, barra de herramientas, tabla con puntaje en barras, selección
 * múltiple con barra flotante, embudo y ficha lateral del cliente.
 */
export function LeadsWorkspace({
  locale,
  initialLeads,
  employees,
  favorites: initialFavorites,
  overdue,
  kpis,
  canEdit,
  isAdmin,
  me,
  openId: initialOpenId,
}: {
  locale: Locale;
  initialLeads: WorkspaceLead[];
  employees: Employee[];
  favorites: string[];
  overdue: string[];
  kpis: CrmKpis;
  canEdit: boolean;
  isAdmin: boolean;
  me: { id: string; name: string };
  openId: string | null;
}) {
  const t = crmPlus;
  const crm = crmCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState(initialLeads);
  const [favorites, setFavorites] = useState(() => new Set(initialFavorites));
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{ tier: string; status: string; source: string; owner: string }>({ tier: "", status: "", source: "", owner: "" });
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [popover, setPopover] = useState<"filter" | "sort" | "bulk-status" | "bulk-assign" | string | null>(null);
  const [dialog, setDialog] = useState<"import" | "add" | null>(null);
  const overdueSet = useMemo(() => new Set(overdue), [overdue]);
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [rowAnchor, setRowAnchor] = useState<HTMLElement | null>(null);
  const [toolAnchor, setToolAnchor] = useState<HTMLElement | null>(null);
  const [kind, setKind] = useState("");

  // Tiempo real.
  useEffect(() => {
    const channel = supabase
      .channel("crm-workspace")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id: string }).id;
          setLeads((list) => list.filter((l) => l.id !== id));
          return;
        }
        const row = payload.new as WorkspaceLead;
        setLeads((list) => (list.some((l) => l.id === row.id) ? list.map((l) => (l.id === row.id ? { ...l, ...row } : l)) : [row, ...list]));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Cerrar menús con clic afuera o Esc.
  useEffect(() => {
    if (!popover) return;
    const onDown = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest("[data-popover]")) setPopover(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setPopover(null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [popover]);

  const inTab = (l: WorkspaceLead, k: Tab) =>
    k === "all" ||
    (k === "favorites" && favorites.has(l.id)) ||
    (k === "new" && l.status === "new") ||
    (k === "mine" && l.assigned_to === me.id) ||
    (k === "overdue" && overdueSet.has(l.id)) ||
    (k === "hot" && l.score >= 80 && OPEN.includes(l.status));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = leads.filter(
      (l) =>
        inTab(l, tab) &&
        (!filters.tier || l.tier === filters.tier) &&
        (!filters.status || l.status === filters.status) &&
        (!filters.source || leadSourceKey(l) === filters.source) &&
        (!filters.owner || (filters.owner === "none" ? !l.assigned_to : l.assigned_to === filters.owner)) &&
        (!kind || requestKey(l) === kind) &&
        (!q || [l.name, l.email, l.company, l.phone, l.request_summary, requestLabel(requestKey(l), locale)].some((v) => v?.toLowerCase().includes(q))),
    );
    return list.sort((a, b) =>
      sort === "score"
        ? b.score - a.score
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "activity"
            ? b.last_activity_at.localeCompare(a.last_activity_at)
            : b.created_at.localeCompare(a.created_at),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, tab, query, filters, kind, sort, favorites, overdueSet, me.id]);

  const sources = useMemo(() => [...new Set(leads.map(leadSourceKey))].sort(), [leads]);
  // Tipos de solicitud presentes en la pestaña actual, con su conteo.
  const kinds = useMemo(() => {
    const count = new Map<string, number>();
    for (const l of leads) if (inTab(l, tab)) count.set(requestKey(l), (count.get(requestKey(l)) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1] || requestLabel(a[0], locale).localeCompare(requestLabel(b[0], locale)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, tab, favorites, overdueSet, me.id, locale]);
  const sv = leadServicesCopy[locale];
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const allChecked = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  const toggleFavorite = async (id: string) => {
    const on = favorites.has(id);
    setFavorites((s) => {
      const next = new Set(s);
      if (on) next.delete(id);
      else next.add(id);
      return next;
    });
    if (on) await supabase.from("lead_favorites").delete().eq("lead_id", id).eq("user_id", me.id);
    else await supabase.from("lead_favorites").insert({ lead_id: id });
  };

  const update = async (ids: string[], patch: Partial<Pick<Lead, "status" | "assigned_to">>) => {
    setLeads((list) => list.map((l) => (ids.includes(l.id) ? { ...l, ...patch } : l)));
    await supabase.from("leads").update(patch).in("id", ids);
  };
  const remove = async (ids: string[]) => {
    if (!window.confirm(t.confirmDelete.replace("{n}", String(ids.length)))) return;
    await supabase.from("leads").delete().in("id", ids);
    setLeads((list) => list.filter((l) => !ids.includes(l.id)));
    setSelected(new Set());
  };

  const exportCsv = () => {
    const header = ["Nombre", "Empresa", "Correo", "Teléfono", "Estado", "Color", "Puntaje", "Responsable", "Origen", sv.csv, "Valor COP", "Necesidad", "Creado"];
    const rows = filtered.map((l) => [
      l.name,
      l.company ?? "",
      l.email,
      l.phone,
      crm.status[l.status],
      crm.tier[l.tier],
      l.score,
      l.assigned_to ? names[l.assigned_to] ?? "" : "",
      t.sources[leadSourceKey(l)] ?? leadSourceKey(l),
      requestLabel(requestKey(l), locale),
      l.value_cop ?? "",
      l.problem_text ?? l.problem_category,
      l.created_at.slice(0, 10),
    ]);
    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `leads-engynex-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const fmtDate = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date(iso));
  const delta = (now: number | null, prev: number | null, inverse = false) => {
    if (now === null || prev === null || prev === 0) return null;
    const d = Math.round(((now - prev) / prev) * 1000) / 10;
    return { d, good: inverse ? d <= 0 : d >= 0 };
  };

  const kpiCards = [
    { key: "new", value: String(kpis.new), series: kpis.series.map((s) => s.new), delta: delta(kpis.new, kpis.new_prev) },
    { key: "qualified", value: String(kpis.qualified), series: kpis.series.map((s) => s.qualified), delta: delta(kpis.qualified, kpis.qualified_prev) },
    {
      key: "response",
      value: kpis.response_h === null ? "—" : t.hours.replace("{n}", String(kpis.response_h)),
      series: kpis.series.map((s) => s.response_h ?? 0),
      delta: delta(kpis.response_h, kpis.response_h_prev, true),
    },
    { key: "hot", value: String(kpis.hot), series: kpis.series.map((s) => s.hot), delta: delta(kpis.hot, kpis.hot_prev) },
  ] as const;

  const iconBtn = "grid h-10 w-10 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
  const menuPanel = "rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
  const menuItem = "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-heading hover:bg-[var(--meta-hover)]";
  const openLead = leads.find((l) => l.id === openId) ?? null;

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {/* Métricas */}
      <div className="grid border-b border-line sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k) => (
          <div key={k.key} className="flex items-center justify-between gap-4 border-line px-6 py-5 sm:border-r xl:last:border-r-0">
            <div>
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-[2rem] font-semibold leading-none tabular-nums text-heading">{k.value}</span>
                {k.delta && (
                  <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", k.delta.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {k.delta.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                    {Math.abs(k.delta.d)}%
                  </span>
                )}
              </p>
            </div>
            <Sparkline values={k.series} label={`${t.kpis[k.key]}: ${t.kpiHint}`} />
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label={t.title} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
        {(Object.keys(t.tabs) as Tab[]).map((k) => {
          const n = leads.filter((l) => inTab(l, k)).length;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => {
                setTab(k);
                setSelected(new Set());
              }}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[k]}
              {k !== "all" && n > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-4 sm:px-6">
        {/* Barra de herramientas */}
        <div ref={toolbarRef} className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
            />
          </label>

          <div className="relative" data-popover>
            <button type="button" onClick={(e) => { setToolAnchor(e.currentTarget); setPopover((p) => (p === "filter" ? null : "filter")); }} aria-label={t.filter} aria-expanded={popover === "filter"} className={cn(iconBtn, "relative")}>
              <ListFilter className="h-[18px] w-[18px]" aria-hidden />
              {activeFilters > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
            </button>
            {popover === "filter" && (
              <FloatingPanel anchor={toolAnchor} open onClose={() => setPopover(null)} align="start" className={cn(menuPanel, "grid w-72 gap-3 p-3")}>
                <Select size="md" label={t.filters.tier} value={filters.tier} onChange={(v) => setFilters((f) => ({ ...f, tier: v }))} options={[{ value: "", label: t.any }, ...(["green", "yellow", "red"] as LeadTier[]).map((k) => ({ value: k, label: crm.tier[k] }))]} />
                <Select size="md" label={t.filters.status} value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} options={[{ value: "", label: t.any }, ...pipeline.map((k) => ({ value: k, label: crm.status[k] }))]} />
                <Select size="md" label={t.filters.source} value={filters.source} onChange={(v) => setFilters((f) => ({ ...f, source: v }))} options={[{ value: "", label: t.any }, ...sources.map((k) => ({ value: k, label: t.sources[k] ?? k }))]} />
                <Select size="md" label={t.filters.owner} value={filters.owner} onChange={(v) => setFilters((f) => ({ ...f, owner: v }))} options={[{ value: "", label: t.any }, { value: "none", label: t.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
                {activeFilters > 0 && (
                  <button type="button" onClick={() => setFilters({ tier: "", status: "", source: "", owner: "" })} className="text-left text-sm font-semibold text-accent hover:underline">
                    {t.clearFilters}
                  </button>
                )}
              </FloatingPanel>
            )}
          </div>

          <div className="relative" data-popover>
            <button type="button" onClick={(e) => { setToolAnchor(e.currentTarget); setPopover((p) => (p === "sort" ? null : "sort")); }} aria-label={t.sort} aria-expanded={popover === "sort"} className={iconBtn}>
              <ArrowDownUp className="h-[18px] w-[18px]" aria-hidden />
            </button>
            {popover === "sort" && (
              <FloatingPanel anchor={toolAnchor} open onClose={() => setPopover(null)} align="start" role="menu" className={cn(menuPanel, "w-56")}>
                {(Object.keys(t.sorts) as Sort[]).map((k) => (
                  <button key={k} type="button" onClick={() => { setSort(k); setPopover(null); }} className={menuItem}>
                    <Check className={cn("h-4 w-4", sort === k ? "text-accent" : "invisible")} aria-hidden />
                    {t.sorts[k]}
                  </button>
                ))}
              </FloatingPanel>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-[10px] p-0.5" role="group" aria-label="Vista">
              <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} aria-label={t.listView} title={t.listView} className={cn(iconBtn, view === "list" && "bg-[var(--meta-hover)]")}>
                <List className="h-[18px] w-[18px]" aria-hidden />
              </button>
              <button type="button" onClick={() => setView("board")} aria-pressed={view === "board"} aria-label={t.boardView} title={t.boardView} className={cn(iconBtn, view === "board" && "bg-[var(--meta-hover)]")}>
                <KanbanSquare className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </div>
            {canEdit && (
              <button type="button" onClick={() => setDialog("import")} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                <CloudUpload className="h-4 w-4" aria-hidden />
                {t.import}
              </button>
            )}
            <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              <CloudDownload className="h-4 w-4" aria-hidden />
              {t.export}
            </button>
            {canEdit && (
              <button type="button" onClick={() => setDialog("add")} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-4 text-sm font-semibold text-accent ring-1 ring-brand-green-dark/20 hover:brightness-95">
                <Plus className="h-4 w-4" aria-hidden />
                {t.addLead}
              </button>
            )}
          </div>
        </div>

        {kinds.length > 1 && (
          <div role="group" aria-label={sv.filterLabel} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {[["", filtered.length] as const, ...kinds].map(([key, n]) => (
              <button
                key={key || "all"}
                type="button"
                aria-pressed={kind === key}
                onClick={() => setKind(key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
                  kind === key ? "bg-heading text-surface ring-heading" : "text-heading ring-line hover:bg-[var(--meta-hover)]",
                )}
              >
                {key ? requestLabel(key, locale) : sv.all}
                <span className={cn("rounded-md px-1.5 text-xs tabular-nums", kind === key ? "bg-white/20" : "bg-card-soft text-muted dark:bg-white/[0.08]")}>{key ? n : kinds.reduce((s, [, c]) => s + c, 0)}</span>
              </button>
            ))}
          </div>
        )}

        {view === "board" ? (
          <CrmBoard
            locale={locale}
            initialLeads={leads as CrmLead[]}
            employees={employees}
            canEdit={canEdit}
            currentUserId={me.id}
            visibleIds={new Set(filtered.map((l) => l.id))}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-[0.92rem]">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="w-10 py-3 pl-1 pr-2">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={allChecked}
                      onChange={() => setSelected(allChecked ? new Set() : new Set(filtered.map((l) => l.id)))}
                      className="h-4 w-4 rounded accent-brand-green-dark"
                    />
                  </th>
                  {(["customer", "request", "company", "status", "manager", "source", "score", "created"] as const).map((k) => (
                    <th key={k} scope="col" className="px-3 py-3 font-medium">{k === "request" ? sv.column : t.cols[k]}</th>
                  ))}
                  <th scope="col" className="w-12"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-sm text-muted">{t.empty}</td>
                  </tr>
                )}
                {filtered.map((l) => {
                  const checked = selected.has(l.id);
                  const fav = favorites.has(l.id);
                  return (
                    <tr
                      key={l.id}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("button, input, a, [data-popover]")) return;
                        setOpenId(l.id);
                      }}
                      className={cn("h-[3.75rem] cursor-pointer border-b border-line transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]", openId === l.id && "bg-[var(--meta-active)]/60")}
                    >
                      <td className="py-2 pl-1 pr-2">
                        <input
                          type="checkbox"
                          aria-label={l.name}
                          checked={checked}
                          onChange={() =>
                            setSelected((s) => {
                              const next = new Set(s);
                              if (checked) next.delete(l.id);
                              else next.add(l.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 rounded accent-brand-green-dark"
                        />
                      </td>
                      <td className="max-w-[13rem] px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-heading">{l.name}</span>
                            <span className="block truncate text-xs text-muted">{l.email}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(l.id)}
                            aria-label={fav ? t.unfavorite : t.favorite}
                            aria-pressed={fav}
                            className={cn("grid h-7 w-7 place-items-center rounded-md hover:bg-[var(--meta-hover)]", fav ? "text-amber-500" : "text-line-strong")}
                          >
                            <Star className={cn("h-4 w-4", fav && "fill-amber-400")} aria-hidden />
                          </button>
                        </span>
                      </td>
                      <td className="max-w-[14rem] px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[0.72rem] font-semibold",
                            l.service ? "bg-[var(--meta-active)] text-accent" : "bg-card-soft text-heading dark:bg-white/[0.08]",
                          )}
                        >
                          {requestLabel(requestKey(l), locale)}
                        </span>
                        {(l.request_summary || l.problem_text) && (
                          <span className="mt-0.5 block truncate text-xs text-muted" title={l.request_summary ?? l.problem_text ?? undefined}>
                            {l.request_summary ?? l.problem_text}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[9rem] truncate px-3 py-2 text-body">{l.company ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="whitespace-nowrap rounded-md border border-line-strong px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-heading">
                          {crm.status[l.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-heading">{l.assigned_to ? names[l.assigned_to] ?? "—" : <span className="text-muted">{t.unassigned}</span>}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-body">{t.sources[leadSourceKey(l)] ?? leadSourceKey(l)}</td>
                      <td className="px-3 py-2"><ScoreBars score={l.score} /></td>
                      <td className="whitespace-nowrap px-3 py-2 text-body">{fmtDate(l.created_at)}</td>
                      <td className="relative py-2 pr-1 text-right" data-popover>
                        <button
                          type="button"
                          onClick={(e) => {
                            setRowAnchor(e.currentTarget);
                            setPopover((p) => (p === `row-${l.id}` ? null : `row-${l.id}`));
                          }}
                          aria-expanded={popover === `row-${l.id}`}
                          aria-label={`${t.rowMenu.open}: ${l.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                        >
                          <MoreHorizontal className="h-5 w-5" aria-hidden />
                        </button>
                        {popover === `row-${l.id}` && (
                          <FloatingPanel anchor={rowAnchor} open onClose={() => setPopover(null)} role="menu" className="w-56 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                            <button type="button" onClick={() => router.push(`/${locale}/portal/crm/${l.id}`)} className={menuItem}>
                              <ExternalLink className="h-4 w-4 text-muted" aria-hidden />
                              {t.rowMenu.open}
                            </button>
                            {canEdit && (
                              <>
                                <button type="button" onClick={() => { void update([l.id], { assigned_to: me.id }); setPopover(null); }} className={menuItem}>
                                  <UserCheck className="h-4 w-4 text-muted" aria-hidden />
                                  {t.rowMenu.assignMe}
                                </button>
                                <button type="button" onClick={() => { void update([l.id], { status: "won" }); setPopover(null); }} className={menuItem}>
                                  <Trophy className="h-4 w-4 text-muted" aria-hidden />
                                  {t.rowMenu.won}
                                </button>
                              </>
                            )}
                            {isAdmin && (
                              <button type="button" onClick={() => { setPopover(null); void remove([l.id]); }} className={cn(menuItem, "text-red-600")}>
                                <Trash2 className="h-4 w-4" aria-hidden />
                                {t.rowMenu.delete}
                              </button>
                            )}
                          </FloatingPanel>
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

      {/* Barra flotante de selección */}
      {selected.size > 0 && canEdit && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl bg-[#18181b] p-1.5 pl-4 text-sm text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 lg:ml-[8.75rem]" data-popover>
          <span className="pr-2 text-white/70">{t.bulk.selected.replace("{n}", String(selected.size))}</span>
          <span className="h-5 w-px bg-white/15" aria-hidden />
          <div className="relative">
            <button type="button" onClick={(e) => { setToolAnchor(e.currentTarget); setPopover((p) => (p === "bulk-status" ? null : "bulk-status")); }} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 hover:bg-white/10">
              <Pencil className="h-4 w-4" aria-hidden />
              {t.bulk.status}
            </button>
            {popover === "bulk-status" && (
              <FloatingPanel anchor={toolAnchor} open onClose={() => setPopover(null)} align="start" placement="top" role="menu" className={cn(menuPanel, "w-52 text-heading")}>
                {pipeline.map((s) => (
                  <button key={s} type="button" onClick={() => { void update([...selected], { status: s }); setPopover(null); }} className={menuItem}>
                    {crm.status[s]}
                  </button>
                ))}
              </FloatingPanel>
            )}
          </div>
          <div className="relative">
            <button type="button" onClick={(e) => { setToolAnchor(e.currentTarget); setPopover((p) => (p === "bulk-assign" ? null : "bulk-assign")); }} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 hover:bg-white/10">
              <Share className="h-4 w-4" aria-hidden />
              {t.bulk.assign}
            </button>
            {popover === "bulk-assign" && (
              <FloatingPanel anchor={toolAnchor} open onClose={() => setPopover(null)} align="start" placement="top" role="menu" className={cn(menuPanel, "max-h-72 w-60 text-heading")}>
                {employees.map((e) => (
                  <button key={e.id} type="button" onClick={() => { void update([...selected], { assigned_to: e.id }); setPopover(null); }} className={menuItem}>
                    {e.name}
                  </button>
                ))}
              </FloatingPanel>
            )}
          </div>
          {isAdmin && (
            <button type="button" onClick={() => remove([...selected])} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 hover:bg-white/10">
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.bulk.delete}
            </button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-1 h-9 rounded-xl bg-white px-3.5 font-semibold text-red-600 hover:bg-white/90">
            {t.bulk.discard}
          </button>
        </div>
      )}

      {openLead && (
        <LeadDrawer
          key={openLead.id}
          locale={locale}
          lead={openLead}
          employees={employees}
          me={me}
          canEdit={canEdit}
          onClose={() => setOpenId(null)}
          onChange={(patch) => setLeads((list) => list.map((l) => (l.id === openLead.id ? { ...l, ...patch } : l)))}
        />
      )}
      {dialog === "import" && <ImportDialog onClose={() => { setDialog(null); router.refresh(); }} />}
      {dialog === "add" && (
        <AddLeadDialog
          locale={locale}
          employees={employees}
          me={me.id}
          onClose={() => setDialog(null)}
          onCreated={(id) => {
            setDialog(null);
            router.refresh();
            setOpenId(id);
          }}
        />
      )}
    </div>
  );
}
