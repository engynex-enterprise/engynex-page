"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, Search, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatConversation, ChatSavedReply } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { WhatsappIcon } from "@/components/SocialIcons";
import { Select } from "@/components/ui/Select";
import { ChatThread } from "./ChatThread";
import { SELECT_CHAT_EVENT } from "./ChatContext";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type InboxConversation = Omit<ChatConversation, "token_hash">;
type Filter = "open" | "mine" | "unassigned" | "closed";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/* ---------------- Permiso de notificaciones de escritorio ---------------- */

type NotifyState = "default" | "granted" | "denied" | "unsupported";
const NOTIFY_EVENT = "engynex-notify-permission";
function readNotify(): NotifyState {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}
function subscribeNotify(cb: () => void) {
  window.addEventListener(NOTIFY_EVENT, cb);
  return () => window.removeEventListener(NOTIFY_EVENT, cb);
}

function NotifyButton({ locale }: { locale: Locale }) {
  const t = liveChatCopy[locale].inbox.notifications;
  const state = useSyncExternalStore(subscribeNotify, readNotify, () => "unsupported" as NotifyState);
  if (state === "unsupported") return null;
  const Icon = state === "granted" ? BellRing : state === "denied" ? BellOff : Bell;
  return (
    <button
      type="button"
      disabled={state !== "default"}
      onClick={async () => {
        await Notification.requestPermission();
        window.dispatchEvent(new Event(NOTIFY_EVENT));
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1",
        state === "granted" ? "text-emerald-700 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-500/30" : "text-heading ring-line-strong hover:bg-surface-soft",
        state === "denied" && "text-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {state === "granted" ? t.enabled : state === "denied" ? t.blocked : t.enable}
    </button>
  );
}

/**
 * Bandeja del chat en vivo: lista (filtros, etiquetas, búsqueda), la
 * conversación y su contexto. Todo en tiempo real; quien responde primero
 * queda asignado.
 */
export function ChatInbox({
  locale,
  initial,
  employees,
  me,
  initialSelected,
  savedReplies,
}: {
  locale: Locale;
  initial: InboxConversation[];
  employees: { id: string; name: string }[];
  me: { id: string; name: string };
  initialSelected: string | null;
  savedReplies: ChatSavedReply[];
}) {
  const t = liveChatCopy[locale].inbox;
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState(initial);
  const [filter, setFilter] = useState<Filter>("open");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);

  const select = (id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("c", id);
    else url.searchParams.delete("c");
    window.history.replaceState(null, "", url);
  };

  // Abrir otra conversación desde el panel de contexto.
  useEffect(() => {
    const onSelect = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      setSelectedId(id);
      setFilter("open");
      const url = new URL(window.location.href);
      url.searchParams.set("c", id);
      window.history.replaceState(null, "", url);
    };
    window.addEventListener(SELECT_CHAT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_CHAT_EVENT, onSelect);
  }, []);

  // Lista en vivo.
  useEffect(() => {
    const channel = supabase
      .channel("chat-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setConversations((list) => list.filter((c) => c.id !== old.id));
          return;
        }
        const { token_hash: _hash, ...row } = payload.new as ChatConversation;
        void _hash;
        setConversations((list) => [row, ...list.filter((c) => c.id !== row.id)]);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const allTags = useMemo(
    () => [...new Set([...t.predefinedTags, ...conversations.flatMap((c) => c.tags ?? [])])].sort(),
    [conversations, t.predefinedTags],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => {
        if (filter === "closed") return c.status === "closed";
        if (c.status !== "open") return false;
        if (filter === "mine") return c.assigned_to === me.id;
        if (filter === "unassigned") return !c.assigned_to;
        return true;
      })
      .filter((c) => !tag || (c.tags ?? []).includes(tag))
      .filter((c) => !q || [c.name, c.email, c.phone, c.last_message].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  }, [conversations, filter, tag, query, me.id]);

  const counts = useMemo(
    () => ({
      open: conversations.filter((c) => c.status === "open").length,
      mine: conversations.filter((c) => c.status === "open" && c.assigned_to === me.id).length,
      unassigned: conversations.filter((c) => c.status === "open" && !c.assigned_to).length,
      closed: conversations.filter((c) => c.status === "closed").length,
    }),
    [conversations, me.id],
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  const ago = (iso: string) => {
    const date = new Date(iso);
    const sameDay = date.toDateString() === new Date().toDateString();
    return new Intl.DateTimeFormat(locale, sameDay ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <NotifyButton locale={locale} />
        <Link
          href={`/${locale}/portal/chat/respuestas`}
          className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft"
        >
          {t.saved.title}
        </Link>
      </div>
      <div className="grid h-[calc(100dvh-12rem)] min-h-[34rem] overflow-hidden rounded-3xl bg-surface ring-1 ring-line md:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_19rem] dark:bg-card">
        {/* ---------------- Lista ---------------- */}
        <section className={cn("flex min-h-0 flex-col border-line md:border-r", selected && "max-md:hidden")}>
          <div className="grid gap-3 border-b border-line p-4">
            <label className="relative block">
              <span className="sr-only">{t.search}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="h-10 w-full rounded-full bg-surface-soft pl-10 pr-4 text-sm text-heading outline-none ring-1 ring-transparent focus:ring-deep-700/30 dark:bg-white/[0.06]"
              />
            </label>
            <div role="tablist" aria-label={t.title} className="-mx-1 flex gap-1 overflow-x-auto px-1">
              {(Object.keys(t.filters) as Filter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors",
                    filter === key ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading hover:bg-surface-soft dark:hover:bg-white/10",
                  )}
                >
                  {t.filters[key]}
                  <span className="tabular-nums opacity-70">{counts[key]}</span>
                </button>
              ))}
            </div>
            <Select
              size="sm"
              label={t.tags}
              value={tag}
              onChange={setTag}
              options={[{ value: "", label: t.allTags }, ...allTags.map((x) => ({ value: x, label: `#${x}` }))]}
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {visible.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">{t.empty}</li>}
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c.id)}
                  aria-current={c.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    c.id === selectedId ? "bg-surface-soft dark:bg-white/[0.08]" : "hover:bg-surface-soft/70 dark:hover:bg-white/[0.04]",
                  )}
                >
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700/10 text-xs font-bold text-deep-700 dark:bg-white/10 dark:text-white">
                    {initialsOf(c.name)}
                    {c.channel === "whatsapp" && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-[#25D366] text-deep-950 ring-2 ring-surface dark:ring-card">
                        <WhatsappIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-sm text-heading", c.unread_agent > 0 ? "font-bold" : "font-semibold")}>{c.name}</span>
                      <span className="shrink-0 text-[0.7rem] text-muted">{ago(c.last_message_at)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-xs", c.unread_agent > 0 ? "font-semibold text-heading" : "text-muted")}>
                        {c.last_message ?? ""}
                      </span>
                      {c.unread_agent > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[0.7rem] font-bold text-white">{c.unread_agent}</span>
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1 text-[0.7rem] text-muted">
                      <span className="truncate">{c.assigned_to ? names[c.assigned_to] ?? "—" : t.unassigned}</span>
                      {!c.first_response_at && c.status === "open" && (
                        <span className="rounded-full bg-amber-100 px-1.5 font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{t.stats.unanswered}</span>
                      )}
                      {c.rating && (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-heading">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                          {c.rating}
                        </span>
                      )}
                      {(c.tags ?? []).slice(0, 2).map((x) => (
                        <span key={x} className="rounded-full bg-surface-soft px-1.5 dark:bg-white/[0.08]">#{x}</span>
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Conversación + contexto ---------------- */}
        {selected ? (
          <ChatThread
            key={selected.id}
            locale={locale}
            conversation={selected}
            employees={employees}
            me={me}
            allTags={allTags}
            savedReplies={savedReplies}
            onBack={() => select(null)}
          />
        ) : (
          <div className="hidden place-items-center p-8 text-center text-sm text-muted md:grid xl:col-span-2">{t.pick}</div>
        )}
      </div>
    </>
  );
}
