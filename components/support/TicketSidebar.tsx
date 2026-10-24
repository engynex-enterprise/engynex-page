"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, CircleCheck, CircleX, Clock3, ExternalLink, Loader2, Star, Tag, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import type { Ticket } from "@/lib/supabase/types";
import { ticketsCopy } from "@/content/tickets";
import { supportProCopy } from "@/content/supportPro";
import { supportTicketCopy } from "@/content/supportTicket";
import { shortDuration, slaMet } from "@/lib/supportSla";
import { ticketPriorities, ticketStatuses, ticketStatusTone } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Other = Pick<Ticket, "id" | "number" | "subject" | "status" | "created_at">;

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
const title = "mb-3 text-[0.98rem] font-semibold text-heading";

/**
 * Panel lateral del equipo: relojes del SLA, gestión (estado, prioridad,
 * responsable, tema, etiquetas), datos del solicitante con sus otras
 * solicitudes, satisfacción y unir duplicados.
 */
export function TicketSidebar({
  locale,
  ticket,
  employees,
  categories,
  meId,
  initialNow,
  others,
}: {
  locale: Locale;
  ticket: Ticket;
  employees: { id: string; name: string }[];
  categories: { value: string; label: string }[];
  meId: string;
  initialNow: number;
  others: Other[];
}) {
  const t = supportTicketCopy[locale].side;
  const tk = ticketsCopy[locale];
  const pro = supportProCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [now, setNow] = useState(initialNow);
  const [state, setState] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to ?? "",
    category: ticket.category,
    tags: ticket.tags,
  });
  const [tag, setTag] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const save = async (patch: Partial<typeof state>) => {
    setState((s) => ({ ...s, ...patch }));
    const row: Partial<Pick<Ticket, "status" | "priority" | "assigned_to" | "category" | "tags">> = {};
    if (patch.status) row.status = patch.status;
    if (patch.priority) row.priority = patch.priority;
    if (patch.category) row.category = patch.category;
    if (patch.tags) row.tags = patch.tags;
    if (patch.assigned_to !== undefined) row.assigned_to = patch.assigned_to || null;
    const { error } = await supabase.from("tickets").update(row).eq("id", ticket.id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    }
  };

  const addTag = () => {
    const v = tag.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    setTag("");
    if (!v || state.tags.includes(v) || state.tags.length >= 10) return;
    void save({ tags: [...state.tags, v] });
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const met = slaMet(ticket);
  const active = ["open", "in_progress", "waiting"].includes(ticket.status) && !ticket.merged_into;

  const clock = (label: string, doneAt: string | null, due: string | null, ok: boolean | null, soonH: number) => {
    let tone = "text-muted";
    let value = t.noSla;
    let Icon = Clock3;
    if (doneAt) {
      value = t.doneAt.replace("{date}", fmt(doneAt));
      tone = ok === false ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400";
      Icon = ok === false ? CircleX : CircleCheck;
    } else if (due && active) {
      const left = new Date(due).getTime() - now;
      const d = shortDuration(left, pro.units);
      value = left < 0 ? pro.sla.breached.replace("{t}", d) : pro.sla.left.replace("{t}", d);
      tone = left < 0 ? "text-red-600 dark:text-red-400" : left < soonH * 3_600_000 ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400";
    } else if (due) {
      value = t.pending;
    }
    return (
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{label}</p>
          <p className={cn("text-sm font-semibold", tone)}>{value}</p>
          {due && !doneAt && <p className="text-xs text-muted">{t.due.replace("{date}", fmt(due))}</p>}
          {doneAt && ok != null && <p className="text-xs text-muted">{ok ? pro.sla.met : pro.sla.late}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid content-start gap-5">
      <section className={card} aria-labelledby="sla-title">
        <h2 id="sla-title" className={title}>
          {t.sla}
        </h2>
        <div className="grid gap-3.5">
          {clock(t.first, ticket.first_response_at, ticket.first_response_due, met.first, 2)}
          {clock(t.resolve, ticket.resolved_at, ticket.resolve_due, met.resolve, 4)}
        </div>
        {ticket.status === "waiting" && <p className="mt-3 text-xs text-muted">{tk.staffStatus.waiting}</p>}
      </section>

      <section className={card} aria-labelledby="ctl-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="ctl-title" className="text-[0.98rem] font-semibold text-heading">
            {t.controls}
          </h2>
          <span className={cn("text-xs font-medium text-emerald-700 transition-opacity dark:text-emerald-400", saved ? "opacity-100" : "opacity-0")} aria-live="polite">
            {saved ? t.saved : ""}
          </span>
        </div>
        <div className="grid gap-3">
          <Select
            size="md"
            label={t.status}
            value={state.status}
            onChange={(v) => void save({ status: v as Ticket["status"] })}
            options={ticketStatuses.map((s) => ({ value: s, label: tk.staffStatus[s] }))}
          />
          <Select
            size="md"
            label={t.priority}
            value={state.priority}
            onChange={(v) => void save({ priority: v as Ticket["priority"] })}
            options={ticketPriorities.map((p) => ({ value: p, label: tk.priority[p] }))}
          />
          <div>
            <Select
              size="md"
              label={t.owner}
              value={state.assigned_to}
              onChange={(v) => void save({ assigned_to: v })}
              options={[{ value: "", label: t.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
            />
            {state.assigned_to !== meId && (
              <button type="button" onClick={() => void save({ assigned_to: meId })} className="mt-1 text-xs font-medium text-accent hover:underline">
                {t.assignMe}
              </button>
            )}
          </div>
          <Select size="md" label={t.category} value={state.category} onChange={(v) => void save({ category: v })} options={categories} />
          <div>
            <p className="mb-1.5 text-xs text-muted">{t.tags}</p>
            <div className="flex flex-wrap items-center gap-1.5 rounded-[10px] px-2 py-1.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-green-dark">
              {state.tags.map((x) => (
                <span key={x} className="inline-flex items-center gap-1 rounded-md bg-[var(--meta-active)] px-2 py-0.5 text-xs text-heading">
                  <Tag className="h-3 w-3" aria-hidden />
                  {x}
                  <button
                    type="button"
                    onClick={() => void save({ tags: state.tags.filter((y) => y !== x) })}
                    aria-label={t.tagRemove.replace("{tag}", x)}
                    className="rounded hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                  if (e.key === "Backspace" && !tag && state.tags.length) void save({ tags: state.tags.slice(0, -1) });
                }}
                onBlur={() => tag.trim() && addTag()}
                placeholder={state.tags.length ? "" : t.tagsAdd}
                aria-label={t.tagsAdd}
                className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm text-heading outline-none focus-visible:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="req-title">
        <h2 id="req-title" className={title}>
          {t.requester}
        </h2>
        <p className="font-semibold text-heading">{ticket.name}</p>
        <a href={`mailto:${ticket.email}`} className="block break-all text-sm text-body hover:underline">
          {ticket.email}
        </a>
        {ticket.phone && (
          <a href={`tel:${ticket.phone}`} className="block text-sm text-body hover:underline">
            {ticket.phone}
          </a>
        )}
        {ticket.company && <p className="text-sm text-muted">{ticket.company}</p>}
        {ticket.affected && (
          <p className="mt-2 text-sm">
            <span className="text-muted">{t.affected}: </span>
            <span className="text-heading">{ticket.affected}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {ticket.requester_id ? (
            <Link href={`/${locale}/portal/clientes/${ticket.requester_id}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              {t.account}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : (
            <span className="text-xs text-muted">{t.noAccount}</span>
          )}
          {ticket.lead_id && (
            <Link href={`/${locale}/portal/crm/${ticket.lead_id}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              {t.lead}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <h3 className="mb-2 mt-5 text-xs font-medium uppercase tracking-[0.08em] text-muted">{t.others}</h3>
        {others.length === 0 ? (
          <p className="text-sm text-muted">{t.noOthers}</p>
        ) : (
          <ul className="-mx-2 grid">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`/${locale}/portal/soporte/${o.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--meta-hover)]">
                  <span className="font-mono text-xs text-muted">#{o.number}</span>
                  <span className="min-w-0 flex-1 truncate text-heading">{o.subject}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", ticketStatusTone[o.status])}>{tk.staffStatus[o.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ticket.csat_rating != null && (
        <section className={card} aria-labelledby="csat-title">
          <h2 id="csat-title" className={title}>
            {t.csat}
          </h2>
          <p className="flex items-center gap-0.5" aria-label={pro.csat.stars.replace("{n}", String(ticket.csat_rating))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={cn("h-5 w-5", n <= (ticket.csat_rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-line-strong")} aria-hidden />
            ))}
            <span className="ml-2 text-sm font-semibold tabular-nums text-heading">{ticket.csat_rating} / 5</span>
          </p>
          {ticket.csat_comment && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--meta-active)]/60 px-3 py-2 text-sm text-heading">“{ticket.csat_comment}”</p>}
          {ticket.csat_at && <p className="mt-2 text-xs text-muted">{fmt(ticket.csat_at)}</p>}
        </section>
      )}

      {!ticket.merged_into && <MergeCard locale={locale} ticket={ticket} />}
    </div>
  );
}

/** Unir esta solicitud (duplicada) a otra por su número. */
function MergeCard({ locale, ticket }: { locale: Locale; ticket: Ticket }) {
  const t = supportTicketCopy[locale].side;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [num, setNum] = useState("");
  const [target, setTarget] = useState<Pick<Ticket, "id" | "number" | "subject" | "name"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async () => {
    setError(null);
    setTarget(null);
    const n = Number(num.replace("#", "").trim());
    if (!Number.isInteger(n) || n <= 0) return setError(t.mergeNotFound);
    if (n === ticket.number) return setError(t.mergeSelf);
    const { data } = await supabase.from("tickets").select("id, number, subject, name").eq("number", n).maybeSingle();
    if (!data) return setError(t.mergeNotFound);
    setTarget(data);
  };

  const merge = async () => {
    if (!target) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("ticket_merge", { p_source: ticket.id, p_target: target.id });
    setBusy(false);
    if (err) return setError(t.mergeError);
    router.push(`/${locale}/portal/soporte/${target.id}`);
  };

  return (
    <section className={card}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 text-left text-[0.98rem] font-semibold text-heading">
        <ArrowRightLeft className="h-4 w-4 text-muted" aria-hidden />
        {t.merge}
      </button>
      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted">{t.mergeHint}</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void find();
            }}
          >
            <label className="sr-only" htmlFor="merge-number">
              {t.mergeNumber}
            </label>
            <input
              id="merge-number"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              inputMode="numeric"
              placeholder={t.mergeNumber}
              className="h-9 min-w-0 flex-1 rounded-[10px] bg-transparent px-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
            />
            <button type="submit" className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              {t.mergeFind}
            </button>
          </form>
          {target && (
            <div className="mt-3 rounded-lg bg-[var(--meta-active)]/60 p-3">
              <p className="text-sm text-heading">
                <span className="font-mono text-muted">#{target.number}</span> {target.subject}
              </p>
              <p className="text-xs text-muted">{target.name}</p>
              <button
                type="button"
                onClick={() => void merge()}
                disabled={busy}
                className="mt-2 inline-flex h-9 items-center gap-2 rounded-[10px] bg-deep-700 px-3.5 text-sm font-semibold text-white hover:bg-deep-600 disabled:opacity-50 dark:bg-brand-green dark:text-deep-950"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t.mergeConfirm.replace("{n}", String(target.number))}
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
