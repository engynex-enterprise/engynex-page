import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { CrmBoard, type CrmLead } from "@/components/crm/CrmBoard";
import { crmCopy } from "@/content/crm";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";

export default async function CrmPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = crmCopy[locale].crm;

  const [{ data: leads }, employees] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, name, email, company, tier, score, status, assigned_to, value_cop, created_at, last_activity_at, problem_category",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    listEmployees(supabase),
  ]);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <CrmBoard
        locale={locale}
        initialLeads={(leads ?? []) as CrmLead[]}
        employees={employees}
        canEdit={["admin", "sales"].includes(profile.role)}
        currentUserId={profile.id}
      />
    </>
  );
}
