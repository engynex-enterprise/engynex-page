import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { AutomationsNav, type AutomationsTab } from "@/components/automations/AutomationsNav";
import { AutomationStats, type AutomationStatsData } from "@/components/automations/AutomationStats";
import { AutomationsPending, type PendingRow } from "@/components/automations/AutomationsPending";
import { RulesList } from "@/components/automations/RulesList";
import { RunsHistory } from "@/components/automations/RunsHistory";
import { buttonClasses } from "@/components/ui/Button";
import { automationsProCopy, shortSpan } from "@/content/automationsPro";
import { rulesCopy } from "@/content/rules";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso, nowIso } from "@/lib/dates";
import type { AutomationRule, AutomationRun } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TABS: Record<string, AutomationsTab> = { historial: "history", estadisticas: "stats", espera: "pending" };

export default async function AutomationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; rule?: string; r?: string; e?: string; d?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = automationsProCopy[locale];
  const sp = await searchParams;
  const tab: AutomationsTab = TABS[sp.tab ?? ""] ?? "rules";
  const canEdit = profile.role === "admin" || profile.role === "marketing";
  const days = ["7", "90"].includes(sp.d ?? "") ? Number(sp.d) : 30;
  const now = nowIso();
  const since30 = daysAgoIso(30);
  const since7 = daysAgoIso(7);

  let history = supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(200);
  if (sp.rule) history = history.eq("rule_id", sp.rule);
  if (sp.r === "done" || sp.r === "failed") history = history.eq("status", sp.r);
  if (sp.e) history = history.eq("entity", sp.e);

  const [{ data: rules }, { count: runs30 }, { count: failed30 }, { count: pendingCount }, { data: fails7 }, extra] = await Promise.all([
    supabase.from("automation_rules").select("*").order("folder", { nullsFirst: false }).order("enabled", { ascending: false }).order("name"),
    supabase.from("automation_runs").select("id", { count: "exact", head: true }).gte("created_at", since30),
    supabase.from("automation_runs").select("id", { count: "exact", head: true }).gte("created_at", since30).eq("status", "failed"),
    supabase.from("automation_pending").select("id", { count: "exact", head: true }),
    supabase.from("automation_runs").select("rule_id").gte("created_at", since7).eq("status", "failed"),
    tab === "history"
      ? history.then((x) => ({ runs: (x.data ?? []) as AutomationRun[] }))
      : tab === "stats"
        ? supabase.rpc("automation_stats", { p_days: days }).then((x) => ({ stats: x.data as unknown as AutomationStatsData }))
        : tab === "pending"
          ? supabase
              .from("automation_pending")
              .select("id, rule_id, entity, entity_id, due_at, created_at")
              .order("due_at")
              .limit(300)
              .then((x) => ({ pending: (x.data ?? []) as PendingRow[] }))
          : Promise.resolve({}),
  ]);
  const list = (rules ?? []) as AutomationRule[];
  const names = list.map((r) => ({ id: r.id, name: r.name }));
  const errors7 = (fails7 ?? []).reduce<Record<string, number>>((acc, x) => {
    acc[x.rule_id] = (acc[x.rule_id] ?? 0) + 1;
    return acc;
  }, {});
  const last = list.reduce<string | null>((m, r) => (r.last_run_at && (!m || r.last_run_at > m) ? r.last_run_at : m), null);
  const savedMin = (runs30 ?? 0) * 3;
  const nowMs = new Date(now).getTime();

  const kpis = [
    { key: "active", value: `${list.filter((r) => r.enabled).length} / ${list.length}` },
    { key: "runs", value: (runs30 ?? 0).toLocaleString(locale) },
    { key: "failed", value: (failed30 ?? 0).toLocaleString(locale), alert: (failed30 ?? 0) > 0 },
    { key: "pending", value: (pendingCount ?? 0).toLocaleString(locale) },
    {
      key: "saved",
      value: savedMin >= 60 ? t.hours.replace("{n}", (savedMin / 60).toLocaleString(locale, { maximumFractionDigits: 1 })) : t.minutes.replace("{n}", String(savedMin)),
      hint: t.kpis.savedHint,
    },
    { key: "last", value: last ? t.ago.replace("{t}", shortSpan(nowMs - new Date(last).getTime())) : "—" },
  ] as { key: keyof typeof t.kpis; value: string; alert?: boolean; hint?: string }[];

  const base = `/${locale}/portal/automatizaciones`;

  return (
    <>
      <PageHeader title={rulesCopy.title} count={list.length} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r xl:border-b-0 xl:[&:nth-child(6n)]:border-r-0">
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums", k.alert ? "text-red-600 dark:text-red-400" : "text-heading")}>{k.value}</p>
              {k.hint && <p className="mt-1 text-xs text-muted">{k.hint}</p>}
            </div>
          ))}
        </div>

        <AutomationsNav locale={locale} tab={tab} pending={pendingCount ?? 0}>
          {canEdit && (
            <Link href={`${base}/nueva`} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
              <Plus className="h-4 w-4" aria-hidden />
              {rulesCopy.create}
            </Link>
          )}
        </AutomationsNav>

        {tab === "rules" && <RulesList locale={locale} rules={list} canEdit={canEdit} errors7={errors7} now={now} />}
        {tab === "history" && "runs" in extra && <RunsHistory locale={locale} runs={extra.runs} rules={names} />}
        {tab === "stats" && "stats" in extra && extra.stats && <AutomationStats locale={locale} days={days} data={extra.stats} rules={names} />}
        {tab === "pending" && "pending" in extra && (
          <AutomationsPending locale={locale} rows={extra.pending} rules={names} canEdit={canEdit} now={now} />
        )}
      </div>
    </>
  );
}
