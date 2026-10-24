import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { FollowupNav } from "@/components/followups/FollowupNav";
import { DraftsTable, type DraftsKpis } from "@/components/followups/DraftsTable";
import { automationCopy } from "@/content/automation";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { nowIso } from "@/lib/dates";
import type { LeadDraft } from "@/lib/supabase/types";

export default async function DraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const since = new Date(new Date(nowIso()).getTime() - 30 * 86_400_000).toISOString();
  const [{ data: drafts }, { data: report }] = await Promise.all([
    supabase
      .from("lead_drafts")
      .select("*")
      .is("completed_at", null)
      .gte("created_at", since)
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase.rpc("followup_report", { p_days: 30 }),
  ]);
  const kpis = ((report as { abandoned?: DraftsKpis } | null)?.abandoned ?? { drafts: 0, reminded: 0, recovered: 0 }) as DraftsKpis;
  return (
    <>
      <PageHeader title={automationCopy[locale].followups.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <FollowupNav locale={locale} />
        <DraftsTable locale={locale} drafts={(drafts ?? []) as LeadDraft[]} kpis={kpis} />
      </div>
    </>
  );
}
