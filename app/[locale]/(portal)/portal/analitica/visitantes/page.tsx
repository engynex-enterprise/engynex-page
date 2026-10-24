import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { VisitorsView, type VisitorRow } from "@/components/analytics/VisitorsView";
import { analyticsProCopy } from "@/content/analyticsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function VisitorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { v } = await searchParams;
  const { data } = await supabase
    .from("visitors")
    .select("id, first_seen, last_seen, first_landing, first_referrer, first_utm, first_gclid, device, country, page_views, lead:leads(id, name, tier)")
    .order("last_seen", { ascending: false })
    .limit(2000);

  return (
    <>
      <PageHeader title={analyticsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AnalyticsNav locale={locale} />
        <VisitorsView locale={locale} rows={(data ?? []) as unknown as VisitorRow[]} initialSelected={v ?? null} />
      </div>
    </>
  );
}
