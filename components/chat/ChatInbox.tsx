"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing, Check, Keyboard, ListFilter, Search, Star, Volume2, VolumeX, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatAgentStatus, ChatChannel, ChatConversation, ChatSavedReply } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { chatProCopy } from "@/content/chatPro";
import { Select } from "@/components/ui/Select";
import { ChatThread } from "./ChatThread";
import { ChannelBadge } from "./ChannelBadge";
import { SELECT_CHAT_EVENT } from "./ChatContext";
import { AGENT_STATUS_EVENT, type AgentStatusDetail } from "./ChatAlerts";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { FloatingPanel } from "@/components/ui/FloatingPanel";

export type InboxConversation = Omit<ChatConversation, "token_hash">;
type Filter = "open" | "mine" | "unassigned" | "closed";

/** Atajo de teclado que la bandeja reenvía a la conversación abierta. */
export const CHAT_SHORTCUT_EVENT = "engynex-chat-shortcut";
export type ChatShortcut = "reply" | "note" | "toggle" | "assign";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export const statusDot: Record<ChatAgentStatus, string> = {
  available: "bg-emerald-500",
  busy: "bg-amber-500",
  away: "bg-zinc-400",
};

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
const menu = "rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const menuItem = "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-heading hover:bg-[var(--meta-hover)]";

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

/* ---------------- Mi estado (disponible / ocupado / ausente) ---------------- */

