"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Bold,
  Bot,
  CalendarPlus,
  CheckCircle2,
  Download,
  Italic,
  LifeBuoy,
  ListTodo,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  SendHorizontal,
  Smile,
  Sparkles,
  Tag,
  UserCheck,
  X,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ChatSavedReply, Json, MeetingChannel } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { chatProCopy } from "@/content/chatPro";
import { campaignsCopy } from "@/content/campaigns";
import { leadFormCopy } from "@/content/leadForm";
import { ticketsCopy } from "@/content/tickets";
import { ticketCategories } from "@/lib/ticketCategories";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import { ChatContext } from "./ChatContext";
import { ChannelBadge } from "./ChannelBadge";
import { RichText } from "./RichText";
import { AttachmentView, uploadChatFile } from "./Attachment";
import { CHAT_SHORTCUT_EVENT, initialsOf, type ChatShortcut, type InboxConversation } from "./ChatInbox";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Presence = { role?: string; page?: string };
type Mode = "reply" | "note";
type Dialog = "task" | "meeting" | "ticket" | "transfer" | null;

const EMOJIS = ["😊", "😄", "🙌", "👍", "👌", "🙏", "👋", "🎉", "✅", "⭐", "🚀", "💡", "📅", "📎", "💬", "❤️", "😅", "🤔", "👀", "🔥", "📞", "💻", "📈", "✨"];
const MEETING_CHANNELS: MeetingChannel[] = ["meet", "call", "whatsapp", "in_person"];

const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)] disabled:opacity-40 disabled:hover:bg-transparent";
const menu = "absolute z-30 mt-2 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const menuItem = "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-heading hover:bg-[var(--meta-hover)]";
const chip = "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

