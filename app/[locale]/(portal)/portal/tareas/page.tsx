import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { TasksBoard, type TaskRow } from "@/components/crm/TasksBoard";
import { crmCopy } from "@/content/crm";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = crmCopy[locale].tasks;

  const [{ data }, employees] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, leads(name)")
      .eq("done", false)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(500),
    listEmployees(supabase),
  ]);

  const rows: TaskRow[] = (data ?? []).map((row) => {
    const { leads, ...task } = row as typeof row & { leads: { name: string } | null };
    return { ...task, lead_name: leads?.name ?? null };
  });

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <TasksBoard
        locale={locale}
        initial={rows}
        currentUserId={profile.id}
        names={Object.fromEntries(employees.map((e) => [e.id, e.name]))}
      />
    </>
  );
}
