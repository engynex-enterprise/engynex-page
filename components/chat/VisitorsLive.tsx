"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Globe2, Loader2, MessageCircle, MessagesSquare, Radio } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { SITE_VISITORS_CHANNEL, VISITOR_INVITE_EVENT, type VisitorInvite, type VisitorPresence } from "@/lib/chatConfig";
import { chatReportsCopy } from "@/content/chatReports";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Row = VisitorPresence & { key: string };

/**
 * Quién está en el sitio ahora (presencia en tiempo real, sin guardar nada)
 * y botón para invitarlo a chatear: el widget le muestra la invitación.
 */
export function VisitorsLive({ locale, me }: { locale: Locale; me: string }) {
  const t = chatReportsCopy[locale].visitors;
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 15_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  // Observador: se suscribe a la presencia sin anunciarse.
  useEffect(() => {
    const channel = supabase.channel(SITE_VISITORS_CHANNEL);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<VisitorPresence>();
        setRows(
          Object.entries(state)
            .map(([key, list]) => ({ ...list[0], key }))
            .filter((v) => v.role === "visitor"),
        );
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRows((r) => r ?? []);
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const invite = (key: string) => {
    const payload: VisitorInvite = { key, agent: me };
    void channelRef.current?.send({ type: "broadcast", event: VISITOR_INVITE_EVENT, payload });
    setInvited((s) => new Set(s).add(key));
  };

  const since = (iso: string) => {
    if (now === null) return "—";
    const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s} s`;
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`;
  };
  const host = (url: string | null) => {
    if (!url) return t.direct;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  // Primero quien lleva más tiempo en el sitio.
  const sorted = [...(rows ?? [])].sort((a, b) => a.since.localeCompare(b.since));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-[var(--meta-active)] text-accent">
          <Radio className="h-[18px] w-[18px]" aria-hidden />
          {sorted.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />}
        </span>
        <div>
          <p className="font-semibold text-heading" aria-live="polite">
            {rows === null ? t.connecting : sorted.length === 1 ? t.countOne : t.count.replace("{n}", String(sorted.length))}
          </p>
          <p className="text-xs text-muted">{t.hint}</p>
        </div>
      </div>

      {rows === null ? (
        <Loader2 className="mx-auto my-16 h-5 w-5 animate-spin text-muted" aria-hidden />
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <Eye className="mx-auto h-8 w-8 text-line-strong" aria-hidden />
          <p className="mt-3 font-semibold text-heading">{t.empty}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
          <table className="w-full min-w-[48rem] text-left text-[0.92rem]">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="px-4 py-3 font-medium">{t.page}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.time}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.from}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t.invite}</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => {
                const sent = invited.has(v.key);
                return (
                  <tr key={v.key} className="border-b border-line last:border-0">
                    <td className="max-w-[26rem] px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-heading">{v.title || v.page}</span>
                        {v.chatting && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                            <MessagesSquare className="h-3 w-3" aria-hidden />
                            {t.chatting}
                            {v.name ? ` · ${v.name}` : ""}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-xs text-muted">
                        {v.page}
                        <span className="font-sans">· {t.lang[v.locale] ?? v.locale}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-body">{since(v.since)}</td>
                    <td className="max-w-[12rem] truncate px-3 py-3 text-body">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                        {host(v.referrer)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.chatting ? (
                        <a
                          href={`/${locale}/portal/chat`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
                        >
                          {t.openChat}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => invite(v.key)}
                          disabled={sent}
                          className={cn(
                            "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold transition-colors",
                            sent ? "text-muted" : "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green/40 hover:brightness-95",
                          )}
                        >
                          {sent ? <Check className="h-4 w-4" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
                          {sent ? t.invited : t.invite}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
