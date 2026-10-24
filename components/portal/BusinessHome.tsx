import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Flame,
  Headset,
  ListChecks,
  MessagesSquare,
  PartyPopper,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { HBarChart, KpiSpark, LeadsByDayChart, type DailyRow } from "@/components/portal/charts/HomeCharts";
import { homeCopy } from "@/content/home";
import { crmCopy, pipeline } from "@/content/crm";
import { crmPlus } from "@/content/crmPlus";
import { leadFormCopy } from "@/content/leadForm";
import { bogotaRange, nowIso } from "@/lib/dates";
import type { Database, LeadActivity, LeadStatus, Profile } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { listEmployees } from "@/lib/employees";

type Client = SupabaseClient<Database>;
type Dashboard = {
  days: number;
  kpis: {
    leads: number;
    leads_prev: number;
    qualified: number;
    qualified_prev: number;
    meetings: number;
    meetings_prev: number;
    won_value: number;
    won_value_prev: number;
    won: number;
    visitors: number;
    visitors_prev: number;
  };
  daily: (DailyRow & { meetings: number; won_value: number })[];
  funnel: Record<string, number>;
  funnel_value: Record<string, number>;
  sources: { source: string; leads: number; green: number }[];
};

async function count(q: PromiseLike<{ count: number | null }>) {
  return (await q).count ?? 0;
}

const compactCop = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v);

/**
 * Inicio del equipo con el diseño del CRM: métricas en franja con
 * minigráficas, leads por día (por color), pendientes, embudo con valor,
 * origen de los leads, reuniones y actividad.
 */
