import type { Locale } from "@/i18n/config";
import type { ProjectMilestone, ProjectStatus } from "@/lib/supabase/types";
import { projectsCopy } from "@/content/projects";
import { cn } from "@/lib/utils";

export const STATUS_TONE: Record<ProjectStatus, string> = {
  planning: "bg-surface-soft text-heading dark:bg-white/[0.06]",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  review: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  cancelled: "bg-surface-soft text-muted line-through dark:bg-white/[0.06]",
};

export const PROJECT_STATUSES = Object.keys(STATUS_TONE) as ProjectStatus[];

export function ProjectStatusChip({ locale, status }: { locale: Locale; status: ProjectStatus }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_TONE[status])}>
      {projectsCopy[locale].statuses[status] ?? status}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--meta-active)]"
      >
        <div className="h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-heading">{value}%</span>
    </div>
  );
}

/** Fecha corta (las columnas `date` llegan como "AAAA-MM-DD"). */
export function fmtDay(locale: Locale, iso: string | null) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(d);
}

export type MilestoneState = "done" | "overdue" | "pending";

/** `today` es "AAAA-MM-DD" calculado en el servidor (hora de Bogotá). */
export function milestoneState(m: ProjectMilestone, today: string): MilestoneState {
  if (m.done_at) return "done";
  return m.due_date && m.due_date < today ? "overdue" : "pending";
}

/** Primer hito sin cumplir, en el orden del proyecto. */
export function nextMilestone(ms: ProjectMilestone[]) {
  return [...ms].sort((a, b) => a.position - b.position).find((m) => !m.done_at) ?? null;
}