/** Ventana modal sencilla para las acciones rápidas. */
function ActionDialog({
  title,
  children,
  onClose,
  onSubmit,
  busy,
  error,
  submitLabel,
  cancelLabel,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  cancelLabel: string;
  disabled?: boolean;
}) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="grid w-full max-w-md gap-4 rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-heading">{title}</h2>
          <button type="button" onClick={onClose} aria-label={cancelLabel} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-[10px] px-4 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
            {cancelLabel}
          </button>
          <button type="submit" disabled={busy || disabled} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Una conversación: mensajes en vivo (con formato y adjuntos), notas internas,
 * respuestas guardadas con "/", respuesta sugerida con IA, transferencias y
 * acciones rápidas (tarea, reunión, ticket, resumen). A la derecha
 * (pantallas grandes), el contexto del visitante.
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
  const pro = chatProCopy[locale];
  const wa = campaignsCopy[locale].chat;
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("reply");
  const [busy, setBusy] = useState(false);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [popover, setPopover] = useState<"emoji" | "replies" | "more" | "tags" | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newTag, setNewTag] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  const isWeb = c.channel === "web";
  const channelName = pro.channels[c.channel] ?? c.channel;
  const internal = mode === "note";
  const windowOpen = isWeb || (!!c.wa_window_until && new Date(c.wa_window_until).getTime() > now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4000);
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

    // Canal del visitante (solo chat web): presencia, página actual y "escribiendo…".
    let typingTimer: number | undefined;
    let live: RealtimeChannel | null = null;
    if (c.channel === "web") {
      const ch = supabase
        .channel(c.topic, { config: { broadcast: { self: false } } })
        .on("presence", { event: "sync" }, () => {
          const state = ch.presenceState<Presence>();
          setPresence(state.visitor?.[0] ?? null);
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.from !== "visitor") return;
          setVisitorTyping(true);
          window.clearTimeout(typingTimer);
          typingTimer = window.setTimeout(() => setVisitorTyping(false), 4000);
        })
        .subscribe();
      live = ch;
      channelRef.current = ch;
    }

    document.addEventListener("visibilitychange", markRead);
    return () => {
      alive = false;
      window.clearTimeout(typingTimer);
      document.removeEventListener("visibilitychange", markRead);
      channelRef.current = null;
      void supabase.removeChannel(changes);
      if (live) void supabase.removeChannel(live);
    };
  }, [supabase, c.id, c.topic, c.channel, markRead]);

  const last = messages?.at(-1)?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last, visitorTyping]);

  // Cerrar menús al hacer clic fuera.
  useEffect(() => {
    if (!popover) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-popover]")) setPopover(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [popover]);

  const lastTyping = useRef(0);
  const notifyTyping = () => {
    if (internal) return;
    const n = Date.now();
    if (n - lastTyping.current < 2000) return;
    lastTyping.current = n;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: "agent", name: me.name.split(/\s+/)[0] } });
  };

  const update = useCallback(
    (patch: { [key: string]: Json }) => void supabase.rpc("chat_agent_update", { p_conversation: c.id, p: patch }).then(),
    [supabase, c.id],
  );

  /* ---------------- Resumen con IA ---------------- */

  const summarize = useCallback(
    async (silent = false) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: c.id, action: "summary" }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (silent) return;
      if (res.ok) flash(t.actions.done.summary);
      else flash(t.composer.aiErrors[data.error ?? ""] ?? t.composer.aiErrors.generic.replace("{detail}", data.error ?? "—"));
    },
    [c.id, flash, t],
  );

  const toggleStatus = useCallback(() => {
    if (c.status === "open") {
      update({ status: "closed" });
      // Al cerrar, se guarda un resumen si la conversación tuvo contenido.
      const visitorLines = (messages ?? []).filter((m) => m.sender === "visitor").length;
      if (!c.summary && visitorLines >= 2) void summarize(true);
    } else {
      update({ status: "open" });
    }
  }, [c.status, c.summary, messages, update, summarize]);

  // Atajos que reenvía la bandeja.
  useEffect(() => {
    const onShortcut = (event: Event) => {
      const key = (event as CustomEvent<ChatShortcut>).detail;
      if (key === "reply" || key === "note") {
        setMode(key);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      } else if (key === "toggle") {
        toggleStatus();
      } else if (key === "assign") {
        update({ assigned_to: me.id });
      }
    };
    window.addEventListener(CHAT_SHORTCUT_EVENT, onShortcut);
    return () => window.removeEventListener(CHAT_SHORTCUT_EVENT, onShortcut);
  }, [toggleStatus, update, me.id]);

  /* ---------------- Respuestas guardadas con "/" ---------------- */

  const slash = body.startsWith("/") && !body.includes("\n") ? body.slice(1).toLowerCase() : null;
  const matches = slash === null ? [] : savedReplies.filter((r) => r.shortcut.startsWith(slash) || r.title.toLowerCase().includes(slash)).slice(0, 6);
  const fillReply = (reply: ChatSavedReply) => {
    setBody(reply.body.replaceAll("{nombre}", c.name.split(/\s+/)[0]).replaceAll("{asesor}", me.name.split(/\s+/)[0]));
    setSlashIndex(0);
    setPopover(null);
    inputRef.current?.focus();
  };

  /* ---------------- Editor ---------------- */

  const insert = (before: string, after = "") => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + before + body.slice(start, end) + after + body.slice(end);
    setBody(next);
    window.setTimeout(() => {
      el?.focus();
      const pos = end + before.length + after.length;
      el?.setSelectionRange(start === end ? start + before.length : pos, start === end ? start + before.length : pos);
    }, 0);
  };

  const suggest = async () => {
    setAiBusy(true);
    setSendError(null);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation: c.id, action: "suggest" }),
    });
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    setAiBusy(false);
    if (res.ok && data.text) {
      setMode("reply");
      setBody(data.text);
      inputRef.current?.focus();
    } else {
      setSendError(t.composer.aiErrors[data.error ?? ""] ?? t.composer.aiErrors.generic.replace("{detail}", data.error ?? "—"));
    }
  };

  const attach = async (file: File) => {
    setUploading(true);
    setSendError(null);
    const result = await uploadChatFile(supabase, c.topic, file);
    if ("error" in result) {
      setUploading(false);
      return setSendError(pro.attach.errors[result.error]);
    }
    const { error } = await supabase.rpc("chat_agent_send", {
      p_conversation: c.id,
      p_body: "",
      p_internal: internal,
      p_attachment: result.attachment as unknown as Json,
    });
    setUploading(false);
    if (error) setSendError(pro.attach.errors.upload);
  };

  /* ---------------- Enviar ---------------- */

  const send = async () => {
    const text = body.trim();
    if (!text || busy || text.startsWith("/")) return;
    setBusy(true);
    setSendError(null);
    if (!isWeb && !internal) {
      // WhatsApp, Messenger e Instagram: el servidor lo envía a Meta y luego lo guarda.
      const res = await fetch(c.channel === "whatsapp" ? "/api/whatsapp/reply" : "/api/meta/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: c.id, body: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      setBusy(false);
      if (res.ok) return setBody("");
      const whatsapp = c.channel === "whatsapp";
      setSendError(
        data.error === "window_closed"
          ? whatsapp
            ? wa.windowClosed
            : t.composer.socialWindowClosed.replace("{channel}", channelName)
          : data.error === "not_configured"
            ? whatsapp
              ? wa.notConfigured
              : t.composer.socialNotConfigured.replace("{channel}", channelName)
            : (whatsapp ? wa.sendFailed : t.composer.socialFailed.replace("{channel}", channelName)).replace("{detail}", data.detail ?? data.error ?? "—"),
      );
      return;
    }
    const { error } = await supabase.rpc("chat_agent_send", { p_conversation: c.id, p_body: text, p_internal: internal });
    setBusy(false);
    if (!error) {
      setBody("");
      setMode("reply");
    } else {
      setSendError(t.actions.errors.generic.replace("{detail}", error.message));
    }
  };

  const toggleTag = (tag: string) => {
    const tags = c.tags ?? [];
    update({ tags: tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag] });
  };

  const time = (iso: string) => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date(now);
    const yesterday = new Date(now - 86_400_000);
    if (d.toDateString() === today.toDateString()) return t.day.today;
    if (d.toDateString() === yesterday.toDateString()) return t.day.yesterday;
    return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(d);
  };

  const downloadTranscript = () => {
    const stamp = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
    const lines = (messages ?? []).map((m) => {
      const who =
        m.sender === "visitor" ? c.name : m.sender === "agent" ? (m.author_id ? names[m.author_id] ?? "Engynex" : "Engynex") : m.sender === "bot" ? pro.bot : "—";
      const text = m.sender === "system" ? `[${t.system[m.body] ?? m.body}]` : m.body;
      return `[${stamp(m.created_at)}] ${who}${m.internal ? ` (${t.internalTag})` : ""}: ${text}`;
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
  const lastAgent = [...(messages ?? [])].reverse().find((m) => m.sender === "agent" && !m.internal);
  const visitorSaw = isWeb && lastAgent && c.visitor_seen_at >= lastAgent.created_at;

  const subtitle = !isWeb
    ? `${channelName}${c.channel === "whatsapp" && c.wa_phone ? ` · +${c.wa_phone}` : ""}`
    : presence
      ? t.online
      : t.offline;

  return (
    <>
      <section className="flex min-h-0 flex-col border-line xl:border-r">
        {/* Encabezado */}
        <header className="border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label={t.back} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--meta-hover)] md:hidden">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700/10 text-xs font-bold text-deep-700 dark:bg-white/10 dark:text-white">
              {initialsOf(c.name)}
              {isWeb ? (
                <span
                  aria-hidden
                  className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface dark:ring-card", presence ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600")}
                />
              ) : (
                <ChannelBadge channel={c.channel} className="absolute -bottom-0.5 -right-0.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[1.02rem] font-semibold leading-tight text-heading">{c.name}</h2>
              <p className="truncate text-xs text-muted">{subtitle}</p>
            </div>

            <div className="hidden w-44 lg:block">
              <Select
                size="sm"
                label={t.assign}
                value={c.assigned_to ?? ""}
                onChange={(v) => update({ assigned_to: v || null })}
                options={[{ value: "", label: t.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
            </div>
            <button type="button" onClick={() => setDialog("transfer")} className={iconBtn} aria-label={t.actions.transfer} title={t.actions.transfer}>
              <ArrowRightLeft className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleStatus}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium",
                c.status === "open" ? "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green/40" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
              )}
            >
              {c.status === "open" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
              <span className="max-sm:sr-only">{c.status === "open" ? t.close : t.reopen}</span>
            </button>
            <div className="relative" data-popover>
              <button
                type="button"
                onClick={() => setPopover((p) => (p === "more" ? null : "more"))}
                aria-expanded={popover === "more"}
                aria-label={t.actions.more}
                className={iconBtn}
              >
                <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
              </button>
              {popover === "more" && (
                <div className={cn(menu, "right-0 w-60")}>
                  {c.assigned_to !== me.id && (
                    <button type="button" className={menuItem} onClick={() => (update({ assigned_to: me.id }), setPopover(null))}>
                      <UserCheck className="h-4 w-4" aria-hidden />
                      {t.actions.assignMe}
                    </button>
                  )}
                  <button type="button" className={menuItem} onClick={() => (setDialog("task"), setPopover(null))}>
                    <ListTodo className="h-4 w-4" aria-hidden />
                    {t.actions.task}
                  </button>
                  <button type="button" className={menuItem} onClick={() => (setDialog("meeting"), setPopover(null))}>
                    <CalendarPlus className="h-4 w-4" aria-hidden />
                    {t.actions.meeting}
                  </button>
                  <button type="button" className={menuItem} onClick={() => (setDialog("ticket"), setPopover(null))}>
                    <LifeBuoy className="h-4 w-4" aria-hidden />
                    {t.actions.ticket}
                  </button>
                  <button type="button" className={menuItem} onClick={() => (void summarize(), setPopover(null))}>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {t.actions.summary}
                  </button>
                  <div className="my-1 border-t border-line" />
                  <button type="button" className={menuItem} onClick={() => (downloadTranscript(), setPopover(null))}>
                    <Download className="h-4 w-4" aria-hidden />
                    {t.transcript}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {c.email && (
              <a href={`mailto:${c.email}`} className={chip}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                <span className="max-w-[12rem] truncate">{c.email}</span>
              </a>
            )}
            {c.phone && (
              <>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={chip}>
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {c.phone}
                </a>
                {isWeb && (
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className={chip}>
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    WhatsApp
                  </a>
                )}
              </>
            )}
            <div className="relative" data-popover>
              <button type="button" onClick={() => setPopover((p) => (p === "tags" ? null : "tags"))} aria-expanded={popover === "tags"} className={chip}>
                <Tag className="h-3.5 w-3.5" aria-hidden />
                {t.tags}
              </button>
              {popover === "tags" && (
                <div className={cn(menu, "left-0 w-64 p-3")}>
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
                            "h-7 rounded-lg px-2.5 text-xs font-medium ring-1",
                            on ? "bg-[var(--meta-active)] text-accent ring-brand-green/40" : "text-heading ring-line hover:bg-[var(--meta-hover)]",
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
                      className="h-8 min-w-0 flex-1 rounded-lg bg-[#f4f4f5] px-3 text-xs text-heading outline-none dark:bg-white/[0.06]"
                    />
                    <button type="submit" aria-label={t.addTag} className="grid h-8 w-8 place-items-center rounded-lg bg-deep-700 text-white dark:bg-white dark:text-deep-700">
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              )}
            </div>
            {(c.tags ?? []).map((x) => (
              <span key={x} className="rounded-lg bg-card-soft px-2 py-1 text-xs font-medium text-heading dark:bg-white/[0.08]">
                #{x}
              </span>
            ))}
          </div>
        </header>

        {/* Mensajes */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] px-4 py-5 sm:px-6 dark:bg-transparent" aria-live="polite">
          {messages === null ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" aria-hidden />
          ) : (
            <ol className="grid gap-2">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                const separator = newDay && (
                  <li key={`d-${m.id}`} className="my-2 flex items-center gap-3 text-xs font-medium text-muted" aria-hidden>
                    <span className="h-px flex-1 bg-line" />
                    {dayLabel(m.created_at)}
                    <span className="h-px flex-1 bg-line" />
                  </li>
                );
                const meta = (m.meta ?? {}) as Record<string, string | number | null>;

                if (m.sender === "system") {
                  let text = t.system[m.body] ?? m.body;
                  if (m.body === "transferred") {
                    text = t.events.transferred
                      .replace("{by}", names[String(meta.by)] ?? "—")
                      .replace("{to}", names[String(meta.to)] ?? "—");
                  } else if (m.body === "ticket_created") {
                    text = t.events.ticket_created.replace("{n}", String(meta.number ?? ""));
                  }
                  return [
                    separator,
                    <li key={m.id} className="flex flex-col items-center gap-1 py-1.5 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-line dark:bg-white/[0.05]">
                        {m.body === "transferred" && <ArrowRightLeft className="h-3 w-3" aria-hidden />}
                        {m.body === "ticket_created" ? (
                          <a href={`/${locale}/portal/soporte/${meta.ticket_id}`} className="font-medium text-accent hover:underline">
                            {text}
                          </a>
                        ) : (
                          text
                        )}
                        <span aria-hidden>·</span>
                        {time(m.created_at)}
                      </span>
                      {m.body === "transferred" && meta.note && <span className="max-w-md text-xs italic text-body">“{meta.note}”</span>}
                    </li>,
                  ];
                }

                const fromUs = m.sender === "agent" || m.sender === "bot";
                const showName = !prev || newDay || prev.sender !== m.sender || prev.author_id !== m.author_id || prev.internal !== m.internal;
                const who = m.sender === "bot" ? pro.bot : m.sender === "agent" ? (m.author_id ? names[m.author_id] ?? "—" : "Engynex") : c.name;
                const dark = m.sender === "agent" && !m.internal;
                return [
                  separator,
                  <li key={m.id} className={cn("flex flex-col", fromUs ? "items-end" : "items-start")}>
                    {showName && (
                      <span className="mx-1 mb-1 flex items-center gap-1 text-xs text-muted">
                        {m.internal && <Lock className="h-3 w-3 text-amber-600" aria-hidden />}
                        {m.sender === "bot" && <Bot className="h-3.5 w-3.5 text-accent" aria-hidden />}
                        <span className="font-medium text-heading">{who}</span> · {time(m.created_at)}
                        {m.internal && <span className="text-amber-700 dark:text-amber-300">· {t.internalTag}</span>}
                      </span>
                    )}
                    <div
                      className={cn(
                        "grid max-w-[80%] gap-2 whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.92rem] leading-relaxed",
                        m.internal
                          ? "bg-amber-50 text-heading ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
                          : m.sender === "bot"
                            ? "rounded-br-md bg-[var(--meta-active)] text-heading ring-1 ring-brand-green/30"
                            : dark
                              ? "rounded-br-md bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950"
                              : "rounded-bl-md bg-surface text-heading ring-1 ring-line dark:bg-white/[0.08] dark:ring-0",
                      )}
                      title={new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(m.created_at))}
                    >
                      {m.attachment ? (
                        <AttachmentView supabase={supabase} attachment={m.attachment} tone={dark ? "dark" : "light"} />
                      ) : (
                        <p>
                          <RichText text={m.body} />
                        </p>
                      )}
                    </div>
                    {m.sender === "agent" && !isWeb && m.delivery && (
                      <span className={cn("mx-1 mt-1 text-[0.7rem]", m.delivery === "failed" ? "text-red-600 dark:text-red-400" : m.delivery === "read" ? "text-[#1fa855]" : "text-muted")}>
                        {m.delivery === "read" || m.delivery === "delivered" ? "✓✓ " : m.delivery === "sent" ? "✓ " : ""}
                        {wa.delivery[m.delivery]}
                      </span>
                    )}
                    {visitorSaw && m.id === lastAgent?.id && <span className="mx-1 mt-1 text-[0.7rem] text-muted">✓✓ {t.seenByVisitor}</span>}
                  </li>,
                ];
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
          className={cn("relative border-t px-4 pb-3 pt-2 sm:px-5", internal ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5" : "border-line")}
        >
          <div className="mb-2 flex items-center gap-1" role="tablist" aria-label={t.composer.reply}>
            {(["reply", "note"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => {
                  setMode(k);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors",
                  mode === k
                    ? k === "note"
                      ? "bg-amber-100 font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                      : "bg-[var(--meta-hover)] font-semibold text-heading"
                    : "text-muted hover:text-heading",
                )}
              >
                {k === "note" ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <MessageSquareText className="h-3.5 w-3.5" aria-hidden />}
                {k === "note" ? t.composer.note : t.composer.reply}
              </button>
            ))}
            {toast && (
              <span role="status" className="ml-auto truncate rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                {toast}
              </span>
            )}
          </div>

          {!isWeb && !internal && (
            <p className={cn("mb-2 text-xs", windowOpen ? "text-muted" : "font-semibold text-amber-700 dark:text-amber-300")}>
              {windowOpen && c.wa_window_until
                ? (c.channel === "whatsapp" ? wa.windowOpen : t.composer.socialWindowOpen).replace(
                    "{time}",
                    new Intl.DateTimeFormat(locale, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(c.wa_window_until)),
                  )
                : c.channel === "whatsapp"
                  ? wa.windowClosed
                  : t.composer.socialWindowClosed.replace("{channel}", channelName)}
            </p>
          )}
          {internal && <p className="mb-2 text-xs text-amber-800 dark:text-amber-300">{t.composer.noteHint}</p>}
          {sendError && (
            <p role="alert" className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
              {sendError}
            </p>
          )}

          {/* Respuestas guardadas: con "/" o desde el botón */}
          {(matches.length > 0 || popover === "replies") && (
            <ul
              role="listbox"
              aria-label={t.saved.title}
              data-popover
              className="absolute bottom-full left-4 right-4 z-20 mb-2 max-h-72 overflow-y-auto rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] sm:left-5 sm:right-5 dark:bg-card"
            >
              {(matches.length > 0 ? matches : savedReplies).map((r, i) => (
                <li key={r.id} role="option" aria-selected={matches.length > 0 && i === slashIndex}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => fillReply(r)}
                    className={cn(
                      "flex w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left",
                      matches.length > 0 && i === slashIndex ? "bg-[var(--meta-hover)]" : "hover:bg-[var(--meta-hover)]",
                    )}
                  >
                    <span className="font-mono text-xs font-bold text-accent">/{r.shortcut}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-heading">
                      <span className="font-medium">{r.title}</span> <span className="text-muted">— {r.body}</span>
                    </span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && savedReplies.length === 0 && <li className="px-3 py-2 text-sm text-muted">{t.saved.empty}</li>}
              <li className="border-t border-line px-3 pb-1 pt-2">
                <a href={`/${locale}/portal/chat/respuestas`} className="text-xs font-semibold text-accent hover:underline">
                  {t.saved.manage}
                </a>
              </li>
            </ul>
          )}

          <label htmlFor={inputId} className="sr-only">
            {t.placeholder}
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
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
              if ((event.metaKey || event.ctrlKey) && (event.key === "b" || event.key === "i")) {
                event.preventDefault();
                if (event.key === "b") insert("*", "*");
                else insert("_", "_");
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={2000}
            disabled={!windowOpen && !internal}
            placeholder={internal ? t.composer.noteHint : `${t.placeholder} · ${t.saved.hint}`}
            className={cn(
              "max-h-44 min-h-[4.5rem] w-full resize-none rounded-xl border bg-surface px-4 py-3 text-sm leading-relaxed text-heading outline-none [field-sizing:content] focus:ring-2 disabled:opacity-60 dark:bg-card",
              internal
                ? "border-amber-300 focus:ring-amber-300/40 dark:border-amber-500/40"
                : "border-line focus:border-line-strong focus:ring-brand-green/25",
            )}
          />

          <div className="mt-2 flex items-center gap-0.5">
            <div className="relative" data-popover>
              <button type="button" onClick={() => setPopover((p) => (p === "emoji" ? null : "emoji"))} aria-expanded={popover === "emoji"} aria-label={t.composer.emoji} title={t.composer.emoji} className={iconBtn}>
                <Smile className="h-[18px] w-[18px]" aria-hidden />
              </button>
              {popover === "emoji" && (
                <div className={cn(menu, "bottom-11 left-0 mt-0 grid w-64 grid-cols-8 gap-0.5 p-2")}>
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => insert(e)} className="grid h-7 w-7 place-items-center rounded-md text-lg hover:bg-[var(--meta-hover)]" aria-label={e}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => insert("*", "*")} aria-label={t.composer.bold} title={`${t.composer.bold} (Ctrl+B)`} className={iconBtn}>
              <Bold className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button type="button" onClick={() => insert("_", "_")} aria-label={t.composer.italic} title={`${t.composer.italic} (Ctrl+I)`} className={iconBtn}>
              <Italic className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!isWeb || uploading}
              aria-label={pro.attach.button}
              title={isWeb ? pro.attach.button : t.composer.attachWebOnly}
              className={iconBtn}
            >
              {uploading ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : <Paperclip className="h-[18px] w-[18px]" aria-hidden />}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void attach(file);
              }}
            />
            <button
              type="button"
              onClick={() => setPopover((p) => (p === "replies" ? null : "replies"))}
              aria-expanded={popover === "replies"}
              aria-label={t.composer.replies}
              title={t.composer.replies}
              className={iconBtn}
              data-popover
            >
              <MessageSquareText className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void suggest()}
              disabled={aiBusy || internal}
              title={t.composer.ai}
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium text-accent hover:bg-[var(--meta-active)] disabled:opacity-40"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              <span className="whitespace-nowrap max-sm:sr-only">{aiBusy ? t.composer.aiBusy : t.composer.aiShort}</span>
            </button>
            <button
              type="submit"
              disabled={busy || !body.trim() || (!windowOpen && !internal)}
              aria-label={t.send}
              className={cn(
                "ml-auto inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-colors disabled:opacity-40",
                internal ? "bg-amber-500 text-deep-950 hover:bg-amber-400" : "bg-deep-700 text-white hover:bg-deep-600 dark:bg-brand-green dark:text-deep-950",
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4" aria-hidden />}
              <span className="max-sm:sr-only">{t.send}</span>
            </button>
          </div>
        </form>
      </section>

      <ChatContext locale={locale} conversation={c} presencePage={presence?.page ?? null} onSummarize={() => summarize()} />

      {dialog && (
        <QuickAction
          kind={dialog}
          locale={locale}
          conversation={c}
          employees={employees}
          me={me}
          onClose={() => setDialog(null)}
          onDone={(text) => {
            setDialog(null);
            flash(text);
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Acciones rápidas: transferir, tarea, reunión y ticket              */
/* ------------------------------------------------------------------ */

function QuickAction({
  kind,
  locale,
  conversation: c,
  employees,
  me,
  onClose,
  onDone,
}: {
  kind: NonNullable<Dialog>;
  locale: Locale;
  conversation: InboxConversation;
  employees: { id: string; name: string }[];
  me: { id: string; name: string };
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const t = liveChatCopy[locale].inbox.actions;
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    to: employees.find((e) => e.id !== c.assigned_to && e.id !== me.id)?.id ?? "",
    note: "",
    title: t.taskDefault.replace("{name}", c.name),
    due: null as string | null,
    assignee: me.id,
    when: null as string | null,
    channel: "meet" as MeetingChannel,
    notes: "",
    subject: `Chat: ${c.name}`,
    category: ticketCategories(locale)[0]?.value ?? "other",
    priority: "medium",
    email: c.email ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const fail = (message: string) => setError(t.errors[message] ?? t.errors.generic.replace("{detail}", message));

  const submit = async () => {
    setBusy(true);
    setError(null);
    let failed: string | null = null;
    let done = "";
    if (kind === "transfer") {
      const { error: e } = await supabase.rpc("chat_transfer", { p_conversation: c.id, p_to: form.to, p_note: form.note || null });
      failed = e?.message ?? null;
      done = t.done.transfer;
    } else if (kind === "task") {
      const { error: e } = await supabase.from("tasks").insert({ title: form.title.trim(), due_at: form.due, assigned_to: form.assignee || null, lead_id: c.lead_id });
      failed = e?.message ?? null;
      done = t.done.task;
    } else if (kind === "meeting") {
      const { error: e } = await supabase.rpc("staff_book_appointment", {
        p_lead: c.lead_id!,
        p_start: form.when!,
        p_channel: form.channel,
        p_notes: form.notes || null,
      });
      failed = e?.message ?? null;
      done = t.done.meeting;
    } else {
      const { data, error: e } = await supabase.rpc("chat_create_ticket", {
        p_conversation: c.id,
        p: { subject: form.subject, category: form.category, priority: form.priority, email: form.email },
      });
      failed = e?.message ?? null;
      done = t.done.ticket.replace("{n}", String((data as { number?: number } | null)?.number ?? ""));
    }
    setBusy(false);
    if (failed) return fail(failed);
    onDone(done);
  };

  const title = { transfer: t.transferTitle, task: t.task, meeting: t.meeting, ticket: t.ticket }[kind];
  const field = cn(inputClass, "h-11 text-sm");
  const disabled =
    (kind === "transfer" && !form.to) ||
    (kind === "task" && form.title.trim().length < 2) ||
    (kind === "meeting" && (!c.lead_id || !form.when)) ||
    (kind === "ticket" && !form.subject.trim());

  return (
    <ActionDialog
      title={title}
      onClose={onClose}
      onSubmit={() => void submit()}
      busy={busy}
      error={error}
      submitLabel={kind === "transfer" ? t.transfer : t.save}
      cancelLabel={t.cancel}
      disabled={disabled}
    >
      {kind === "transfer" && (
        <>
          <Select
            size="md"
            label={t.transferTo}
            value={form.to}
            onChange={(v) => set("to", v)}
            options={employees.filter((e) => e.id !== c.assigned_to).map((e) => ({ value: e.id, label: e.name }))}
          />
          <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} maxLength={500} placeholder={t.transferNote} aria-label={t.transferNote} className={cn(inputClass, "h-auto resize-none py-2.5 text-sm")} />
        </>
      )}
      {kind === "task" && (
        <>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={300} placeholder={t.taskTitle} aria-label={t.taskTitle} className={field} />
          <DateTimePicker size="md" label={t.taskDue} value={form.due} onChange={(v) => set("due", v)} locale={locale} />
          <Select size="md" label={t.taskAssignee} value={form.assignee} onChange={(v) => set("assignee", v)} options={employees.map((e) => ({ value: e.id, label: e.name }))} />
        </>
      )}
      {kind === "meeting" &&
        (c.lead_id ? (
          <>
            <DateTimePicker size="md" label={t.meetingWhen} value={form.when} onChange={(v) => set("when", v)} locale={locale} />
            <Select
              size="md"
              label={t.meetingChannel}
              value={form.channel}
              onChange={(v) => set("channel", v as MeetingChannel)}
              options={MEETING_CHANNELS.map((k) => ({ value: k, label: leadFormCopy[locale].booking.channels[k] ?? k }))}
            />
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder={t.meetingNotes} aria-label={t.meetingNotes} className={cn(inputClass, "h-auto resize-none py-2.5 text-sm")} />
          </>
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t.meetingNeedsLead}</p>
        ))}
      {kind === "ticket" && (
        <>
          <input value={form.subject} onChange={(e) => set("subject", e.target.value)} maxLength={200} placeholder={t.ticketSubject} aria-label={t.ticketSubject} className={field} />
          <Select size="md" label={t.ticketCategory} value={form.category} onChange={(v) => set("category", v)} options={ticketCategories(locale)} />
          <Select
            size="md"
            label={t.ticketPriority}
            value={form.priority}
            onChange={(v) => set("priority", v)}
            options={(["critical", "high", "medium", "low"] as const).map((k) => ({ value: k, label: ticketsCopy[locale].priority[k] }))}
          />
          {!c.email && <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t.ticketEmail} aria-label={t.ticketEmail} className={field} />}
        </>
      )}
    </ActionDialog>
  );
}
