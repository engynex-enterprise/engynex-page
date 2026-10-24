import { CalendarClock, Circle, Mail, MessageCircle, Phone, RefreshCw, type LucideIcon } from "lucide-react";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Una tarea con los nombres que la lista necesita. */
export type TaskRow = Task & { lead_name: string | null; ticket_number: number | null; comments: number };

/** Lo que reciben las vistas (lista, tablero, calendario). */
export type TaskViewProps = {
  locale: Locale;
  tasks: TaskRow[];
  names: Record<string, string>;
  /** Abrir el panel de la tarea. */
  onOpen: (id: string) => void;
  /** Guardar cambios de una tarea (optimista; la página se sincroniza en vivo). */
  onUpdate: (id: string, patch: Partial<Task>) => void;
};

export const STATUSES: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];
export const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];
export const TYPES: TaskType[] = ["call", "email", "whatsapp", "meeting", "follow_up", "other"];

export const priorityTone: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  medium: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  low: "bg-card-soft text-muted dark:bg-white/[0.06]",
};

export const statusDot: Record<TaskStatus, string> = {
  todo: "bg-zinc-400",
  in_progress: "bg-sky-500",
  waiting: "bg-amber-500",
  done: "bg-emerald-500",
};

export const typeIcon: Record<TaskType, LucideIcon> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: CalendarClock,
  follow_up: RefreshCw,
  other: Circle,
};

export function PriorityBadge({ priority, label, className }: { priority: TaskPriority; label: string; className?: string }) {
  return <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-[0.7rem] font-semibold", priorityTone[priority], className)}>{label}</span>;
}

/** Fecha corta de vencimiento en hora de Colombia. */
export const fmtDue = (locale: Locale, iso: string, withTime = true) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/Bogota",
  }).format(new Date(iso));

/** aaaa-mm-dd en Colombia. */
export const dayKey = (iso: string | number | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));

/** Consulta de tareas con lo que la vista necesita. */
export const TASK_SELECT = "*, leads(name), tickets(number), task_comments(count)";

/** Fila de Supabase (con relaciones) → TaskRow. */
export function toTaskRow(row: Record<string, unknown>): TaskRow {
  const { leads, tickets, task_comments, ...task } = row as Task & {
    leads: { name: string } | null;
    tickets: { number: number } | null;
    task_comments: { count: number }[] | null;
  };
  return { ...(task as Task), lead_name: leads?.name ?? null, ticket_number: tickets?.number ?? null, comments: task_comments?.[0]?.count ?? 0 };
}
