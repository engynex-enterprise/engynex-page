"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Availability, AvailabilityBlock } from "@/lib/supabase/types";
import { agendaCalendarCopy } from "@/content/agendaCalendar";
import { agendaProCopy } from "@/content/agendaPro";
import { bogotaIso, channelIcon, dayKey, fmtTime, kindDot, statusTone, type AgendaRow, type AgendaViewProps } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Mode = "day" | "week" | "month";
const MODE_KEY = "engynex-agenda-mode";
const SLOT_PX = 22; // alto de media hora
const DAY_MS = 86_400_000;
const MAX_CHIPS = 3;

/** Minutos desde la medianoche en Colombia (UTC−5 todo el año). */
const localMin = (iso: string) => {
  const m = Math.floor(Date.parse(iso) / 60_000) - 300;
  return ((m % 1440) + 1440) % 1440;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};
/** Fecha aaaa-mm-dd ± días (aritmética en UTC, sin husos). */
const addDays = (key: string, n: number) => new Date(Date.parse(`${key}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();
const mondayOf = (key: string) => addDays(key, -((weekday(key) + 6) % 7));
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtKey = (locale: Locale, key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));

/** Reparte en columnas las reuniones que se cruzan (como Google Calendar). */
function layout(events: AgendaRow[]) {
  const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at) || b.ends_at.localeCompare(a.ends_at));
  const placed: { e: AgendaRow; col: number; cols: number }[] = [];
  let cluster: { e: AgendaRow; col: number }[] = [];
  let clusterEnd = 0;
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((c) => c.col + 1));
    for (const c of cluster) placed.push({ ...c, cols });
    cluster = [];
  };
  for (const e of sorted) {
    const start = Date.parse(e.starts_at);
    if (cluster.length && start >= clusterEnd) flush();
    const busy = new Set(cluster.filter((c) => Date.parse(c.e.ends_at) > start).map((c) => c.col));
    let col = 0;
    while (busy.has(col)) col++;
    cluster.push({ e, col });
    clusterEnd = Math.max(clusterEnd, Date.parse(e.ends_at));
  }
  flush();
  return placed;
}

/**
 * Calendario de la agenda: día, semana (por defecto) y mes, en hora de
 * Colombia. Sombrea lo que está fuera del horario de atención, muestra los
 * bloqueos y la hora actual. Clic en un hueco libre para agendar; arrastrar
 * una reunión futura a otra media hora la reprograma.
 */
export function AgendaCalendar({ locale, items, availability, blocks, onOpen, onCreateAt, onReschedule }: AgendaViewProps) {
  const t = agendaCalendarCopy[locale];
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(() => dayKey(Date.now()));
  const [dragging, setDragging] = useState<AgendaRow | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    // Vista recordada (solo en el navegador, después de hidratar).
    const restore = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved === "day" || saved === "week" || saved === "month") setMode(saved);
      } catch {
        // Sin almacenamiento: queda la semana.
      }
    }, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(restore);
    };
  }, []);

  const changeMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // Sin almacenamiento: no se recuerda.
    }
  };
  const openDay = (key: string) => {
    setAnchor(key);
    changeMode("day");
  };

  const today = dayKey(now);
  const byDay = useMemo(() => {
    const map = new Map<string, AgendaRow[]>();
    for (const e of items) {
      const key = dayKey(e.starts_at);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    for (const list of map.values()) list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [items]);

  const move = (dir: -1 | 1) => {
    if (mode === "day") setAnchor((a) => addDays(a, dir));
    else if (mode === "week") setAnchor((a) => addDays(a, 7 * dir));
    else
      setAnchor((a) => {
        const [y, m] = a.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1 + dir, 1, 12)).toISOString().slice(0, 10);
      });
  };

  const days = mode === "day" ? [anchor] : mode === "week" ? Array.from({ length: 7 }, (_, i) => addDays(mondayOf(anchor), i)) : [];
  const title = (() => {
    if (mode === "day") return capital(fmtKey(locale, anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    if (mode === "month") return capital(fmtKey(locale, anchor, { month: "long", year: "numeric" }));
    const [a, b] = [days[0], days[6]];
    const sameMonth = a.slice(0, 7) === b.slice(0, 7);
    const left = sameMonth ? fmtKey(locale, a, { day: "numeric" }) : fmtKey(locale, a, { day: "numeric", month: "short" });
    return `${left} – ${fmtKey(locale, b, { day: "numeric", month: "short", year: "numeric" })}`;
  })();

  const whenLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  const onDragStart = (event: DragStartEvent) => setDragging(items.find((e) => e.id === event.active.id) ?? null);
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const over = event.over?.id ? String(event.over.id) : null;
    if (!over?.startsWith("slot:")) return;
    const [day, time] = over.slice(5).split("|");
    const iso = bogotaIso(day, time);
    const e = items.find((x) => x.id === event.active.id);
    if (!e || iso === e.starts_at || Date.parse(iso) <= now) return;
    onReschedule(e.id, iso);
    setAnnouncement(t.moved.replace("{when}", whenLabel(iso)));
  };

  return (
    <div>
      {/* Barra del calendario */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-lg font-semibold text-heading">{title}</h3>
        <span className="hidden text-xs text-muted xl:inline">{t.dragHint}</span>
        <button type="button" onClick={() => setAnchor(today)} className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
          {t.today}
        </button>
        <button type="button" onClick={() => move(-1)} aria-label={t.prev} className="grid h-9 w-9 place-items-center rounded-[10px] text-heading hover:bg-[var(--meta-hover)]">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => move(1)} aria-label={t.next} className="grid h-9 w-9 place-items-center rounded-[10px] text-heading hover:bg-[var(--meta-hover)]">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <div role="group" aria-label={t.view} className="flex rounded-[10px] bg-card-soft p-0.5 dark:bg-white/[0.06]">
          {(["day", "week", "month"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => changeMode(m)}
              className={cn("h-8 rounded-lg px-3 text-sm", mode === m ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
            >
              {t.modes[m]}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {mode === "month" ? (
        <MonthGrid locale={locale} anchor={anchor} today={today} now={now} byDay={byDay} onOpen={onOpen} onOpenDay={openDay} />
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <TimeGrid
            locale={locale}
            days={days}
            today={today}
            now={now}
            byDay={byDay}
            availability={availability}
            blocks={blocks}
            dragging={dragging}
            onOpen={onOpen}
            onCreateAt={onCreateAt}
            onOpenDay={openDay}
          />
          <DragOverlay dropAnimation={null}>
            {dragging && (
              <div className={cn("rounded-lg px-2 py-1 text-xs shadow-[0_12px_24px_-8px_rgba(16,24,40,0.35)]", statusTone[dragging.status])}>
                <span className="font-semibold">{fmtTime(locale, dragging.starts_at)}</span> · {dragging.lead?.name ?? t.noLead}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      <p className="mt-2 text-xs text-muted xl:hidden">{t.dragHint}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Día y semana: rejilla de medias horas                              */
/* ------------------------------------------------------------------ */

function TimeGrid({
  locale,
  days,
  today,
  now,
  byDay,
  availability,
  blocks,
  dragging,
  onOpen,
  onCreateAt,
  onOpenDay,
}: {
  locale: Locale;
  days: string[];
  today: string;
  now: number;
  byDay: Map<string, AgendaRow[]>;
  availability: Availability[];
  blocks: AvailabilityBlock[];
  dragging: AgendaRow | null;
  onOpen: (id: string) => void;
  onCreateAt: (iso: string) => void;
  onOpenDay: (key: string) => void;
}) {
  // De 7:00 a 20:00, ampliado si hay reuniones por fuera.
  const [startMin, endMin] = useMemo(() => {
    let s = 7 * 60;
    let e = 20 * 60;
    for (const d of days) {
      for (const ev of byDay.get(d) ?? []) {
        s = Math.min(s, Math.floor(localMin(ev.starts_at) / 60) * 60);
        const end = dayKey(ev.ends_at) !== d ? 1440 : localMin(ev.ends_at);
        e = Math.max(e, Math.ceil(end / 60) * 60);
      }
    }
    return [s, Math.min(e, 1440)];
  }, [days, byDay]);
  const slots = Array.from({ length: (endMin - startMin) / 30 }, (_, i) => startMin + i * 30);
  const height = slots.length * SLOT_PX;
  const y = (min: number) => ((min - startMin) / 30) * SLOT_PX;
  const nowMin = localMin(new Date(now).toISOString());

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div className={cn(days.length > 1 && "min-w-[46rem]")}>
        {/* Encabezado de días */}
        <div className="sticky top-0 z-20 grid border-b border-line bg-surface dark:bg-card" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <span />
          {days.map((d) => {
            const isToday = d === today;
            return (
              <button
                key={d}
                type="button"
                onClick={() => days.length > 1 && onOpenDay(d)}
                className={cn("flex items-baseline justify-center gap-1.5 border-l border-line py-2 text-sm", days.length > 1 && "hover:bg-[var(--meta-hover)]")}
                aria-label={capital(fmtKey(locale, d, { weekday: "long", day: "numeric", month: "long" }))}
              >
                <span className="text-xs uppercase tracking-[0.06em] text-muted">{fmtKey(locale, d, { weekday: "short" }).replace(".", "")}</span>
                <span
                  className={cn(
                    "grid h-7 min-w-7 place-items-center rounded-full px-1 font-semibold tabular-nums",
                    isToday ? "bg-brand-green-dark text-white dark:bg-brand-green dark:text-deep-950" : "text-heading",
                  )}
                >
                  {Number(d.slice(8))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
          {/* Horas */}
          <div className="relative" style={{ height }}>
            {slots.map((m) =>
              m % 60 === 0 ? (
                <span key={m} className="absolute right-2 -translate-y-1/2 text-[0.7rem] tabular-nums text-muted" style={{ top: y(m) }}>
                  {m === startMin ? "" : fmtTime(locale, new Date(Date.UTC(2026, 0, 1, Math.floor(m / 60) + 5, m % 60)).toISOString())}
                </span>
              ) : null,
            )}
          </div>

          {days.map((d) => (
            <DayColumn
              key={d}
              locale={locale}
              day={d}
              isToday={d === today}
              now={now}
              nowMin={nowMin}
              slots={slots}
              startMin={startMin}
              endMin={endMin}
              height={height}
              y={y}
              events={byDay.get(d) ?? []}
              availability={availability.filter((a) => a.weekday === weekday(d))}
              blocks={blocks}
              dragging={dragging}
              onOpen={onOpen}
              onCreateAt={onCreateAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  locale,
  day,
  isToday,
  now,
  nowMin,
  slots,
  startMin,
  endMin,
  height,
  y,
  events,
  availability,
  blocks,
  dragging,
  onOpen,
  onCreateAt,
}: {
  locale: Locale;
  day: string;
  isToday: boolean;
  now: number;
  nowMin: number;
  slots: number[];
  startMin: number;
  endMin: number;
  height: number;
  y: (min: number) => number;
  events: AgendaRow[];
  availability: Availability[];
  blocks: AvailabilityBlock[];
  dragging: AgendaRow | null;
  onOpen: (id: string) => void;
  onCreateAt: (iso: string) => void;
}) {
  const t = agendaCalendarCopy[locale];
  const open = (min: number) => availability.some((a) => min >= toMin(a.start_time) && min < toMin(a.end_time));

  // Bloqueos que tocan este día, recortados a la rejilla.
  const dayStart = Date.parse(`${day}T00:00:00-05:00`);
  const bands = blocks
    .map((b) => {
      const s = Math.max(Date.parse(b.starts_at), dayStart);
      const e = Math.min(Date.parse(b.ends_at), dayStart + DAY_MS);
      if (e <= s) return null;
      const from = Math.max((s - dayStart) / 60_000, startMin);
      const to = Math.min((e - dayStart) / 60_000, endMin);
      return to > from ? { id: b.id, from, to, reason: b.reason } : null;
    })
    .filter(Boolean) as { id: number; from: number; to: number; reason: string | null }[];

  return (
    <div className="relative border-l border-line" style={{ height }}>
      {slots.map((m) => (
        <Slot
          key={m}
          locale={locale}
          day={day}
          min={m}
          top={y(m)}
          available={open(m)}
          future={Date.parse(bogotaIso(day, hhmm(m))) > now}
          dragging={dragging}
          onCreateAt={onCreateAt}
        />
      ))}

      {bands.map((b) => (
        <div
          key={b.id}
          title={b.reason ? `${t.blocked}: ${b.reason}` : t.blocked}
          className="pointer-events-none absolute inset-x-0 z-[1] border-y border-line bg-[repeating-linear-gradient(135deg,rgba(113,113,122,0.14)_0_6px,transparent_6px_12px)]"
          style={{ top: y(b.from), height: y(b.to) - y(b.from) }}
        >
          <span className="m-1 inline-block rounded bg-surface/80 px-1 text-[0.65rem] text-muted dark:bg-card/80">{b.reason || t.blocked}</span>
        </div>
      ))}

      {isToday && nowMin >= startMin && nowMin <= endMin && (
        <div className="pointer-events-none absolute inset-x-0 z-[3] flex items-center" style={{ top: y(nowMin) }} aria-label={t.now}>
          <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
          <span className="h-px flex-1 bg-red-500" />
        </div>
      )}

      {layout(events).map(({ e, col, cols }) => (
        <EventBlock
          key={e.id}
          locale={locale}
          event={e}
          day={day}
          now={now}
          y={y}
          endMin={endMin}
          col={col}
          cols={cols}
          hidden={dragging?.id === e.id}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

/** Media hora: destino para soltar y clic para agendar. */
function Slot({
  locale,
  day,
  min,
  top,
  available,
  future,
  dragging,
  onCreateAt,
}: {
  locale: Locale;
  day: string;
  min: number;
  top: number;
  available: boolean;
  future: boolean;
  dragging: AgendaRow | null;
  onCreateAt: (iso: string) => void;
}) {
  const t = agendaCalendarCopy[locale];
  const iso = bogotaIso(day, hhmm(min));
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${day}|${hhmm(min)}`, disabled: !future });
  const label = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const span = dragging ? Math.max(1, Math.round((Date.parse(dragging.ends_at) - Date.parse(dragging.starts_at)) / 1_800_000)) : 1;
  return (
    <div
      ref={setNodeRef}
      className={cn("absolute inset-x-0", min % 60 === 0 ? "border-t border-line" : "border-t border-dashed border-line/60", !available && "bg-[#f7f7f8] dark:bg-white/[0.025]")}
      style={{ top, height: SLOT_PX }}
    >
      {future && (
        <button
          type="button"
          onClick={() => onCreateAt(iso)}
          aria-label={`${t.createAt.replace("{when}", label)}${available ? "" : ` (${t.unavailable})`}`}
          className="absolute inset-0 w-full hover:bg-[var(--meta-active)]/70 focus-visible:bg-[var(--meta-active)]"
        />
      )}
      {isOver && dragging && (
        <div
          className="pointer-events-none absolute inset-x-1 top-0 z-[4] rounded-lg border-2 border-dashed border-brand-green-dark bg-[var(--meta-active)]/70 px-1.5 text-[0.7rem] font-semibold text-heading dark:border-brand-green"
          style={{ height: span * SLOT_PX - 2 }}
        >
          {fmtTime(locale, iso)}
        </div>
      )}
    </div>
  );
}

