import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { RuleEditor } from "@/components/automations/RuleEditor";
import { RuleRunsPanel, type RuleStats } from "@/components/automations/RuleRunsPanel";
import { rulesCopy } from "@/content/rules";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { AutomationRule, AutomationRun, WaTemplate } from "@/lib/supabase/types";

export default async function EditRulePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { data } = await supabase.from("automation_rules").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const rule = data as AutomationRule;
  const [employees, { data: templates }, { data: folders }, { data: stats }, { data: runs }] = await Promise.all([
    listEmployees(supabase),
    supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name"),
    supabase.from("automation_rules").select("folder").not("folder", "is", null),
    supabase.rpc("automation_stats", { p_days: 30, p_rule: id }),
    supabase.from("automation_runs").select("*").eq("rule_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const s = (stats ?? { total: 0, failed: 0, pending: 0, daily: [] }) as unknown as RuleStats;

  return (
    <>
      <Link href={`/${locale}/portal/automatizaciones`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {rulesCopy.editor.back}
      </Link>
      <PageHeader title={rule.name} subtitle={rule.description ?? rulesCopy.editor.editTitle} />
      <RuleEditor
        key={rule.updated_at}
        locale={locale}
        rule={rule}
        employees={employees}
        templates={(templates ?? []) as WaTemplate[]}
        folders={[...new Set((folders ?? []).map((f) => f.folder as string))]}
        canEdit={profile.role === "admin" || profile.role === "marketing"}
        extra={<RuleRunsPanel locale={locale} stats={s} runs={(runs ?? []) as AutomationRun[]} />}
      />
    </>
  );
}
