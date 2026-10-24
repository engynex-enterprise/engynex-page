"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Appointment, AppointmentStatus } from "@/lib/supabase/types";
import { crmCopy } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type AgendaRow = Appointment & {
  lead: { id: string; name: string; phone: string; email: string } | null;
};

const statusTone: Record<AppointmentStatus, string> = {
  scheduled: "bg-accent-soft text-heading",
  done: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  no_show: "bg-amber-400/15 text-amber-700 dark:text-amber-300",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

/** Reuniones agrupadas por día, con acciones para cerrar cada una. */
export function AgendaList({
  locale,
  upcoming,
  past,
}: {
  locale: Locale;
  upcoming: AgendaRow[];
  past: AgendaRow[];
}) {
  const t = crmCopy[locale].agenda;
  const channels = leadFormCopy[locale].booking.channels;
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [rows, setRows] = useState({ upcoming, past });
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (row: AgendaRow, status: AppointmentStatus) => {
    setBusy(row.id);
    const { error } = await createClient().from("appointments").update({ status }).eq("id", row.id);
    setBusy(null);
    if (error) return;
    setRows((r) => ({
      upcoming: r.upcoming.map((x) => (x.id === row.id ? { ...x, status } : x)),
      past: r.past.map((x) => (x.id === row.id ? { ...x, status } : x)),
    }));
  };

  const list = rows[tab];
  const groups = new Map<string, AgendaRow[]>();
  for (const row of list) {
    const key = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Bogota",
    }).format(new Date(row.starts_at));
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <div>
      <div role="tablist" aria-label={t.title} className="mb-6 flex gap-1.5">
        {(["upcoming", "past"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
              tab === k ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface",
            )}
          >
            {t[k]} <span className="opacity-70">· {rows[k].length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center text-sm text-muted shadow-meta dark:bg-card">{t.empty}</p>
      ) : (
        <div className="grid gap-6">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm text-heading first-letter:uppercase">{day}</h2>
              <ul className="grid gap-3">
                {items.map((row) => (
                  <li key={row.id} className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-meta sm:flex-row sm:items-center dark:bg-card">
                    <div className="w-20 shrink-0">
                      <p className="text-xl font-bold tabular-nums text-heading">{time(row.starts_at)}</p>
                      <p className="text-xs text-muted">{channels[row.channel]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      {row.lead ? (
                        <Link href={`/${locale}/portal/crm/${row.lead.id}`} className="font-bold text-heading hover:underline">
                          {row.lead.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-heading">—</span>
                      )}
                      <p className="truncate text-xs text-muted">
                        {row.lead ? `${row.lead.phone} · ${row.lead.email}` : ""}
                      </p>
                      {row.notes && <p className="mt-1 text-sm text-body">{row.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusTone[row.status])}>
                        {t.statuses[row.status]}
                      </span>
                      {busy === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
                      ) : (
                        row.status === "scheduled" &&
                        (["done", "no_show", "cancelled"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(row, s)}
                            className="h-8 rounded-full px-3 text-xs font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft dark:hover:bg-white/10"
                          >
                            {t.mark[s]}
                          </button>
                        ))
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
