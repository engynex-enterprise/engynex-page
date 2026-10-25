import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, FolderKanban, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { fmtDay, nextMilestone, ProgressBar, ProjectStatusChip } from "@/components/projects/shared";
import { projectsCopy } from "@/content/projects";
import { services } from "@/content/services";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { nowIso } from "@/lib/dates";
import type { ClientProject, ProjectMilestone } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider"]);
  const t = projectsCopy[locale];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(nowIso()));

  const { data: rows } = await supabase.from("client_projects").select("*").eq("account_id", profile.id).order("updated_at", { ascending: false });
  const projects = (rows ?? []) as ClientProject[];
  const { data: msRows } = projects.length
    ? await supabase.from("project_milestones").select("*").in("project_id", projects.map((p) => p.id)).order("position")
    : { data: [] };
  const milestones = (msRows ?? []) as ProjectMilestone[];
  const byProject = new Map<string, ProjectMilestone[]>();
  for (const m of milestones) byProject.set(m.project_id, [...(byProject.get(m.project_id) ?? []), m]);

  const live = projects.filter((p) => !["delivered", "cancelled"].includes(p.status));
  const awaiting = milestones.filter((m) => m.needs_approval && m.approval_status === "pending");
  const upcoming = milestones
    .filter((m) => !m.done_at && m.due_date && live.some((p) => p.id === m.project_id))
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];
  const kpis = [
    { key: "active", value: String(live.length) },
    { key: "approvals", value: String(awaiting.length), tone: awaiting.length > 0 },
    { key: "next", value: upcoming ? `${upcoming.title} · ${fmtDay(locale, upcoming.due_date)}` : t.noNext, small: true, tone: !!upcoming && upcoming.due_date! < today },
    { key: "delivered", value: String(projects.filter((p) => p.status === "delivered").length) },
  ] as const;
  const serviceTitle = (slug: string | null) => (slug ? services.find((s) => s.slug === slug)?.[locale].title : null);
  const base = `/${locale}/portal/proyectos`;

  return (
    <>
      <PageHeader title={t.title} count={projects.length} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.key} className="min-w-0 border-b border-line px-6 py-4 sm:border-r lg:border-b-0 lg:[&:nth-child(4n)]:border-r-0">
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p
                className={cn(
                  "mt-1 font-semibold leading-tight tabular-nums [overflow-wrap:anywhere]",
                  "small" in k && k.small ? "text-lg" : "text-[1.6rem] leading-none",
                  "tone" in k && k.tone ? "text-amber-700 dark:text-amber-400" : "text-heading",
                )}
              >
                {k.value}
              </p>
            </div>
          ))}
        </div>

        <div className="px-4 py-6 sm:px-6">
          {projects.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--meta-active)] text-heading">
                <FolderKanban className="h-7 w-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-heading">{t.emptyTitle}</h2>
              <p className="mt-2 text-sm text-muted">{t.emptyBody}</p>
              <Link href={`/${locale}/cotizar`} className={cn(buttonClasses("primary", "md"), "mt-6")}>
                {t.emptyCta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {projects.map((p) => {
                const ms = byProject.get(p.id) ?? [];
                const next = nextMilestone(ms);
                const toApprove = ms.filter((m) => m.needs_approval && m.approval_status === "pending").length;
                const service = serviceTitle(p.service_slug);
                return (
                  <li key={p.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 dark:bg-card">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--meta-active)] text-heading">
                        <FolderKanban className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`${base}/${p.id}`} className="text-lg font-semibold text-heading [overflow-wrap:anywhere] hover:underline">
                            {p.name}
                          </Link>
                          <ProjectStatusChip locale={locale} status={p.status} />
                        </div>
                        {service && <p className="mt-0.5 text-sm text-muted">{service}</p>}
                      </div>
                    </div>
                    {toApprove > 0 && (
                      <Link
                        href={`${base}/${p.id}#aprobaciones`}
                        className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 hover:brightness-95 dark:bg-violet-500/15 dark:text-violet-300"
                      >
                        <Hourglass className="h-3.5 w-3.5" aria-hidden />
                        {t.awaitingYou} · {toApprove}
                      </Link>
                    )}
                    <div className="mt-4">
                      <ProgressBar value={p.progress} label={t.progress} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-muted">{t.start}</dt>
                        <dd className="font-medium text-heading">{fmtDay(locale, p.start_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">{t.due}</dt>
                        <dd className="font-medium text-heading">{fmtDay(locale, p.due_date)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted">{t.nextMilestone}</dt>
                        <dd className="flex flex-wrap items-center gap-x-2 font-medium text-heading">
                          {next ? next.title : t.noNext}
                          {next?.due_date && (
                            <span className={cn("inline-flex items-center gap-1 text-xs font-normal", next.due_date < today ? "text-amber-700 dark:text-amber-400" : "text-muted")}>
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                              {fmtDay(locale, next.due_date)}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex justify-end pt-4">
                      <Link href={`${base}/${p.id}`} className={cn(buttonClasses("dark", "md"), "h-9 px-3.5")}>
                        {t.open}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
