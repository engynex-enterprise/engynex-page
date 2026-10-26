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
import { Bot, Loader2, MessagesSquare, MoreHorizontal, Paperclip, SendHorizontal, Star, X } from "lucide-react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatAttachment, Database, Json } from "@/lib/supabase/types";
import { getVisitorId } from "@/lib/visitor";
import { trackContact } from "@/lib/tracking";
import { AGENTS_CHANNEL, OPEN_CHAT_EVENT, liveChatCopy } from "@/content/liveChat";
import { chatWidgetCopy } from "@/content/chatWidget";
import { chatProCopy } from "@/content/chatPro";
import { serviceFromPath, serviceNames } from "@/content/serviceNames";
import {
  ATTACHMENT_ACCEPT,
  SITE_VISITORS_CHANNEL,
  VISITOR_INVITE_EVENT,
  inviteFor,
  pathExcluded,
  readableOn,
  type AgentPresence,
  type ChatTexts,
  type FieldMode,
  type PublicChatConfig,
  type VisitorInvite,
  type VisitorPresence,
} from "@/lib/chatConfig";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import { AttachmentView, uploadChatFile } from "./Attachment";
import { RichText } from "./RichText";
import type { Locale } from "@/i18n/config";
import { ding } from "@/lib/ding";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  sender: "visitor" | "agent" | "system" | "bot";
  body: string;
  attachment?: ChatAttachment | null;
  created_at: string;
  agent: string | null;
  /** Mensaje del bot escrito por la IA (piloto automático). */
  ai?: boolean;
};

type Fetched = {
  topic: string;
  name: string;
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
const EXIT_KEY = "engynex-chat-exit-shown";
const TAB_KEY = "engynex-chat-tab";

/** Color del acento (ajustes del portal) como estilo en línea; sin color, mandan las clases. */
type Accent = React.CSSProperties | undefined;
const accentStyle = (color: string | null | undefined): Accent =>
  color ? { backgroundColor: color, color: readableOn(color) } : undefined;

/** Identificador aleatorio de esta pestaña para la presencia (no es una cookie). */
let tabMemory: { key: string; since: string } | null = null;
function tabIdentity() {
  if (tabMemory) return tabMemory;
  try {
    const saved = sessionStorage.getItem(TAB_KEY);
    if (saved) return (tabMemory = JSON.parse(saved) as { key: string; since: string });
  } catch {
    // Sin almacenamiento: vale solo mientras la página esté abierta.
  }
  tabMemory = { key: crypto.randomUUID(), since: new Date().toISOString() };
  try {
    sessionStorage.setItem(TAB_KEY, JSON.stringify(tabMemory));
  } catch {
    // Igual que arriba.
  }
  return tabMemory;
}

/**
 * Avisa al servidor que hay un mensaje nuevo para que el asistente con IA
 * decida si responde (según el modo configurado). No bloquea la interfaz y
 * cualquier error se ignora: el chat funciona igual sin IA.
 */
function pingAutopilot(token: string) {
  void fetch("/api/chat/autopilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    keepalive: true,
  }).catch(() => null);
}

