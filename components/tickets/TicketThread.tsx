"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2, Lock, MessageSquareText, Paperclip, SendHorizontal, Star, X, Zap } from "lucide-react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { createClient } from "@/lib/supabase/client";
import type { Ticket, TicketAttachment, TicketMacro, TicketMessage, TicketStatus } from "@/lib/supabase/types";
import { ticketsCopy } from "@/content/tickets";
import { supportTicketCopy } from "@/content/supportTicket";
import { TICKET_FILE_TYPES, TicketAttachmentView, uploadTicketFile } from "@/components/support/TicketAttachment";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

/** Reemplaza {nombre}, {numero} y {asunto} con los datos de la solicitud. */
export const fillMacro = (body: string, ticket: Pick<Ticket, "name" | "number" | "subject">) =>
  body
    .replaceAll("{nombre}", ticket.name.split(/\s+/)[0] ?? ticket.name)
    .replaceAll("{numero}", String(ticket.number))
    .replaceAll("{asunto}", ticket.subject);

/**
 * Conversación de una solicitud en tiempo real, con adjuntos (botón, arrastrar
 * o pegar). El equipo responde o deja notas internas (RLS evita que el cliente
 * las reciba) y usa respuestas rápidas que pueden cambiar el estado al enviar.
 */
export function TicketThread({
  locale,
  ticket,
  initial,
  staff,
  meId,
  names,
  macros = [],
  mergedNumber,
}: {
  locale: Locale;
  ticket: Ticket;
  initial: TicketMessage[];
  staff: boolean;
  meId: string;
  names: Record<string, string>;
  macros?: TicketMacro[];
  /** Número de la solicitud principal si esta se unió a otra. */
  mergedNumber?: number | null;
}) {
  const t = supportTicketCopy[locale];
  const base = ticketsCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [file, setFile] = useState<File | null>(null);
  const [setStatus, setSetStatus] = useState<TicketStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [macroOpen, setMacroOpen] = useState(false);
  const [macroAnchor, setMacroAnchor] = useState<HTMLElement | null>(null);
  const [macroQ, setMacroQ] = useState("");
  const listEnd = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const note = staff && mode === "note";
  const statusLabel = staff ? base.staffStatus : base.status;

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

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!TICKET_FILE_TYPES.includes(f.type)) return setError(t.fileErrors.type);
    if (f.size > 15 * 1024 * 1024) return setError(t.fileErrors.too_big);
    setError(null);
    setFile(f);
  };

  const send = async () => {
    const text = body.trim();
    if ((!text && !file) || busy) return;
    setBusy(true);
    setError(null);
    let attachment: TicketAttachment | null = null;
    if (file) {
      const up = await uploadTicketFile(supabase, ticket.id, file);
      if ("error" in up) {
        setBusy(false);
        return setError(t.fileErrors[up.error]);
      }
      attachment = up.attachment;
    }
    const { error: err } = await supabase.rpc("ticket_reply", {
      p_ticket: ticket.id,
      p_body: text,
      p_internal: note,
      p_attachment: attachment,
    });
    if (err) {
      setBusy(false);
      return setError(t.fileErrors.send);
    }
    if (staff && setStatus) await supabase.from("tickets").update({ status: setStatus }).eq("id", ticket.id);
    setBusy(false);
    setBody("");
    setFile(null);
    setSetStatus(null);
    router.refresh();
  };

  const applyMacro = (m: TicketMacro) => {
    setBody((b) => (b.trim() ? `${b.trimEnd()}\n\n` : "") + fillMacro(m.body, ticket));
    setSetStatus(m.set_status);
    setMode("reply");
    setMacroOpen(false);
    setMacroQ("");
    requestAnimationFrame(() => textarea.current?.focus());
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const closed = ticket.status === "resolved" || ticket.status === "closed";
  const visibleMacros = macros.filter((m) => !macroQ.trim() || `${m.title} ${m.body}`.toLowerCase().includes(macroQ.trim().toLowerCase()));
  const count = messages.filter((m) => m.author_kind !== "system").length;

  const systemText = (m: TicketMessage) => {
    if (m.body.startsWith("status:")) return t.system.status.replace("{status}", statusLabel[m.body.slice(7)] ?? m.body.slice(7));
    if (m.body.startsWith("merged:")) return t.system.merged.replace("{n}", m.body.slice(7));
    if (m.body.startsWith("csat:")) return t.system.csat.replace("{n}", m.body.slice(5));
    return m.body;
  };

  return (
    <section className="rounded-xl border border-line bg-surface dark:bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
          <MessageSquareText className="h-4 w-4 text-muted" aria-hidden />
          {t.conversation}
        </h2>
        <span className="text-xs tabular-nums text-muted">{t.messages.replace("{n}", String(count + 1))}</span>
      </header>

      <ol className="grid gap-5 px-5 py-5">
        {/* La descripción inicial abre la conversación. */}
        <li className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" aria-hidden>
            {initials(ticket.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-semibold text-heading">{staff ? ticket.name : t.you}</span>
              <span className="text-muted"> · {fmt(ticket.created_at)}</span>
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-[0.94rem] leading-relaxed text-body">{ticket.description}</p>
          </div>
        </li>
        {messages.map((m) => {
          if (m.author_kind === "system") {
            const csat = m.body.startsWith("csat:");
            if (csat && !staff) return null;
            return (
              <li key={m.id} className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                <span className="inline-flex items-center gap-1.5">
                  {csat ? <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden /> : m.body.startsWith("merged:") ? <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden /> : null}
                  {systemText(m)} · {fmt(m.created_at)}
                </span>
                <span className="h-px flex-1 bg-line" />
              </li>
            );
          }
          const mine = m.author_id === meId;
          const fromTeam = m.author_kind === "staff";
          const who = mine ? t.you : fromTeam ? (staff ? names[m.author_id ?? ""] ?? t.team : t.team) : ticket.name;
          const text = m.attachment && m.body === `📎 ${m.attachment.name}` ? null : m.body;
          return (
            <li key={m.id} className={cn("flex gap-3", m.internal && "-mx-2 rounded-xl bg-amber-50 px-2 py-2.5 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/25")}>
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  fromTeam ? "bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950" : "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
                )}
                aria-hidden
              >
                {fromTeam && !staff ? "E" : initials(fromTeam ? names[m.author_id ?? ""] ?? who : ticket.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
                  <span className="font-semibold text-heading">{who}</span>
                  <span className="text-muted">· {fmt(m.created_at)}</span>
                  {m.internal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                      <Lock className="h-3 w-3" aria-hidden />
                      {t.internalTag}
                    </span>
                  )}
                </p>
                {text && <p className="mt-1 whitespace-pre-wrap break-words text-[0.94rem] leading-relaxed text-body">{text}</p>}
                {m.attachment && (
                  <div className="mt-2 w-fit max-w-sm">
                    <TicketAttachmentView supabase={supabase} attachment={m.attachment} locale={locale} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={listEnd} />

      {mergedNumber ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-muted">
          {t.mergedNote}
          {staff && ticket.merged_into && (
            <Link href={`/${locale}/portal/soporte/${ticket.merged_into}`} className="font-medium text-accent hover:underline">
              {t.goMerged.replace("{n}", String(mergedNumber))}
            </Link>
          )}
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          className="relative border-t border-line"
        >
          {dragging && (
            <div className="absolute inset-2 z-10 grid place-items-center rounded-xl border-2 border-dashed border-brand-green-dark bg-surface/90 text-sm font-medium text-heading dark:border-brand-green dark:bg-card/90">
              {t.drop}
            </div>
          )}
          {staff && (
            <div className="flex gap-1 px-4 pt-2" role="tablist">
              {(["reply", "note"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={mode === k}
                  onClick={() => setMode(k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-sm transition-colors",
                    mode === k
                      ? k === "note"
                        ? "border-amber-500 font-semibold text-amber-800 dark:text-amber-300"
                        : "border-brand-green-dark font-semibold text-heading dark:border-brand-green"
                      : "border-transparent text-muted hover:text-heading",
                  )}
                >
                  {k === "note" && <Lock className="h-3.5 w-3.5" aria-hidden />}
                  {t.tabs[k]}
                </button>
              ))}
            </div>
          )}
          <div className={cn("px-4 pb-4", staff ? "pt-2" : "pt-4")}>
            {!staff && closed && <p className="mb-2 text-xs text-muted">{t.closedNote}</p>}
            <label htmlFor={inputId} className="sr-only">
              {note ? t.notePlaceholder : staff ? t.staffPlaceholder : t.placeholder}
            </label>
            <div
              className={cn(
                "rounded-xl ring-1 transition-shadow focus-within:ring-2",
                note ? "bg-amber-50/60 ring-amber-300 focus-within:ring-amber-400 dark:bg-amber-500/5 dark:ring-amber-500/40" : "ring-line focus-within:ring-brand-green-dark dark:focus-within:ring-brand-green",
              )}
            >
              <textarea
                id={inputId}
                ref={textarea}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void send();
                  }
                }}
                onPaste={(e) => {
                  const f = Array.from(e.clipboardData.files)[0];
                  if (f) {
                    e.preventDefault();
                    pickFile(f);
                  }
                }}
                rows={4}
                maxLength={5000}
                placeholder={note ? t.notePlaceholder : staff ? t.staffPlaceholder : t.placeholder}
                className="block w-full resize-y rounded-xl bg-transparent px-4 py-3 text-[0.94rem] leading-relaxed text-heading outline-none focus-visible:outline-none"
              />
              {(file || setStatus) && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {file && (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[var(--meta-active)] px-2.5 py-1 text-xs text-heading">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} aria-label={t.remove} className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </span>
                  )}
                  {setStatus && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--meta-active)] px-2.5 py-1 text-xs text-heading">
                      <Zap className="h-3.5 w-3.5" aria-hidden />
                      {t.macroSets.replace("{status}", base.staffStatus[setStatus])}
                      <button type="button" onClick={() => setSetStatus(null)} aria-label={t.remove} className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-1.5">
                <input
                  ref={fileInput}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  accept={TICKET_FILE_TYPES.join(",")}
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                  aria-label={t.attach}
                  title={t.attach}
                >
                  <Paperclip className="h-4 w-4" aria-hidden />
                </button>
                {staff && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        setMacroAnchor(e.currentTarget);
                        setMacroOpen((v) => !v);
                      }}
                      aria-expanded={macroOpen}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                    >
                      <Zap className="h-4 w-4" aria-hidden />
                      {t.macros}
                    </button>
                    {macroOpen && (
                      <FloatingPanel anchor={macroAnchor} open onClose={() => setMacroOpen(false)} align="start" placement="top" className="w-[min(22rem,calc(100vw-3rem))] rounded-xl bg-surface shadow-[0_16px_40px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                        <div className="border-b border-line p-2">
                          <input
                            autoFocus
                            value={macroQ}
                            onChange={(e) => setMacroQ(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setMacroOpen(false);
                              if (e.key === "Enter" && visibleMacros[0]) {
                                e.preventDefault();
                                applyMacro(visibleMacros[0]);
                              }
                            }}
                            placeholder={t.macrosSearch}
                            aria-label={t.macrosSearch}
                            className="h-8 w-full rounded-lg bg-transparent px-2.5 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
                          />
                        </div>
                        <ul className="max-h-64 overflow-y-auto py-1">
                          {visibleMacros.length === 0 && <li className="px-3 py-3 text-sm text-muted">{t.macrosEmpty}</li>}
                          {visibleMacros.map((m) => (
                            <li key={m.id}>
                              <button type="button" onClick={() => applyMacro(m)} className="block w-full px-3 py-2 text-left hover:bg-[var(--meta-hover)]">
                                <span className="block text-sm font-medium text-heading">{m.title}</span>
                                <span className="block truncate text-xs text-muted">{fillMacro(m.body, ticket).replace(/\s+/g, " ")}</span>
                                {m.set_status && <span className="mt-0.5 block text-[0.7rem] font-medium text-accent">{t.macroSets.replace("{status}", base.staffStatus[m.set_status])}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <Link href={`/${locale}/portal/soporte/respuestas`} className="block border-t border-line px-3 py-2 text-xs font-medium text-accent hover:underline">
                          {t.macrosManage}
                        </Link>
                      </FloatingPanel>
                    )}
                  </div>
                )}
                <span className="ml-auto hidden pr-2 text-xs text-muted sm:inline">{t.shortcut}</span>
                <button
                  type="submit"
                  disabled={busy || (!body.trim() && !file)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold disabled:opacity-40",
                    note ? "bg-amber-500 text-deep-950 hover:bg-amber-400" : "bg-deep-700 text-white hover:bg-deep-600 dark:bg-brand-green dark:text-deep-950",
                  )}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4" aria-hidden />}
                  {setStatus && !note ? t.sendAnd.replace("{status}", base.staffStatus[setStatus]) : t.send}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
