"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCheck,
  Eye,
  ListFilter,
  Loader2,
  MailPlus,
  MousePointerClick,
  RotateCcw,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmailQueueRow, LeadTier } from "@/lib/supabase/types";
import { automationCopy } from "@/content/automation";
import { followupQueueCopy } from "@/content/followupQueue";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import { tierStyles } from "@/lib/tiers";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type QueueRow = EmailQueueRow & { leads: { name: string; email: string; tier: LeadTier } | null };
type Tab = "queued" | "sent" | "problems" | "all";
type Payload = { subject?: string; manual?: boolean; internal?: boolean } | null;

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
const menu = "absolute z-30 mt-2 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const softBtn = "inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

const statusTone: Record<string, string> = {
  queued: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  sending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-card-soft text-muted dark:bg-white/[0.06]",
};

const inTab = (r: QueueRow, tab: Tab) =>
  tab === "all" ||
  (tab === "queued" && (r.status === "queued" || r.status === "sending")) ||
  (tab === "sent" && r.status === "sent" && !r.bounced_at) ||
  (tab === "problems" && (r.status === "failed" || r.status === "cancelled" || !!r.bounced_at));

const kindKey = (r: QueueRow) => (r.kind === "custom" && (r.payload as Payload)?.manual ? "manual" : r.kind);

/**
 * Cola de correos del seguimiento: pestañas, búsqueda, filtro por tipo,
 * acciones en lote (enviar ahora, cancelar, reintentar), métricas de cada
 * correo y un panel con el recorrido y la vista previa. Además: escribir un
 * correo a un lead e inscribir leads en la secuencia.
 */
