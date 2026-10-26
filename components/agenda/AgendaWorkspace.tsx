"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { CalendarDays, Check, Copy, Link2, ListFilter, Loader2, Mail, MessageCircle, Plus, Rows3, Search, Settings2, X } from "lucide-react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentKind, Availability, AvailabilityBlock, MeetingChannel } from "@/lib/supabase/types";
import { agendaProCopy } from "@/content/agendaPro";
import { agendaWorkspaceCopy } from "@/content/agendaWorkspace";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { AgendaCalendar } from "./AgendaCalendar";
import { AgendaListView } from "./AgendaListView";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { LeadPicker, SlotPicker, type PickedLead } from "./pickers";
import { AGENDA_SELECT, type AgendaRow } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "toClose" | "past" | "cancelled";
type View = "list" | "calendar" | "settings";
const KINDS: AppointmentKind[] = ["discovery", "demo", "proposal", "followup", "support", "other"];
const CHANNELS: MeetingChannel[] = ["meet", "call", "whatsapp", "in_person"];

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
const menu = "rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const softBtn = "inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

/**
 * Agenda: lista por día (próximas, por cerrar, pasadas, canceladas),
 * calendario (día/semana/mes) y disponibilidad. Agendar, enviar enlace de
 * agenda, y el panel de cada reunión. Todo en vivo.
 */
