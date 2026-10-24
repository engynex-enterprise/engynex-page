"use client";

import { CheckCircle2, UserX, Video } from "lucide-react";
import { agendaProCopy } from "@/content/agendaPro";
import { agendaWorkspaceCopy } from "@/content/agendaWorkspace";
import { tierStyles } from "@/lib/tiers";
import { channelIcon, dayKey, fmtTime, kindDot, statusTone, type AgendaRow } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Reuniones agrupadas por día. Las que ya pasaron sin resultado muestran
 * "Realizada" y "No asistió" para cerrarlas en un clic (se abre el panel).
 */
export function AgendaListView({
  locale,
  items,
  names,
  now,
  descending,
  onOpen,
  onClose,
}: {
  locale: Locale;
  items: AgendaRow[];
  names: Record<string, string>;
  now: number;
  descending: boolean;
  onOpen: (id: string) => void;
  /** Cerrar desde la lista: abre el panel con el resultado preseleccionado. */
  onClose: (id: string, status: "done" | "no_show") => void;
}) {
  const t = agendaWorkspaceCopy[locale];
  const p = agendaProCopy[locale];
  const today = dayKey(now);
  const tomorrow = dayKey(now + 86_400_000);

  const sorted = [...items].sort((a, b) => (descending ? b.starts_at.localeCompare(a.starts_at) : a.starts_at.localeCompare(b.starts_at)));
  const groups = new Map<string, AgendaRow[]>();
  for (const item of sorted) {
    const key = dayKey(item.starts_at);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const dayLabel = (key: string) => {
    const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
    const prefix = key === today ? `${t.today} · ` : key === tomorrow ? `${t.tomorrow} · ` : "";
    return prefix + full.charAt(0).toUpperCase() + full.slice(1);
  };

  return (
    <div className="grid gap-6">
      {[...groups.entries()].map(([key, list]) => (
        <section key={key} aria-label={dayLabel(key)}>
          <h2 className={cn("mb-1 flex items-center gap-2 border-b border-line pb-2 text-[0.95rem] font-semibold", key === today ? "text-accent" : "text-heading")}>
            {dayLabel(key)}
            <span className="rounded-md bg-card-soft px-1.5 text-xs font-normal tabular-nums text-muted dark:bg-white/10">{list.length}</span>
          </h2>
          <ul>
            {list.map((a) => {
              const Icon = channelIcon[a.channel];
              const pending = a.status === "scheduled" && Date.parse(a.ends_at) < now;
              const live = a.status === "scheduled" && Date.parse(a.starts_at) - now < 15 * 60_000 && Date.parse(a.ends_at) > now;
              const host = a.host_id ? names[a.host_id] : null;
              return (
                <li key={a.id} className="flex min-h-[4rem] items-center gap-3 border-b border-line px-1 transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]">
                  <button type="button" onClick={() => onOpen(a.id)} className="flex min-w-0 flex-1 items-center gap-4 py-2.5 text-left">
                    <span className="w-24 shrink-0 tabular-nums">
                      <span className={cn("block text-[0.95rem] font-semibold", a.status === "cancelled" ? "text-muted line-through" : "text-heading")}>{fmtTime(locale, a.starts_at)}</span>
                      <span className="block text-xs text-muted">{fmtTime(locale, a.ends_at)}</span>
                    </span>
                    <span className={cn("h-9 w-1 shrink-0 rounded-full", kindDot[a.kind])} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        {a.lead && <span className={cn("h-2 w-2 shrink-0 rounded-full", tierStyles[a.lead.tier].dot)} aria-hidden />}
                        <span className="truncate font-medium text-heading">{a.lead?.name ?? "—"}</span>
                        {a.lead?.company && <span className="truncate text-sm text-muted max-md:hidden">· {a.lead.company}</span>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span>{p.kinds[a.kind]}</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon className="h-3 w-3" aria-hidden />
                          {p.channels[a.channel]}
                        </span>
                        {a.notes && <span className="max-w-[16rem] truncate">“{a.notes}”</span>}
                      </span>
                    </span>
                  </button>
                  {live && a.meeting_url ? (
                    <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-green px-3 text-sm font-semibold text-deep-950 hover:brightness-95">
                      <Video className="h-4 w-4" aria-hidden />
                      {t.join}
                    </a>
                  ) : pending ? (
                    <span className="flex gap-1.5">
                      <button type="button" onClick={() => onClose(a.id, "done")} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        {t.markDone}
                      </button>
                      <button type="button" onClick={() => onClose(a.id, "no_show")} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50 dark:text-amber-300 dark:ring-amber-500/30 dark:hover:bg-amber-500/10">
                        <UserX className="h-3.5 w-3.5" aria-hidden />
                        {t.markNoShow}
                      </button>
                    </span>
                  ) : (
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", statusTone[a.status].replace("line-through", ""))}>{p.statuses[a.status]}</span>
                  )}
                  <span
                    title={host ?? "—"}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deep-700/10 text-[0.65rem] font-bold text-deep-700 dark:bg-white/10 dark:text-white max-sm:hidden"
                  >
                    {host ? initials(host) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

