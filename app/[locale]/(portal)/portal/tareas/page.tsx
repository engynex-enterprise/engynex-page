import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { TasksWorkspace } from "@/components/tasks/TasksWorkspace";
import { TASK_SELECT, toTaskRow } from "@/components/tasks/shared";
import { Sparkline } from "@/components/crm/leads/Sparkline";
import { tasksWorkspaceCopy } from "@/content/tasksWorkspace";
import { tasksProCopy } from "@/content/tasksPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { daysAgoIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Kpis = {
  mine_open: number;
  mine_overdue: number;
  mine_today: number;
  overdue: number;
  unassigned: number;
  done_week: number;
  done_prev_week: number;
  on_time_pct: number | null;
  daily_done: { day: string; done: number }[];
  workload: { id: string; name: string; open: number; overdue: number }[];
};

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string; t?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const { v, t: openId } = await searchParams;
  const t = tasksWorkspaceCopy[locale];
  const since = daysAgoIso(30);

  const [{ data: open }, { data: done }, employees, { data: kpiData }] = await Promise.all([
    supabase.from("tasks").select(TASK_SELECT).eq("done", false).order("due_at", { ascending: true, nullsFirst: false }).limit(1000),
    supabase.from("tasks").select(TASK_SELECT).eq("done", true).gte("completed_at", since).order("completed_at", { ascending: false }).limit(300),
    listEmployees(supabase),
    supabase.rpc("tasks_kpis"),
  ]);
  const rows = [...(open ?? []), ...(done ?? [])].map((r) => toTaskRow(r as Record<string, unknown>));
  const k = (kpiData ?? {}) as Partial<Kpis>;
  const delta = k.done_prev_week ? Math.round((((k.done_week ?? 0) - k.done_prev_week) / k.done_prev_week) * 100) : null;

  const kpis = [
    { key: "mine", value: k.mine_open ?? 0, hint: k.unassigned ? t.kpis.unassignedHint.replace("{n}", String(k.unassigned)) : null, tone: "" },
    { key: "today", value: k.mine_today ?? 0, hint: null, tone: "" },
    {
      key: "overdue",
      value: k.mine_overdue ?? 0,
      hint: k.overdue ? t.kpis.overdueHint.replace("{n}", String(k.overdue)) : null,
      tone: (k.mine_overdue ?? 0) > 0 ? "text-red-600 dark:text-red-400" : "",
    },
    { key: "doneWeek", value: k.done_week ?? 0, hint: null, tone: "", delta, series: (k.daily_done ?? []).map((d) => d.done) },
    { key: "onTime", value: k.on_time_pct != null ? `${k.on_time_pct}%` : "—", hint: null, tone: "" },
  ] as { key: keyof typeof t.kpis; value: number | string; hint: string | null; tone: string; delta?: number | null; series?: number[] }[];

  return (
    <>
      <PageHeader title={tasksProCopy[locale].title} count={k.mine_open ?? 0} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-5">
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
              {x.series && x.series.some((n) => n > 0) && <Sparkline values={x.series} label={t.kpis[x.key]} className="text-brand-green-dark dark:text-brand-green max-2xl:hidden" />}
            </div>
          ))}
        </div>

        <TasksWorkspace
          locale={locale}
          initial={rows}
          employees={employees}
          me={profile.id}
          workload={k.workload ?? []}
          initialView={v === "board" || v === "calendar" ? v : "list"}
          initialOpen={openId ?? null}
        />
      </div>
    </>
  );
}
