"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/supabase/types";
import { crmCopy } from "@/content/crm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type TaskRow = Task & { lead_name: string | null };

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));

/** Tareas pendientes agrupadas: vencidas, hoy, próximas y sin fecha. */
export function TasksBoard({
  locale,
  initial,
  currentUserId,
  names,
}: {
  locale: Locale;
  initial: TaskRow[];
  currentUserId: string;
  names: Record<string, string>;
}) {
  const t = crmCopy[locale].tasks;
  const [tasks, setTasks] = useState(initial);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  // Hora de referencia (se fija al montar).
  const [now] = useState(() => Date.now());
  const today = dayKey(new Date(now).toISOString());

  const groups = useMemo(() => {
    const list = tasks.filter((task) => !task.done && (scope === "all" || task.assigned_to === currentUserId));
    const by = { overdue: [] as TaskRow[], today: [] as TaskRow[], upcoming: [] as TaskRow[], noDate: [] as TaskRow[] };
    for (const task of list) {
      if (!task.due_at) by.noDate.push(task);
      else if (Date.parse(task.due_at) < now && dayKey(task.due_at) !== today) by.overdue.push(task);
      else if (dayKey(task.due_at) === today) by.today.push(task);
      else by.upcoming.push(task);
    }
    return by;
  }, [tasks, scope, currentUserId, now, today]);

  const toggle = async (task: TaskRow) => {
    setTasks((list) => list.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));
    const { error } = await createClient().from("tasks").update({ done: !task.done }).eq("id", task.id);
    if (error) setTasks((list) => list.map((x) => (x.id === task.id ? task : x)));
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }).format(new Date(iso));

  const total = Object.values(groups).reduce((n, g) => n + g.length, 0);

  return (
    <div>
      <div role="group" aria-label={t.title} className="mb-6 flex gap-1.5">
        {(["mine", "all"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={scope === k}
            onClick={() => setScope(k)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
              scope === k ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface",
            )}
          >
            {k === "mine" ? t.mine : t.all}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center text-sm text-muted shadow-meta dark:bg-card">{t.empty}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(["overdue", "today", "upcoming", "noDate"] as const).map((key) =>
            groups[key].length === 0 ? null : (
              <section key={key} className="rounded-lg bg-surface p-6 shadow-meta dark:bg-card">
                <h2 className={cn("text-lg", key === "overdue" ? "text-red-600 dark:text-red-400" : "text-heading")}>
                  {t[key]} <span className="font-normal text-muted">· {groups[key].length}</span>
                </h2>
                <ul className="mt-4 divide-y divide-line">
                  {groups[key].map((task) => (
                    <li key={task.id} className="flex items-start gap-3 py-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.done}
                        aria-label={task.title}
                        onClick={() => toggle(task)}
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-line-strong hover:border-deep-700"
                      >
                        {task.done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-heading">{task.title}</p>
                        <p className="text-xs text-muted">
                          {task.due_at && <span className="first-letter:uppercase">{fmt(task.due_at)}</span>}
                          {task.lead_id && task.lead_name && (
                            <>
                              {task.due_at && " · "}
                              <Link href={`/${locale}/portal/crm/${task.lead_id}`} className="font-semibold text-heading hover:underline">
                                {task.lead_name}
                              </Link>
                            </>
                          )}
                          {scope === "all" && task.assigned_to && ` · ${names[task.assigned_to] ?? ""}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
