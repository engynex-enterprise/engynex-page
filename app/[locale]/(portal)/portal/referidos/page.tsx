import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ReferralsView } from "@/components/clientPortal/ReferralsView";
import { clientPortalCopy } from "@/content/clientPortal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["client"]);
  const t = clientPortalCopy[locale].referrals;
  const { data: referrals } = await supabase.rpc("my_referrals");

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <ReferralsView locale={locale} referrals={referrals ?? []} />
    </>
  );
}
