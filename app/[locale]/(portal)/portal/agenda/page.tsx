import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { AgendaWorkspace } from "@/components/agenda/AgendaWorkspace";
import { AGENDA_SELECT, type AgendaRow } from "@/components/agenda/shared";
import { AvailabilityForm, BlocksForm, BookingForm } from "@/components/crm/SettingsForms";
import { Sparkline } from "@/components/crm/leads/Sparkline";
import { agendaWorkspaceCopy } from "@/content/agendaWorkspace";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { daysAgoIso } from "@/lib/dates";
import type { Availability, AvailabilityBlock, BookingSettings } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Kpis = {
  today: number;
  week: number;
  booked: number;
  booked_prev: number;
  done: number;
  no_show: number;
  to_close: number;
  won: number;
  daily: { day: string; n: number }[];
};

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string; a?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales"]);
  const { v, a } = await searchParams;
  const t = agendaWorkspaceCopy[locale];
  const isAdmin = profile.role === "admin";

  const [{ data: rows }, employees, { data: availability }, { data: blocks }, { data: booking }, { data: kpiData }] = await Promise.all([
    supabase.from("appointments").select(AGENDA_SELECT).gte("starts_at", daysAgoIso(120)).order("starts_at").limit(2000),
    listEmployees(supabase),
    supabase.from("availability").select("*").order("weekday").order("start_time"),
    supabase.from("availability_blocks").select("*").gte("ends_at", daysAgoIso(1)).order("starts_at"),
    supabase.from("booking_settings").select("*").eq("id", 1).single(),
    supabase.rpc("agenda_kpis", { p_days: 30 }),
  ]);
  const k = (kpiData ?? {}) as Partial<Kpis>;
  const closed = (k.done ?? 0) + (k.no_show ?? 0);
  const delta = k.booked_prev ? Math.round((((k.booked ?? 0) - k.booked_prev) / k.booked_prev) * 100) : null;

  const kpis = [
    { key: "today", value: String(k.today ?? 0), hint: null, tone: "" },
    { key: "week", value: String(k.week ?? 0), hint: null, tone: "" },
    { key: "booked", value: String(k.booked ?? 0), hint: null, tone: "", delta, series: (k.daily ?? []).map((d) => d.n) },
    { key: "attendance", value: closed ? `${Math.round(((k.done ?? 0) / closed) * 100)}%` : "—", hint: k.no_show ? t.kpis.attendanceHint.replace("{n}", String(k.no_show)) : null, tone: "" },
    { key: "toClose", value: String(k.to_close ?? 0), hint: k.to_close ? t.kpis.toCloseHint : null, tone: (k.to_close ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : "" },
    { key: "won", value: k.done ? `${Math.round(((k.won ?? 0) / k.done) * 100)}%` : "—", hint: null, tone: "" },
  ] as { key: keyof typeof t.kpis; value: string; hint: string | null; tone: string; delta?: number | null; series?: number[] }[];

  return (
    <>
      <PageHeader title={t.title} count={k.week ?? 0} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((x) => (
            <div key={x.key} className="flex items-center justify-between gap-3 border-line px-6 py-4 sm:border-r xl:last:border-r-0">
              <div className="min-w-0">
                <p className="text-sm text-muted">{t.kpis[x.key]}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className={cn("text-[1.7rem] font-semibold leading-none tabular-nums text-heading", x.tone)}>{x.value}</span>
                  {x.delta != null && (
                    <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", x.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {x.delta >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                      {Math.abs(x.delta)}%
                    </span>
                  )}
                </p>
                {x.hint && <p className="mt-1 text-xs text-muted">{x.hint}</p>}
              </div>
              {x.series && x.series.some((n) => n > 0) && <Sparkline values={x.series} label={t.kpis[x.key]} className="text-brand-green-dark dark:text-brand-green max-[1800px]:hidden" />}
            </div>
          ))}
        </div>

        <AgendaWorkspace
          locale={locale}
          initial={(rows ?? []) as unknown as AgendaRow[]}
          employees={employees}
          availability={(availability ?? []) as Availability[]}
          blocks={(blocks ?? []) as AvailabilityBlock[]}
          initialView={v === "calendar" || (v === "settings" && isAdmin) ? v : "list"}
          initialOpen={a ?? null}
          isAdmin={isAdmin}
          settings={
            <div className="grid gap-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <BookingForm locale={locale} initial={booking as BookingSettings} />
                <BlocksForm locale={locale} initial={(blocks ?? []) as AvailabilityBlock[]} />
              </div>
              <AvailabilityForm locale={locale} initial={(availability ?? []) as Availability[]} />
            </div>
          }
        />
      </div>
    </>
  );
}
