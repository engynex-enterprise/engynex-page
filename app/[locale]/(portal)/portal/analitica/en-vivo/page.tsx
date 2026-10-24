import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { LiveView, type LiveData } from "@/components/analytics/LiveView";
import { analyticsProCopy } from "@/content/analyticsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { data } = await supabase.rpc("analytics_live");
  const live = data as unknown as LiveData;

  return (
    <>
      <PageHeader title={analyticsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AnalyticsNav locale={locale} live={live?.now ?? 0} />
        <div className="px-4 py-6 sm:px-6">
          <LiveView locale={locale} initial={live} />
        </div>
      </div>
    </>
  );
}
