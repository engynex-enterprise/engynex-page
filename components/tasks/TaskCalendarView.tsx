"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { tasksViewsCopy } from "@/content/tasksViews";
import { dayKey, statusDot, type TaskRow, type TaskViewProps } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const MAX_PER_DAY = 3;
const TZ = "America/Bogota";

/** Hora local (Colombia) "HH:mm" de un instante. */
const timeOf = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
};

/** Mismo momento del día en otra fecha (sin hora → 9:00 a.m. de Colombia). */
const moveToDay = (day: string, iso: string | null) => new Date(`${day}T${iso ? timeOf(iso) : "09:00"}:00-05:00`).toISOString();

const utcKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Calendario mensual de tareas por fecha de vencimiento (hora de Colombia).
 * Arrastrar una tarea a otro día la reprograma conservando la hora; las
 * tareas sin fecha se pueden soltar en el calendario para darles una.
 */
export function TaskCalendarView({ locale, tasks, onOpen, onUpdate }: TaskViewProps) {
  const t = tasksViewsCopy[locale].calendar;
  const [now, setNow] = useState(() => Date.now());
  const [month, setMonth] = useState(() => {
    const [y, m] = dayKey(Date.now()).split("-").map(Number);
    return { y, m: m - 1 };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<TaskRow | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const today = dayKey(now);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  // Semanas del mes (lunes a domingo), como claves aaaa-mm-dd.
  const weeks = useMemo(() => {
    const first = Date.UTC(month.y, month.m, 1);
    const offset = (new Date(first).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    const count = Math.ceil((offset + days) / 7) * 7;
    const start = first - offset * 86_400_000;
    const all = Array.from({ length: count }, (_, i) => utcKey(start + i * 86_400_000));
    return Array.from({ length: count / 7 }, (_, w) => all.slice(w * 7, w * 7 + 7));
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const task of tasks) {
      if (!task.due_at) continue;
      const key = dayKey(task.due_at);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    for (const list of map.values()) list.sort((a, b) => a.due_at!.localeCompare(b.due_at!));
    return map;
  }, [tasks]);
  const noDate = tasks.filter((x) => !x.due_at);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i)))),
    [locale],
  );
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(month.y, month.m, 1)));
  const longDate = (key: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));

  const shift = (delta: number) => setMonth(({ y, m }) => ({ y: m + delta < 0 ? y - 1 : m + delta > 11 ? y + 1 : y, m: (m + delta + 12) % 12 }));
  const goToday = () => {
    const [y, m] = today.split("-").map(Number);
    setMonth({ y, m: m - 1 });
    setSelected(today);
  };

  const onDragStart = (event: DragStartEvent) => setDragging(tasks.find((x) => x.id === event.active.id) ?? null);
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const task = tasks.find((x) => x.id === event.active.id);
    const over = event.over?.id ? String(event.over.id) : null;
    if (!task || !over?.startsWith("day:")) return;
    const day = over.slice(4);
    if (task.due_at && dayKey(task.due_at) === day) return;
    onUpdate(task.id, { due_at: moveToDay(day, task.due_at) });
    setAnnouncement(t.moved.replace("{title}", task.title).replace("{date}", longDate(day)));
  };

  const selectedTasks = selected ? byDay.get(selected) ?? [] : [];

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-label={t.label} className="min-w-0">
          {/* Navegación */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="mr-auto text-lg font-semibold text-heading">{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</h3>
            <span className="hidden text-xs text-muted md:inline">{t.dragHint}</span>
            <button type="button" onClick={goToday} className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              {t.today}
            </button>
            <button type="button" onClick={() => shift(-1)} aria-label={t.prev} className="grid h-9 w-9 place-items-center rounded-[10px] text-heading hover:bg-[var(--meta-hover)]">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => shift(1)} aria-label={t.next} className="grid h-9 w-9 place-items-center rounded-[10px] text-heading hover:bg-[var(--meta-hover)]">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div role="grid" aria-label={monthLabel} className="min-w-[44rem] overflow-hidden rounded-xl border border-line">
              <div role="row" className="grid grid-cols-7 border-b border-line bg-[#fafafa] dark:bg-white/[0.03]">
                {weekdays.map((w) => (
                  <div key={w} role="columnheader" className="px-2 py-2 text-xs font-medium uppercase tracking-[0.06em] text-muted">
                    {w}
                  </div>
                ))}
              </div>
              {weeks.map((week) => (
                <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-line last:border-b-0">
                  {week.map((key) => (
                    <DayCell
                      key={key}
                      day={key}
                      label={longDate(key)}
                      inMonth={Number(key.slice(5, 7)) - 1 === month.m}
                      isToday={key === today}
                      isSelected={key === selected}
                      tasks={byDay.get(key) ?? []}
                      now={now}
                      locale={locale}
                      onOpen={onOpen}
                      onSelect={() => setSelected(key)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          {selected && (
            <section aria-label={t.day.replace("{date}", longDate(selected))} className="rounded-xl border border-line bg-surface p-4 dark:bg-card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold first-letter:uppercase text-heading">{longDate(selected)}</h3>
                <button type="button" onClick={() => setSelected(null)} aria-label={t.close} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)]">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {selectedTasks.length === 0 ? (
                <p className="text-sm text-muted">{t.dayEmpty}</p>
              ) : (
                <ul className="grid gap-1">
                  {selectedTasks.map((task) => (
                    <li key={task.id}>
                      <ChipBody task={task} now={now} onOpen={onOpen} wide />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <NoDateList title={`${t.noDate} (${noDate.length})`} empty={t.noDateEmpty} tasks={noDate} now={now} onOpen={onOpen} />
        </aside>
      </div>
      <DragOverlay>{dragging && <ChipBody task={dragging} now={now} lifted />}</DragOverlay>
    </DndContext>
  );
}

function DayCell({
  day,
  label,
  inMonth,
  isToday,
  isSelected,
  tasks,
  now,
  locale,
  onOpen,
  onSelect,
}: {
  day: string;
  label: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: TaskRow[];
  now: number;
  locale: Locale;
  onOpen: (id: string) => void;
  onSelect: () => void;
}) {
  const t = tasksViewsCopy[locale].calendar;
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  const extra = tasks.length - MAX_PER_DAY;
  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-label={`${label}${tasks.length ? ` · ${t.tasks.replace("{n}", String(tasks.length))}` : ""}`}
      aria-selected={isSelected}
      className={cn(
        "min-h-[7.5rem] min-w-0 overflow-hidden border-r border-line p-1.5 transition-colors last:border-r-0",
        !inMonth && "bg-[#fafafa] dark:bg-white/[0.02]",
        isOver && "bg-[var(--meta-active)]",
        isSelected && !isOver && "bg-[var(--meta-hover)]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        className={cn(
          "mb-1 grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-xs tabular-nums hover:bg-[var(--meta-hover)]",
          isToday ? "bg-brand-green-dark font-semibold text-white ring-2 ring-brand-green/40 dark:bg-brand-green dark:text-deep-950" : inMonth ? "text-heading" : "text-muted",
        )}
      >
        {Number(day.slice(8))}
      </button>
      <ul className="grid gap-1">
        {tasks.slice(0, MAX_PER_DAY).map((task) => (
          <li key={task.id}>
            <Chip task={task} now={now} onOpen={onOpen} />
          </li>
        ))}
      </ul>
      {extra > 0 && (
        <button type="button" onClick={onSelect} className="mt-1 px-1.5 text-xs font-medium text-accent hover:underline">
          {t.more.replace("{n}", String(extra))}
        </button>
      )}
    </div>
  );
}

function Chip({ task, now, onOpen }: { task: TaskRow; now: number; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("cursor-grab touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-green active:cursor-grabbing", isDragging && "opacity-40")}
      onClick={() => onOpen(task.id)}
    >
      <ChipBody task={task} now={now} />
    </div>
  );
}

/** Ficha compacta: estado, hora y título (o botón cuando no se arrastra). */
function ChipBody({
  task,
  now,
  onOpen,
  wide = false,
  lifted = false,
}: {
  task: TaskRow;
  now: number;
  onOpen?: (id: string) => void;
  wide?: boolean;
  lifted?: boolean;
}) {
  const overdue = !task.done && !!task.due_at && Date.parse(task.due_at) < now;
  const content = (
    <>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDot[task.status])} aria-hidden />
      {task.due_at && <span className="shrink-0 tabular-nums opacity-80">{timeOf(task.due_at)}</span>}
      <span className={cn("min-w-0 truncate", task.done && "line-through")}>{task.title}</span>
    </>
  );
  const tone = cn(
    "flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md px-1.5 text-left",
    wide ? "py-1.5 text-sm" : "py-0.5 text-[0.72rem]",
    task.done
      ? "bg-card-soft text-muted dark:bg-white/[0.05]"
      : overdue
        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
        : "bg-surface text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] dark:bg-white/[0.06] dark:ring-0",
    lifted && "shadow-[0_12px_24px_-8px_rgba(16,24,40,0.35)]",
  );
  return onOpen ? (
    <button type="button" onClick={() => onOpen(task.id)} className={tone}>
      {content}
    </button>
  ) : (
    <span className={tone}>{content}</span>
  );
}

/** Tareas sin fecha: se pueden arrastrar al calendario. */
function NoDateList({
  title,
  empty,
  tasks,
  now,
  onOpen,
}: {
  title: string;
  empty: string;
  tasks: TaskRow[];
  now: number;
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-label={title} className="rounded-xl border border-line bg-surface p-4 dark:bg-card">
      <h3 className="mb-2 text-sm font-semibold text-heading">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="grid max-h-96 gap-1 overflow-y-auto">
          {tasks.map((task) => (
            <li key={task.id}>
              <Chip task={task} now={now} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
