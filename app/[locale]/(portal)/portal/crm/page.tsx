import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { LeadsWorkspace, type CrmKpis, type WorkspaceLead } from "@/components/crm/leads/LeadsWorkspace";
import { crmPlus } from "@/content/crmPlus";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { nowIso } from "@/lib/dates";

export default async function CrmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { lead } = await searchParams;

  const [{ data: leads, count }, employees, { data: favorites }, { data: overdue }, { data: kpis }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, name, email, phone, company, tier, score, status, assigned_to, value_cop, created_at, last_activity_at, problem_category, problem_text, source, utm, gclid, referrer",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .limit(2000),
    listEmployees(supabase),
    supabase.from("lead_favorites").select("lead_id").eq("user_id", profile.id),
    supabase.from("tasks").select("lead_id").eq("done", false).lt("due_at", nowIso()).not("lead_id", "is", null),
    supabase.rpc("crm_kpis", { p_days: 14 }),
  ]);

  return (
    <>
      <PageHeader title={crmPlus.title} count={count ?? leads?.length ?? 0} />
      <LeadsWorkspace
        locale={locale}
        initialLeads={(leads ?? []) as WorkspaceLead[]}
        employees={employees}
        favorites={(favorites ?? []).map((f) => f.lead_id)}
        overdue={[...new Set((overdue ?? []).map((o) => o.lead_id as string))]}
        kpis={kpis as unknown as CrmKpis}
        canEdit={["admin", "sales"].includes(profile.role)}
        isAdmin={profile.role === "admin"}
        me={{ id: profile.id, name: profile.full_name ?? profile.email }}
        openId={lead ?? null}
      />
    </>
  );
}
