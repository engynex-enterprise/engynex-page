import type { Locale } from "@/i18n/config";
import type { TaskPriority, TaskRecurrence, TaskStatus, TaskType } from "@/lib/supabase/types";

/** Textos comunes del módulo de tareas. */
const es = {
  title: "Tareas",
  statuses: { todo: "Por hacer", in_progress: "En curso", waiting: "En espera", done: "Hecha" } satisfies Record<TaskStatus, string>,
  priorities: { urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja" } satisfies Record<TaskPriority, string>,
  types: {
    call: "Llamada",
    email: "Correo",
    whatsapp: "WhatsApp",
    meeting: "Reunión",
    follow_up: "Seguimiento",
    other: "Otra",
  } satisfies Record<TaskType, string>,
  recurrences: {
    none: "No se repite",
    daily: "Cada día",
    weekdays: "Días hábiles (lun–vie)",
    weekly: "Cada semana",
    monthly: "Cada mes",
  } satisfies Record<TaskRecurrence, string>,
  noDate: "Sin fecha",
  unassigned: "Sin asignar",
  overdue: "Vencida",
  checklist: "{done}/{total}",
};

export type TasksProCopy = typeof es;

const en: TasksProCopy = {
  title: "Tasks",
  statuses: { todo: "To do", in_progress: "In progress", waiting: "Waiting", done: "Done" },
  priorities: { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" },
  types: { call: "Call", email: "Email", whatsapp: "WhatsApp", meeting: "Meeting", follow_up: "Follow-up", other: "Other" },
  recurrences: { none: "Doesn't repeat", daily: "Every day", weekdays: "Weekdays (Mon–Fri)", weekly: "Every week", monthly: "Every month" },
  noDate: "No date",
  unassigned: "Unassigned",
  overdue: "Overdue",
  checklist: "{done}/{total}",
};

export const tasksProCopy: Record<Locale, TasksProCopy> = { es, en };
