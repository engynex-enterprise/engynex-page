import type { Locale } from "@/i18n/config";

/** Textos de las vistas de tablero y calendario de tareas. */
const es = {
  board: {
    label: "Tablero de tareas",
    empty: "Arrastra tareas aquí",
    showMore: "Mostrar más ({n})",
    dragHint: "Arrastra una tarjeta para cambiar su estado.",
    moved: "{title} pasó a {status}.",
    handle: "Mover {title}",
    unassigned: "Sin asignar",
    comments: "{n} comentarios",
    checklist: "Pasos completados: {done} de {total}",
  },
  calendar: {
    label: "Calendario de tareas",
    prev: "Mes anterior",
    next: "Mes siguiente",
    today: "Hoy",
    more: "+{n} más",
    noDate: "Sin fecha",
    noDateEmpty: "Todas las tareas tienen fecha.",
    day: "Tareas del {date}",
    dayEmpty: "Sin tareas este día.",
    close: "Cerrar",
    moved: "{title} se movió al {date}.",
    dragHint: "Arrastra una tarea a otro día para reprogramarla.",
    tasks: "{n} tareas",
  },
};

export type TasksViewsCopy = typeof es;

const en: TasksViewsCopy = {
  board: {
    label: "Task board",
    empty: "Drag tasks here",
    showMore: "Show more ({n})",
    dragHint: "Drag a card to change its status.",
    moved: "{title} moved to {status}.",
    handle: "Move {title}",
    unassigned: "Unassigned",
    comments: "{n} comments",
    checklist: "Steps done: {done} of {total}",
  },
  calendar: {
    label: "Task calendar",
    prev: "Previous month",
    next: "Next month",
    today: "Today",
    more: "+{n} more",
    noDate: "No date",
    noDateEmpty: "Every task has a date.",
    day: "Tasks on {date}",
    dayEmpty: "No tasks this day.",
    close: "Close",
    moved: "{title} moved to {date}.",
    dragHint: "Drag a task to another day to reschedule it.",
    tasks: "{n} tasks",
  },
};

export const tasksViewsCopy: Record<Locale, TasksViewsCopy> = { es, en };
