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
import { GripVertical, MessageSquare } from "lucide-react";
import type { TaskStatus } from "@/lib/supabase/types";
import { tasksProCopy } from "@/content/tasksPro";
import { tasksViewsCopy } from "@/content/tasksViews";
import { PriorityBadge, STATUSES, fmtDue, statusDot, typeIcon, type TaskRow, type TaskViewProps } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const DONE_PAGE = 30;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Tablero de tareas por estado (Por hacer, En curso, En espera, Hecha).
 * Arrastrar una tarjeta a otra columna cambia su estado; con teclado se usa
 * el asa de la tarjeta (Espacio para tomarla, flechas y Espacio para soltarla).
 */
export function TaskBoardView({ locale, tasks, names, onOpen, onUpdate }: TaskViewProps) {
  const t = tasksViewsCopy[locale].board;
  const labels = tasksProCopy[locale];
  const [dragging, setDragging] = useState<TaskRow | null>(null);
  const [doneShown, setDoneShown] = useState(DONE_PAGE);
  const [announcement, setAnnouncement] = useState("");
  // Hora de referencia para marcar lo vencido (se actualiza cada minuto).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const columns = useMemo(() => {
    const by = Object.fromEntries(STATUSES.map((s) => [s, [] as TaskRow[]])) as Record<TaskStatus, TaskRow[]>;
    for (const task of tasks) by[task.status]?.push(task);
    // Pendientes: primero lo que vence antes; hechas: lo último completado.
    for (const s of STATUSES) {
      by[s].sort((a, b) =>
        s === "done"
          ? (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at)
          : (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"),
      );
    }
    return by;
  }, [tasks]);

  const onDragStart = (event: DragStartEvent) => setDragging(tasks.find((x) => x.id === event.active.id) ?? null);
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const task = tasks.find((x) => x.id === event.active.id);
    const status = event.over?.id as TaskStatus | undefined;
    if (!task || !status || task.status === status) return;
    onUpdate(task.id, { status });
    setAnnouncement(t.moved.replace("{title}", task.title).replace("{status}", labels.statuses[status]));
  };

  return (
    <div>
      <p className="mb-3 text-xs text-muted">{t.dragHint}</p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div role="region" aria-label={t.label} className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {STATUSES.map((status) => {
            const all = columns[status];
            const list = status === "done" ? all.slice(0, doneShown) : all;
            return (
              <Column key={status} status={status} title={labels.statuses[status]} count={all.length} empty={t.empty}>
                {list.map((task) => (
                  <Card key={task.id} task={task} locale={locale} names={names} now={now} onOpen={onOpen} />
                ))}
                {status === "done" && all.length > doneShown && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setDoneShown((n) => n + DONE_PAGE)}
                      className="h-9 w-full rounded-lg text-sm font-medium text-accent hover:bg-[var(--meta-hover)]"
                    >
                      {t.showMore.replace("{n}", String(all.length - doneShown))}
                    </button>
                  </li>
                )}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{dragging && <CardBody task={dragging} locale={locale} names={names} now={now} lifted />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  title,
  count,
  empty,
  children,
}: {
  status: TaskStatus;
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} · ${count}`}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl p-2.5 transition-colors xl:w-auto xl:min-w-0 xl:flex-1",
        isOver ? "bg-[var(--meta-active)] ring-2 ring-brand-green/50" : "bg-[#f4f4f5] dark:bg-white/[0.03]",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        <span className={cn("h-2.5 w-2.5 rounded-full", statusDot[status])} aria-hidden />
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
        <span className="rounded-md bg-surface px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{count}</span>
      </header>
      <ul className="grid min-h-28 content-start gap-2">
        {count === 0 ? (
          <li className="grid h-24 place-items-center rounded-lg border border-dashed border-line-strong text-xs text-muted">{empty}</li>
        ) : (
          children
        )}
      </ul>
    </section>
  );
}

function Card({
  task,
  locale,
  names,
  now,
  onOpen,
}: {
  task: TaskRow;
  locale: Locale;
  names: Record<string, string>;
  now: number;
  onOpen: (id: string) => void;
}) {
  const t = tasksViewsCopy[locale].board;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  // El puntero arrastra desde toda la tarjeta; el teclado, desde el asa.
  const { onPointerDown, onKeyDown } = (listeners ?? {}) as {
    onPointerDown?: React.PointerEventHandler;
    onKeyDown?: React.KeyboardEventHandler;
  };
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={cn("group relative", isDragging && "opacity-40")}>
      <div onPointerDown={onPointerDown} className="cursor-grab touch-none active:cursor-grabbing">
        <button type="button" onClick={() => onOpen(task.id)} className="block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-green">
          <CardBody task={task} locale={locale} names={names} now={now} />
        </button>
      </div>
      <span
        {...attributes}
        onKeyDown={onKeyDown}
        aria-label={t.handle.replace("{title}", task.title)}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md text-muted opacity-0 outline-none hover:bg-[var(--meta-hover)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-green group-hover:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </span>
    </li>
  );
}

function CardBody({
  task,
  locale,
  names,
  now,
  lifted = false,
}: {
  task: TaskRow;
  locale: Locale;
  names: Record<string, string>;
  now: number;
  lifted?: boolean;
}) {
  const t = tasksViewsCopy[locale].board;
  const labels = tasksProCopy[locale];
  const Icon = typeIcon[task.type];
  const overdue = !task.done && !!task.due_at && Date.parse(task.due_at) < now;
  const owner = task.assigned_to ? names[task.assigned_to] : undefined;
  const steps = task.checklist ?? [];
  const stepsDone = steps.filter((s) => s.done).length;
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_0_0_1px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-[0_6px_16px_-6px_rgba(16,24,40,0.18),0_0_0_1px_rgba(16,24,40,0.08)] dark:bg-card",
        lifted && "rotate-2 shadow-[0_16px_32px_-8px_rgba(16,24,40,0.3)]",
      )}
    >
      <div className="flex items-start gap-2 pr-5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span className="sr-only">{labels.types[task.type]}:</span>
        <p className={cn("line-clamp-2 text-sm font-medium leading-snug text-heading", task.done && "text-muted line-through")}>{task.title}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} label={labels.priorities[task.priority]} />
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="inline-flex h-5 items-center rounded-md bg-card-soft px-1.5 text-[0.7rem] text-muted dark:bg-white/[0.06]">
            #{tag}
          </span>
        ))}
      </div>

      {task.lead_name && <p className="mt-2 truncate text-xs text-body">{task.lead_name}</p>}

      {steps.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2" title={t.checklist.replace("{done}", String(stepsDone)).replace("{total}", String(steps.length))}>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-card-soft dark:bg-white/10">
            <span className="block h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
          </span>
          <span className="text-[0.7rem] tabular-nums text-muted">
            {labels.checklist.replace("{done}", String(stepsDone)).replace("{total}", String(steps.length))}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={cn("min-w-0 flex-1 truncate first-letter:uppercase", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted")}>
          {task.due_at ? fmtDue(locale, task.due_at) : labels.noDate}
        </span>
        {task.comments > 0 && (
          <span className="inline-flex items-center gap-0.5 text-muted" title={t.comments.replace("{n}", String(task.comments))}>
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{task.comments}</span>
          </span>
        )}
        <span
          title={owner ?? t.unassigned}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold",
            owner ? "bg-deep-700/10 text-deep-700 dark:bg-white/10 dark:text-white" : "border border-dashed border-line-strong text-muted",
          )}
        >
          {owner ? initials(owner) : "?"}
          <span className="sr-only">{owner ?? t.unassigned}</span>
        </span>
      </div>
    </div>
  );
}
