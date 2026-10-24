"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, Lock, SendHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ticket, TicketMessage } from "@/lib/supabase/types";
import { ticketsCopy } from "@/content/tickets";
import { Select } from "@/components/ui/Select";
import { ticketPriorities, ticketStatuses } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Conversación de una solicitud, en tiempo real. El equipo puede dejar notas
 * internas (RLS evita que el cliente las reciba) y cambiar estado, prioridad
 * y responsable; el cliente solo responde.
 */
export function TicketThread({
  locale,
  ticket,
  initial,
  staff,
  meId,
  names,
}: {
  locale: Locale;
  ticket: Ticket;
  initial: TicketMessage[];
  staff: boolean;
  meId: string;
  names: Record<string, string>;
}) {
  const t = ticketsCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          const m = payload.new as TicketMessage;
          // Las notas internas nunca llegan al cliente (RLS), pero por si acaso.
          if (m.internal && !staff) return;
          setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, ticket.id, staff]);

  const last = messages.at(-1)?.id;
  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "nearest" });
  }, [last]);

  const send = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("ticket_reply", { p_ticket: ticket.id, p_body: text, p_internal: staff && internal });
    setBusy(false);
    if (!error) {
      setBody("");
      setInternal(false);
    }
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const statusLabel = staff ? t.staffStatus : t.status;
  const closed = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <section className="rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card">
      <h2 className="text-lg text-heading">{t.thread.conversation}</h2>
      <ol className="mt-5 grid gap-4">
        {messages.map((m) => {
          if (m.author_kind === "system") {
            const status = m.body.startsWith("status:") ? m.body.slice(7) : m.body;
            return (
              <li key={m.id} className="text-center text-xs text-muted">
                {t.thread.systemStatus.replace("{status}", statusLabel[status] ?? status)} · {fmt(m.created_at)}
              </li>
            );
          }
          const mine = m.author_id === meId;
          const fromTeam = m.author_kind === "staff";
          const who = mine ? t.thread.you : fromTeam ? (staff ? names[m.author_id ?? ""] ?? t.thread.team : t.thread.team) : ticket.name;
          return (
            <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <span className="mx-1 mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                {m.internal && <Lock className="h-3 w-3" aria-hidden />}
                {who} · {fmt(m.created_at)}
                {m.internal && <span className="text-amber-700 dark:text-amber-300">· {t.thread.internalTag}</span>}
              </span>
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.internal
                    ? "bg-amber-50 text-heading ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
                    : mine
                      ? "rounded-br-md bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950"
                      : "rounded-bl-md bg-surface-soft text-heading dark:bg-white/[0.08]",
                )}
              >
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>
      <div ref={listEnd} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="mt-6 border-t border-line pt-5"
      >
        {!staff && closed && <p className="mb-2 text-xs text-muted">{t.thread.closedNote}</p>}
        <label htmlFor={inputId} className="sr-only">
          {staff ? t.thread.staffPlaceholder : t.thread.placeholder}
        </label>
        <textarea
          id={inputId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={5000}
          placeholder={staff ? t.thread.staffPlaceholder : t.thread.placeholder}
          className={cn(
            "w-full resize-y rounded-2xl border bg-surface px-4 py-3 text-sm leading-relaxed text-heading outline-none focus:ring-2 dark:bg-card",
            internal
              ? "border-amber-300 focus:ring-amber-300/40 dark:border-amber-500/40"
              : "border-line-strong focus:border-deep-700 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20",
          )}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {staff ? (
            <label className="flex items-center gap-2 text-sm text-body">
              <input
                type="checkbox"
                checked={internal}
                onChange={(event) => setInternal(event.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              {t.thread.internal}
            </label>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-deep-700 px-5 text-sm font-semibold text-white hover:bg-deep-600 disabled:opacity-40 dark:bg-brand-green dark:text-deep-950"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4" aria-hidden />}
            {t.thread.send}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Controles del equipo: estado, prioridad y responsable. */
export function TicketControls({
  locale,
  ticket,
  employees,
}: {
  locale: Locale;
  ticket: Ticket;
  employees: { id: string; name: string }[];
}) {
  const t = ticketsCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to ?? "",
  });

  const save = async (patch: Partial<typeof state>) => {
    setState((s) => ({ ...s, ...patch }));
    const row: Partial<Pick<Ticket, "status" | "priority" | "assigned_to">> = {};
    if (patch.status) row.status = patch.status;
    if (patch.priority) row.priority = patch.priority;
    if (patch.assigned_to !== undefined) row.assigned_to = patch.assigned_to || null;
    await supabase.from("tickets").update(row).eq("id", ticket.id);
  };

  return (
    <div className="grid gap-4">
      <Select
        size="md"
        label={t.thread.status}
        value={state.status}
        onChange={(v) => void save({ status: v as Ticket["status"] })}
        options={ticketStatuses.map((s) => ({ value: s, label: t.staffStatus[s] }))}
      />
      <Select
        size="md"
        label={t.thread.priority}
        value={state.priority}
        onChange={(v) => void save({ priority: v as Ticket["priority"] })}
        options={ticketPriorities.map((p) => ({ value: p, label: t.priority[p] }))}
      />
      <Select
        size="md"
        label={t.thread.owner}
        value={state.assigned_to}
        onChange={(v) => void save({ assigned_to: v })}
        options={[{ value: "", label: t.staff.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
      />
    </div>
  );
}