/** Botones de respuesta rápida: al tocar uno se usa su texto como mensaje. */
function QuickReplies({
  label,
  options,
  accent,
  disabled,
  onPick,
}: {
  label: string;
  options: string[];
  accent: Accent;
  disabled?: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          style={accent ? { borderColor: accent.backgroundColor, color: "inherit" } : undefined}
          className="rounded-full border border-deep-700/30 bg-surface px-3 py-1.5 text-left text-xs font-semibold text-heading transition-colors hover:bg-surface-soft disabled:opacity-50 dark:border-white/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

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
 * - Invitación según la página, al intentar salir o enviada por un asesor, y
 *   aviso en el título de la pestaña.
 * - Apariencia, campos, páginas e invitaciones vienen de los ajustes del portal
 *   (chat_public_config); adjuntos, respuestas del bot y formato ligero.
 * - Presencia anónima en el sitio para que los asesores vean quién navega.
 */
export function LiveChatWidget({ locale }: { locale: Locale }) {
  const t = liveChatCopy[locale].widget;
  const w = chatWidgetCopy[locale];
  const [open, setOpen] = useState(false);
  const token = useSyncExternalStore(subscribeToken, readToken, () => null);

  /* ---------------- Ajustes públicos ---------------- */

  const [config, setConfig] = useState<PublicChatConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void supabase()
      .rpc("chat_public_config", { p_locale: locale })
      .then(({ data }) => {
        if (!alive) return;
        if (data) setConfig(data as unknown as PublicChatConfig);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [locale]);

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
  const [inviteOverride, setInviteOverride] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentPresence[]>([]);
  const [convName, setConvName] = useState<string | null>(null);
  const pathname = usePathname();

  const hiddenHere = !!config && (!config.enabled || pathExcluded(pathname, config.exclude_paths ?? []));
  const active = loaded && !hiddenHere;
  const texts: ChatTexts = {
    title: config?.texts?.title || t.title,
    launcher: config?.texts?.launcher || t.launcher,
    greeting: config?.texts?.greeting || t.greeting,
    greeting_away: config?.texts?.greeting_away || t.greetingAway,
    invite: config?.texts?.invite || t.invite.default,
  };
  const accent = accentStyle(config?.color);
  const left = config?.position === "left";

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
    setConvName(result.name);
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

  const rule = config ? inviteFor(pathname, config.invites ?? []) : null;
  const inviteDelay = (rule?.delay ?? config?.invite_delay ?? 20) * 1000;
  useEffect(() => {
    if (!active || token || open) return;
    try {
      if (sessionStorage.getItem(INVITE_KEY)) return;
    } catch {
      return;
    }
    const id = window.setTimeout(() => setInvite(true), inviteDelay);
    return () => window.clearTimeout(id);
  }, [active, token, open, inviteDelay]);

  // Intención de salida (solo con mouse): una vez por sesión.
  const exitIntent = active && !!config?.exit_intent && !token && !open;
  useEffect(() => {
    if (!exitIntent || !window.matchMedia("(pointer: fine)").matches) return;
    const onOut = (event: MouseEvent) => {
      if (event.relatedTarget || event.clientY > 0) return;
      try {
        if (sessionStorage.getItem(EXIT_KEY)) return;
        sessionStorage.setItem(EXIT_KEY, "1");
      } catch {
        return;
      }
      setInvite(true);
    };
    document.addEventListener("mouseout", onOut);
    return () => document.removeEventListener("mouseout", onOut);
  }, [exitIntent]);

  /* ---------------- Presencia en el sitio e invitación de un asesor ---------------- */

  const live = useRef({ token, open, invite: texts.invite });
  useEffect(() => {
    live.current = { token, open, invite: texts.invite };
  });
  const visitorsRef = useRef<RealtimeChannel | null>(null);
  const presence = useCallback(
    (): VisitorPresence => ({
      role: "visitor",
      page: pathname,
      title: document.title.slice(0, 120),
      locale,
      referrer: (() => {
        try {
          return document.referrer ? new URL(document.referrer).hostname : null;
        } catch {
          return null;
        }
      })(),
      since: tabIdentity().since,
      chatting: !!token,
      name: token ? convName : null,
    }),
    [pathname, locale, token, convName],
  );
  const presenceRef = useRef(presence);
  useEffect(() => {
    presenceRef.current = presence;
  });

  useEffect(() => {
    if (!active) return;
    const { key } = tabIdentity();
    const channel = supabase()
      .channel(SITE_VISITORS_CHANNEL, { config: { presence: { key }, broadcast: { self: false } } })
      .on("broadcast", { event: VISITOR_INVITE_EVENT }, ({ payload }) => {
        const p = payload as Partial<VisitorInvite> | undefined;
        if (p?.key !== key || live.current.token || live.current.open) return;
        // Del mensaje solo se usa el nombre del asesor; el texto es el de los ajustes.
        const agent = String(p.agent ?? "").slice(0, 30).trim();
        setInviteOverride(agent ? `${agent} · ${live.current.invite}` : live.current.invite);
        setInvite(true);
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") void channel.track(presenceRef.current());
      });
    visitorsRef.current = channel;
    return () => {
      visitorsRef.current = null;
      void supabase().removeChannel(channel);
    };
  }, [active]);

  useEffect(() => {
    void visitorsRef.current?.track(presence());
  }, [presence]);

  const dismissInvite = () => {
    setInvite(false);
    setInviteOverride(null);
    try {
      sessionStorage.setItem(INVITE_KEY, "1");
    } catch {
      // Sin almacenamiento: puede volver a aparecer en otra página.
    }
  };
  const inviteText = inviteOverride ?? rule?.text ?? texts.invite;

  /* ---------------- Presencia de asesores (solo con el panel abierto) ---------------- */

  useEffect(() => {
    if (!open) return;
    const channel = supabase()
      .channel(AGENTS_CHANNEL)
      .on("presence", { event: "sync" }, () => {
        const here = Object.values(channel.presenceState<AgentPresence>())
          .map((list) => list[0])
          .filter((a): a is AgentPresence & { presence_ref: string } => !!a && a.status !== "away");
        setAgentsOnline(here.length > 0);
        setAgents(here);
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

  const away = config?.open_now === false || agentsOnline === false;
  // En una página de servicio, saludo que nombra el servicio (si está activo).
  const pageService = serviceFromPath(pathname);
  const pageGreeting =
    !away && pageService && config?.page_greeting
      ? config.page_greeting.replace(/\{servicio\}|\{service\}/g, serviceNames[pageService][locale])
      : null;
  const greeting = away ? texts.greeting_away : pageGreeting || texts.greeting;
  const quickReplies = config?.quick_replies ?? [];
  const aiEnabled = !!config?.ai?.enabled;
  const agentNames = [...new Set(agents.map((a) => a.name).filter(Boolean))].slice(0, 3);

  if (!loaded || (hiddenHere && !token)) return null;

  return (
    <>
      {/* -------- Invitación -------- */}
      {invite && !open && (
        <div
          role="status"
          className={cn(
            "fixed bottom-24 z-50 w-[min(19rem,calc(100vw-2.5rem))] rounded-3xl bg-surface p-4 pr-10 shadow-[0_18px_50px_-16px_rgba(11,16,32,0.55)] ring-1 ring-line motion-safe:animate-[fade-in_300ms_ease-out] dark:bg-card",
            left ? "left-5 rounded-bl-md" : "right-5 rounded-br-md",
          )}
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
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep-700" style={accent}>
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
        aria-label={unread ? `${texts.launcher} · ${t.unread.replace("{n}", String(unread))}` : texts.launcher}
        style={accent}
        className={cn(
          "fixed bottom-5 z-50 inline-flex h-14 items-center gap-2.5 rounded-full bg-deep-700 pl-4 pr-5 text-[0.95rem] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(11,16,32,0.6)] ring-1 ring-white/10 transition-[transform,background-color,filter] hover:bg-deep-600 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 dark:bg-brand-green dark:text-deep-950 dark:hover:bg-brand-green-dark",
          left ? "left-5" : "right-5",
          "max-sm:w-14 max-sm:justify-center max-sm:px-0",
          open && "max-md:hidden",
        )}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessagesSquare className="h-6 w-6" aria-hidden />}
        <span className="max-sm:sr-only">{texts.launcher}</span>
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
          "inset-0 md:inset-auto md:bottom-24 md:h-[min(38rem,calc(100dvh-8rem))] md:w-[24rem] md:rounded-3xl",
          left ? "md:left-5" : "md:right-5",
        )}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-deep-700" style={accent}>
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
              {texts.title}
            </h2>
            {agentsOnline !== null && (
              <p className="mt-0.5 truncate text-xs text-muted">{agentsOnline ? t.agentsOnline : t.agentsAway}</p>
            )}
          </div>
          {config?.show_agents !== false && agentNames.length > 0 && (
            <div className="flex -space-x-2" title={agentNames.join(", ")}>
              <span className="sr-only">{w.agentsHere.replace("{names}", agentNames.join(", "))}</span>
              {agentNames.map((name) => (
                <span
                  key={name}
                  aria-hidden
                  className="grid h-8 w-8 place-items-center rounded-full bg-card-soft text-[0.7rem] font-bold text-heading ring-2 ring-surface dark:bg-white/10 dark:ring-card"
                >
                  {initials(name)}
                </span>
              ))}
            </div>
          )}
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
            topic={topic}
            messages={messages}
            askRating={status === "closed" && hasAgentReply && !rated}
            onRated={() => setRated(true)}
            status={status}
            agentSeenAt={agentSeenAt}
            typing={typing}
            greeting={greeting}
            accent={accent}
            onSent={() => void load(token)}
            onTyping={notifyTyping}
            quickReplies={hasAgentReply ? [] : quickReplies}
            aiEnabled={aiEnabled}
          />
        ) : (
          <StartForm
            locale={locale}
            greeting={greeting}
            agentsOnline={agentsOnline}
            fields={config?.fields ?? null}
            accent={accent}
            quickReplies={quickReplies}
            aiEnabled={aiEnabled}
          />
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Inicio: datos de contacto y primer mensaje                         */
/* ------------------------------------------------------------------ */

/** Modos efectivos: siempre queda al menos un dato de contacto. */
function contactModes(fields: { email: FieldMode; phone: FieldMode } | null) {
  let email: FieldMode = fields?.email ?? "optional";
  let phone: FieldMode = fields?.phone ?? "optional";
  if (email === "hidden" && phone === "hidden") email = phone = "optional";
  if (email === "hidden") phone = "required";
  if (phone === "hidden") email = "required";
  return { email, phone };
}

function StartForm({
  locale,
  greeting,
  agentsOnline,
  fields,
  accent,
  quickReplies,
  aiEnabled,
}: {
  locale: Locale;
  greeting: string;
  agentsOnline: boolean | null;
  fields: { email: FieldMode; phone: FieldMode } | null;
  accent: Accent;
  quickReplies: string[];
  aiEnabled: boolean;
}) {
  const t = liveChatCopy[locale].widget;
  const w = chatWidgetCopy[locale];
  const modes = contactModes(fields);
  const eitherContact = modes.email === "optional" && modes.phone === "optional";
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { name: useId(), email: useId(), phone: useId(), message: useId() };
  const field = cn(inputClass, "h-11 rounded-xl text-sm");

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  const emailLabel = modes.email === "required" ? t.email : eitherContact ? t.email : w.emailOptional;
  const phoneLabel = modes.phone === "required" ? w.phoneRequired : eitherContact ? t.phone : w.phoneOptional;
  const hint = eitherContact ? t.contactHint : modes.phone === "hidden" ? w.contactEmail : modes.email === "hidden" ? w.contactPhone : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = modes.email === "hidden" ? "" : form.email.trim();
    const phone = modes.phone === "hidden" ? "" : form.phone.trim();
    if (!form.name.trim() || !form.message.trim() || (!email && !phone)) return setError(t.errors.required);
    if (modes.email === "required" && !email) return setError(w.errors.emailRequired);
    if (modes.phone === "required" && !phone) return setError(w.errors.phoneRequired);
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
      const msg = rpcError?.message ?? "";
      return setError(
        msg.includes("rate_limited")
          ? t.errors.rate
          : msg.includes("chat_disabled")
            ? w.errors.disabled
            : msg.includes("invalid")
              ? w.errors.invalid
              : t.errors.generic,
      );
    }
    const token = (data as { token: string }).token;
    // Nadie conectado: respuesta automática con el horario de atención.
    if (agentsOnline === false) await supabase().rpc("chat_offline_notice", { p_token: token });
    if (aiEnabled) pingAutopilot(token);
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
            <input id={ids.name} data-autofocus value={form.name} onChange={set("name")} autoComplete="name" maxLength={120} required className={field} />
          </div>
          {modes.email !== "hidden" && (
            <div>
              <label htmlFor={ids.email} className="mb-1 block text-xs font-semibold text-muted">
                {emailLabel}
              </label>
              <input
                id={ids.email}
                type="email"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                maxLength={200}
                required={modes.email === "required"}
                className={field}
              />
            </div>
          )}
          {modes.phone !== "hidden" && (
            <div>
              <label htmlFor={ids.phone} className="mb-1 block text-xs font-semibold text-muted">
                {phoneLabel}
              </label>
              <input
                id={ids.phone}
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
                maxLength={40}
                required={modes.phone === "required"}
                className={field}
              />
            </div>
          )}
          {quickReplies.length > 0 && (
            <QuickReplies
              label={w.quickReplies}
              options={quickReplies}
              accent={accent}
              onPick={(text) => setForm((f) => ({ ...f, message: text }))}
            />
          )}
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
              required
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
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        {error && (
          <p role="alert" className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} style={accent} className={buttonClasses("primary", "md", "w-full disabled:opacity-60")}>
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
  topic,
  messages,
  askRating,
  onRated,
  status,
  agentSeenAt,
  typing,
  greeting,
  accent,
  onSent,
  onTyping,
  quickReplies,
  aiEnabled,
}: {
  locale: Locale;
  token: string;
  topic: string | null;
  messages: Message[];
  askRating: boolean;
  onRated: () => void;
  status: "open" | "closed";
  agentSeenAt: string | null;
  typing: string | null;
  greeting: string;
  accent: Accent;
  onSent: () => void;
  onTyping: () => void;
  quickReplies: string[];
  aiEnabled: boolean;
}) {
  const t = liveChatCopy[locale].widget;
  const w = chatWidgetCopy[locale];
  const pro = chatProCopy[locale];
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  // Sobre la burbuja propia (color de los ajustes), ¿el adjunto va en claro u oscuro?
  const ownTone = accent ? (accent.color === "#ffffff" ? "dark" : "light") : "dark";

  // Bajar al último mensaje cuando llega algo nuevo.
  const last = messages.at(-1)?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last, typing]);

  const send = async (preset?: string) => {
    const text = (preset ?? body).trim();
    if (!text || busy) return;
    setBusy(true);
    const { error: rpcError } = await supabase().rpc("chat_send", { p_token: token, p_body: text });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message.includes("rate_limited") ? t.errors.rate : t.errors.generic);
      return;
    }
    setError(null);
    if (preset === undefined) setBody("");
    onSent();
    if (aiEnabled) pingAutopilot(token);
  };
  // Botones que aún no se han enviado (mientras ningún asesor responda).
  const sentTexts = new Set(messages.filter((m) => m.sender === "visitor").map((m) => m.body.trim()));
  const pendingQuick = status === "open" ? quickReplies.filter((q) => !sentTexts.has(q.trim())) : [];

  const attach = async (file: File) => {
    if (!topic) return;
    setUploading(true);
    setError(null);
    const result = await uploadChatFile(supabase(), topic, file);
    if ("error" in result) {
      setUploading(false);
      return setError(pro.attach.errors[result.error]);
    }
    const { error: rpcError } = await supabase().rpc("chat_send_file", {
      p_token: token,
      p: result.attachment as unknown as Json,
    });
    setUploading(false);
    if (rpcError) return setError(rpcError.message.includes("rate_limited") ? t.errors.rate : pro.attach.errors.upload);
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
                  {w.system[m.body] ?? t.system[m.body] ?? m.body}
                </li>
              );
            }
            const mine = m.sender === "visitor";
            const bot = m.sender === "bot";
            const prev = messages[i - 1];
            const showName = !mine && (prev?.sender !== m.sender || prev.agent !== m.agent);
            const onlyFile = !!m.attachment && m.body === `📎 ${m.attachment.name}`;
            return (
              <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {(showName || (bot && m.ai && !prev?.ai)) && (
                  <span className="mb-1 ml-1 flex items-center gap-1 text-xs font-semibold text-muted">
                    {bot && <Bot className="h-3.5 w-3.5" aria-hidden />}
                    {bot ? (m.ai ? w.aiBot : pro.bot) : m.agent || t.someone}
                  </span>
                )}
                <div
                  style={mine ? accent : undefined}
                  className={cn(
                    "grid max-w-[85%] gap-2 whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-md bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950"
                      : "rounded-bl-md bg-surface-soft text-heading dark:bg-white/[0.08]",
                    m.attachment && "p-2",
                  )}
                  title={time(m.created_at)}
                >
                  {m.attachment && <AttachmentView supabase={supabase()} attachment={m.attachment} tone={mine ? ownTone : "light"} />}
                  {!onlyFile && (
                    <p className={cn(m.attachment && "px-2 pb-1")}>
                      <RichText text={m.body} />
                    </p>
                  )}
                </div>
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
        {pendingQuick.length > 0 && (
          <div className="mt-4">
            <QuickReplies label={w.quickReplies} options={pendingQuick} accent={accent} disabled={busy} onPick={(text) => void send(text)} />
          </div>
        )}
      </div>

      {askRating && <RatingPrompt locale={locale} token={token} onRated={onRated} accent={accent} />}

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
          <input
            ref={fileRef}
            type="file"
            accept={ATTACHMENT_ACCEPT.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void attach(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !topic}
            aria-label={uploading ? pro.attach.uploading : w.attach}
            title={uploading ? pro.attach.uploading : w.attach}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-soft hover:text-heading disabled:opacity-40 dark:hover:bg-white/[0.06]"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Paperclip className="h-5 w-5" aria-hidden />}
          </button>
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
            style={accent}
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

function RatingPrompt({ locale, token, onRated, accent }: { locale: Locale; token: string; onRated: () => void; accent: Accent }) {
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
          style={accent}
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
