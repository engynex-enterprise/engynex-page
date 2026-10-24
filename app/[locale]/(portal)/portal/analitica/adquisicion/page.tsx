import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { AcquisitionView, type AcqCampaign, type AcqChannel, type AcqSource } from "@/components/analytics/AcquisitionView";
import { analyticsProCopy } from "@/content/analyticsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { analyticsRange } from "@/lib/analyticsRange";

type Acquisition = { channels: AcqChannel[]; sources: AcqSource[]; campaigns: AcqCampaign[] };

export default async function AcquisitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { from, to } = analyticsRange((await searchParams).r);
  const { data } = await supabase.rpc("analytics_acquisition", { p_from: from, p_to: to });
  const a = (data ?? { channels: [], sources: [], campaigns: [] }) as unknown as Acquisition;

  return (
    <>
      <PageHeader title={analyticsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AnalyticsNav locale={locale} />
        <div className="px-4 py-6 sm:px-6">
          <AcquisitionView locale={locale} channels={a.channels ?? []} sources={a.sources ?? []} campaigns={a.campaigns ?? []} />
        </div>
      </div>
    </>
  );
}
