import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { ReportPanel } from "@/components/reports/ReportPanel";
import { reportsProCopy } from "@/content/reportsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { reportPeriod } from "@/lib/reportPeriod";

type Live = {
  current: Record<string, unknown>;
  prev: Record<string, unknown>;
  sources: { source: string; leads: number; green: number; meetings: number; won: number; won_value: number }[];
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const period = reportPeriod(await searchParams);
  const { data } = await supabase.rpc("report_live", { p_from: period.from, p_to: period.to });
  const live = (data ?? { current: {}, prev: {}, sources: [] }) as unknown as Live;

  // Etiqueta del periodo anterior (misma duración, justo antes).
  const days = Math.round((Date.parse(period.to) - Date.parse(period.from)) / 86_400_000);
  const prevTo = new Date(`${period.fromDay}T12:00:00Z`);
  const prevFrom = new Date(prevTo.getTime() - days * 86_400_000);
  const fmt = (d: Date) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
  const prevLabel = `${fmt(prevFrom)} – ${fmt(new Date(prevTo.getTime() - 86_400_000))}`;

  return (
    <>
      <PageHeader title={reportsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ReportsNav locale={locale} fromDay={period.fromDay} toDay={period.toDay} />
        <ReportPanel locale={locale} current={live.current} prev={live.prev} sources={live.sources} prevLabel={prevLabel} />
      </div>
    </>
  );
}
