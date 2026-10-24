"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, MessagesSquare, MoreHorizontal, SendHorizontal, Star, X } from "lucide-react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { getVisitorId } from "@/lib/visitor";
import { trackContact } from "@/lib/tracking";
import { AGENTS_CHANNEL, OPEN_CHAT_EVENT, liveChatCopy } from "@/content/liveChat";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { ding } from "@/lib/ding";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  sender: "visitor" | "agent" | "system";
  body: string;
  created_at: string;
  agent: string | null;
};

type Fetched = {
  topic: string;
  status: "open" | "closed";
  agent_seen_at: string | null;
  rated: boolean;
  has_agent_reply: boolean;
  messages: Message[];
} | null;

/* ------------------------------------------------------------------ */
/*  Sesión del chat en el navegador (solo el token secreto)            */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "engynex-chat";
const TOKEN_EVENT = "engynex-chat-change";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin almacenamiento: el chat vive solo mientras la página esté abierta.
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

function subscribeToken(callback: () => void) {
  window.addEventListener(TOKEN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TOKEN_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

let client: SupabaseClient<Database> | null = null;
const supabase = () => (client ??= createClient());

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const INVITE_KEY = "engynex-chat-invite-dismissed";

/**
 * Chat en vivo del sitio.
 *
 * Un botón abajo a la derecha abre un panel al estilo de los chats de ayuda de
 * meta.com. El visitante deja su nombre, un correo o celular y su mensaje; la
 * conversación sigue aquí mismo y en tiempo real (Supabase Realtime):
 *
 * - Presencia: si hay asesores conectados al portal, se muestra "en línea".
 * - Mensajes: la base avisa por un canal secreto y el navegador los pide con
 *   su token; el aviso no trae contenido.
 * - "Escribiendo…" en ambos sentidos.
 * - Si cierra la pestaña, la conversación sigue: al volver, se recupera.
 * - Sin asesores conectados, responde solo con el horario de atención.
 * - Al cerrar la conversación, pide una calificación de 1 a 5.
 * - Invitación según la página y aviso en el título de la pestaña.
 */
export function LiveChatWidget({ locale }: { locale: Locale }) {
  const t = liveChatCopy[locale].widget;
  const [open, setOpen] = useState(false);
  const token = useSyncExternalStore(subscribeToken, readToken, () => null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [agentSeenAt, setAgentSeenAt] = useState<string | null>(null);
  const [agentsOnline, setAgentsOnline] = useState<boolean | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [seenId, setSeenId] = useState(0);
  const [menu, setMenu] = useState(false);
  const [rated, setRated] = useState(false);
  const [hasAgentReply, setHasAgentReply] = useState(false);
  const [invite, setInvite] = useState(false);
  const pathname = usePathname();

  const lastId = messages.at(-1)?.id ?? 0;
  const lastIdRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Lo que el visitante ya vio: todo, mientras el panel está abierto.
  if (open && lastId !== seenId) setSeenId(lastId);
  const unread = messages.filter((m) => m.sender === "agent" && m.id > seenId).length;

  /* ---------------- Mensajes ---------------- */

  const load = useCallback(async (current: string) => {
    const { data, error } = await supabase().rpc("chat_fetch", {
      p_token: current,
      p_after: lastIdRef.current,
    });
    if (error) return;
    const result = data as unknown as Fetched;
    if (!result) {
      // La conversación ya no existe (se borró): empezar de cero.
      saveToken(null);
      return;
    }
    setTopic(result.topic);
    setStatus(result.status);
    setAgentSeenAt(result.agent_seen_at);
    setRated(result.rated);
    setHasAgentReply(result.has_agent_reply);
    if (result.messages.length > 0) {
      lastIdRef.current = result.messages.at(-1)!.id;
      // Llegó la respuesta: ya no está "escribiendo".
      if (result.messages.some((m) => m.sender === "agent")) setTyping(null);
      setMessages((list) => {
        const known = new Set(list.map((m) => m.id));
        return [...list, ...result.messages.filter((m) => !known.has(m.id))];
      });
    }
  }, []);

  // Al cambiar de conversación: limpiar y cargar.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (loadedFor !== token) {
    setLoadedFor(token);
    setMessages([]);
    setTopic(null);
    setStatus("open");
    setSeenId(0);
  }
  useEffect(() => {
    lastIdRef.current = 0;
    if (token) void load(token);
  }, [token, load]);

  /* ---------------- Tiempo real: canal secreto ---------------- */

  useEffect(() => {
    if (!token || !topic) return;
    let typingTimer: number | undefined;
    const channel = supabase()
      .channel(topic, { config: { broadcast: { self: false }, presence: { key: "visitor" } } })
      .on("broadcast", { event: "message" }, () => void load(token))
      .on("broadcast", { event: "status" }, () => void load(token))
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from !== "agent") return;
        setTyping(typeof payload.name === "string" && payload.name ? payload.name : "");
        window.clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => setTyping(null), 4000);
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          // El asesor ve en qué página está el visitante.
          void channel.track({ role: "visitor", page: window.location.pathname });
          void load(token);
        }
      });
    channelRef.current = channel;

    // Respaldo por si se cae la conexión en tiempo real.
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(token);
    }, 20_000);

    return () => {
      window.clearTimeout(typingTimer);
      window.clearInterval(poll);
      channelRef.current = null;
      void supabase().removeChannel(channel);
    };
  }, [token, topic, load]);

  // Al navegar, se actualiza la página que ve el asesor.
  useEffect(() => {
    void channelRef.current?.track({ role: "visitor", page: pathname });
  }, [pathname]);

  /* ---------------- Aviso de mensajes nuevos (sonido y título) ---------------- */

  const unreadRef = useRef(0);
  useEffect(() => {
    if (unread > unreadRef.current && (!open || document.hidden)) ding();
    unreadRef.current = unread;
    if (unread === 0) return;
    const original = document.title;
    const alert = t.newMessageTitle.replace("{n}", String(unread));
    let on = false;
    const id = window.setInterval(() => {
      on = !on;
      document.title = on ? alert : original;
    }, 1200);
    return () => {
      window.clearInterval(id);
      document.title = original;
    };
  }, [unread, open, t.newMessageTitle]);

  /* ---------------- Invitación según la página ---------------- */

  useEffect(() => {
    if (token || open) return;
    try {
      if (sessionStorage.getItem(INVITE_KEY)) return;
    } catch {
      return;
    }
    const id = window.setTimeout(() => setInvite(true), 20_000);
    return () => window.clearTimeout(id);
  }, [token, open]);

  const dismissInvite = () => {
    setInvite(false);
    try {
      sessionStorage.setItem(INVITE_KEY, "1");
    } catch {
      // Sin almacenamiento: puede volver a aparecer en otra página.
    }
  };
  const section = pathname.split("/")[2] ?? "";
  const inviteText = t.invite[section] ?? t.invite.default;

  /* ---------------- Presencia de asesores (solo con el panel abierto) ---------------- */

  useEffect(() => {
    if (!open) return;
    const channel = supabase()
      .channel(AGENTS_CHANNEL)
      .on("presence", { event: "sync" }, () => {
        setAgentsOnline(Object.keys(channel.presenceState()).length > 0);
      })
      .subscribe();
    return () => {
      void supabase().removeChannel(channel);
    };
  }, [open]);

  /* ---------------- Abrir / cerrar ---------------- */

  if (open && invite) setInvite(false);

  const close = useCallback(() => {
    setOpen(false);
    setMenu(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, token, close]);

  const endChat = async () => {
    setMenu(false);
    if (!token || !window.confirm(t.endConfirm)) return;
    await supabase().rpc("chat_end", { p_token: token });
    saveToken(null);
  };

  const sendTyping = useRef(0);
  const notifyTyping = () => {
    const now = Date.now();
    if (now - sendTyping.current < 2000) return;
    sendTyping.current = now;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: "visitor" } });
  };

  const greeting = agentsOnline === false ? t.greetingAway : t.greeting;

  return (
    <>
      {/* -------- Invitación -------- */}
      {invite && !open && (
        <div
          role="status"
          className="fixed bottom-24 right-5 z-50 w-[min(19rem,calc(100vw-2.5rem))] rounded-3xl rounded-br-md bg-surface p-4 pr-10 shadow-[0_18px_50px_-16px_rgba(11,16,32,0.55)] ring-1 ring-line motion-safe:animate-[fade-in_300ms_ease-out] dark:bg-card"
        >
          <button
            type="button"
            onClick={dismissInvite}
            aria-label={t.invite.close}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-soft hover:text-heading"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              dismissInvite();
              setOpen(true);
            }}
            className="flex items-start gap-3 text-left"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep-700">
              <Image src="/images/logos/favico.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
            </span>
            <span>
              <span className="block text-xs font-semibold text-muted">{t.invite.from}</span>
              <span className="mt-0.5 block text-sm font-semibold leading-snug text-heading">{inviteText}</span>
            </span>
          </button>
        </div>
      )}

      {/* -------- Botón -------- */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="live-chat-panel"
        aria-label={unread ? `${t.launcher} · ${t.unread.replace("{n}", String(unread))}` : t.launcher}
        className={cn(
          "fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2.5 rounded-full bg-deep-700 pl-4 pr-5 text-[0.95rem] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(11,16,32,0.6)] ring-1 ring-white/10 transition-[transform,background-color] hover:bg-deep-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 dark:bg-brand-green dark:text-deep-950 dark:hover:bg-brand-green-dark",
          "max-sm:w-14 max-sm:justify-center max-sm:px-0",
          open && "max-md:hidden",
        )}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessagesSquare className="h-6 w-6" aria-hidden />}
        <span className="max-sm:sr-only">{t.launcher}</span>
        {unread > 0 && !open && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white ring-2 ring-surface dark:ring-deep-950"
          >
            {unread}
          </span>
        )}
      </button>

      {/* -------- Panel -------- */}
      <div
        ref={panelRef}
        id="live-chat-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        hidden={!open}
        className={cn(
          "fixed z-[55] flex flex-col overflow-hidden bg-surface text-heading shadow-[0_24px_70px_-20px_rgba(11,16,32,0.5)] ring-1 ring-line dark:bg-card",
          "inset-0 md:inset-auto md:bottom-24 md:right-5 md:h-[min(38rem,calc(100dvh-8rem))] md:w-[24rem] md:rounded-3xl",
        )}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-deep-700">
            <Image src="/images/logos/favico.png" alt="" width={26} height={26} className="h-6.5 w-6.5 object-contain" />
            <span
              aria-hidden
              className={cn(
                "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-surface dark:ring-card",
                agentsOnline ? "bg-emerald-500" : "bg-deep-400",
              )}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base leading-tight text-heading">
              {t.title}
            </h2>
            {agentsOnline !== null && (
              <p className="mt-0.5 truncate text-xs text-muted">{agentsOnline ? t.agentsOnline : t.agentsAway}</p>
            )}
          </div>
          {token && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-label={t.end}
                className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-card-soft hover:text-heading"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </button>
              {menu && (
                <div className="absolute right-0 top-11 z-10 w-48 rounded-2xl bg-surface p-1.5 shadow-[0_16px_40px_-12px_rgba(11,16,32,0.45)] ring-1 ring-line dark:bg-card">
                  <button
                    type="button"
                    onClick={endChat}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-red-600 hover:bg-surface-soft dark:hover:bg-white/[0.06]"
                  >
                    {t.end}
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            className="-mr-2 grid h-10 w-10 place-items-center rounded-full hover:bg-card-soft"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {token ? (
          <Conversation
            locale={locale}
            token={token}
            messages={messages}
            askRating={status === "closed" && hasAgentReply && !rated}
            onRated={() => setRated(true)}
            status={status}
            agentSeenAt={agentSeenAt}
            typing={typing}
            greeting={greeting}
            onSent={() => void load(token)}
            onTyping={notifyTyping}
          />
        ) : (
          <StartForm locale={locale} greeting={greeting} agentsOnline={agentsOnline} />
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Inicio: datos de contacto y primer mensaje                         */
/* ------------------------------------------------------------------ */

function StartForm({ locale, greeting, agentsOnline }: { locale: Locale; greeting: string; agentsOnline: boolean | null }) {
  const t = liveChatCopy[locale].widget;
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), email: useId(), phone: useId(), message: useId() };
  const field = cn(inputClass, "h-11 rounded-xl text-sm");

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!form.name.trim() || !form.message.trim() || (!email && !phone)) return setError(t.errors.required);
    if (email && !EMAIL_RE.test(email)) return setError(t.errors.email);
    setError(null);
    setBusy(true);
    const { data, error: rpcError } = await supabase().rpc("chat_start", {
      p: {
        name: form.name,
        email: email || null,
        phone: phone || null,
        message: form.message,
        website: form.website,
        page: window.location.pathname,
        locale,
        visitor_id: getVisitorId(),
      },
    });
    setBusy(false);
    if (rpcError || !data) {
      return setError(rpcError?.message.includes("rate_limited") ? t.errors.rate : t.errors.generic);
    }
    const token = (data as { token: string }).token;
    // Nadie conectado: respuesta automática con el horario de atención.
    if (agentsOnline === false) await supabase().rpc("chat_offline_notice", { p_token: token });
    trackContact("chat");
    saveToken(token);
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface-soft px-4 py-3 text-sm leading-relaxed text-body dark:bg-white/[0.06]">
          {greeting}
        </p>
        <div className="mt-5 grid gap-3">
          <div>
            <label htmlFor={ids.name} className="mb-1 block text-xs font-semibold text-muted">
              {t.name}
            </label>
            <input id={ids.name} data-autofocus value={form.name} onChange={set("name")} autoComplete="name" maxLength={120} className={field} />
          </div>
          <div>
            <label htmlFor={ids.email} className="mb-1 block text-xs font-semibold text-muted">
              {t.email}
            </label>
            <input id={ids.email} type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={200} className={field} />
          </div>
          <div>
            <label htmlFor={ids.phone} className="mb-1 block text-xs font-semibold text-muted">
              {t.phone}
            </label>
            <input id={ids.phone} type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" maxLength={40} className={field} />
          </div>
          <div>
            <label htmlFor={ids.message} className="mb-1 block text-xs font-semibold text-muted">
              {t.message}
            </label>
            <textarea
              id={ids.message}
              value={form.message}
              onChange={set("message")}
              rows={3}
              maxLength={2000}
              className={cn(inputClass, "h-auto resize-none rounded-xl py-2.5 text-sm leading-relaxed")}
            />
          </div>
          {/* Trampa para robots */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={set("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <p className="text-xs text-muted">{t.contactHint}</p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        {error && (
          <p role="alert" className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={buttonClasses("primary", "md", "w-full disabled:opacity-60")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.start}
        </button>
        <p className="mt-2.5 text-center text-[0.7rem] leading-relaxed text-muted">
          {t.consent}{" "}
          <Link href={`/${locale}/legal/privacidad`} className="font-semibold underline">
            {t.privacy}
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversación                                                       */
/* ------------------------------------------------------------------ */

function Conversation({
  locale,
  token,
  messages,
  askRating,
  onRated,
  status,
  agentSeenAt,
  typing,
  greeting,
  onSent,
  onTyping,
}: {
  locale: Locale;
  token: string;
  messages: Message[];
  askRating: boolean;
  onRated: () => void;
  status: "open" | "closed";
  agentSeenAt: string | null;
  typing: string | null;
  greeting: string;
  onSent: () => void;
  onTyping: () => void;
}) {
  const t = liveChatCopy[locale].widget;
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Bajar al último mensaje cuando llega algo nuevo.
  const last = messages.at(-1)?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last, typing]);

  const send = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const { error: rpcError } = await supabase().rpc("chat_send", { p_token: token, p_body: text });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message.includes("rate_limited") ? t.errors.rate : t.errors.generic);
      return;
    }
    setError(null);
    setBody("");
    onSent();
  };

  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  const lastVisitor = [...messages].reverse().find((m) => m.sender === "visitor");
  const seen = !!(lastVisitor && agentSeenAt && agentSeenAt >= lastVisitor.created_at);

  return (
    <>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
        <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface-soft px-4 py-3 text-sm leading-relaxed text-body dark:bg-white/[0.06]">
          {greeting}
        </p>
        <ol className="mt-4 grid gap-2">
          {messages.map((m, i) => {
            if (m.sender === "system") {
              return (
                <li key={m.id} className="py-2 text-center text-xs text-muted">
                  {t.system[m.body] ?? m.body}
                </li>
              );
            }
            const mine = m.sender === "visitor";
            const prev = messages[i - 1];
            const showName = !mine && (prev?.sender !== "agent" || prev.agent !== m.agent);
            return (
              <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {showName && <span className="mb-1 ml-1 text-xs font-semibold text-muted">{m.agent || t.someone}</span>}
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-md bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950"
                      : "rounded-bl-md bg-surface-soft text-heading dark:bg-white/[0.08]",
                  )}
                  title={time(m.created_at)}
                >
                  {m.body}
                </p>
                {mine && m.id === lastVisitor?.id && (
                  <span className="mr-1 mt-1 text-[0.7rem] text-muted">
                    {seen ? t.seen : t.sent} · {time(m.created_at)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {typing !== null && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span aria-hidden className="inline-flex gap-0.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-bounce"
                  style={{ animationDelay: `${d * 120}ms` }}
                />
              ))}
            </span>
            {t.typing.replace("{name}", typing || t.someone)}
          </p>
        )}
      </div>

      {askRating && <RatingPrompt locale={locale} token={token} onRated={onRated} />}

      {status === "closed" && (
        <p className="border-t border-line bg-surface-soft px-5 py-2.5 text-xs text-muted dark:bg-white/[0.04]">
          {t.closedBanner}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="border-t border-line px-4 py-3"
      >
        {error && (
          <p role="alert" className="mb-2 px-1 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t.placeholder}
          </label>
          <textarea
            id={inputId}
            data-autofocus
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={t.placeholder}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm leading-relaxed text-heading outline-none [field-sizing:content] focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            aria-label={t.send}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-deep-700 text-white transition-colors hover:bg-deep-600 disabled:opacity-40 dark:bg-brand-green dark:text-deep-950"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <SendHorizontal className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Calificación al cerrar                                             */
/* ------------------------------------------------------------------ */

function RatingPrompt({ locale, token, onRated }: { locale: Locale; token: string; onRated: () => void }) {
  const t = liveChatCopy[locale].widget.rating;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "skipped">("idle");

  if (state === "skipped") return null;
  if (state === "done") {
    return (
      <p role="status" className="border-t border-line px-5 py-4 text-center text-sm font-semibold text-heading">
        {t.thanks}
      </p>
    );
  }

  const submit = async () => {
    if (!rating) return;
    setState("busy");
    await supabase().rpc("chat_rate", { p_token: token, p_rating: rating, p_comment: comment || null });
    setState("done");
    window.setTimeout(onRated, 2500);
  };

  return (
    <div className="border-t border-line px-5 py-4">
      <p className="text-center text-sm font-bold text-heading">{t.title}</p>
      <div role="radiogroup" aria-label={t.title} className="mt-2 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t.stars.replace("{n}", String(n))}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-soft dark:hover:bg-white/[0.06]"
          >
            <Star className={cn("h-7 w-7 transition-colors", n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-line-strong")} aria-hidden />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <label className="sr-only" htmlFor="chat-rating-comment">
            {t.comment}
          </label>
          <textarea
            id="chat-rating-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t.comment}
            className="mt-3 w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-heading outline-none focus:border-deep-700 dark:bg-card"
          />
        </>
      )}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!rating || state === "busy"}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-deep-700 px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-brand-green dark:text-deep-950"
        >
          {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.send}
        </button>
        <button type="button" onClick={() => setState("skipped")} className="h-10 rounded-full px-3 text-sm font-semibold text-muted hover:text-heading">
          {t.skip}
        </button>
      </div>
    </div>
  );
}