export function AgendaWorkspace({
  locale,
  initial,
  employees,
  availability,
  blocks,
  initialView,
  initialOpen,
  isAdmin,
  settings,
}: {
  locale: Locale;
  initial: AgendaRow[];
  employees: { id: string; name: string }[];
  availability: Availability[];
  blocks: AvailabilityBlock[];
  initialView: View;
  initialOpen: string | null;
  isAdmin: boolean;
  /** Formularios de disponibilidad (se renderizan en el servidor). */
  settings: React.ReactNode;
}) {
  const t = agendaWorkspaceCopy[locale];
  const p = agendaProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ channel: "", kind: "", host: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState<{ id: string; close?: "done" | "no_show" } | null>(initialOpen ? { id: initialOpen } : null);
  const [dialog, setDialog] = useState<{ kind: "new"; at?: string } | { kind: "invite" } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const flash = useCallback((text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast((c) => (c?.text === text ? null : c)), 4000);
  }, []);
  const setUrl = (key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  };
  const openItem = (id: string | null, close?: "done" | "no_show") => {
    setOpen(id ? { id, close } : null);
    setUrl("a", id);
  };

  const refetch = useCallback(
    async (id: string) => {
      const { data } = await supabase.from("appointments").select(AGENDA_SELECT).eq("id", id).maybeSingle();
      if (data) setItems((list) => [data as unknown as AgendaRow, ...list.filter((x) => x.id !== id)]);
    },
    [supabase],
  );

  // En vivo: reuniones nuevas o cambiadas por cualquiera (también desde el sitio).
  useEffect(() => {
    const channel = supabase
      .channel("agenda")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setItems((list) => list.filter((x) => x.id !== old.id));
        } else {
          void refetch((payload.new as { id: string }).id);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-filter], [data-popover]")) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((a) => !filters.channel || a.channel === filters.channel)
      .filter((a) => !filters.kind || a.kind === filters.kind)
      .filter((a) => !filters.host || a.host_id === filters.host)
      .filter((a) => !q || [a.lead?.name, a.lead?.company, a.lead?.email, a.notes].some((v) => v?.toLowerCase().includes(q)));
  }, [items, filters, query]);
  const inTab = useCallback(
    (a: AgendaRow, k: Tab) =>
      k === "cancelled"
        ? a.status === "cancelled"
        : k === "upcoming"
          ? a.status === "scheduled" && Date.parse(a.ends_at) >= now
          : k === "toClose"
            ? a.status === "scheduled" && Date.parse(a.ends_at) < now
            : a.status === "done" || a.status === "no_show",
    [now],
  );
  const counts = useMemo(
    () => Object.fromEntries((Object.keys(t.tabs) as Tab[]).map((k) => [k, filtered.filter((a) => inTab(a, k)).length])) as Record<Tab, number>,
    [filtered, inTab, t.tabs],
  );
  const listItems = filtered.filter((a) => inTab(a, tab));
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const current = open ? items.find((x) => x.id === open.id) ?? null : null;

  const reschedule = async (id: string, iso: string) => {
    const { error } = await supabase.rpc("staff_reschedule", { p_id: id, p_start: iso, p_notify: true });
    if (error) return flash(t.errors[error.message] ?? t.errors.generic.replace("{detail}", error.message), true);
    await refetch(id);
    flash(t.drawer.saved);
  };

  return (
    <div className="px-4 py-4 sm:px-6">
      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-[10px] bg-card-soft p-0.5 dark:bg-white/[0.06]" role="group" aria-label={t.views.list}>
          {(
            [
              ["list", Rows3],
              ["calendar", CalendarDays],
              ...(isAdmin ? ([["settings", Settings2]] as const) : []),
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                setUrl("v", v === "list" ? null : v);
              }}
              aria-pressed={view === v}
              className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm", view === v ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="max-sm:sr-only">{t.views[v]}</span>
            </button>
          ))}
        </div>
        {view !== "settings" && (
          <>
            <label className="relative block w-full sm:w-64">
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
            <div className="relative" data-filter>
              <button type="button" onClick={(e) => { setFilterAnchor(e.currentTarget); setFilterOpen((v) => !v); }} aria-expanded={filterOpen} aria-label={t.filter} className={cn(iconBtn, "relative", activeFilters && "bg-[var(--meta-active)] text-accent")}>
                <ListFilter className="h-[18px] w-[18px]" aria-hidden />
                {activeFilters > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
              </button>
              {filterOpen && (
                <FloatingPanel anchor={filterAnchor} open onClose={() => setFilterOpen(false)} align="start" className={cn(menu, "grid w-72 gap-3 p-3")}>
                  <Select size="md" label={t.filters.channel} value={filters.channel} onChange={(v) => setFilters((f) => ({ ...f, channel: v }))} options={[{ value: "", label: t.filters.any }, ...CHANNELS.map((k) => ({ value: k, label: p.channels[k] }))]} />
                  <Select size="md" label={t.filters.kind} value={filters.kind} onChange={(v) => setFilters((f) => ({ ...f, kind: v }))} options={[{ value: "", label: t.filters.any }, ...KINDS.map((k) => ({ value: k, label: p.kinds[k] }))]} />
                  <Select size="md" label={t.filters.host} value={filters.host} onChange={(v) => setFilters((f) => ({ ...f, host: v }))} options={[{ value: "", label: t.filters.any }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
                  {activeFilters > 0 && (
                    <button type="button" onClick={() => setFilters({ channel: "", kind: "", host: "" })} className="text-left text-sm font-semibold text-accent hover:underline">
                      {t.filters.clear}
                    </button>
                  )}
                </FloatingPanel>
              )}
            </div>
          </>
        )}
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setDialog({ kind: "invite" })} className={softBtn}>
            <Link2 className="h-4 w-4" aria-hidden />
            {t.invite}
          </button>
          <button
            type="button"
            onClick={() => setDialog({ kind: "new" })}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-4 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.newMeeting}
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div role="tablist" aria-label={t.title} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
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
                {counts[k] > 0 && (
                  <span className={cn("rounded-md px-1.5 text-xs tabular-nums", k === "toClose" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-card-soft text-muted dark:bg-white/10")}>
                    {counts[k]}
                  </span>
                )}
              </button>
            ))}
          </div>
          {listItems.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.empty[tab]}</p>
          ) : (
            <AgendaListView
              locale={locale}
              items={listItems}
              names={names}
              now={now}
              descending={tab === "past" || tab === "cancelled" || tab === "toClose"}
              onOpen={(id) => openItem(id)}
              onClose={(id, status) => openItem(id, status)}
            />
          )}
        </>
      )}
      {view === "calendar" && (
        <AgendaCalendar
          locale={locale}
          items={filtered}
          names={names}
          availability={availability}
          blocks={blocks}
          onOpen={(id) => openItem(id)}
          onCreateAt={(iso) => setDialog({ kind: "new", at: iso })}
          onReschedule={(id, iso) => void reschedule(id, iso)}
        />
      )}
      {view === "settings" && settings}

      {current && (
        <AppointmentDrawer
          key={`${current.id}-${open?.close ?? ""}`}
          locale={locale}
          item={current}
          employees={employees}
          now={now}
          initialClose={open?.close}
          onClose={() => openItem(null)}
          onChanged={(text, patch) => {
            if (patch) setItems((list) => list.map((x) => (x.id === current.id ? { ...x, ...patch } : x)));
            else void refetch(current.id);
            flash(text);
          }}
        />
      )}
      {dialog?.kind === "new" && (
        <NewMeetingDialog
          locale={locale}
          at={dialog.at ?? null}
          employees={employees}
          items={items}
          onClose={() => setDialog(null)}
          onDone={(id) => {
            setDialog(null);
            void refetch(id);
            openItem(id);
          }}
        />
      )}
      {dialog?.kind === "invite" && <InviteDialog locale={locale} onClose={() => setDialog(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nueva reunión                                                      */
/* ------------------------------------------------------------------ */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const id = useId();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        onMouseDown={(e) => e.stopPropagation()}
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between">
          <h2 id={id} className="text-base font-semibold text-heading">{title}</h2>
          <button type="button" onClick={onClose} aria-label="×" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NewMeetingDialog({
  locale,
  at,
  employees,
  items,
  onClose,
  onDone,
}: {
  locale: Locale;
  at: string | null;
  employees: { id: string; name: string }[];
  items: AgendaRow[];
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const t = agendaWorkspaceCopy[locale];
  const p = agendaProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [lead, setLead] = useState<PickedLead | null>(null);
  const [form, setForm] = useState({
    starts_at: at,
    duration: 30,
    channel: "meet" as MeetingChannel,
    kind: "discovery" as AppointmentKind,
    host_id: "",
    meeting_url: "",
    location: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replaces = !!lead && items.some((a) => a.lead_id === lead.id && a.status === "scheduled");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const field =
    "h-11 w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]";

  const submit = async () => {
    if (!lead || !form.starts_at) return;
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("staff_book", { p: { ...form, lead_id: lead.id, host_id: form.host_id || null } });
    setBusy(false);
    if (e) return setError(t.errors[e.message] ?? t.errors.generic.replace("{detail}", e.message));
    onDone(data as string);
  };

  return (
    <Modal title={t.dialog.title} onClose={onClose}>
      <LeadPicker value={lead} onChange={setLead} placeholder={t.dialog.leadSearch} noResults={t.dialog.noResults} label={t.dialog.lead} />
      {replaces && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t.dialog.replaces}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Select size="md" label={t.dialog.duration} value={String(form.duration)} onChange={(v) => set("duration", Number(v))} options={[15, 30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: t.minutes.replace("{n}", String(m)) }))} />
        <Select size="md" label={t.drawer.kind} value={form.kind} onChange={(v) => set("kind", v as AppointmentKind)} options={KINDS.map((k) => ({ value: k, label: p.kinds[k] }))} />
      </div>
      <SlotPicker
        key={form.duration}
        locale={locale}
        value={form.starts_at}
        onChange={(v) => set("starts_at", v)}
        duration={form.duration}
        labels={{ day: t.dialog.day, noSlots: t.drawer.noSlots, otherTime: t.drawer.otherTime }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select size="md" label={t.drawer.channel} value={form.channel} onChange={(v) => set("channel", v as MeetingChannel)} options={CHANNELS.map((k) => ({ value: k, label: p.channels[k] }))} />
        <Select size="md" label={t.drawer.host} value={form.host_id} onChange={(v) => set("host_id", v)} options={[{ value: "", label: "—" }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
      </div>
      {form.channel === "in_person" ? (
        <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder={t.drawer.locationPlaceholder} aria-label={t.drawer.location} maxLength={300} className={field} />
      ) : form.channel === "meet" ? (
        <input type="url" value={form.meeting_url} onChange={(e) => set("meeting_url", e.target.value)} placeholder={t.drawer.linkPlaceholder} aria-label={t.drawer.link} maxLength={500} className={field} />
      ) : null}
      <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={1000} placeholder={t.drawer.notesPlaceholder} aria-label={t.drawer.notes} className={cn(field, "h-auto resize-none py-2.5")} />
      <p className="text-xs text-muted">{t.dialog.confirmation}</p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={softBtn}>
          {t.dialog.cancel}
        </button>
        <button type="button" disabled={busy || !lead || !form.starts_at} onClick={() => void submit()} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.dialog.create}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Enlace de agenda                                                   */
/* ------------------------------------------------------------------ */

function InviteDialog({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = agendaWorkspaceCopy[locale];
  const i = t.inviteDialog;
  const supabase = useMemo(() => createClient(), []);
  const [lead, setLead] = useState<PickedLead | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!lead) return;
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("booking_invite", { p_lead: lead.id });
    setBusy(false);
    if (e) return setError(t.errors[e.message] ?? t.errors.generic.replace("{detail}", e.message));
    setLink(`${window.location.origin}/${lead.locale === "en" ? "en" : "es"}/agendar?t=${data}`);
  };

  const message = lead && link ? i.message.replace("{nombre}", lead.name.split(/\s+/)[0]).replace("{link}", link) : "";
  const digits = (lead?.phone ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `57${digits}` : digits;

  return (
    <Modal title={i.title} onClose={onClose}>
      <p className="text-sm text-muted">{i.hint}</p>
      <LeadPicker
        value={lead}
        onChange={(l) => {
          setLead(l);
          setLink(null);
        }}
        placeholder={t.dialog.leadSearch}
        noResults={t.dialog.noResults}
        label={t.dialog.lead}
      />
      {link ? (
        <div className="grid gap-3">
          <label className="text-xs font-medium uppercase tracking-[0.06em] text-muted">{i.link}</label>
          <div className="flex gap-2">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="h-10 min-w-0 flex-1 rounded-[10px] bg-[#f4f4f5] px-3 font-mono text-xs text-heading outline-none dark:bg-white/[0.06]" />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              className={softBtn}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? t.drawer.copied : t.drawer.copy}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {digits && (
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={softBtn}>
                <MessageCircle className="h-4 w-4" aria-hidden />
                {i.whatsapp}
              </a>
            )}
            <a href={`mailto:${lead?.email}?subject=${encodeURIComponent(i.subject)}&body=${encodeURIComponent(message)}`} className={softBtn}>
              <Mail className="h-4 w-4" aria-hidden />
              {i.email}
            </a>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button type="button" disabled={busy || !lead} onClick={() => void create()} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {i.create}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Modal>
  );
}
