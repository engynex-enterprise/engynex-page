"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TZ = "America/Bogota";
/** Colombia no tiene horario de verano: siempre UTC−5. */
const OFFSET = "-05:00";

/** Partes locales (Colombia) de un instante ISO. */
function localParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`,
  };
}

const toIso = (date: string, time: string) =>
  new Date(`${date}T${time}:00${OFFSET}`).toISOString();

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Selector de fecha y hora al estilo de meta.com (hora de Colombia).
 *
 * El campo muestra la etiqueta dentro y el valor debajo, como el desplegable;
 * al abrirlo aparece un calendario mensual y, al lado, la lista de horas cada
 * `step` minutos. `mode="date"` oculta las horas. Devuelve ISO (UTC) o null.
 */
export function DateTimePicker({
  label,
  value,
  onChange,
  locale,
  mode = "datetime",
  step = 30,
  minDate,
  clearLabel,
  size = "md",
  className,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  locale: string;
  mode?: "date" | "datetime";
  step?: number;
  /** aaaa-mm-dd: días anteriores quedan deshabilitados. */
  minDate?: string;
  clearLabel?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? localParts(value) : null;
  const today = localParts(new Date().toISOString()).date;
  const [month, setMonth] = useState(() => (selected?.date ?? today).slice(0, 7));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    panelRef.current?.querySelector<HTMLElement>("[aria-selected='true'], [data-today]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const [year, monthIndex] = month.split("-").map(Number);
  const weeks = useMemo(() => {
    const first = new Date(Date.UTC(year, monthIndex - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7; // semana empieza el lunes
    const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
    const cells: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(monthIndex)}-${pad(d)}`);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [year, monthIndex]);

  const weekdayNames = useMemo(() => {
    const base = Date.UTC(2024, 0, 1); // lunes
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
        new Date(base + i * 864e5),
      ),
    );
  }, [locale]);

  const times = useMemo(() => {
    const list: string[] = [];
    for (let m = 6 * 60; m <= 21 * 60; m += step) list.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    return list;
  }, [step]);

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  const pickDate = (date: string) => {
    const time = selected?.time ?? (mode === "date" ? "12:00" : "09:00");
    onChange(toIso(date, time));
    if (mode === "date") setOpen(false);
  };
  const pickTime = (time: string) => {
    onChange(toIso(selected?.date ?? today, time));
    setOpen(false);
    buttonRef.current?.focus();
  };

  const display = value
    ? new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: selected && selected.date.slice(0, 4) !== today.slice(0, 4) ? "numeric" : undefined,
        ...(mode === "datetime" ? { hour: "numeric", minute: "2-digit" } : {}),
        timeZone: TZ,
      }).format(new Date(value))
    : "—";
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  );
  const small = size === "sm";

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        className={cn(
          "relative flex w-full flex-col items-start justify-center border bg-surface pr-11 text-left outline-none transition-colors dark:bg-card",
          small ? "h-11 rounded-xl pl-4" : "h-16 rounded-2xl pl-4",
          open
            ? "border-deep-700 shadow-[inset_0_0_0_1px_var(--color-deep-700)] dark:border-brand-green dark:shadow-[inset_0_0_0_1px_var(--color-brand-green)]"
            : "border-line-strong hover:border-muted focus-visible:border-deep-700",
        )}
      >
        <span id={`${id}-label`} className={cn("text-xs text-muted", small && "sr-only")}>
          {label}
        </span>
        <span
          id={`${id}-value`}
          className={cn("block w-full truncate first-letter:uppercase", small ? "text-sm" : "mt-0.5 text-base", value ? "text-heading" : "text-muted")}
        >
          {display}
        </span>
        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-heading" strokeWidth={1.6} aria-hidden />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-2 flex w-max max-w-[calc(100vw-2rem)] gap-4 rounded-3xl bg-surface p-4 shadow-[0_16px_50px_-14px_rgba(11,16,32,0.45)] ring-1 ring-line dark:bg-card"
        >
          <div className="w-64">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="‹" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-soft dark:hover:bg-white/10">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold capitalize text-heading">{monthName}</p>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="›" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-soft dark:hover:bg-white/10">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-xs font-semibold uppercase text-muted">
              {weekdayNames.map((w, i) => (
                <span key={i} className="py-1.5">{w}</span>
              ))}
            </div>
            <div role="grid" className="grid grid-cols-7 gap-0.5">
              {weeks.map((date, i) =>
                date ? (
                  <button
                    key={date}
                    type="button"
                    role="gridcell"
                    aria-selected={selected?.date === date}
                    data-today={date === today ? "" : undefined}
                    disabled={!!minDate && date < minDate}
                    onClick={() => pickDate(date)}
                    className={cn(
                      "grid h-9 place-items-center rounded-full text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30",
                      selected?.date === date
                        ? "bg-deep-700 font-bold text-white dark:bg-white dark:text-deep-700"
                        : date === today
                          ? "font-bold text-heading ring-1 ring-line-strong hover:bg-surface-soft dark:hover:bg-white/10"
                          : "text-heading hover:bg-surface-soft dark:hover:bg-white/10",
                    )}
                  >
                    {Number(date.slice(8))}
                  </button>
                ) : (
                  <span key={`e${i}`} />
                ),
              )}
            </div>
            {clearLabel && value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-heading"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                {clearLabel}
              </button>
            )}
          </div>
          {mode === "datetime" && (
            <ul aria-label="Hora" className="no-scrollbar h-[19rem] w-24 overflow-y-auto border-l border-line pl-3">
              {times.map((time) => {
                const active = selected?.time === time;
                return (
                  <li key={time}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => pickTime(time)}
                      className={cn(
                        "h-9 w-full rounded-full text-sm tabular-nums transition-colors",
                        active
                          ? "bg-action font-bold text-deep-700"
                          : "text-heading hover:bg-surface-soft dark:hover:bg-white/10",
                      )}
                    >
                      {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
                        new Date(`1970-01-01T${time}:00Z`),
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
