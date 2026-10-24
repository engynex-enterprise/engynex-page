"use client";

import { useMemo } from "react";
import { AlarmClockPlus, Check, CheckSquare, MessageSquare, Repeat } from "lucide-react";
import type { TaskPriority } from "@/lib/supabase/types";
import { tasksProCopy } from "@/content/tasksPro";
import { tasksWorkspaceCopy } from "@/content/tasksWorkspace";
import { PriorityBadge, dayKey, fmtDue, typeIcon, type TaskRow, type TaskViewProps } from "./shared";
import { cn } from "@/lib/utils";

type Group = "overdue" | "today" | "tomorrow" | "week" | "later" | "noDate" | "done";
const ORDER: Group[] = ["overdue", "today", "tomorrow", "week", "later", "noDate", "done"];
const RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Lista agrupada por vencimiento (vencidas, hoy, mañana, esta semana, más
 * adelante, sin fecha) con selección para acciones en lote. Las completadas
 * van en un solo grupo, de la más reciente a la más antigua.
 */
export function TaskListView({
  locale,
  tasks,
  names,
  onOpen,
  onUpdate,
  selected,
  onSelect,
  onSelectMany,
  now,
  openId,
}: TaskViewProps & {
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectMany: (ids: string[], on: boolean) => void;
  now: number;
  openId: string | null;
}) {
  const t = tasksWorkspaceCopy[locale];
  const p = tasksProCopy[locale];

  const groups = useMemo(() => {
    const today = dayKey(now);
    const tomorrow = dayKey(now + 86_400_000);
    const weekEnd = now + 7 * 86_400_000;
    const by = Object.fromEntries(ORDER.map((g) => [g, [] as TaskRow[]])) as Record<Group, TaskRow[]>;
    for (const task of tasks) {
      if (task.done) by.done.push(task);
      else if (!task.due_at) by.noDate.push(task);
      else {
        const due = Date.parse(task.due_at);
        const key = dayKey(task.due_at);
        if (due < now && key !== today) by.overdue.push(task);
        else if (key === today) by.today.push(task);
        else if (key === tomorrow) by.tomorrow.push(task);
        else if (due < weekEnd) by.week.push(task);
        else by.later.push(task);
      }
    }
    for (const g of ORDER) {
      by[g].sort((a, b) =>
        g === "done"
          ? (b.completed_at ?? "").localeCompare(a.completed_at ?? "")
          : (a.due_at ?? "").localeCompare(b.due_at ?? "") || RANK[a.priority] - RANK[b.priority],
      );
    }
    return by;
  }, [tasks, now]);

  const postpone = (task: TaskRow) => {
    const base = task.due_at ? Date.parse(task.due_at) : now;
    const due = new Date(Math.max(base, now) + 86_400_000).toISOString();
    const shift = task.reminder_at && task.due_at ? Date.parse(task.due_at) - Date.parse(task.reminder_at) : null;
    onUpdate(task.id, { due_at: due, ...(shift !== null ? { reminder_at: new Date(Date.parse(due) - shift).toISOString() } : {}) });
  };

  return (
    <div className="grid gap-6">
      {ORDER.map((g) => {
        const list = groups[g];
        if (list.length === 0) return null;
        const allOn = list.every((x) => selected.has(x.id));
        return (
          <section key={g} aria-label={t.groups[g]}>
            <div className="mb-1 flex items-center gap-2 border-b border-line pb-2">
              <input
                type="checkbox"
                checked={allOn}
                onChange={() => onSelectMany(list.map((x) => x.id), !allOn)}
                aria-label={`${t.groups[g]} (${list.length})`}
                className="h-4 w-4 rounded accent-brand-green-dark"
              />
              <h2 className={cn("text-[0.95rem] font-semibold", g === "overdue" ? "text-red-600 dark:text-red-400" : "text-heading")}>{t.groups[g]}</h2>
              <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{list.length}</span>
            </div>
            <ul>
              {list.map((task) => {
                const Icon = typeIcon[task.type];
                const overdue = !task.done && !!task.due_at && Date.parse(task.due_at) < now;
                const steps = task.checklist?.length ?? 0;
                const stepsDone = task.checklist?.filter((c) => c.done).length ?? 0;
                const owner = task.assigned_to ? names[task.assigned_to] ?? "—" : null;
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "group flex min-h-[3.5rem] items-center gap-3 border-b border-line px-1 transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]",
                      openId === task.id && "bg-[var(--meta-active)]/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(task.id)}
                      onChange={() => onSelect(task.id)}
                      aria-label={task.title}
                      className="h-4 w-4 shrink-0 rounded accent-brand-green-dark"
                    />
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.done}
                      aria-label={task.done ? t.reopen : t.complete}
                      title={task.done ? t.reopen : t.complete}
                      onClick={() => onUpdate(task.id, { status: task.done ? "todo" : "done", done: !task.done })}
                      className={cn(
                        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors",
                        task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong hover:border-brand-green-dark hover:bg-[var(--meta-active)]",
                      )}
                    >
                      {task.done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                    </button>
                    <button type="button" onClick={() => onOpen(task.id)} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
                      <Icon className="h-4 w-4 shrink-0 text-muted" aria-label={p.types[task.type]} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[0.93rem]", task.done ? "text-muted line-through" : "font-medium text-heading")}>{task.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                          {task.status === "in_progress" || task.status === "waiting" ? <span>{p.statuses[task.status]}</span> : null}
                          {task.lead_name && <span className="truncate">{task.lead_name}</span>}
                          {steps > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" aria-hidden />
                              {stepsDone}/{steps}
                            </span>
                          )}
                          {task.comments > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" aria-hidden />
                              {task.comments}
                            </span>
                          )}
                          {task.recurrence !== "none" && (
                            <span className="inline-flex items-center gap-1" title={p.recurrences[task.recurrence]}>
                              <Repeat className="h-3 w-3" aria-hidden />
                              {t.repeats}
                            </span>
                          )}
                          {task.tags.slice(0, 2).map((x) => (
                            <span key={x} className="rounded bg-card-soft px-1 dark:bg-white/[0.08]">#{x}</span>
                          ))}
                        </span>
                      </span>
                    </button>
                    {task.priority !== "medium" && <PriorityBadge priority={task.priority} label={p.priorities[task.priority]} className="max-sm:hidden" />}
                    <span className={cn("hidden w-32 shrink-0 text-right text-xs sm:block", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted")}>
                      {task.due_at ? fmtDue(locale, task.due_at) : ""}
                    </span>
                    <span
                      title={owner ?? p.unassigned}
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold",
                        owner ? "bg-deep-700/10 text-deep-700 dark:bg-white/10 dark:text-white" : "border border-dashed border-line-strong text-muted",
                      )}
                    >
                      {owner ? initials(owner) : "?"}
                    </span>
                    {!task.done && (
                      <button
                        type="button"
                        onClick={() => postpone(task)}
                        aria-label={t.postpone}
                        title={t.postpone}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted opacity-0 hover:bg-[var(--meta-hover)] hover:text-heading focus:opacity-100 group-hover:opacity-100"
                      >
                        <AlarmClockPlus className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
