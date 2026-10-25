"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays, CalendarPlus, Download, Loader2, MapPin, Phone, Users, Video, X, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookMeetingButton } from "@/components/clientPortal/BookMeetingButton";
import { card, fmtWhen, TZ, type Meeting } from "@/components/clientPortal/shared";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { clientPortalCopy } from "@/content/clientPortal";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type MeetingsTab = "upcoming" | "past";

const CHANNEL_ICON: Record<string, LucideIcon> = { meet: Video, call: Phone, whatsapp: Phone, in_person: MapPin };
const STATUS_TONE: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
  no_show: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};
const JOIN_BEFORE = 15 * 60 * 1000;

/** Archivo .ics de una reunión, para añadirla al calendario. */
function downloadIcs(m: Meeting, title: string, description: string) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Engynex//Portal//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${m.id}@${siteConfig.domain}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(m.starts_at)}`,
    `DTEND:${stamp(m.ends_at)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    m.meeting_url ? `URL:${m.meeting_url}` : "",
    m.location || m.meeting_url ? `LOCATION:${esc(m.location || m.meeting_url || "")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `engynex-${m.starts_at.slice(0, 10)}.ics` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Reuniones del cliente: próximas (unirse, calendario, reprogramar, cancelar) y pasadas. */
export function MeetingsView({ locale, tab, meetings, now: initialNow }: { locale: Locale; tab: MeetingsTab; meetings: Meeting[]; now: number }) {
  const t = clientPortalCopy[locale].meetings;
  const base = `/${locale}/portal/reuniones`;
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const isUpcoming = (m: Meeting) => m.status === "scheduled" && Date.parse(m.ends_at) >= now;
  const list = tab === "upcoming"
    ? meetings.filter(isUpcoming).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    : meetings.filter((m) => !isUpcoming(m)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const counts = { upcoming: meetings.filter(isUpcoming).length, past: meetings.filter((m) => !isUpcoming(m)).length };

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(["upcoming", "past"] as const).map((k) => (
            <Link
              key={k}
              href={k === "upcoming" ? base : `${base}?tab=past`}
              aria-current={tab === k ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[k]}
              <span className="text-sm font-normal tabular-nums text-muted">{counts[k]}</span>
            </Link>
          ))}
        </nav>
        <BookMeetingButton locale={locale} className={cn(buttonClasses("primary", "md"), "my-2 h-9 px-3.5")}>
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t.book}
        </BookMeetingButton>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {list.length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--meta-active)] text-heading">
              <CalendarDays className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-5 text-sm text-muted">{tab === "upcoming" ? t.emptyUpcoming : t.emptyPast}</p>
          </div>
        ) : (
          <ul className="grid max-w-4xl gap-3">
            {list.map((m) => (
              <MeetingCard key={m.id} locale={locale} m={m} now={now} upcoming={tab === "upcoming"} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ locale, m, now, upcoming }: { locale: Locale; m: Meeting; now: number; upcoming: boolean }) {
  const t = clientPortalCopy[locale].meetings;
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = CHANNEL_ICON[m.channel] ?? Video;
  const start = Date.parse(m.starts_at);
  const mins = Math.round((Date.parse(m.ends_at) - start) / 60000);
  const canJoin = !!m.meeting_url && now >= start - JOIN_BEFORE && now <= Date.parse(m.ends_at);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: TZ }).format(new Date(m.starts_at));
  const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: TZ }).format(new Date(m.starts_at));

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().rpc("my_appointment_cancel", { p_id: m.id, p_reason: reason.trim() || null });
    setBusy(false);
    if (err) return setError(t.error);
    setConfirming(false);
    router.refresh();
  };

  const small = "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";
  return (
    <li className={cn(card, "flex flex-wrap gap-x-5 gap-y-4", m.status === "cancelled" && "opacity-75")}>
      <div className="grid h-14 w-14 shrink-0 place-items-center content-center rounded-xl bg-[var(--meta-active)] text-center text-heading">
        <span className="text-xl font-semibold leading-none tabular-nums">{day}</span>
        <span className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted">{month.replace(".", "")}</span>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-heading first-letter:uppercase">{fmtWhen(locale, m.starts_at)}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", STATUS_TONE[m.status] ?? STATUS_TONE.cancelled)}>{t.status[m.status] ?? m.status}</span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-4 w-4" aria-hidden />
            {t.channels[m.channel] ?? m.channel}
          </span>
          <span>{t.minutes.replace("{n}", String(mins))}</span>
          {m.host_name && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              {t.with.replace("{name}", m.host_name)}
            </span>
          )}
          {m.location && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{m.location}</span>
            </span>
          )}
        </p>
      </div>

      {upcoming && (
        <div className="flex basis-full flex-wrap items-center gap-2 md:basis-auto md:justify-end">
          {m.meeting_url &&
            (canJoin ? (
              <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
                <Video className="h-4 w-4" aria-hidden />
                {t.join}
              </a>
            ) : (
              <span title={t.joinSoon} className={cn(small, "cursor-not-allowed opacity-50")} aria-disabled>
                <Video className="h-4 w-4" aria-hidden />
                {t.join}
              </span>
            ))}
          <button type="button" className={small} onClick={() => downloadIcs(m, t.icsTitle, [m.host_name && t.with.replace("{name}", m.host_name), m.meeting_url].filter(Boolean).join("\n"))}>
            <Download className="h-4 w-4" aria-hidden />
            {t.ics}
          </button>
          <BookMeetingButton locale={locale} className={small}>
            <CalendarClock className="h-4 w-4" aria-hidden />
            {t.reschedule}
          </BookMeetingButton>
          {!confirming && (
            <button type="button" className={cn(small, "text-red-700 dark:text-red-400")} onClick={() => setConfirming(true)}>
              <X className="h-4 w-4" aria-hidden />
              {t.cancel}
            </button>
          )}
        </div>
      )}

      {confirming && (
        <div role="group" aria-label={t.cancelTitle} className="basis-full rounded-lg border border-line bg-[var(--meta-hover)] p-4">
          <p className="font-semibold text-heading">{t.cancelTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.cancelBody}</p>
          <label className="mt-3 block text-sm font-medium text-heading">
            {t.cancelReason}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} className={cn(inputClass, "mt-1.5 h-auto py-2")} />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={cancel} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.cancelConfirm}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={small}>
              {t.cancelKeep}
            </button>
            {error && (
              <span role="alert" className="text-sm text-red-700 dark:text-red-400">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
