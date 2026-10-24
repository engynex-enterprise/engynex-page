import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { SupportNav } from "@/components/support/SupportNav";
import { SupportReports, type SupportKpis } from "@/components/support/SupportReports";
import { SupportPeriod } from "@/components/support/SupportPeriod";
import { supportProCopy } from "@/content/supportPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { ticketCategories } from "@/lib/ticketCategories";

const DAYS = [7, 30, 90];

export default async function SupportReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales"]);
  const d = Number((await searchParams).d);
  const days = DAYS.includes(d) ? d : 30;
  const { data } = await supabase.rpc("support_kpis", { p_days: days });
  const pro = supportProCopy[locale];

  return (
    <>
      <PageHeader title={pro.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <SupportNav locale={locale} admin={profile.role === "admin"}>
          <SupportPeriod locale={locale} days={days} />
        </SupportNav>
        <SupportReports locale={locale} data={(data ?? {}) as unknown as SupportKpis} categories={ticketCategories(locale)} />
      </div>
    </>
  );
}