export function EmailQueue({
  locale,
  rows,
  employees,
  canAct,
}: {
  locale: Locale;
  rows: QueueRow[];
  employees: { id: string; name: string }[];
  canAct: boolean;
}) {
  const t = followupQueueCopy[locale];
  const k = automationCopy[locale].followups;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("queued");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"compose" | "enroll" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // En vivo: cualquier cambio en la cola refresca la página (con pausa).
  useEffect(() => {
    let timer: number | undefined;
    const channel = supabase
      .channel("email-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_queue" }, () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => router.refresh(), 800);
      })
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-filter]")) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((c) => (c === text ? null : c)), 4000);
  }, []);

  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const kinds = useMemo(() => [...new Set(rows.map(kindKey))].sort(), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => inTab(r, tab))
      .filter((r) => !kind || kindKey(r) === kind)
      .filter(
        (r) =>
          !q ||
          [r.leads?.name, r.leads?.email, r.to_email, (r.payload as Payload)?.subject, k.kinds[kindKey(r)]].some((v) => v?.toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        tab === "queued" ? a.send_at.localeCompare(b.send_at) : (b.sent_at ?? b.created_at).localeCompare(a.sent_at ?? a.created_at),
      );
  }, [rows, tab, kind, query, k.kinds]);
  const counts = useMemo(
    () => Object.fromEntries((Object.keys(t.tabs) as Tab[]).map((x) => [x, rows.filter((r) => inTab(r, x)).length])) as Record<Tab, number>,
    [rows, t.tabs],
  );

  const relative = (iso: string) => {
    const diff = new Date(iso).getTime() - now;
    const m = Math.round(Math.abs(diff) / 60000);
    const text = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
    return (diff > 0 ? t.inTime : t.agoTime).replace("{t}", text);
  };
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  const bulk = async (action: "send_now" | "cancel" | "retry", ids: number[]) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("email_bulk", { p_ids: ids, p_action: action });
    setBusy(false);
    if (error) return flash(t.errors.generic.replace("{detail}", error.message));
    setSelected(new Set());
    flash(t.bulkDone.replace("{n}", String(data ?? 0)));
    router.refresh();
  };

  const toggleAll = () =>
    setSelected((s) => (visible.every((r) => s.has(r.id)) ? new Set() : new Set(visible.map((r) => r.id))));
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const open = rows.find((r) => r.id === openId) ?? null;

  return (
    <div className="px-4 py-4 sm:px-6">
      {/* Pestañas */}
      <div role="tablist" aria-label={k.queue} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
        {(Object.keys(t.tabs) as Tab[]).map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            onClick={() => {
              setTab(x);
              setSelected(new Set());
            }}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[0.94rem] transition-colors",
              tab === x ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.tabs[x]}
            {counts[x] > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[x]}</span>}
          </button>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative block w-full sm:w-80">
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
          <button type="button" onClick={() => setFilterOpen((v) => !v)} aria-expanded={filterOpen} aria-label={t.filter} className={cn(iconBtn, "relative", kind && "bg-[var(--meta-active)] text-accent")}>
            <ListFilter className="h-[18px] w-[18px]" aria-hidden />
            {kind && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
          </button>
          {filterOpen && (
            <div className={cn(menu, "left-0 grid w-72 gap-3 p-3")}>
              <Select
                size="md"
                label={t.kind}
                value={kind}
                onChange={setKind}
                options={[{ value: "", label: t.allKinds }, ...kinds.map((x) => ({ value: x, label: k.kinds[x] ?? x }))]}
              />
              {kind && (
                <button type="button" onClick={() => setKind("")} className="text-left text-sm font-semibold text-accent hover:underline">
                  {t.clear}
                </button>
              )}
            </div>
          )}
        </div>
        {toast && (
          <span role="status" className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            {toast}
          </span>
        )}
        {canAct && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDialog("enroll")} className={softBtn}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {t.enroll}
            </button>
            <button
              type="button"
              onClick={() => setDialog("compose")}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-4 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
            >
              <MailPlus className="h-4 w-4" aria-hidden />
              {t.compose}
            </button>
          </div>
        )}
      </div>

      {/* Acciones en lote */}
      {canAct && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--meta-active)] px-3 py-2 text-sm">
          <span className="font-semibold text-heading">{t.selected.replace("{n}", String(selected.size))}</span>
          {selectedRows.some((r) => r.status === "queued") && (
            <>
              <button type="button" disabled={busy} onClick={() => bulk("send_now", [...selected])} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70">
                <Send className="h-4 w-4" aria-hidden />
                {t.bulk.send_now}
              </button>
              <button type="button" disabled={busy} onClick={() => bulk("cancel", [...selected])} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70">
                <Ban className="h-4 w-4" aria-hidden />
                {t.bulk.cancel}
              </button>
            </>
          )}
          {selectedRows.some((r) => r.status === "failed" || r.status === "cancelled") && (
            <button type="button" disabled={busy} onClick={() => bulk("retry", [...selected])} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70">
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t.bulk.retry}
            </button>
          )}
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm font-medium text-muted hover:text-heading">
            {t.bulk.clear}
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-left text-[0.92rem]">
          <thead>
            <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
              {canAct && (
                <th scope="col" className="w-10 py-3 pl-1 pr-2">
                  <input
                    type="checkbox"
                    aria-label={t.selected.replace("{n}", String(visible.length))}
                    checked={visible.length > 0 && visible.every((r) => selected.has(r.id))}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded accent-brand-green-dark"
                  />
                </th>
              )}
              {(["to", "email", "when", "status", "tracking"] as const).map((c) => (
                <th key={c} scope="col" className="px-3 py-3 font-medium">
                  {t.cols[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <p className="text-sm font-medium text-heading">{t.empty}</p>
                  <p className="mt-1 text-sm text-muted">{t.emptyHint}</p>
                </td>
              </tr>
            )}
            {visible.map((r) => {
              const payload = r.payload as Payload;
              const internal = !r.lead_id && !r.draft_id && (r.kind === "new_lead_alert" || r.kind === "weekly_report" || payload?.internal);
              const when = r.status === "sent" && r.sent_at ? r.sent_at : r.send_at;
              return (
                <tr
                  key={r.id}
                  onClick={() => setOpenId(r.id)}
                  className={cn(
                    "h-[3.75rem] cursor-pointer border-b border-line transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]",
                    openId === r.id && "bg-[var(--meta-active)]/60",
                  )}
                >
                  {canAct && (
                    <td className="py-2 pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={r.leads?.name ?? r.to_email ?? String(r.id)}
                        checked={selected.has(r.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            if (next.has(r.id)) next.delete(r.id);
                            else next.add(r.id);
                            return next;
                          })
                        }
                        className="h-4 w-4 rounded accent-brand-green-dark"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {r.leads && <span className={cn("h-2 w-2 shrink-0 rounded-full", tierStyles[r.leads.tier].dot)} aria-hidden />}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-heading">{r.leads?.name ?? (internal ? t.team : r.to_email ?? "—")}</span>
                        {(r.leads?.email ?? (!internal && r.to_email)) && <span className="block truncate text-xs text-muted">{r.leads?.email ?? r.to_email}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="max-w-[18rem] px-3 py-2">
                    <span className="block truncate text-heading">{k.kinds[kindKey(r)] ?? r.kind}</span>
                    {payload?.subject && <span className="block truncate text-xs text-muted">{payload.subject}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="block text-heading">{fmt(when)}</span>
                    <span className="block text-xs text-muted">{relative(when)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", r.bounced_at ? statusTone.failed : statusTone[r.status])}>
                      {r.bounced_at ? t.tracking.bounced : k.statuses[r.status]}
                    </span>
                    {r.error && r.error !== "bounced" && <span className="mt-0.5 block max-w-[14rem] truncate text-xs text-muted">{k.reasons[r.error] ?? r.error}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Tracking row={r} locale={locale} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <EmailDrawer
          key={open.id}
          locale={locale}
          row={open}
          names={names}
          canAct={canAct}
          onClose={() => setOpenId(null)}
          onChanged={(text) => {
            flash(text);
            router.refresh();
          }}
        />
      )}
      {dialog && (
        <LeadDialog
          kind={dialog}
          locale={locale}
          onClose={() => setDialog(null)}
          onDone={(text) => {
            setDialog(null);
            flash(text);
            setTab("queued");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Íconos de entrega, apertura, clic y rebote. */
function Tracking({ row: r, locale }: { row: QueueRow; locale: Locale }) {
  const t = followupQueueCopy[locale].tracking;
  if (r.status !== "sent") return <span className="text-muted">—</span>;
  const item = (on: boolean, Icon: typeof Eye, label: string, count?: number, tone = "text-emerald-600 dark:text-emerald-400") => (
    <span title={`${label}${count && count > 1 ? ` · ${t.times.replace("{n}", String(count))}` : ""}`} className={cn("inline-flex items-center gap-0.5", on ? tone : "text-line-strong")}>
      <Icon className="h-4 w-4" aria-hidden />
      {on && count && count > 1 ? <span className="text-xs font-semibold tabular-nums">{count}</span> : null}
      <span className="sr-only">{on ? label : `—`}</span>
    </span>
  );
  if (r.bounced_at) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" aria-hidden />{t.bounced}</span>;
  return (
    <span className="flex items-center gap-2.5">
      {item(!!r.delivered_at, CheckCheck, t.delivered)}
      {item(!!r.opened_at, Eye, t.opened, r.open_count)}
      {item(!!r.clicked_at, MousePointerClick, t.clicked, r.click_count, "text-accent")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel de un correo: recorrido, vista previa y acciones             */
/* ------------------------------------------------------------------ */

function EmailDrawer({
  locale,
  row: r,
  names,
  canAct,
  onClose,
  onChanged,
}: {
  locale: Locale;
  row: QueueRow;
  names: Record<string, string>;
  canAct: boolean;
  onClose: () => void;
  onChanged: (text: string) => void;
}) {
  const t = followupQueueCopy[locale];
  const k = automationCopy[locale].followups;
  const supabase = useMemo(() => createClient(), []);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null | "error">(null);
  const [when, setWhen] = useState<string | null>(r.send_at);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/email/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "queue", id: r.id }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { subject: string; html: string }) => alive && setPreview(data))
      .catch(() => alive && setPreview("error"));
    return () => {
      alive = false;
    };
  }, [r.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null; data?: unknown }>, done: (data: unknown) => string) => {
    setBusy(true);
    setError(null);
    const { error: e, data } = await fn();
    setBusy(false);
    if (e) return setError(t.errors[e.message] ?? t.errors.generic.replace("{detail}", e.message));
    onChanged(done(data));
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const steps: [string, string | null, string?][] = [
    [t.drawer.created, r.created_at],
    [r.status === "sent" ? t.drawer.sent : t.drawer.scheduled, r.status === "sent" ? r.sent_at : r.send_at],
    [t.tracking.delivered, r.delivered_at],
    [t.tracking.opened, r.opened_at, r.open_count > 1 ? t.tracking.times.replace("{n}", String(r.open_count)) : undefined],
    [t.tracking.clicked, r.clicked_at, r.click_count > 1 ? t.tracking.times.replace("{n}", String(r.click_count)) : undefined],
    ...(r.bounced_at ? ([[t.tracking.bounced, r.bounced_at]] as [string, string][]) : []),
    ...(r.complained_at ? ([[t.tracking.complained, r.complained_at]] as [string, string][]) : []),
  ];
  const isFollowup = r.kind.startsWith("followup_");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={k.kinds[kindKey(r)] ?? r.kind}
        className="fixed inset-y-3 right-3 z-50 flex w-[min(34rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{k.kinds[kindKey(r)] ?? r.kind}</p>
            <h2 className="truncate text-lg font-semibold text-heading">{r.leads?.name ?? r.to_email ?? t.team}</h2>
            {r.created_by && names[r.created_by] && <p className="text-xs text-muted">{t.drawer.by.replace("{name}", names[r.created_by])}</p>}
          </div>
          <span className={cn("mt-1 rounded-md px-2 py-0.5 text-xs font-semibold", r.bounced_at ? statusTone.failed : statusTone[r.status])}>
            {r.bounced_at ? t.tracking.bounced : k.statuses[r.status]}
          </span>
          <button type="button" onClick={onClose} aria-label={t.drawer.close} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Recorrido */}
          <section className="border-b border-line px-5 py-4">
            <h3 className="text-xs font-medium uppercase tracking-[0.06em] text-muted">{t.drawer.timeline}</h3>
            <ol className="mt-3 grid gap-2.5">
              {steps.map(([label, at, extra]) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", at ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong")} aria-hidden />
                  <span className={cn("flex-1", at ? "text-heading" : "text-muted")}>{label}</span>
                  <span className="text-xs text-muted">
                    {at ? fmt(at) : "—"}
                    {extra ? ` · ${extra}` : ""}
                  </span>
                </li>
              ))}
            </ol>
            {r.error && (
              <p className="mt-3 rounded-lg bg-card-soft px-3 py-2 text-xs text-body dark:bg-white/[0.05]">
                <span className="font-semibold">{t.drawer.error}:</span> {k.reasons[r.error] ?? r.error}
              </p>
            )}
          </section>

          {/* Acciones */}
          {canAct && (
            <section className="grid gap-3 border-b border-line px-5 py-4">
              {r.status === "queued" && (
                <>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <DateTimePicker size="md" label={t.drawer.rescheduleLabel} value={when} onChange={setWhen} locale={locale} />
                    </div>
                    <button
                      type="button"
                      disabled={busy || !when || when === r.send_at}
                      onClick={() => run(() => supabase.rpc("email_reschedule", { p_id: r.id, p_at: when! }), () => t.drawer.reschedule)}
                      className={cn(buttonClasses("outline", "md", "h-12 px-4 disabled:opacity-50"))}
                    >
                      {t.drawer.reschedule}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={() => run(() => supabase.rpc("email_bulk", { p_ids: [r.id], p_action: "send_now" }), () => t.drawer.sendNow)} className={buttonClasses("primary", "md", "h-10 px-4")}>
                      <Send className="h-4 w-4" aria-hidden />
                      {t.drawer.sendNow}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run(() => supabase.rpc("email_bulk", { p_ids: [r.id], p_action: "cancel" }), () => t.drawer.cancel)} className={softBtn}>
                      <Ban className="h-4 w-4" aria-hidden />
                      {t.drawer.cancel}
                    </button>
                  </div>
                </>
              )}
              {(r.status === "failed" || r.status === "cancelled") && !r.bounced_at && (
                <button type="button" disabled={busy} onClick={() => run(() => supabase.rpc("email_bulk", { p_ids: [r.id], p_action: "retry" }), () => t.drawer.retry)} className={cn(softBtn, "w-fit")}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t.drawer.retry}
                </button>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {r.lead_id && (
                  <Link href={`/${locale}/portal/crm/${r.lead_id}`} className="font-semibold text-accent hover:underline">
                    {t.drawer.openLead}
                  </Link>
                )}
                {r.lead_id && isFollowup && r.status === "queued" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => supabase.rpc("followup_stop", { p_lead: r.lead_id! }), (n) => t.drawer.stopped.replace("{n}", String(n ?? 0)))}
                    className="font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    {t.drawer.stopSequence}
                  </button>
                )}
              </div>
              {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
              {error && (
                <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </section>
          )}

          {/* Vista previa */}
          <section className="px-5 py-4">
            <h3 className="text-xs font-medium uppercase tracking-[0.06em] text-muted">{t.drawer.preview}</h3>
            {preview === null ? (
              <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted" aria-hidden />
            ) : preview === "error" ? (
              <p className="mt-2 text-sm text-muted">{t.drawer.previewError}</p>
            ) : (
              <>
                <p className="mt-2 text-sm">
                  <span className="text-muted">{t.drawer.subject}:</span> <span className="font-medium text-heading">{preview.subject}</span>
                </p>
                <iframe
                  title={preview.subject}
                  srcDoc={preview.html}
                  sandbox=""
                  className="mt-3 h-[34rem] w-full rounded-xl bg-white ring-1 ring-line"
                />
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Escribir un correo o inscribir en la secuencia                     */
/* ------------------------------------------------------------------ */

type LeadHit = { id: string; name: string; email: string; tier: LeadTier; email_opt_out_at: string | null };

function LeadDialog({
  kind,
  locale,
  onClose,
  onDone,
}: {
  kind: "compose" | "enroll";
  locale: Locale;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const t = followupQueueCopy[locale];
  const c = t.composeDialog;
  const supabase = useMemo(() => createClient(), []);
  const titleId = useId();
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<LeadHit[]>([]);
  const [lead, setLead] = useState<LeadHit | null>(null);
  const [form, setForm] = useState({ subject: "", body: "", cta_label: "", cta_url: "", later: false, send_at: null as string | null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const find = (q: string) => {
    setSearch(q);
    window.clearTimeout(timer.current);
    const term = q.trim().replace(/[%,()]/g, "");
    if (term.length < 2) return setHits([]);
    timer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, tier, email_opt_out_at")
        .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      setHits((data ?? []) as LeadHit[]);
    }, 250);
  };

  const submit = async () => {
    if (!lead) return;
    setBusy(true);
    setError(null);
    const result =
      kind === "enroll"
        ? await supabase.rpc("followup_enroll", { p_lead: lead.id })
        : await supabase.rpc("email_compose", {
            p_lead: lead.id,
            p: { subject: form.subject, body: form.body, cta_label: form.cta_label, cta_url: form.cta_url, send_at: form.later ? form.send_at : null },
          });
    setBusy(false);
    if (result.error) return setError(t.errors[result.error.message] ?? t.errors.generic.replace("{detail}", result.error.message));
    onDone(kind === "enroll" ? t.enrollDialog.done.replace("{n}", String(result.data ?? 0)) : c.done);
  };

  const ready = !!lead && !lead.email_opt_out_at && (kind === "enroll" || (form.subject.trim() && form.body.trim() && (!form.later || form.send_at)));
  const field = cn(inputClass, "h-11 text-sm");

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-heading">
            {kind === "enroll" ? t.enrollDialog.title : c.title}
          </h2>
          <button type="button" onClick={onClose} aria-label={c.cancel} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {kind === "enroll" && <p className="text-sm text-muted">{t.enrollDialog.hint}</p>}

        {/* Lead */}
        {lead ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-line">
            <span className={cn("h-2.5 w-2.5 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-heading">{lead.name}</span>
              <span className="block truncate text-xs text-muted">
                {lead.email}
                {lead.email_opt_out_at && <span className="text-red-600 dark:text-red-400"> · {c.optedOut}</span>}
              </span>
            </span>
            <button type="button" onClick={() => setLead(null)} aria-label={c.cancel} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)]">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input value={search} onChange={(e) => find(e.target.value)} placeholder={c.leadSearch} aria-label={c.lead} autoFocus className={field} />
            {search.trim().length >= 2 && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                {hits.length === 0 && <li className="px-3 py-2 text-sm text-muted">{c.noResults}</li>}
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => setLead(h)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--meta-hover)]">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", tierStyles[h.tier].dot)} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-heading">{h.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {h.email}
                          {h.email_opt_out_at && <span className="text-red-600 dark:text-red-400"> · {c.optedOut}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {kind === "compose" && (
          <>
            <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} maxLength={200} placeholder={c.subject} aria-label={c.subject} className={field} />
            <div>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={7}
                maxLength={5000}
                placeholder={c.body}
                aria-label={c.body}
                className={cn(inputClass, "h-auto resize-y py-2.5 text-sm leading-relaxed")}
              />
              <p className="mt-1 text-xs text-muted">{c.bodyHint}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.cta_label} onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))} maxLength={60} placeholder={c.ctaLabel} aria-label={c.ctaLabel} className={field} />
              <input type="url" value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} placeholder={c.ctaUrl} aria-label={c.ctaUrl} className={field} />
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium text-heading">{c.when}</legend>
              <div className="flex gap-1 rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]">
                {[false, true].map((later) => (
                  <button
                    key={String(later)}
                    type="button"
                    aria-pressed={form.later === later}
                    onClick={() => setForm((f) => ({ ...f, later }))}
                    className={cn("h-9 flex-1 rounded-lg text-sm", form.later === later ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted")}
                  >
                    {later ? c.later : c.now}
                  </button>
                ))}
              </div>
              {form.later && <DateTimePicker size="md" label={c.whenLabel} value={form.send_at} onChange={(v) => setForm((f) => ({ ...f, send_at: v }))} locale={locale} />}
            </fieldset>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={softBtn}>
            {c.cancel}
          </button>
          <button type="submit" disabled={busy || !ready} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {kind === "enroll" ? t.enrollDialog.submit : c.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
