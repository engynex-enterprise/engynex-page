"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  SendHorizontal,
  Tag,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ChatSavedReply, Json } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { campaignsCopy } from "@/content/campaigns";
import { WhatsappIcon } from "@/components/SocialIcons";
import { Select } from "@/components/ui/Select";
import { ChatContext } from "./ChatContext";
import { initialsOf, type InboxConversation } from "./ChatInbox";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Presence = { role?: string; page?: string };

/**
 * Una conversación: mensajes en vivo, notas internas, respuestas guardadas
 * con "/", etiquetas, asignación y cierre. A la derecha (pantallas grandes),
 * el contexto del visitante.
 */
export function ChatThread({
  locale,
  conversation: c,
  employees,
  me,
  allTags,
  savedReplies,
  onBack,
}: {
  locale: Locale;
  conversation: InboxConversation;
  employees: { id: string; name: string }[];
  me: { id: string; name: string };
  allTags: string[];
  savedReplies: ChatSavedReply[];
  onBack: () => void;
}) {
  const t = liveChatCopy[locale].inbox;
  const wa = campaignsCopy[locale].chat;
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  const isWhatsApp = c.channel === "whatsapp";
  const windowOpen = !isWhatsApp || (!!c.wa_window_until && new Date(c.wa_window_until).getTime() > now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const markRead = useCallback(() => {
    // Las consultas de supabase-js son perezosas: solo corren con then/await.
    if (document.visibilityState === "visible") void supabase.rpc("chat_agent_read", { p_conversation: c.id }).then();
  }, [supabase, c.id]);

  // Mensajes: carga inicial + en vivo (nuevos y cambios de entrega).
  useEffect(() => {
    let alive = true;
    void supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", c.id)
      .order("id")
      .limit(500)
      .then(({ data }) => {
        if (alive) setMessages(data ?? []);
      });
    markRead();

    const changes = supabase
      .channel(`chat-thread-${c.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${c.id}` }, (payload) => {
        const message = payload.new as ChatMessage;
        setMessages((list) => (list && !list.some((m) => m.id === message.id) ? [...list, message] : list));
        if (message.sender === "visitor") {
          setVisitorTyping(false);
          markRead();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${c.id}` }, (payload) => {
        const message = payload.new as ChatMessage;
        setMessages((list) => list?.map((m) => (m.id === message.id ? message : m)) ?? list);
      })
      .subscribe();

    // Canal del visitante: presencia (y página actual) y "escribiendo…".
    let typingTimer: number | undefined;
    const live = supabase
      .channel(c.topic, { config: { broadcast: { self: false } } })
      .on("presence", { event: "sync" }, () => {
        const state = live.presenceState<Presence>();
        setPresence(state.visitor?.[0] ?? null);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from !== "visitor") return;
        setVisitorTyping(true);
        window.clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => setVisitorTyping(false), 4000);
      })
      .subscribe();
    channelRef.current = live;

    document.addEventListener("visibilitychange", markRead);
    return () => {
      alive = false;
      window.clearTimeout(typingTimer);
      document.removeEventListener("visibilitychange", markRead);
      channelRef.current = null;
      void supabase.removeChannel(changes);
      void supabase.removeChannel(live);
    };
  }, [supabase, c.id, c.topic, markRead]);

  const last = messages?.at(-1)?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last, visitorTyping]);

  const lastTyping = useRef(0);
  const notifyTyping = () => {
    if (internal) return;
    const n = Date.now();
    if (n - lastTyping.current < 2000) return;
    lastTyping.current = n;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: "agent", name: me.name.split(/\s+/)[0] } });
  };

  /* ---------------- Respuestas guardadas con "/" ---------------- */

  const slash = body.startsWith("/") && !body.includes("\n") ? body.slice(1).toLowerCase() : null;
  const matches = slash === null ? [] : savedReplies.filter((r) => r.shortcut.startsWith(slash) || r.title.toLowerCase().includes(slash)).slice(0, 6);
  const fillReply = (reply: ChatSavedReply) => {
    setBody(
      reply.body
        .replaceAll("{nombre}", c.name.split(/\s+/)[0])
        .replaceAll("{asesor}", me.name.split(/\s+/)[0]),
    );
    setSlashIndex(0);
  };

  /* ---------------- Enviar ---------------- */

  const send = async () => {
    const text = body.trim();
    if (!text || busy || text.startsWith("/")) return;
    setBusy(true);
    setSendError(null);
    if (isWhatsApp && !internal) {
      // Por WhatsApp: el servidor lo envía a Meta y luego lo guarda.
      const res = await fetch("/api/whatsapp/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: c.id, body: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      setBusy(false);
      if (res.ok) return setBody("");
      setSendError(
        data.error === "window_closed"
          ? wa.windowClosed
          : data.error === "not_configured"
            ? wa.notConfigured
            : wa.sendFailed.replace("{detail}", data.detail ?? data.error ?? "—"),
      );
      return;
    }
    const { error } = await supabase.rpc("chat_agent_send", { p_conversation: c.id, p_body: text, p_internal: internal });
    setBusy(false);
    if (!error) {
      setBody("");
      setInternal(false);
    }
  };

  const update = (patch: { [key: string]: Json }) =>
    void supabase.rpc("chat_agent_update", { p_conversation: c.id, p: patch }).then();

  const toggleTag = (tag: string) => {
    const tags = c.tags ?? [];
    update({ tags: tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag] });
  };

  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(iso));

  const downloadTranscript = () => {
    const lines = (messages ?? []).map((m) => {
      const who = m.sender === "visitor" ? c.name : m.sender === "agent" ? (m.author_id ? names[m.author_id] ?? "Engynex" : "Engynex") : "—";
      const body = m.sender === "system" ? `[${t.system[m.body] ?? m.body}]` : m.body;
      return `[${time(m.created_at)}] ${who}${m.internal ? ` (${t.internalTag})` : ""}: ${body}`;
    });
    const header = [`${t.title} — ${c.name}`, c.email ?? "", c.phone ?? "", ""].filter((x, i) => x || i === 3);
    const blob = new Blob([[...header, ...lines].join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${c.name.replace(/\s+/g, "-").toLowerCase()}-${c.created_at.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const digits = (c.phone ?? "").replace(/\D/g, "");
  const waNumber = digits.length === 10 ? `57${digits}` : digits;
  const action =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft dark:hover:bg-white/[0.06]";
  const lastAgent = [...(messages ?? [])].reverse().find((m) => m.sender === "agent" && !m.internal);
  const visitorSaw = !isWhatsApp && lastAgent && c.visitor_seen_at >= lastAgent.created_at;

  return (
    <>
      <section className="flex min-h-0 flex-col border-line xl:border-r">
        {/* Encabezado */}
        <header className="border-b border-line px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label={t.back} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface-soft md:hidden">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700/10 text-xs font-bold text-deep-700 dark:bg-white/10 dark:text-white">
              {initialsOf(c.name)}
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface dark:ring-card",
                  presence ? "bg-emerald-500" : "bg-deep-300 dark:bg-deep-500",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base leading-tight text-heading">{c.name}</h2>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted">
                {isWhatsApp ? (
                  <>
                    <WhatsappIcon className="h-3.5 w-3.5 text-[#1fa855]" />
                    {wa.badge} · {c.wa_phone ? `+${c.wa_phone}` : ""}
                  </>
                ) : presence ? (
                  t.online
                ) : (
                  t.offline
                )}
              </p>
            </div>
            <div className="hidden w-44 2xl:block">
              <Select
                size="sm"
                label={t.assign}
                value={c.assigned_to ?? ""}
                onChange={(v) => update({ assigned_to: v || null })}
                options={[{ value: "", label: t.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
            </div>
            {c.status === "open" ? (
              <button type="button" onClick={() => update({ status: "closed" })} className={action}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t.close}
              </button>
            ) : (
              <button type="button" onClick={() => update({ status: "open" })} className={action}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t.reopen}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {c.email && (
              <a href={`mailto:${c.email}`} className={action}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                <span className="max-w-[12rem] truncate">{c.email}</span>
              </a>
            )}
            {c.phone && (
              <>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={action}>
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {c.phone}
                </a>
                {!isWhatsApp && (
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className={action}>
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    WhatsApp
                  </a>
                )}
              </>
            )}
            <button type="button" onClick={downloadTranscript} className={action} title={t.transcript}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t.transcript}</span>
            </button>

            {/* Etiquetas */}
            <div className="relative">
              <button type="button" onClick={() => setTagsOpen((v) => !v)} aria-expanded={tagsOpen} className={action}>
                <Tag className="h-3.5 w-3.5" aria-hidden />
                {t.tags}
              </button>
              {tagsOpen && (
                <div className="absolute left-0 top-11 z-20 w-64 rounded-lg bg-surface p-3 shadow-[0_16px_40px_-12px_rgba(11,16,32,0.45)] shadow-meta dark:bg-card">
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((x) => {
                      const on = (c.tags ?? []).includes(x);
                      return (
                        <button
                          key={x}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleTag(x)}
                          className={cn(
                            "h-7 rounded-full px-2.5 text-xs font-semibold ring-1",
                            on ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700" : "text-heading ring-line-strong hover:bg-surface-soft",
                          )}
                        >
                          #{x}
                        </button>
                      );
                    })}
                  </div>
                  <form
                    className="mt-3 flex gap-1.5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const tag = newTag.trim().toLowerCase();
                      if (tag && !(c.tags ?? []).includes(tag)) toggleTag(tag);
                      setNewTag("");
                    }}
                  >
                    <input
                      value={newTag}
                      onChange={(event) => setNewTag(event.target.value)}
                      maxLength={30}
                      placeholder={t.addTag}
                      aria-label={t.addTag}
                      className="h-8 min-w-0 flex-1 rounded-full bg-surface-soft px-3 text-xs text-heading outline-none dark:bg-white/[0.06]"
                    />
                    <button type="submit" aria-label={t.addTag} className="grid h-8 w-8 place-items-center rounded-full bg-deep-700 text-white dark:bg-white dark:text-deep-700">
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              )}
            </div>
            {(c.tags ?? []).map((x) => (
              <span key={x} className="rounded-full bg-surface-soft px-2 py-1 font-semibold text-heading dark:bg-white/[0.08]">#{x}</span>
            ))}
          </div>
        </header>

        {/* Mensajes */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto bg-surface-soft/40 px-4 py-5 sm:px-6 dark:bg-transparent" aria-live="polite">
          {messages === null ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" aria-hidden />
          ) : (
            <ol className="grid gap-2">
              {messages.map((m, i) => {
                if (m.sender === "system") {
                  return (
                    <li key={m.id} className="py-2 text-center text-xs text-muted">
                      {t.system[m.body] ?? m.body} · {time(m.created_at)}
                    </li>
                  );
                }
                const agent = m.sender === "agent";
                const prev = messages[i - 1];
                const showName = prev?.sender !== m.sender || prev.author_id !== m.author_id || prev.internal !== m.internal;
                return (
                  <li key={m.id} className={cn("flex flex-col", agent ? "items-end" : "items-start")}>
                    {showName && (
                      <span className="mx-1 mb-1 flex items-center gap-1 text-xs font-semibold text-muted">
                        {m.internal && <Lock className="h-3 w-3 text-amber-600" aria-hidden />}
                        {agent ? (m.author_id ? names[m.author_id] ?? "—" : "Engynex") : c.name} · {time(m.created_at)}
                        {m.internal && <span className="text-amber-700 dark:text-amber-300">· {t.internalTag}</span>}
                      </span>
                    )}
                    <p
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                        m.internal
                          ? "bg-amber-50 text-heading ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
                          : agent
                            ? "rounded-br-md bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950"
                            : "rounded-bl-md bg-surface text-heading shadow-meta dark:bg-white/[0.08] dark:ring-0",
                      )}
                      title={time(m.created_at)}
                    >
                      {m.body}
                    </p>
                    {agent && isWhatsApp && m.delivery && (
                      <span className={cn("mx-1 mt-1 text-[0.7rem]", m.delivery === "failed" ? "text-red-600 dark:text-red-400" : m.delivery === "read" ? "text-[#1fa855]" : "text-muted")}>
                        {m.delivery === "read" || m.delivery === "delivered" ? "✓✓ " : m.delivery === "sent" ? "✓ " : ""}
                        {wa.delivery[m.delivery]}
                      </span>
                    )}
                    {visitorSaw && m.id === lastAgent?.id && <span className="mx-1 mt-1 text-[0.7rem] text-muted">✓✓ {t.seenByVisitor}</span>}
                  </li>
                );
              })}
            </ol>
          )}
          {visitorTyping && <p className="mt-3 text-xs text-muted">{t.typing.replace("{name}", c.name.split(/\s+/)[0])}</p>}
        </div>

        {/* Respuesta */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className={cn("relative border-t px-4 py-3 sm:px-6", internal ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5" : "border-line")}
        >
          {isWhatsApp && !internal && (
            <p className={cn("mb-2 text-xs", windowOpen ? "text-muted" : "font-semibold text-amber-700 dark:text-amber-300")}>
              {windowOpen && c.wa_window_until
                ? wa.windowOpen.replace(
                    "{time}",
                    new Intl.DateTimeFormat(locale, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(c.wa_window_until)),
                  )
                : wa.windowClosed}
            </p>
          )}
          {sendError && (
            <p role="alert" className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
              {sendError}
            </p>
          )}

          {/* Atajos: respuestas guardadas */}
          {matches.length > 0 && (
            <ul role="listbox" aria-label={t.saved.title} className="absolute bottom-full left-4 right-4 z-20 mb-2 overflow-hidden rounded-lg bg-surface shadow-[0_16px_40px_-12px_rgba(11,16,32,0.45)] shadow-meta sm:left-6 sm:right-6 dark:bg-card">
              {matches.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === slashIndex}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => fillReply(r)}
                    className={cn("flex w-full items-baseline gap-3 px-4 py-2.5 text-left", i === slashIndex ? "bg-surface-soft dark:bg-white/[0.08]" : "hover:bg-surface-soft/70")}
                  >
                    <span className="font-mono text-xs font-bold text-accent">/{r.shortcut}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-heading">
                      <span className="font-semibold">{r.title}</span> <span className="text-muted">— {r.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1">
            {savedReplies.slice(0, 5).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => fillReply(r)}
                className="h-8 shrink-0 rounded-full bg-surface-soft px-3 text-xs font-semibold text-heading hover:bg-card-soft dark:bg-white/[0.06]"
              >
                {r.title}
              </button>
            ))}
            <Link href={`/${locale}/portal/chat/respuestas`} className="h-8 shrink-0 px-2 text-xs font-semibold leading-8 text-accent hover:underline">
              {t.saved.manage}
            </Link>
          </div>
          <div className="flex items-end gap-2">
            <label htmlFor={inputId} className="sr-only">
              {t.placeholder}
            </label>
            <textarea
              id={inputId}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setSlashIndex(0);
                notifyTyping();
              }}
              onKeyDown={(event) => {
                if (matches.length > 0) {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setSlashIndex((i) => (i + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
                    return;
                  }
                  if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault();
                    fillReply(matches[slashIndex] ?? matches[0]);
                    return;
                  }
                  if (event.key === "Escape") {
                    setBody("");
                    return;
                  }
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={2}
              maxLength={2000}
              disabled={!windowOpen && !internal}
              placeholder={`${t.placeholder} · ${t.saved.hint}`}
              className={cn(
                "max-h-40 min-h-12 flex-1 resize-none rounded-lg border bg-surface px-4 py-3 text-sm leading-relaxed text-heading outline-none [field-sizing:content] focus:ring-2 dark:bg-card",
                internal
                  ? "border-amber-300 focus:ring-amber-300/40 dark:border-amber-500/40"
                  : "border-line-strong focus:border-deep-700 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20",
              )}
            />
            <button
              type="submit"
              disabled={busy || !body.trim() || (!windowOpen && !internal)}
              aria-label={t.send}
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40",
                internal ? "bg-amber-500 text-deep-950 hover:bg-amber-400" : "bg-deep-700 text-white hover:bg-deep-600 dark:bg-brand-green dark:text-deep-950",
              )}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <SendHorizontal className="h-5 w-5" aria-hidden />}
            </button>
          </div>
          <label className="mt-2 flex w-fit items-center gap-2 text-xs text-body">
            <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} className="h-4 w-4 accent-amber-500" />
            <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            {t.internal}
          </label>
        </form>
      </section>

      <ChatContext locale={locale} conversation={c} presencePage={presence?.page ?? null} />
    </>
  );
}
