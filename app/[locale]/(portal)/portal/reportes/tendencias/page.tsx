import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { TrendsReport, type PipelineData, type TrendRow } from "@/components/reports/TrendsReport";
import { reportsProCopy } from "@/content/reportsPro";
import { reportsTeamCopy } from "@/content/reportsTeam";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MONTHS = ["6", "12", "24"] as const;

export default async function TrendsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { m: raw } = await searchParams;
  const months = MONTHS.includes(raw as (typeof MONTHS)[number]) ? (raw as (typeof MONTHS)[number]) : "12";
  const t = reportsTeamCopy[locale].trends;

  const [{ data: trends }, { data: pipeline }] = await Promise.all([
    supabase.rpc("report_trends", { p_months: Number(months) }),
    supabase.rpc("report_pipeline"),
  ]);

  return (
    <>
      <PageHeader title={reportsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ReportsNav locale={locale} />
        <div className="px-4 py-6 sm:px-6">
          <div className="mb-5 flex justify-end print:hidden">
            <div role="group" aria-label={t.months} className="flex rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]">
              {MONTHS.map((x) => (
                <Link
                  key={x}
                  href={`?m=${x}`}
                  aria-current={x === months ? "true" : undefined}
                  className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", x === months ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
                >
                  {t.monthsOption.replace("{n}", x)}
                </Link>
              ))}
            </div>
          </div>
          <TrendsReport locale={locale} rows={(trends ?? []) as unknown as TrendRow[]} pipeline={(pipeline ?? null) as unknown as PipelineData | null} />
        </div>
      </div>
    </>
  );
}
