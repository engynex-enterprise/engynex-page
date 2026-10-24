import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { RuleEditor } from "@/components/automations/RuleEditor";
import { rulesCopy } from "@/content/rules";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { WaTemplate } from "@/lib/supabase/types";

export default async function NewRulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
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
      <PageHeader title={rulesCopy.editor.newTitle} />
      <RuleEditor locale={locale} rule={null} employees={employees} templates={(templates ?? []) as WaTemplate[]} canEdit />
    </>
  );
}
