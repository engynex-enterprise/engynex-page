import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { SavedReports } from "@/components/reports/SavedReports";
import { reportsProCopy } from "@/content/reportsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { WeeklyReport } from "@/lib/supabase/types";

/** Fecha de hoy en Colombia (aaaa-mm-dd → partes). */
function bogotaToday() {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date()).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Lunes de la semana pasada y primer día del mes pasado (hora de Colombia). */
function periods() {
  const today = bogotaToday();
  const monday = new Date(today.getTime() - (((today.getUTCDay() + 6) % 7) + 7) * 86_400_000);
  const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  return { lastMonday: monday.toISOString().slice(0, 10), lastMonth: lastMonth.toISOString().slice(0, 10) };
}

export default async function SavedReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { r } = await searchParams;

  const { data } = await supabase.from("weekly_reports").select("*").order("week_start", { ascending: false }).limit(120);
  const reports = (data ?? []) as WeeklyReport[];
  const { lastMonday, lastMonth } = periods();

  return (
    <>
      <PageHeader title={reportsProCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ReportsNav locale={locale} />
        <SavedReports
          locale={locale}
          reports={reports}
          selectedId={r ?? null}
          isAdmin={profile.role === "admin"}
          lastMonday={lastMonday}
          lastMonth={lastMonth}
        />
      </div>
    </>
  );
}
