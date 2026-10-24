"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { chatReportsCopy } from "@/content/chatReports";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: "available" | "busy" | "away";
  max_chats: number;
  custom_max: boolean;
  last_seen_at: string | null;
  online: boolean;
  open_chats: number;
  waiting: number;
  today: number;
};

const ONLINE_MS = 3 * 60 * 1000;

/**
 * Supervisión del equipo de chat: quién está conectado, su estado, cuántos
 * chats lleva frente a su límite y cuántos esperan respuesta. En vivo.
 */
export function TeamBoard({
  locale,
  initial,
  unassigned: initialUnassigned,
  isAdmin,
}: {
  locale: Locale;
  initial: TeamMember[];
  unassigned: number;
  isAdmin: boolean;
}) {
  const t = chatReportsCopy[locale].team;
  const supabase = useMemo(() => createClient(), []);
  const [team, setTeam] = useState(initial);
  const [unassigned, setUnassigned] = useState(initialUnassigned);
  const [now, setNow] = useState<number | null>(null);

  // Reloj para "visto hace…" y para saber quién sigue conectado.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const refresh = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase.rpc("chat_team"),
        supabase.from("chat_conversations").select("id", { count: "exact", head: true }).eq("status", "open").is("assigned_to", null),
      ]);
      if (data) setTeam(data as unknown as TeamMember[]);
      setUnassigned(count ?? 0);
    };
    // Varios cambios seguidos → una sola recarga.
    const soon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 800);
    };
    const channel = supabase
      .channel("chat-team")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_agents" }, soon)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, soon)
      .subscribe();
    const poll = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const isOnline = (m: TeamMember) => (now === null ? m.online : !!m.last_seen_at && now - new Date(m.last_seen_at).getTime() < ONLINE_MS);
  const online = team.filter(isOnline);
  const available = online.filter((m) => m.status === "available");

  const relative = (iso: string) => {
    if (now === null) return "";
    const s = Math.round((new Date(iso).getTime() - now) / 1000);
    if (s > -60) return t.now;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (s > -3600) return rtf.format(Math.round(s / 60), "minute");
    if (s > -86400) return rtf.format(Math.round(s / 3600), "hour");
    return rtf.format(Math.round(s / 86400), "day");
  };

  const badge: Record<TeamMember["status"], string> = {
    available: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    busy: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    away: "bg-card-soft text-muted ring-line dark:bg-white/[0.06]",
  };

  if (team.length === 0) return <p className="py-16 text-center text-sm text-muted">{t.empty}</p>;

  return (
    <>
      <p className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="font-semibold text-heading">{t.online.replace("{n}", String(online.length))}</span>
        </span>
        <span>{t.available.replace("{n}", String(available.length))}</span>
        <Link href={`/${locale}/portal/chat`} className={cn("font-semibold hover:underline", unassigned > 0 ? "text-amber-700 dark:text-amber-300" : "text-muted")}>
          {t.unassigned.replace("{n}", String(unassigned))}
        </Link>
      </p>

      <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {team.map((m) => {
          const on = isOnline(m);
          const pct = Math.min(100, Math.round((m.open_chats / Math.max(1, m.max_chats)) * 100));
          return (
            <li key={m.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 dark:bg-card">
              <div className="flex items-center gap-3">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-deep-700/10 text-sm font-bold text-deep-700 dark:bg-white/10 dark:text-white">
                  {m.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                  <span
                    aria-hidden
                    className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface dark:ring-card", on ? "bg-emerald-500" : "bg-deep-300 dark:bg-deep-500")}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-heading">{m.name}</p>
                  <p className="truncate text-xs text-muted">
                    {t.roles[m.role] ?? m.role} · {on ? t.lastSeen.replace("{time}", t.now) : m.last_seen_at ? t.lastSeen.replace("{time}", relative(m.last_seen_at)) : t.never}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", on ? badge[m.status] : badge.away)}>
                  {on ? t.status[m.status] : t.offline}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">{t.openChats}</span>
                  <span className="font-semibold tabular-nums text-heading">{t.capacity.replace("{open}", String(m.open_chats)).replace("{max}", String(m.max_chats))}</span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-card-soft dark:bg-white/[0.08]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={m.max_chats}
                  aria-valuenow={m.open_chats}
                  aria-label={t.openChats}
                >
                  <div
                    className={cn("h-full rounded-full", pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-brand-green-dark dark:bg-brand-green")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-card-soft px-3 py-2 dark:bg-white/[0.05]">
                  <dt className="text-xs text-muted">{t.waiting}</dt>
                  <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", m.waiting > 0 ? "text-red-600 dark:text-red-400" : "text-heading")}>{m.waiting}</dd>
                </div>
                <div className="rounded-lg bg-card-soft px-3 py-2 dark:bg-white/[0.05]">
                  <dt className="text-xs text-muted">{t.today}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-heading">{m.today}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
                {isAdmin ? <MaxChats locale={locale} member={m} onSaved={(max, custom) => setTeam((list) => list.map((x) => (x.id === m.id ? { ...x, max_chats: max, custom_max: custom } : x)))} /> : <span />}
                <Link
                  href={`/${locale}/portal/chat?agent=${m.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden />
                  {t.seeChats}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Límite de chats simultáneos de un asesor (solo administradores). */
function MaxChats({ locale, member, onSaved }: { locale: Locale; member: TeamMember; onSaved: (max: number, custom: boolean) => void }) {
  const t = chatReportsCopy[locale].team;
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(member.custom_max ? String(member.max_chats) : "");
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const dirty = value !== (member.custom_max ? String(member.max_chats) : "");

  const save = async () => {
    const n = value.trim() === "" ? "" : String(Math.min(50, Math.max(1, Number(value) || 1)));
    setState("busy");
    const { error } = await supabase.rpc("chat_agent_set", { p: { max_chats: n }, p_profile: member.id });
    if (error) return setState("idle");
    // Sin valor propio: el límite general se ve al recargar el equipo.
    onSaved(n === "" ? member.max_chats : Number(n), n !== "");
    setValue(n);
    setState("saved");
    window.setTimeout(() => setState("idle"), 1500);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="flex items-end gap-2"
    >
      <label className="grid gap-1 text-xs text-muted" title={t.maxHint}>
        {t.max}
        <input
          type="number"
          min={1}
          max={50}
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t.maxDefault}
          className="h-9 w-36 rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
        />
      </label>
      {(dirty || state !== "idle") && (
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[var(--meta-active)] px-3 text-sm font-semibold text-accent ring-1 ring-brand-green/40 disabled:opacity-60"
        >
          {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : state === "saved" ? <Check className="h-4 w-4" aria-hidden /> : null}
          {state === "saved" ? t.saved : t.save}
        </button>
      )}
    </form>
  );
}
