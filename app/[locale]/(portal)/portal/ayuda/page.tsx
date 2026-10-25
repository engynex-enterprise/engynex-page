import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { HelpCenter } from "@/components/clientPortal/HelpCenter";
import { clientPortalCopy } from "@/content/clientPortal";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireProfile(locale, ["client", "provider"]);
  const t = clientPortalCopy[locale].help;
  const general = getDictionary(locale).servicesPage.commonFaqs.map(({ q, a }) => ({ q, a }));

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <HelpCenter locale={locale} general={general} />
    </>
  );
}