function EventBlock({
  locale,
  event: e,
  day,
  now,
  y,
  endMin,
  col,
  cols,
  hidden,
  onOpen,
}: {
  locale: Locale;
  event: AgendaRow;
  day: string;
  now: number;
  y: (min: number) => number;
  endMin: number;
  col: number;
  cols: number;
  hidden: boolean;
  onOpen: (id: string) => void;
}) {
  const t = agendaCalendarCopy[locale];
  const p = agendaProCopy[locale];
  const movable = e.status === "scheduled" && Date.parse(e.starts_at) > now;
  const { setNodeRef, attributes, listeners } = useDraggable({ id: e.id, disabled: !movable });
  const start = localMin(e.starts_at);
  const end = dayKey(e.ends_at) !== day ? endMin : Math.min(localMin(e.ends_at), endMin);
  const top = y(start);
  const height = Math.max(y(end) - top, SLOT_PX - 2);
  const Icon = channelIcon[e.channel];
  const compact = height < SLOT_PX * 2;
  const name = e.lead?.name ?? t.noLead;
  const when = `${fmtTime(locale, e.starts_at)} – ${fmtTime(locale, e.ends_at)}`;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(movable ? listeners : {})}
      {...(movable ? attributes : {})}
      onClick={() => onOpen(e.id)}
      aria-label={t.event
        .replace("{name}", name)
        .replace("{when}", new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(e.starts_at)))
        .replace("{status}", p.statuses[e.status])}
      className={cn(
        "absolute z-[2] overflow-hidden rounded-lg px-1.5 py-1 text-left text-[0.72rem] leading-tight transition-shadow hover:shadow-md",
        statusTone[e.status],
        e.status === "cancelled" && "opacity-60",
        movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        hidden && "opacity-30",
      )}
      style={{ top: top + 1, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}
    >
      <span className="flex min-w-0 items-center gap-1">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", kindDot[e.kind])} aria-hidden />
        <span className="min-w-0 truncate font-semibold">{compact ? `${fmtTime(locale, e.starts_at)} ${name}` : name}</span>
      </span>
      {!compact && (
        <span className="mt-0.5 flex min-w-0 items-center gap-1 opacity-80">
          <Icon className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{when}</span>
        </span>
      )}
      {!compact && height >= SLOT_PX * 3 && <span className="mt-0.5 block truncate opacity-70">{p.kinds[e.kind]}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Mes                                                                */
/* ------------------------------------------------------------------ */

function MonthGrid({
  locale,
  anchor,
  today,
  now,
  byDay,
  onOpen,
  onOpenDay,
}: {
  locale: Locale;
  anchor: string;
  today: string;
  now: number;
  byDay: Map<string, AgendaRow[]>;
  onOpen: (id: string) => void;
  onOpenDay: (key: string) => void;
}) {
  const t = agendaCalendarCopy[locale];
  const p = agendaProCopy[locale];
  const month = anchor.slice(0, 7);
  const weeks = useMemo(() => {
    const first = `${month}-01`;
    const start = mondayOf(first);
    const [y, m] = month.split("-").map(Number);
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const offset = (weekday(first) + 6) % 7;
    const count = Math.ceil((offset + daysIn) / 7) * 7;
    const all = Array.from({ length: count }, (_, i) => addDays(start, i));
    return Array.from({ length: count / 7 }, (_, w) => all.slice(w * 7, w * 7 + 7));
  }, [month]);

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div role="grid" aria-label={capital(fmtKey(locale, `${month}-15`, { month: "long", year: "numeric" }))} className="min-w-[44rem]">
        <div role="row" className="grid grid-cols-7 border-b border-line bg-[#fafafa] dark:bg-white/[0.03]">
          {weeks[0].map((d) => (
            <span key={d} role="columnheader" className="px-2 py-2 text-xs uppercase tracking-[0.06em] text-muted">
              {fmtKey(locale, d, { weekday: "short" }).replace(".", "")}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((d) => {
              const list = byDay.get(d) ?? [];
              const inMonth = d.startsWith(month);
              const label = capital(fmtKey(locale, d, { weekday: "long", day: "numeric", month: "long" }));
              return (
                <div
                  key={d}
                  role="gridcell"
                  aria-label={`${label}${list.length ? ` · ${list.length}` : ""}`}
                  onClick={(ev) => {
                    if (ev.target === ev.currentTarget) onOpenDay(d);
                  }}
                  className={cn("relative min-h-[7rem] min-w-0 cursor-pointer overflow-hidden border-r border-line p-1.5 last:border-r-0", !inMonth && "bg-[#fafafa] dark:bg-white/[0.02]")}
                >
                  <button
                    type="button"
                    onClick={() => onOpenDay(d)}
                    aria-label={label}
                    className={cn(
                      "mb-1 grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold tabular-nums hover:bg-[var(--meta-hover)]",
                      d === today ? "bg-brand-green-dark text-white hover:bg-brand-green-dark dark:bg-brand-green dark:text-deep-950" : inMonth ? "text-heading" : "text-muted",
                    )}
                  >
                    {Number(d.slice(8))}
                  </button>
                  <div className="grid gap-0.5">
                    {list.slice(0, MAX_CHIPS).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onOpen(e.id)}
                        aria-label={`${e.lead?.name ?? t.noLead}, ${fmtTime(locale, e.starts_at)}, ${p.statuses[e.status]}`}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[0.72rem]",
                          statusTone[e.status],
                          e.status === "scheduled" && Date.parse(e.ends_at) < now && "ring-amber-400",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", kindDot[e.kind])} aria-hidden />
                        <span className="shrink-0 tabular-nums opacity-80">{fmtTime(locale, e.starts_at)}</span>
                        <span className="min-w-0 truncate">{e.lead?.name ?? t.noLead}</span>
                      </button>
                    ))}
                    {list.length > MAX_CHIPS && (
                      <button type="button" onClick={() => onOpenDay(d)} className="px-1.5 text-left text-[0.72rem] font-semibold text-accent hover:underline">
                        {t.more.replace("{n}", String(list.length - MAX_CHIPS))}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
