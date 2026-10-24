"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Flame,
  Headset,
  ListChecks,
  MessagesSquare,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/supabase/types";
import { shellCopy, timeAgo } from "@/content/shell";
import { ding } from "@/lib/ding";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  lead: { icon: Flame, tone: "bg-emerald-500" },
  chat: { icon: MessagesSquare, tone: "bg-sky-500" },
  ticket: { icon: Headset, tone: "bg-violet-500" },
  task: { icon: ListChecks, tone: "bg-amber-500" },
  meeting: { icon: CalendarClock, tone: "bg-deep-600" },
  ai: { icon: Sparkles, tone: "bg-fuchsia-500" },
};

/**
 * Campana de la barra superior, como la de Meta Business Suite: lista en vivo
 * de avisos (los generan las automatizaciones), con no leídas y "marcar todo".
 */
export function NotificationsBell({ locale, userId }: { locale: Locale; userId: string }) {
  const t = shellCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setItems(data ?? []));
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        setItems((list) => [payload.new as AppNotification, ...list].slice(0, 50));
        ding();
      })
      .subscribe();
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearInterval(tick);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read_at).length;
  const visible = tab === "unread" ? items.filter((n) => !n.read_at) : items;

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read_at) {
      const readAt = new Date().toISOString();
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: readAt } : x)));
      await supabase.from("notifications").update({ read_at: readAt }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    const readAt = new Date().toISOString();
    setItems((list) => list.map((x) => ({ ...x, read_at: x.read_at ?? readAt })));
    await supabase.rpc("notifications_mark_all_read");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setNow(Date.now());
        }}
        aria-expanded={open}
        aria-label={unread ? `${t.notifications.open} (${unread})` : t.notifications.open}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full bg-card-soft text-heading transition-colors hover:brightness-95",
          open && "bg-[var(--meta-active)] text-accent",
        )}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[0.7rem] font-bold text-white ring-2 ring-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t.notifications.title}
          className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg bg-surface shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:bg-card"
        >
          <div className="flex items-center justify-between px-4 pb-1 pt-4">
            <h2 className="text-xl font-bold text-heading">{t.notifications.title}</h2>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="rounded-md px-2 py-1 text-sm font-semibold text-accent hover:bg-[var(--meta-hover)]">
                {t.notifications.markAll}
              </button>
            )}
          </div>
          <div role="tablist" className="flex gap-1 px-4 py-2">
            {(["all", "unread"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm font-semibold",
                  tab === k ? "bg-[var(--meta-active)] text-accent" : "text-heading hover:bg-[var(--meta-hover)]",
                )}
              >
                {t.notifications[k]}
              </button>
            ))}
          </div>
          <ul className="max-h-[min(30rem,70dvh)] overflow-y-auto px-2 pb-2">
            {visible.length === 0 && (
              <li className="px-3 py-10 text-center text-sm text-muted">{tab === "unread" ? t.notifications.emptyUnread : t.notifications.empty}</li>
            )}
            {visible.map((n) => {
              const meta = ICONS[n.kind] ?? { icon: Zap, tone: "bg-deep-500" };
              const Icon = meta.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-[var(--meta-hover)]"
                  >
                    <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full text-white", meta.tone)}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm leading-snug text-heading", !n.read_at && "font-semibold")}>{n.title}</span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-[0.8rem] text-muted">{n.body}</span>}
                      <span className={cn("mt-0.5 block text-xs", n.read_at ? "text-muted" : "font-semibold text-accent")}>
                        {timeAgo(t, n.created_at, now)}
                      </span>
                    </span>
                    {!n.read_at && <span aria-hidden className="mt-4 h-3 w-3 shrink-0 rounded-full bg-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
