import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { ConversionsView, type FunnelData } from "@/components/analytics/ConversionsView";
import { analyticsProCopy } from "@/content/analyticsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { analyticsRange } from "@/lib/analyticsRange";

const EMPTY: FunnelData = {
  visitors: 0,
  engaged: 0,
  quote_page: 0,
  form_start: 0,
  leads: 0,
  qualified: 0,
  meetings: 0,
  won: 0,
  contacts: { whatsapp: 0, phone: 0, email: 0, chat: 0 },
  form_steps: [],
};

export default async function ConversionsPage({
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
  const { data } = await supabase.rpc("analytics_funnel", { p_from: from, p_to: to });

  return (
    <>
      <PageHeader title={analyticsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AnalyticsNav locale={locale} />
        <div className="px-4 py-6 sm:px-6">
          <ConversionsView locale={locale} funnel={{ ...EMPTY, ...((data ?? {}) as Partial<FunnelData>) }} />
        </div>
      </div>
    </>
  );
}