function AgentStatusMenu({ locale, initial, onShortcuts }: { locale: Locale; initial: AgentStatusDetail; onShortcuts: () => void }) {
  const t = liveChatCopy[locale].inbox;
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState(initial);
  const [open, setOpen] = useState(false);
  const notify = useSyncExternalStore(subscribeNotify, readNotify, () => "unsupported" as NotifyState);

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const save = (patch: Partial<AgentStatusDetail>) => {
    const next = { ...me, ...patch };
    setMe(next);
    window.dispatchEvent(new CustomEvent<AgentStatusDetail>(AGENT_STATUS_EVENT, { detail: next }));
    void supabase.rpc("chat_agent_set", { p: patch }).then();
  };

  const NotifyIcon = notify === "granted" ? BellRing : notify === "denied" ? BellOff : Bell;
  return (
    <div className="relative" data-status-menu>
      <button
        type="button"
        onClick={(e) => {
          setAnchor(e.currentTarget);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`${t.status.label}: ${t.status[me.status]}`}
        className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
      >
        <span className={cn("h-2.5 w-2.5 rounded-full", statusDot[me.status])} aria-hidden />
        <span className="hidden sm:inline">{t.status[me.status]}</span>
      </button>
      {open && (
        <FloatingPanel anchor={anchor} open onClose={() => setOpen(false)} role="menu" className={cn(menu, "w-72")}>
          <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted">{t.status.label}</p>
          {(["available", "busy", "away"] as const).map((s) => (
            <button key={s} type="button" onClick={() => save({ status: s })} className={menuItem}>
              <span className={cn("h-2.5 w-2.5 rounded-full", statusDot[s])} aria-hidden />
              <span className="flex-1">{t.status[s]}</span>
              {me.status === s && <Check className="h-4 w-4 text-accent" aria-hidden />}
            </button>
          ))}
          <p className="px-2.5 py-1.5 text-xs text-muted">{t.status.hint}</p>
          <div className="my-1 border-t border-line" />
          <button type="button" onClick={() => save({ sound: !me.sound })} className={menuItem} role="menuitemcheckbox" aria-checked={me.sound}>
            {me.sound ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4 text-muted" aria-hidden />}
            <span className="flex-1">{t.status.sound}</span>
            {me.sound && <Check className="h-4 w-4 text-accent" aria-hidden />}
          </button>
          {notify !== "unsupported" && (
            <button
              type="button"
              disabled={notify !== "default"}
              onClick={async () => {
                await Notification.requestPermission();
                window.dispatchEvent(new Event(NOTIFY_EVENT));
              }}
              className={cn(menuItem, "disabled:cursor-default disabled:hover:bg-transparent")}
            >
              <NotifyIcon className={cn("h-4 w-4", notify === "granted" ? "text-emerald-600" : "text-muted")} aria-hidden />
              <span className="flex-1">
                {notify === "granted" ? t.notifications.enabled : notify === "denied" ? t.notifications.blocked : t.notifications.enable}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onShortcuts();
            }}
            className={menuItem}
          >
            <Keyboard className="h-4 w-4" aria-hidden />
            <span className="flex-1">{t.shortcuts.open}</span>
            <kbd className="rounded bg-card-soft px-1.5 font-mono text-xs text-muted dark:bg-white/10">?</kbd>
          </button>
        </FloatingPanel>
      )}
    </div>
  );
}

/* ---------------- Atajos ---------------- */

function ShortcutsDialog({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = liveChatCopy[locale].inbox.shortcuts;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-heading">{t.title}</h2>
          <button type="button" onClick={onClose} aria-label={t.close} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <dl className="grid gap-2">
          {t.items.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-body">{label}</dt>
              <dd>
                <kbd className="rounded-md bg-card-soft px-2 py-0.5 font-mono text-xs font-semibold text-heading ring-1 ring-line dark:bg-white/10">{key}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

const typingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  return !!node && (node.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
};

/**
 * Bandeja del chat en vivo: lista (pestañas, filtros por canal, asesor y
 * etiqueta, búsqueda), la conversación y su contexto. Todo en tiempo real.
 * Atajos de teclado y "Mi estado" (la asignación automática lo respeta).
 */
export function ChatInbox({
  locale,
  initial,
  employees,
  me,
  initialSelected,
  initialAgent,
  savedReplies,
  myStatus,
}: {
  locale: Locale;
  initial: InboxConversation[];
  employees: { id: string; name: string }[];
  me: { id: string; name: string };
  initialSelected: string | null;
  initialAgent: string | null;
  savedReplies: ChatSavedReply[];
  myStatus: AgentStatusDetail;
}) {
  const t = liveChatCopy[locale].inbox;
  const pro = chatProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState(initial);
  const [filter, setFilter] = useState<Filter>("open");
  const [tag, setTag] = useState("");
  const [channel, setChannel] = useState<"" | ChatChannel>("");
  const [agent, setAgent] = useState(initialAgent ?? "");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null);
  const [help, setHelp] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("c", id);
    else url.searchParams.delete("c");
    window.history.replaceState(null, "", url);
  }, []);

  // Abrir otra conversación desde el panel de contexto.
  useEffect(() => {
    const onSelect = (event: Event) => {
      setFilter("open");
      select((event as CustomEvent<string>).detail);
    };
    window.addEventListener(SELECT_CHAT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_CHAT_EVENT, onSelect);
  }, [select]);

  // Lista en vivo.
  useEffect(() => {
    const live = supabase
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
      void supabase.removeChannel(live);
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
      .filter((c) => !channel || c.channel === channel)
      .filter((c) => !agent || c.assigned_to === agent)
      .filter((c) => !q || [c.name, c.email, c.phone, c.last_message].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  }, [conversations, filter, tag, channel, agent, query, me.id]);

  const counts = useMemo(
    () => ({
      open: conversations.filter((c) => c.status === "open").length,
      mine: conversations.filter((c) => c.status === "open" && c.assigned_to === me.id).length,
      unassigned: conversations.filter((c) => c.status === "open" && !c.assigned_to).length,
      closed: conversations.filter((c) => c.status === "closed").length,
    }),
    [conversations, me.id],
  );

  // Atajos: J/K para moverse; R, N, E y A los atiende la conversación abierta.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (typingTarget(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement).blur();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        setHelp((v) => !v);
        return;
      }
      if (key === "j" || key === "k") {
        event.preventDefault();
        const i = visible.findIndex((c) => c.id === selectedId);
        const next = key === "j" ? Math.min(i + 1, visible.length - 1) : Math.max(i - 1, 0);
        if (visible[next]) select(visible[next].id);
        return;
      }
      const map: Record<string, ChatShortcut> = { r: "reply", n: "note", e: "toggle", a: "assign" };
      if (map[key] && selectedId) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent<ChatShortcut>(CHAT_SHORTCUT_EVENT, { detail: map[key] }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, selectedId, select]);


  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const activeFilters = [tag, channel, agent].filter(Boolean).length;

  const ago = (iso: string) => {
    const date = new Date(iso);
    const sameDay = date.toDateString() === new Date(now).toDateString();
    return new Intl.DateTimeFormat(locale, sameDay ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
  };
  const waited = (iso: string) => {
    const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
    return m < 60 ? t.duration.m.replace("{n}", String(m)) : t.duration.h.replace("{n}", (m / 60).toFixed(m < 600 ? 1 : 0));
  };

  return (
    <>
      <div className="grid h-[calc(100dvh-15.5rem)] min-h-[34rem] overflow-hidden border-b border-line md:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)_19rem] 2xl:grid-cols-[24rem_minmax(0,1fr)_21rem]">
        {/* ---------------- Lista ---------------- */}
        <section className={cn("flex min-h-0 flex-col border-line md:border-r", selected && "max-md:hidden")}>
          <div className="grid gap-3 px-4 pb-2 pt-4">
            <div className="flex items-center gap-2">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">{t.search}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                  className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
                />
              </label>
              <div className="relative" data-filters>
                <button
                  type="button"
                  onClick={(e) => {
                    setFiltersAnchor(e.currentTarget);
                    setFiltersOpen((v) => !v);
                  }}
                  aria-label={t.more.filter}
                  aria-expanded={filtersOpen}
                  className={cn(iconBtn, "relative", activeFilters > 0 && "bg-[var(--meta-active)] text-accent")}
                >
                  <ListFilter className="h-[18px] w-[18px]" aria-hidden />
                  {activeFilters > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
                </button>
                {filtersOpen && (
                  <FloatingPanel anchor={filtersAnchor} open onClose={() => setFiltersOpen(false)} className={cn(menu, "grid w-72 gap-3 p-3")}>
                    <Select
                      size="md"
                      label={t.more.channel}
                      value={channel}
                      onChange={(v) => setChannel(v as "" | ChatChannel)}
                      options={[
                        { value: "", label: t.more.allChannels },
                        ...(["web", "whatsapp", "messenger", "instagram"] as const).map((c) => ({ value: c, label: pro.channels[c] })),
                      ]}
                    />
                    <Select
                      size="md"
                      label={t.more.agent}
                      value={agent}
                      onChange={setAgent}
                      options={[{ value: "", label: t.more.allAgents }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
                    />
                    <Select
                      size="md"
                      label={t.tags}
                      value={tag}
                      onChange={setTag}
                      options={[{ value: "", label: t.allTags }, ...allTags.map((x) => ({ value: x, label: `#${x}` }))]}
                    />
                    {activeFilters > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTag("");
                          setChannel("");
                          setAgent("");
                        }}
                        className="text-left text-sm font-semibold text-accent hover:underline"
                      >
                        {t.more.clear}
                      </button>
                    )}
                  </FloatingPanel>
                )}
              </div>
              <AgentStatusMenu locale={locale} initial={myStatus} onShortcuts={() => setHelp(true)} />
            </div>
            <div role="tablist" aria-label={t.title} className="-mx-4 flex gap-0.5 overflow-x-auto border-b border-line px-3">
              {(Object.keys(t.filters) as Filter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-2 py-2.5 text-sm transition-colors",
                    filter === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
                  )}
                >
                  {t.filters[key]}
                  {counts[key] > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[key]}</span>}
                </button>
              ))}
            </div>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {visible.length === 0 && <li className="px-3 py-14 text-center text-sm text-muted">{t.empty}</li>}
            {visible.map((c) => {
              const unread = c.unread_agent > 0;
              const waiting = c.status === "open" && !c.first_response_at;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(c.id)}
                    aria-current={c.id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      c.id === selectedId ? "bg-[var(--meta-active)]" : "hover:bg-[var(--meta-hover)]",
                    )}
                  >
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700/10 text-xs font-bold text-deep-700 dark:bg-white/10 dark:text-white">
                      {initialsOf(c.name)}
                      <ChannelBadge channel={c.channel} className="absolute -bottom-0.5 -right-0.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-[0.94rem] text-heading", unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                        <span className={cn("shrink-0 text-xs", unread ? "font-semibold text-accent" : "text-muted")}>{ago(c.last_message_at)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-[0.82rem]", unread ? "text-heading" : "text-muted")}>{c.last_message ?? ""}</span>
                        {unread && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-green-dark px-1.5 text-[0.7rem] font-bold text-white dark:bg-brand-green dark:text-deep-950">
                            {c.unread_agent}
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1 text-[0.72rem] text-muted">
                        <span className="max-w-[9rem] truncate">{c.assigned_to ? names[c.assigned_to] ?? "—" : t.unassigned}</span>
                        {waiting && (
                          <span className="rounded-md bg-amber-100 px-1.5 font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                            {t.waiting.replace("{time}", waited(c.created_at))}
                          </span>
                        )}
                        {c.rating && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-heading">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                            {c.rating}
                          </span>
                        )}
                        {(c.tags ?? []).slice(0, 2).map((x) => (
                          <span key={x} className="rounded-md bg-card-soft px-1.5 dark:bg-white/[0.08]">#{x}</span>
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
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
          <div className="hidden place-items-center p-8 text-center text-sm text-muted md:grid xl:col-span-2">
            <div>
              <p>{t.pick}</p>
              <p className="mt-2 text-xs">
                <kbd className="rounded-md bg-card-soft px-1.5 py-0.5 font-mono ring-1 ring-line dark:bg-white/10">J</kbd> /{" "}
                <kbd className="rounded-md bg-card-soft px-1.5 py-0.5 font-mono ring-1 ring-line dark:bg-white/10">K</kbd> · {t.shortcuts.items[0][1]}
              </p>
            </div>
          </div>
        )}
      </div>
      {help && <ShortcutsDialog locale={locale} onClose={() => setHelp(false)} />}
    </>
  );
}
