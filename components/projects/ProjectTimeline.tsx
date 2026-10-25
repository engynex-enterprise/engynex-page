import { AlertTriangle, Check, ExternalLink, MessageCircleQuestion, Package, Megaphone, User } from "lucide-react";
import { fmtDay, milestoneState } from "@/components/projects/shared";
import { projectsCopy } from "@/content/projects";
import type { Locale } from "@/i18n/config";
import type { ProjectMilestone, ProjectUpdate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** Línea de tiempo vertical de hitos: cumplido, pendiente o atrasado. */
export function MilestoneTimeline({ locale, milestones, today }: { locale: Locale; milestones: ProjectMilestone[]; today: string }) {
  const t = projectsCopy[locale];
  if (!milestones.length) return <p className="text-sm text-muted">{t.noMilestones}</p>;
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const state = milestoneState(m, today);
        return (
          <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < milestones.length - 1 && (
              <span aria-hidden className={cn("absolute left-[0.9rem] top-8 bottom-0 w-0.5", state === "done" ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line")} />
            )}
            <span
              className={cn(
                "relative z-[1] grid h-7.5 w-7.5 shrink-0 place-items-center rounded-full ring-4 ring-surface dark:ring-card",
                state === "done" && "bg-brand-green-dark text-white dark:bg-brand-green dark:text-deep-700",
                state === "overdue" && "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
                state === "pending" && "border-2 border-line-strong bg-surface text-muted dark:bg-card",
              )}
            >
              {state === "done" ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : state === "overdue" ? (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <span className="text-xs font-semibold tabular-nums">{i + 1}</span>
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-heading">{m.title}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                    state === "done" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
                    state === "overdue" && "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
                    state === "pending" && "bg-surface-soft text-muted dark:bg-white/[0.06]",
                  )}
                >
                  {t[state]}
                </span>
                {m.needs_approval && m.approval_status === "pending" && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.7rem] font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-300">
                    {t.awaitingYou}
                  </span>
                )}
                {m.needs_approval && m.approval_status === "changes_requested" && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[0.7rem] font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                    {t.changesRequested}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {m.done_at ? t.doneOn.replace("{date}", fmtDay(locale, m.done_at)) : m.due_date ? t.dueOn.replace("{date}", fmtDay(locale, m.due_date)) : null}
              </p>
              {m.description && <p className="mt-1 whitespace-pre-line text-sm text-body">{m.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const KIND_ICON = { update: Megaphone, delivery: Package, question: MessageCircleQuestion, client: User } as const;

/** Novedades del proyecto, la más reciente primero. */
export function UpdatesFeed({
  locale,
  updates,
  names,
  staff = false,
}: {
  locale: Locale;
  updates: ProjectUpdate[];
  /** Nombre de cada autor del equipo (en el portal del cliente basta "Equipo Engynex"). */
  names?: Record<string, string>;
  staff?: boolean;
}) {
  const t = projectsCopy[locale];
  if (!updates.length) return <p className="text-sm text-muted">{t.noUpdates}</p>;
  const when = new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });
  return (
    <ul className="divide-y divide-line">
      {updates.map((u) => {
        const Icon = KIND_ICON[u.kind];
        const mine = u.kind === "client";
        const author = mine ? (staff ? t.staff.clientSaid.replace(":", "") : t.kinds.client) : (u.author_id && names?.[u.author_id]) || t.team;
        return (
          <li key={u.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                mine ? "bg-[var(--meta-active)] text-heading" : u.kind === "delivery" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : u.kind === "question" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold text-heading">{author}</span>
                {!mine && <span className="text-xs font-medium text-muted">· {t.kinds[u.kind]}</span>}
                {staff && !u.visible_to_client && <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[0.68rem] font-semibold text-muted dark:bg-white/[0.06]">{t.staff.internal}</span>}
                <span className="text-xs text-muted">{when.format(new Date(u.created_at))}</span>
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-body [overflow-wrap:anywhere]">{u.body}</p>
              {u.link_url && (
                <a href={u.link_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {t.openLink}
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