export async function BusinessHome({
  locale,
  supabase,
  profile,
  hello,
  days,
}: {
  locale: Locale;
  supabase: Client;
  profile: Pick<Profile, "id" | "role">;
  hello: string;
  days: number;
}) {
  const t = homeCopy[locale];
  const crm = crmCopy[locale];
  const today = bogotaRange(1);
  const now = nowIso();
  const head = { count: "exact" as const, head: true };

  const [{ data: dash }, green, chats, tickets, tasks, meetingsToday, { data: activity }, { data: meetings }, rules, team] = await Promise.all([
    supabase.rpc("home_dashboard", { p_days: days }),
    count(supabase.from("leads").select("id", head).eq("tier", "green").eq("status", "new")),
    count(supabase.from("chat_conversations").select("id", head).eq("status", "open").is("first_response_at", null)),
    count(supabase.from("tickets").select("id", head).eq("status", "open")),
    count(supabase.from("tasks").select("id", head).eq("done", false).eq("assigned_to", profile.id).lt("due_at", today.to)),
    count(supabase.from("appointments").select("id", head).eq("status", "scheduled").gte("starts_at", today.from).lt("starts_at", today.to)),
    supabase.from("lead_activities").select("id, type, body, created_at, lead_id, meta, author_id, leads(name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("appointments").select("id, starts_at, channel, lead_id, leads(name)").eq("status", "scheduled").gte("starts_at", now).order("starts_at").limit(5),
    count(supabase.from("automation_rules").select("id", head).eq("enabled", true)),
    listEmployees(supabase),
  ]);
  const names = Object.fromEntries(team.map((m) => [m.id, m.name]));
  const d = dash as unknown as Dashboard;
  const k = d.kpis;

  const base = `/${locale}/portal`;
  const todo: { key: keyof typeof t.todoItems; n: number; href: string; icon: LucideIcon; tone: string }[] = [
    { key: "green", n: green, href: `${base}/crm`, icon: Flame, tone: "bg-emerald-500" },
    { key: "chats", n: chats, href: `${base}/chat`, icon: MessagesSquare, tone: "bg-sky-500" },
    { key: "tickets", n: tickets, href: `${base}/soporte`, icon: Headset, tone: "bg-violet-500" },
    { key: "tasks", n: tasks, href: `${base}/tareas`, icon: ListChecks, tone: "bg-amber-500" },
    { key: "meetings", n: meetingsToday, href: `${base}/agenda`, icon: CalendarClock, tone: "bg-deep-600" },
  ];
  const pending = todo.filter((x) => x.n > 0);

  const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);
  const conversion = k.visitors > 0 && k.leads <= k.visitors ? `${((k.leads / k.visitors) * 100).toFixed(1)}%` : null;
  const kpis = [
    { label: t.kpiItems.leads, value: k.leads.toLocaleString(locale), delta: pct(k.leads, k.leads_prev), series: d.daily.map((r) => r.green + r.yellow + r.red), hint: conversion ? t.conversion.replace("{pct}", conversion).replace("{n}", k.visitors.toLocaleString(locale)) : null },
    { label: t.kpiItems.green, value: k.qualified.toLocaleString(locale), delta: pct(k.qualified, k.qualified_prev), series: d.daily.map((r) => r.green), hint: null },
    { label: t.kpiItems.meetings, value: k.meetings.toLocaleString(locale), delta: pct(k.meetings, k.meetings_prev), series: d.daily.map((r) => r.meetings), hint: null },
    { label: t.kpiItems.value, value: compactCop(locale, k.won_value), delta: pct(k.won_value, k.won_value_prev), series: d.daily.map((r) => r.won_value), hint: `${k.won} ${t.kpiItems.won.toLowerCase()}` },
  ];

  const funnelRows = pipeline.map((s) => ({ label: crm.status[s], value: d.funnel[s] ?? 0 }));
  const funnelValueRows = pipeline.filter((s) => s !== "lost").map((s) => ({ label: crm.status[s], value: d.funnel_value[s] ?? 0 }))
    .filter((r) => r.value > 0);
  const sourceRows = d.sources.map((s) => ({ label: crmPlus.sources[s.source] ?? s.source.charAt(0).toUpperCase() + s.source.slice(1), value: s.leads }));

  const fmtDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" });
  const fmtShort = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
  const channels = leadFormCopy[locale].booking.channels;
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const cardTitle = (title: string, hint?: string, href?: string) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline">
          {t.seeAll}
        </Link>
      )}
    </div>
  );

  const describe = (a: Pick<LeadActivity, "type" | "body" | "meta">) => {
    const meta = (a.meta ?? {}) as Record<string, string>;
    if (a.type === "status_change") return crm.lead.activity.status_change.replace("{from}", crm.status[meta.from as LeadStatus] ?? meta.from).replace("{to}", crm.status[meta.to as LeadStatus] ?? meta.to);
    if (a.type === "created") return crm.lead.activity.created.replace("{score}", meta.score ?? "").replace("{tier}", crm.tier[meta.tier as keyof typeof crm.tier] ?? meta.tier);
    if (a.type === "chat") return crm.lead.activity.chat;
    if (a.type === "assignment") return meta.to ? crm.lead.activity.assignment.replace("{to}", names[meta.to] ?? "—") : crm.lead.activity.unassigned;
    return a.body ?? crm.lead.composerTypes[a.type as keyof typeof crm.lead.composerTypes] ?? a.type;
  };

  return (
    <>
      <PageHeader title={hello} />

      <div className="-mx-4 -mt-6 sm:-mx-6">
        {/* Saludo y periodo */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <p className="text-sm text-muted first-letter:uppercase">{fmtDate.format(new Date(now))}</p>
          <nav aria-label={t.range} className="flex rounded-[10px] bg-card-soft p-0.5">
            {(["7", "30", "90"] as const).map((r) => (
              <Link
                key={r}
                href={r === "30" ? base : `${base}?r=${r}`}
                aria-current={String(days) === r ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  String(days) === r ? "bg-surface text-heading shadow-[0_1px_2px_rgba(16,24,40,0.08)] dark:bg-card" : "text-muted hover:text-heading",
                )}
              >
                {t.ranges[r]}
              </Link>
            ))}
          </nav>
        </div>

        {/* Métricas */}
        <dl className="grid border-b border-line sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((m) => (
            <div key={m.label} className="flex items-center justify-between gap-4 border-line px-6 py-5 sm:border-r xl:last:border-r-0">
              <div className="min-w-0">
                <dt className="text-sm text-muted">{m.label}</dt>
                <dd className="mt-1 flex items-baseline gap-2">
                  <span className="text-[2rem] font-semibold leading-none tabular-nums text-heading">{m.value}</span>
                  {m.delta !== null && (
                    <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", m.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} title={t.vsPrevN.replace("{n}", String(days))}>
                      {m.delta >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                      {Math.abs(m.delta)}%
                    </span>
                  )}
                </dd>
                {m.hint && <dd className="mt-1 truncate text-xs text-muted">{m.hint}</dd>}
              </div>
              <KpiSpark data={m.series} label={m.label} />
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {/* Leads por día */}
        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.leadsByDay, `${t.leadsByDayHint} · ${t.ranges[String(days)] ?? `${days} d`}`, `${base}/crm`)}
          <LeadsByDayChart data={d.daily} labels={t.tiers} locale={locale} tableLabel={t.table} dayLabel={t.day} />
        </section>

        {/* Pendientes */}
        <section className={card}>
          {cardTitle(t.todo, t.todoHint)}
          {pending.length === 0 ? (
            <p className="flex items-center gap-3 rounded-lg bg-[var(--meta-active)] p-4 text-sm font-medium text-heading">
              <PartyPopper className="h-5 w-5 text-accent" aria-hidden />
              {t.allClear}
            </p>
          ) : (
            <ul className="grid gap-1">
              {pending.map(({ key, n, href, icon: Icon, tone }) => (
                <li key={key}>
                  <Link href={href} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--meta-hover)]">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white", tone)}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-heading">{t.todoItems[key]}</span>
                    <span className="grid h-6 min-w-6 place-items-center rounded-md border border-line-strong px-1.5 text-xs font-semibold tabular-nums text-heading">{n}</span>
                    <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`${base}/automatizaciones`} className="mt-4 flex items-center gap-3 rounded-lg border border-line p-3 hover:bg-[var(--meta-hover)]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--meta-active)] text-accent">
              <Workflow className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-heading">{t.automations}</span>
              <span className="block text-xs text-muted">{t.automationsHint.replace("{n}", String(rules))}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
          </Link>
        </section>

        {/* Embudo */}
        <section className={card}>
          {cardTitle(t.funnel, t.funnelHint, `${base}/crm`)}
          <HBarChart rows={funnelRows} valueLabel={t.leadsLabel} highlight={crm.status.won} />
        </section>

        {/* Valor por etapa */}
        <section className={card}>
          {cardTitle(t.funnelValue, "COP")}
          {funnelValueRows.length === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <HBarChart rows={funnelValueRows} valueLabel="COP" currency highlight={crm.status.won} />}
        </section>

        {/* Origen */}
        <section className={card}>
          {cardTitle(t.sources, t.sourcesHint)}
          {sourceRows.length === 0 ? <p className="text-sm text-muted">{t.noData}</p> : <HBarChart rows={sourceRows} valueLabel={t.leadsLabel} />}
        </section>

        {/* Reuniones */}
        <section className={card}>
          {cardTitle(t.upcoming, undefined, `${base}/agenda`)}
          {!meetings?.length ? (
            <p className="text-sm text-muted">{t.noMeetings}</p>
          ) : (
            <ul className="grid gap-1">
              {meetings.map((m) => (
                <li key={m.id}>
                  <Link href={`${base}/crm?lead=${m.lead_id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--meta-hover)]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card-soft text-heading">
                      <CalendarClock className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-heading">{(m.leads as unknown as { name: string } | null)?.name ?? "—"}</span>
                      <span className="block text-xs text-muted first-letter:uppercase">
                        {fmtShort.format(new Date(m.starts_at))} · {channels[m.channel]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actividad */}
        <section className={cn(card, "xl:col-span-2")}>
          {cardTitle(t.activity, undefined, `${base}/crm`)}
          {!activity?.length ? (
            <p className="text-sm text-muted">{t.noActivity}</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id}>
                  <Link href={`${base}/crm?lead=${a.lead_id}`} className="flex items-center gap-3 py-2.5 hover:bg-[var(--meta-hover)]">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-deep-700 text-[0.65rem] font-bold text-white dark:bg-white dark:text-deep-700">
                      {((a.leads as unknown as { name: string } | null)?.name ?? "—").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-heading">{(a.leads as unknown as { name: string } | null)?.name ?? "—"}</span>
                      <span className="block truncate text-xs text-muted">{describe(a as Pick<LeadActivity, "type" | "body" | "meta">)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{fmtShort.format(new Date(a.created_at))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
