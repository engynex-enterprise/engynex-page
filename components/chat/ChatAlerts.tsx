"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessagesSquare, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/supabase/types";
import { AGENTS_CHANNEL, liveChatCopy } from "@/content/liveChat";
import { ding } from "@/lib/ding";
import type { Locale } from "@/i18n/config";

type Alert = { id: number; conversation: string; name: string; body: string };

/**
 * Para los asesores, en todo el portal:
 * - Los marca "en línea" (presencia) para que el visitante lo vea en el chat.
 * - Cuenta los mensajes sin leer (para el menú).
 * - Avisa cuando un visitante escribe: con sonido siempre (salvo si ya tiene
 *   abierta esa conversación) y con una tarjeta fuera de la bandeja.
 */
export function ChatAlerts({
  locale,
  userId,
  onUnread,
}: {
  locale: Locale;
  userId: string;
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

    const presence = supabase.channel(AGENTS_CHANNEL, { config: { presence: { key: userId } } });
    presence.subscribe((state) => {
      if (state === "SUBSCRIBED") void presence.track({ role: "agent" });
    });

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
          ding();
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
      void supabase.removeChannel(presence);
      void supabase.removeChannel(changes);
    };
  }, [userId, locale, t.visitor, t.newMessage]);

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
