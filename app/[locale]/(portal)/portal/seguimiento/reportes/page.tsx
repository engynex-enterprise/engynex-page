import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { FollowupNav } from "@/components/followups/FollowupNav";
import { FollowupReports, type FollowupReport } from "@/components/followups/FollowupReports";
import { automationCopy } from "@/content/automation";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function FollowupReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { r } = await searchParams;
  const days = r === "7" || r === "90" ? Number(r) : 30;
  const { data } = await supabase.rpc("followup_report", { p_days: days });

  return (
    <>
      <PageHeader title={automationCopy[locale].followups.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <FollowupNav locale={locale} />
        <div className="px-4 pb-8 sm:px-6">
          <FollowupReports locale={locale} report={data as unknown as FollowupReport} days={days} />
        </div>
      </div>
    </>
  );
}
