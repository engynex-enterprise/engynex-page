import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { RuleEditor } from "@/components/automations/RuleEditor";
import { rulesCopy } from "@/content/rules";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { AutomationRule, WaTemplate } from "@/lib/supabase/types";

export default async function EditRulePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { data: rule } = await supabase.from("automation_rules").select("*").eq("id", id).maybeSingle();
  if (!rule) notFound();
  const [employees, { data: templates }] = await Promise.all([
    listEmployees(supabase),
    supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name"),
  ]);
  return (
    <>
      <Link href={`/${locale}/portal/automatizaciones`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {rulesCopy.editor.back}
      </Link>
      <PageHeader title={(rule as AutomationRule).name} subtitle={rulesCopy.editor.editTitle} />
      <RuleEditor
        locale={locale}
        rule={rule as AutomationRule}
        employees={employees}
        templates={(templates ?? []) as WaTemplate[]}
        canEdit={profile.role === "admin" || profile.role === "marketing"}
      />
    </>
  );
}
