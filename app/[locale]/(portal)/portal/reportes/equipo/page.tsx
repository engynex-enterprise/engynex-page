import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { TeamReport, type TeamRow } from "@/components/reports/TeamReport";
import { reportsProCopy } from "@/content/reportsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { reportPeriod } from "@/lib/reportPeriod";

export default async function TeamReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = reportsProCopy[locale];
  const period = reportPeriod(await searchParams);
  const { data } = await supabase.rpc("report_team", { p_from: period.from, p_to: period.to });

  const fmt = (day: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  const periodLabel = `${t.periods[period.p]} · ${fmt(period.fromDay)} – ${fmt(period.toDay)}`;

  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ReportsNav locale={locale} fromDay={period.fromDay} toDay={period.toDay} />
        <div className="px-4 py-6 sm:px-6">
          <TeamReport locale={locale} rows={(data ?? []) as unknown as TeamRow[]} periodLabel={periodLabel} />
        </div>
      </div>
    </>
  );
}
