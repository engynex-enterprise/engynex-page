"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessagesSquare, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatAgentRow, ChatAgentStatus, ChatMessage } from "@/lib/supabase/types";
import { AGENTS_CHANNEL, liveChatCopy } from "@/content/liveChat";
import type { AgentPresence } from "@/lib/chatConfig";
import { ding } from "@/lib/ding";
import type { Locale } from "@/i18n/config";

type Alert = { id: number; conversation: string; name: string; body: string };

/** Lo emite el menú "Mi estado" de la bandeja al cambiar estado o sonido. */
export const AGENT_STATUS_EVENT = "engynex-agent-status";
export type AgentStatusDetail = { status: ChatAgentStatus; sound: boolean };

/**
 * Para los asesores, en todo el portal:
 * - Los marca "en línea" (presencia, con su nombre y estado) para que el
 *   visitante lo vea en el chat, y envía un latido cada minuto: la asignación
 *   automática solo elige asesores conectados y disponibles.
 * - Cuenta los mensajes sin leer (para el menú).
 * - Avisa cuando un visitante escribe: con sonido siempre (salvo si ya tiene
 *   abierta esa conversación) y con una tarjeta fuera de la bandeja.
 */
export function ChatAlerts({
  locale,
  userId,
  name,
  onUnread,
}: {
  locale: Locale;
  userId: string;
  name: string;
  onUnread: (n: number) => void;
}) {
  const t = liveChatCopy[locale].inbox;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const onUnreadRef = useRef(onUnread);
  useEffect(() => {
    onUnreadRef.current = onUnread;
  });

  useEffect(() => {
    const supabase = createClient();

    const refreshUnread = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("unread_agent")
        .eq("status", "open")
        .gt("unread_agent", 0);
      onUnreadRef.current((data ?? []).reduce((n, c) => n + c.unread_agent, 0));
    };
    void refreshUnread();

    // Estado propio: lo trae el latido y lo cambia el menú "Mi estado".
    const me: AgentStatusDetail = { status: "available", sound: true };
    const firstName = name.split(/\s+/)[0] ?? "";
    const presence = supabase.channel(AGENTS_CHANNEL, { config: { presence: { key: userId } } });
    let subscribed = false;
    const track = () => {
      if (subscribed) void presence.track({ role: "agent", name: firstName, status: me.status } satisfies AgentPresence);
    };
    presence.subscribe((state) => {
      subscribed = state === "SUBSCRIBED";
      track();
    });
    const heartbeat = async () => {
      const { data } = await supabase.rpc("chat_agent_heartbeat");
      const row = data as ChatAgentRow | null;
      if (row && (row.status !== me.status || row.sound !== me.sound)) {
        me.status = row.status;
        me.sound = row.sound;
        track();
      }
    };
    void heartbeat();
    const beat = window.setInterval(() => void heartbeat(), 60_000);
    const onStatus = (event: Event) => {
      Object.assign(me, (event as CustomEvent<AgentStatusDetail>).detail);
      track();
    };
    window.addEventListener(AGENT_STATUS_EVENT, onStatus);

    const changes = supabase
      .channel("chat-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => void refreshUnread())
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: "sender=eq.visitor" },
        async (payload) => {
          const message = payload.new as ChatMessage;
          const params = new URLSearchParams(window.location.search);
          const inInbox = window.location.pathname.endsWith("/portal/chat");
          const viewing =
            inInbox && params.get("c") === message.conversation_id && document.visibilityState === "visible";
          if (viewing) return;
          if (me.sound) ding();
          const { data } = await supabase
            .from("chat_conversations")
            .select("name")
            .eq("id", message.conversation_id)
            .maybeSingle();
          const name = data?.name ?? t.visitor;
          // Notificación del sistema si la pestaña no está a la vista.
          if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
            const note = new Notification(t.newMessage.replace("{name}", name), {
              body: message.body.slice(0, 140),
              tag: message.conversation_id,
              icon: "/images/logos/favico.png",
            });
            note.onclick = () => {
              window.focus();
              window.location.assign(`/${locale}/portal/chat?c=${message.conversation_id}`);
            };
          }
          // En la bandeja ya se ve en la lista: basta el sonido.
          if (inInbox) return;
          setAlerts((list) =>
            [
              { id: message.id, conversation: message.conversation_id, name, body: message.body },
              ...list.filter((a) => a.conversation !== message.conversation_id),
            ].slice(0, 3),
          );
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(beat);
      window.removeEventListener(AGENT_STATUS_EVENT, onStatus);
      void supabase.removeChannel(presence);
      void supabase.removeChannel(changes);
    };
  }, [userId, name, locale, t.visitor, t.newMessage]);

  if (alerts.length === 0) return null;
  const dismiss = (conversation: string) => setAlerts((list) => list.filter((a) => a.conversation !== conversation));

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[70] grid w-[min(22rem,calc(100vw-2rem))] gap-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          role="status"
          className="flex items-start gap-3 rounded-lg bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(11,16,32,0.45)] shadow-meta dark:bg-card"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700 text-white dark:bg-brand-green dark:text-deep-950">
            <MessagesSquare className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-heading">{t.newMessage.replace("{name}", a.name)}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-body">{a.body}</p>
            <Link
              href={`/${locale}/portal/chat?c=${a.conversation}`}
              onClick={() => dismiss(a.conversation)}
              className="mt-1 inline-block text-sm font-semibold text-accent hover:underline"
            >
              {t.open}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.conversation)}
            aria-label="×"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-soft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
