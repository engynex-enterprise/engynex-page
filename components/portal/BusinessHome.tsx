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
import { homeCopy } from "@/content/home";
import { crmCopy, pipeline } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import { bogotaRange, daysAgoIso, nowIso } from "@/lib/dates";
import type { Database, LeadActivity, LeadStatus, Profile } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Client = SupabaseClient<Database>;

/** Cuenta filas con un filtro (sin traerlas). */
async function count(q: PromiseLike<{ count: number | null }>) {
  return (await q).count ?? 0;
}

/**
 * Inicio del equipo, como el panel de Meta Business Suite: pendientes del
 * día, métricas con tendencia, embudo de ventas, actividad y reuniones.
 */
export async function BusinessHome({
  locale,
  supabase,
  profile,
  hello,
}: {
  locale: Locale;
  supabase: Client;
  profile: Pick<Profile, "id" | "role">;
  hello: string;
}) {
  const t = homeCopy[locale];
  const crm = crmCopy[locale];
  const today = bogotaRange(1);
  const since = daysAgoIso(30);
  const before = daysAgoIso(60);
  const now = nowIso();
  const head = { count: "exact" as const, head: true };

  const [
    green,
    chats,
    tickets,
    tasks,
    meetingsToday,
    leadsNow,
    leadsPrev,
    greenNow,
    greenPrev,
    apptNow,
    apptPrev,
    { data: wonNow },
    { data: wonPrev },
    { data: funnel },
    { data: activity },
    { data: meetings },
    rules,
  ] = await Promise.all([
    count(supabase.from("leads").select("id", head).eq("tier", "green").eq("status", "new")),
    count(supabase.from("chat_conversations").select("id", head).eq("status", "open").is("first_response_at", null)),
    count(supabase.from("tickets").select("id", head).eq("status", "open")),
    count(supabase.from("tasks").select("id", head).eq("done", false).eq("assigned_to", profile.id).lt("due_at", today.to)),
    count(supabase.from("appointments").select("id", head).eq("status", "scheduled").gte("starts_at", today.from).lt("starts_at", today.to)),
    count(supabase.from("leads").select("id", head).gte("created_at", since)),
    count(supabase.from("leads").select("id", head).gte("created_at", before).lt("created_at", since)),
    count(supabase.from("leads").select("id", head).eq("tier", "green").gte("created_at", since)),
    count(supabase.from("leads").select("id", head).eq("tier", "green").gte("created_at", before).lt("created_at", since)),
    count(supabase.from("appointments").select("id", head).gte("created_at", since)),
    count(supabase.from("appointments").select("id", head).gte("created_at", before).lt("created_at", since)),
    supabase.from("lead_activities").select("lead_id").eq("type", "status_change").eq("meta->>to", "won").gte("created_at", since),
    supabase.from("lead_activities").select("lead_id").eq("type", "status_change").eq("meta->>to", "won").gte("created_at", before).lt("created_at", since),
    supabase.from("leads").select("status").limit(5000),
    supabase.from("lead_activities").select("id, type, body, created_at, lead_id, meta, leads(name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("appointments").select("id, starts_at, channel, lead_id, leads(name)").eq("status", "scheduled").gte("starts_at", now).order("starts_at").limit(5),
    count(supabase.from("automation_rules").select("id", head).eq("enabled", true)),
  ]);

  const wonIds = [...new Set((wonNow ?? []).map((w) => w.lead_id))];
  const { data: wonLeads } = wonIds.length
    ? await supabase.from("leads").select("value_cop").in("id", wonIds)
    : { data: [] as { value_cop: number | null }[] };
  const wonValue = (wonLeads ?? []).reduce((sum, l) => sum + (l.value_cop ?? 0), 0);

  const base = `/${locale}/portal`;
  const todo: { key: keyof typeof t.todoItems; n: number; href: string; icon: LucideIcon; tone: string }[] = [
    { key: "green", n: green, href: `${base}/crm`, icon: Flame, tone: "bg-emerald-500" },
    { key: "chats", n: chats, href: `${base}/chat`, icon: MessagesSquare, tone: "bg-sky-500" },
    { key: "tickets", n: tickets, href: `${base}/soporte`, icon: Headset, tone: "bg-violet-500" },
    { key: "tasks", n: tasks, href: `${base}/tareas`, icon: ListChecks, tone: "bg-amber-500" },
    { key: "meetings", n: meetingsToday, href: `${base}/agenda`, icon: CalendarClock, tone: "bg-deep-600" },
  ];
  const pending = todo.filter((x) => x.n > 0);

  const kpis: { label: string; value: string; now: number; prev: number }[] = [
    { label: t.kpiItems.leads, value: leadsNow.toLocaleString(locale), now: leadsNow, prev: leadsPrev },
    { label: t.kpiItems.green, value: greenNow.toLocaleString(locale), now: greenNow, prev: greenPrev },
    { label: t.kpiItems.meetings, value: apptNow.toLocaleString(locale), now: apptNow, prev: apptPrev },
    { label: t.kpiItems.won, value: (wonNow?.length ?? 0).toLocaleString(locale), now: wonNow?.length ?? 0, prev: wonPrev?.length ?? 0 },
    {
      label: t.kpiItems.value,
      value: new Intl.NumberFormat(locale, { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(wonValue),
      now: wonValue,
      prev: -1,
    },
  ];

  const stages = pipeline.map((s) => ({ status: s, n: (funnel ?? []).filter((l) => l.status === s).length }));
  const maxStage = Math.max(1, ...stages.map((s) => s.n));
  const fmtDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" });
  const fmtShort = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
  const channels = leadFormCopy[locale].booking.channels;
  const card = "rounded-lg bg-surface p-5 shadow-meta dark:bg-card";

  const describe = (a: Pick<LeadActivity, "type" | "body" | "meta">) => {
    const meta = (a.meta ?? {}) as Record<string, string>;
    if (a.type === "status_change") return crm.lead.activity.status_change.replace("{from}", crm.status[meta.from as LeadStatus] ?? meta.from).replace("{to}", crm.status[meta.to as LeadStatus] ?? meta.to);
    if (a.type === "created") return crm.lead.activity.created.replace("{score}", meta.score ?? "").replace("{tier}", crm.tier[meta.tier as keyof typeof crm.tier] ?? meta.tier);
    if (a.type === "chat") return crm.lead.activity.chat;
    return a.body ?? crm.lead.composerTypes[a.type as keyof typeof crm.lead.composerTypes] ?? a.type;
  };

  return (
    <>
      <PageHeader title={hello} subtitle={t.today.replace("{date}", fmtDate.format(new Date(now)))} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-4">
          {/* Pendientes */}
          <section className={card}>
            <h2 className="text-lg font-bold text-heading">{t.todo}</h2>
            <p className="text-sm text-muted">{t.todoHint}</p>
            {pending.length === 0 ? (
              <p className="mt-4 flex items-center gap-3 rounded-lg bg-[var(--meta-active)] p-4 text-sm font-semibold text-heading">
                <PartyPopper className="h-5 w-5 text-accent" aria-hidden />
                {t.allClear}
              </p>
            ) : (
              <ul className="mt-3 grid gap-1">
                {pending.map(({ key, n, href, icon: Icon, tone }) => (
                  <li key={key}>
                    <Link href={href} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--meta-hover)]">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-white", tone)}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-[0.94rem] font-semibold text-heading">{t.todoItems[key]}</span>
                      <span className="grid h-7 min-w-7 place-items-center rounded-full bg-red-600 px-2 text-sm font-bold text-white">{n}</span>
                      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Métricas */}
          <section className={card}>
            <h2 className="text-lg font-bold text-heading">{t.kpis}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-5">
              {kpis.map((k) => {
                const delta = k.prev > 0 ? Math.round(((k.now - k.prev) / k.prev) * 100) : null;
                const up = (delta ?? 0) >= 0;
                return (
                  <div key={k.label}>
                    <dt className="text-sm text-muted">{k.label}</dt>
                    <dd className="mt-1 text-2xl font-bold tabular-nums text-heading">{k.value}</dd>
                    {delta !== null && (
                      <dd className={cn("mt-0.5 flex items-center gap-0.5 text-xs font-semibold", up ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} title={t.vsPrev}>
                        {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
                        {up ? "+" : ""}
                        {delta}%
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 text-xs text-muted">{t.vsPrev}</p>
          </section>

          {/* Embudo: una serie, un tono, barras con puntas redondeadas */}
          <section className={card}>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-heading">{t.funnel}</h2>
                <p className="text-sm text-muted">{t.funnelHint}</p>
              </div>
              <Link href={`${base}/crm`} className="text-sm font-semibold text-accent hover:underline">
                {t.seeAll}
              </Link>
            </div>
            <ul className="mt-4 grid gap-2.5" aria-label={t.funnel}>
              {stages.map((s) => (
                <li key={s.status} className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-3" title={`${crm.status[s.status]}: ${s.n}`}>
                  <span className="truncate text-sm text-heading">{crm.status[s.status]}</span>
                  <span className="h-6 rounded-r-[4px] bg-card-soft">
                    <span
                      className="block h-full rounded-r-[4px] bg-deep-700 dark:bg-[#9fb0d8]"
                      style={{ width: `${(s.n / maxStage) * 100}%`, minWidth: s.n > 0 ? 4 : 0 }}
                    />
                  </span>
                  <span className="text-right text-sm font-bold tabular-nums text-heading">{s.n}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="grid content-start gap-4">
          {/* Automatizaciones */}
          <Link href={`${base}/automatizaciones`} className={cn(card, "flex items-center gap-3 hover:bg-[var(--meta-hover)]")}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--meta-active)] text-accent">
              <Workflow className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.94rem] font-semibold text-heading">{t.automations}</span>
              <span className="block text-sm text-muted">{t.automationsHint.replace("{n}", String(rules))}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
          </Link>

          {/* Reuniones */}
          <section className={card}>
            <h2 className="text-lg font-bold text-heading">{t.upcoming}</h2>
            {!meetings?.length ? (
              <p className="mt-3 text-sm text-muted">{t.noMeetings}</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <Link href={`${base}/crm/${m.lead_id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--meta-hover)]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card-soft text-heading">
                        <CalendarClock className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-heading">{(m.leads as unknown as { name: string } | null)?.name ?? "—"}</span>
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
          <section className={card}>
            <h2 className="text-lg font-bold text-heading">{t.activity}</h2>
            {!activity?.length ? (
              <p className="mt-3 text-sm text-muted">{t.noActivity}</p>
            ) : (
              <ul className="mt-3 grid gap-1">
                {activity.map((a) => (
                  <li key={a.id}>
                    <Link href={`${base}/crm/${a.lead_id}`} className="block rounded-lg p-2 hover:bg-[var(--meta-hover)]">
                      <span className="block truncate text-sm font-semibold text-heading">{(a.leads as unknown as { name: string } | null)?.name ?? "—"}</span>
                      <span className="block truncate text-xs text-muted">
                        {describe(a as Pick<LeadActivity, "type" | "body" | "meta">)} · {fmtShort.format(new Date(a.created_at))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
