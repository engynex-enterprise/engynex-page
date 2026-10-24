"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  Download,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Video,
  type LucideIcon,
} from "lucide-react";
import { trackBooking } from "@/lib/tracking";
import { createClient } from "@/lib/supabase/client";
import type { BookingResult } from "@/lib/supabase/types";
import { buttonClasses } from "@/components/ui/Button";
import {
  channelKeys,
  leadFormCopy,
  type ChannelKey,
} from "@/content/leadForm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TZ = "America/Bogota";

const channelIcons: Record<ChannelKey, LucideIcon> = {
  meet: Video,
  call: Phone,
  whatsapp: MessageCircle,
  in_person: MapPin,
};

/** Fecha local de Colombia (aaaa-mm-dd) de un instante. */
const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));

/** 20261026T130000Z, el formato de fechas de calendarios. */
const calStamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * Agenda del lead verde: elige día, hora (en hora de Colombia) y medio de la
 * reunión. Los huecos los calcula la base de datos con la disponibilidad,
 * las citas existentes y los bloqueos; la reserva se valida otra vez allá.
 */
export function Booking({
  locale,
  token,
  name,
}: {
  locale: Locale;
  token: string;
  name: string;
}) {
  const t = leadFormCopy[locale].booking;
  const [slots, setSlots] = useState<string[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelKey>("meet");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [booked, setBooked] = useState<BookingResult | null>(null);
  const [skipped, setSkipped] = useState(false);

  const load = async () => {
    const { data, error } = await createClient().rpc("available_slots", {
      p_token: token,
    });
    if (error) {
      setSlots([]);
      setMessage(error.message.includes("invalid_token") ? t.expired : t.error);
      return;
    }
    const list = (data ?? []).map((row) => row.starts_at);
    setSlots(list);
    setDay((current) =>
      current && list.some((s) => dayKey(s) === current)
        ? current
        : list[0]
          ? dayKey(list[0])
          : null,
    );
  };

  useEffect(() => {
    // Carga inicial de huecos; `load` solo depende del token.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const slot of slots ?? []) {
      const key = dayKey(slot);
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return map;
  }, [slots]);

  const fmtDay = (key: string) => {
    const date = new Date(`${key}T12:00:00-05:00`);
    return {
      weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: TZ }).format(date),
      day: new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: TZ }).format(date),
      month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: TZ }).format(date),
    };
  };
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }).format(new Date(iso));
  const fmtFull = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }).format(new Date(iso));

  const confirm = async () => {
    if (!time) return;
    setStatus("saving");
    const { data, error } = await createClient().rpc("book_appointment", {
      p_token: token,
      p_start: time,
      p_channel: channel,
      p_notes: notes || null,
    });
    if (error) {
      setStatus("error");
      if (error.message.includes("slot_unavailable")) {
        setMessage(t.taken);
        setTime(null);
        void load();
      } else {
        setMessage(error.message.includes("invalid_token") ? t.expired : t.error);
      }
      return;
    }
    setStatus("idle");
    trackBooking();
    setBooked(data as unknown as BookingResult);
  };

  // ------------------------ Confirmado ------------------------
  if (booked) {
    const details = `${t.channels[booked.channel]} · ${name}`;
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      t.eventTitle,
    )}&dates=${calStamp(booked.starts_at)}/${calStamp(booked.ends_at)}&details=${encodeURIComponent(details)}`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Engynex//Agenda//ES",
      "BEGIN:VEVENT",
      `UID:${booked.id}@engynex.com`,
      `DTSTAMP:${calStamp(new Date().toISOString())}`,
      `DTSTART:${calStamp(booked.starts_at)}`,
      `DTEND:${calStamp(booked.ends_at)}`,
      `SUMMARY:${t.eventTitle}`,
      `DESCRIPTION:${details}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return (
      <div className="mt-8 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8 dark:bg-card" role="status">
        <CalendarCheck className="h-9 w-9 text-accent" aria-hidden />
        <h3 className="mt-4 text-2xl text-heading">{t.doneTitle}</h3>
        <p className="mt-2 text-sm text-muted">{t.doneSubtitle}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-soft p-4 dark:bg-white/[0.06]">
            <dt className="text-xs text-muted">{t.when}</dt>
            <dd className="mt-1 font-bold text-heading first-letter:uppercase">
              {fmtFull(booked.starts_at)}
            </dd>
            <dd className="text-xs text-muted">{t.timezone}</dd>
          </div>
          <div className="rounded-2xl bg-surface-soft p-4 dark:bg-white/[0.06]">
            <dt className="text-xs text-muted">{t.how}</dt>
            <dd className="mt-1 font-bold text-heading">{t.channels[booked.channel]}</dd>
            <dd className="text-xs text-muted">{t.channelHints[booked.channel]}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={google}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("dark", "md")}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {t.addGoogle}
          </a>
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`}
            download="reunion-engynex.ics"
            className={buttonClasses("outline", "md")}
          >
            <Download className="h-4 w-4" aria-hidden />
            {t.downloadIcs}
          </a>
        </div>
      </div>
    );
  }

  if (skipped) {
    return (
      <p role="status" className="mt-8 rounded-2xl bg-accent-soft px-5 py-4 text-sm text-heading">
        {t.skipped}
      </p>
    );
  }

  // ------------------------ Cargando / sin huecos ------------------------
  if (slots === null) {
    return (
      <div className="mt-8 flex justify-center py-10" aria-busy>
        <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <p role="status" className="mt-8 rounded-2xl bg-surface-soft px-5 py-4 text-sm text-heading">
        {message || t.noneAtAll}
      </p>
    );
  }

  // ------------------------ Agenda ------------------------
  const daySlots = day ? (days.get(day) ?? []) : [];

  return (
    <div className="mt-8 space-y-8">
      {/* Días */}
      <fieldset>
        <legend className="text-sm font-bold text-heading">{t.dayLabel}</legend>
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {[...days.keys()].map((key) => {
            const f = fmtDay(key);
            const active = key === day;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDay(key);
                  setTime(null);
                }}
                className={cn(
                  "flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors",
                  active
                    ? "border-deep-700 bg-deep-700 text-white dark:border-white dark:bg-white dark:text-deep-700"
                    : "border-line-strong bg-surface text-heading hover:border-muted dark:bg-card",
                )}
              >
                <span className="text-xs capitalize opacity-80">{f.weekday}</span>
                <span className="text-xl font-bold leading-tight">{f.day}</span>
                <span className="text-xs capitalize opacity-80">{f.month}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Horas */}
      <fieldset>
        <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-bold text-heading">
          {t.timeLabel}
          <span className="text-xs font-normal text-muted">{t.timezone}</span>
        </legend>
        {daySlots.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.noSlots}</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {daySlots.map((slot) => {
              const active = slot === time;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTime(slot)}
                  className={cn(
                    "h-11 rounded-full border text-sm font-semibold tabular-nums transition-colors",
                    active
                      ? "border-transparent bg-action text-deep-700"
                      : "border-line-strong bg-surface text-heading hover:border-muted dark:bg-card",
                  )}
                >
                  {fmtTime(slot)}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Medio */}
      <fieldset>
        <legend className="text-sm font-bold text-heading">{t.channelLabel}</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {channelKeys.map((key) => {
            const Icon = channelIcons[key];
            const active = key === channel;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setChannel(key)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-deep-700 shadow-[inset_0_0_0_1px_var(--color-deep-700)] dark:border-brand-green dark:shadow-[inset_0_0_0_1px_var(--color-brand-green)]"
                    : "border-line-strong hover:border-muted",
                  "bg-surface dark:bg-card",
                )}
              >
                <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block text-sm font-bold text-heading">{t.channels[key]}</span>
                  <span className="block text-xs text-muted">{t.channelHints[key]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-bold text-heading">{t.notes}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          maxLength={1000}
          className="mt-2 w-full resize-y rounded-2xl border border-line-strong bg-surface px-4 py-3 text-base text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20"
        />
      </label>

      {status === "error" && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
          {message}
        </p>
      )}

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="text-sm font-semibold text-muted hover:text-heading hover:underline"
        >
          {t.skip}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!time || status === "saving"}
          className={buttonClasses("primary", "lg", "w-full sm:w-auto disabled:opacity-50")}
        >
          {status === "saving" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {status === "saving" ? t.confirming : t.confirm}
        </button>
      </div>
    </div>
  );
}
