import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { ApprovalCard, CommentComposer } from "@/components/projects/ClientProjectActions";
import { MilestoneTimeline, UpdatesFeed } from "@/components/projects/ProjectTimeline";
import { fmtDay, ProgressBar, ProjectStatusChip } from "@/components/projects/shared";
import { projectsCopy } from "@/content/projects";
import { services } from "@/content/services";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { nowIso } from "@/lib/dates";
import type { ClientProject, ProjectMilestone, ProjectUpdate } from "@/lib/supabase/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider"]);
  const t = projectsCopy[locale];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(nowIso()));

  const { data: row } = await supabase.from("client_projects").select("*").eq("id", id).eq("account_id", profile.id).maybeSingle();
  if (!row) notFound();
  const project = row as ClientProject;
  const [{ data: ms }, { data: ups }, { data: manager }] = await Promise.all([
    supabase.from("project_milestones").select("*").eq("project_id", id).order("position"),
    supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.rpc("project_manager_name", { p_project: id }),
  ]);
  const milestones = (ms ?? []) as ProjectMilestone[];
  const updates = (ups ?? []) as ProjectUpdate[];
  const approvals = milestones.filter((m) => m.needs_approval);
  // Primero lo que espera al cliente, luego lo ya revisado.
  approvals.sort((a, b) => Number(b.approval_status === "pending") - Number(a.approval_status === "pending") || a.position - b.position);
  const service = project.service_slug ? services.find((s) => s.slug === project.service_slug)?.[locale].title : null;
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

  return (
    <>
      <PageHeader title={project.name} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="border-b border-line px-4 py-5 sm:px-6">
          <Link href={`/${locale}/portal/proyectos`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-heading [overflow-wrap:anywhere]">{project.name}</h2>
            <ProjectStatusChip locale={locale} status={project.status} />
          </div>
          {service && <p className="mt-0.5 text-sm text-muted">{service}</p>}
          {project.description && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm text-body">{project.description}</p>}
          <div className="mt-4 max-w-xl">
            <ProgressBar value={project.progress} label={t.progress} />
          </div>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-muted">{t.manager}</dt>
              <dd className="font-medium text-heading">{manager || t.team}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.start}</dt>
              <dd className="font-medium text-heading">{fmtDay(locale, project.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.due}</dt>
              <dd className="font-medium text-heading">{fmtDay(locale, project.due_date)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            {approvals.length > 0 && (
              <section id="aprobaciones" className="scroll-mt-20 space-y-3">
                {approvals.map((m) => (
                  <ApprovalCard key={m.id} locale={locale} milestone={m} />
                ))}
              </section>
            )}
            <section className={card}>
              <h3 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.updates}</h3>
              <CommentComposer locale={locale} projectId={project.id} />
              <div className="mt-6 border-t border-line pt-5">
                <UpdatesFeed locale={locale} updates={updates} />
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-6">
            <section className={card}>
              <h3 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.milestones}</h3>
              <MilestoneTimeline locale={locale} milestones={milestones} today={today} />
            </section>
            <section className={card}>
              <h3 className="text-[0.98rem] font-semibold text-heading">{t.quick.title}</h3>
              <div className="mt-3 grid gap-1">
                <Link href={`/${locale}/portal/soporte/nueva`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-heading hover:bg-[var(--meta-hover)]">
                  <LifeBuoy className="h-4 w-4" aria-hidden />
                  {t.quick.ticket}
                </Link>
                <Link href={`/${locale}/portal/documentos`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-heading hover:bg-[var(--meta-hover)]">
                  <FileText className="h-4 w-4" aria-hidden />
                  {t.quick.docs}
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
