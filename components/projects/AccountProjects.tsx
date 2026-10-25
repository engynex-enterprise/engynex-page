import { ProjectsManager } from "@/components/projects/ProjectsManager";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { ClientProject, ProjectMilestone, ProjectUpdate } from "@/lib/supabase/types";

/** Pestaña "Proyectos" de la ficha del cliente (solo equipo). */
export async function AccountProjects({
  locale,
  accountId,
  employees,
  today,
}: {
  locale: Locale;
  accountId: string;
  employees: { id: string; name: string }[];
  today: string;
}) {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("client_projects").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
  const projects = (rows ?? []) as ClientProject[];
  const ids = projects.map((p) => p.id);
  const [{ data: ms }, { data: ups }] = ids.length
    ? await Promise.all([
        supabase.from("project_milestones").select("*").in("project_id", ids).order("position"),
        supabase.from("project_updates").select("*").in("project_id", ids).order("created_at", { ascending: false }).limit(500),
      ])
    : [{ data: [] }, { data: [] }];
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));

  return (
    <ProjectsManager
      locale={locale}
      accountId={accountId}
      projects={projects}
      milestones={(ms ?? []) as ProjectMilestone[]}
      updates={(ups ?? []) as ProjectUpdate[]}
      employees={employees}
      services={services.map((s) => ({ value: s.slug, label: s[locale].title }))}
      names={names}
      today={today}
    />
  );
}
