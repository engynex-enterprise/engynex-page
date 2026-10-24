import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileText, Headset, MessageCircle } from "lucide-react";
import { ticketsCopy } from "@/content/tickets";
import { ticketStatusTone } from "@/lib/tickets";
import { PageHeader } from "@/components/portal/PageHeader";
import { portalCopy } from "@/content/portal";
import { leadFormCopy } from "@/content/leadForm";
import { isLocale, type Locale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import type { Lead, LeadTier } from "@/lib/supabase/types";
import { tierStyles } from "@/lib/tiers";
import { daysAgoIso, nowIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default async function PortalHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale);
  const t = portalCopy[locale].portal;
  const name = (profile.full_name ?? profile.email).split(/\s+/)[0];
  const hello = t.hello.replace("{name}", name);

  if (profile.kind === "client" || profile.kind === "provider") {
    const copy = profile.kind === "client" ? t.clientHome : t.providerHome;
    const tk = ticketsCopy[locale];
    const [{ data: openTickets }, { data: docs }, { data: meetings }] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, number, subject, status, last_activity_at")
        .eq("requester_id", profile.id)
        .in("status", ["open", "in_progress", "waiting"])
        .order("last_activity_at", { ascending: false })
        .limit(5),
      supabase.from("documents").select("id, title, kind, created_at").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(4),
      profile.kind === "client" ? supabase.rpc("my_appointments") : Promise.resolve({ data: [] }),
    ]);
    const now = nowIso();
    const upcoming = (meetings ?? []).filter((m) => m.status === "scheduled" && m.starts_at >= now).reverse().slice(0, 3);
    const when = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
    const card = "rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card";
    const seeAll = (href: string) => (
      <Link href={href} className="text-sm font-semibold text-accent hover:underline">
        {tk.home.seeAll}
      </Link>
    );

    return (
      <>
        <PageHeader title={hello} subtitle={copy.subtitle} />
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickCard
            href={`/${locale}/portal/soporte/nueva`}
            icon={<Headset className="h-6 w-6 text-accent" aria-hidden />}
            title={tk.client.new}
            desc={t.clientHome.supportDesc}
          />
          <QuickCard
            href={`https://wa.me/${siteConfig.whatsapp}`}
            external
            icon={<MessageCircle className="h-6 w-6 text-accent" aria-hidden />}
            title={profile.kind === "client" ? t.clientHome.contact : t.providerHome.contact}
            desc={profile.kind === "client" ? t.clientHome.contactDesc : t.providerHome.contactDesc}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg text-heading">{tk.home.openTickets}</h2>
              {seeAll(`/${locale}/portal/soporte`)}
            </div>
            {!openTickets?.length ? (
              <p className="mt-3 text-sm text-muted">{tk.home.noTickets}</p>
            ) : (
              <ul className="mt-3 grid gap-1">
                {openTickets.map((x) => (
                  <li key={x.id}>
                    <Link href={`/${locale}/portal/soporte/${x.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-surface-soft dark:hover:bg-white/[0.05]">
                      <span className="font-mono text-xs text-muted">#{x.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">{x.subject}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-bold", ticketStatusTone[x.status])}>{tk.status[x.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profile.kind === "client" && (
            <section className={card}>
              <h2 className="text-lg text-heading">{tk.home.meetings}</h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{tk.home.noMeetings}</p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {upcoming.map((m) => (
                    <li key={m.id} className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-white/[0.05]">
                      <p className="text-sm font-bold text-heading first-letter:uppercase">{when.format(new Date(m.starts_at))}</p>
                      <p className="text-xs text-muted">{tk.home.channels[m.channel]}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg text-heading">{tk.home.recentDocs}</h2>
              {seeAll(`/${locale}/portal/documentos`)}
            </div>
            {!docs?.length ? (
              <p className="mt-3 text-sm text-muted">{tk.docs.empty}</p>
            ) : (
              <ul className="mt-3 grid gap-1">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-2 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">{d.title}</span>
                    <span className="text-xs text-muted">{tk.docs.kinds[d.kind]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    );
  }

  // ---------------------- Empleados ----------------------
  const since = daysAgoIso(30);
  const [{ data: leads }, { data: meetings }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, email, tier, score, problem_category, created_at, status")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, starts_at, channel, lead_id, leads(name)")
      .eq("status", "scheduled")
      .gte("starts_at", nowIso())
      .order("starts_at")
      .limit(5),
  ]);

  const list = (leads ?? []) as Pick<
    Lead,
    "id" | "name" | "email" | "tier" | "score" | "problem_category" | "created_at" | "status"
  >[];
  const count = (tier: LeadTier) => list.filter((l) => l.tier === tier).length;
  const e = t.employeeHome;
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  const channels = leadFormCopy[locale as Locale].booking.channels;
  const problems = leadFormCopy[locale as Locale].steps.problem.options;

  return (
    <>
      <PageHeader title={hello} subtitle={e.subtitle} />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={e.leads} value={list.length} />
        <Stat label={e.green} value={count("green")} dot={tierStyles.green.dot} />
        <Stat label={e.yellow} value={count("yellow")} dot={tierStyles.yellow.dot} />
        <Stat label={e.red} value={count("red")} dot={tierStyles.red.dot} />
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card">
          <h2 className="text-lg text-heading">{e.recent}</h2>
          {list.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{e.noLeads}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {list.slice(0, 8).map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-heading">{lead.name}</p>
                    <p className="truncate text-xs text-muted">
                      {problems[lead.problem_category as keyof typeof problems] ?? lead.problem_category}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", tierStyles[lead.tier].pill)}>
                    {e.score} {lead.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card">
          <h2 className="text-lg text-heading">{e.upcoming}</h2>
          {!meetings || meetings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{e.noMeetings}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {meetings.map((m) => (
                <li key={m.id} className="py-3">
                  <p className="text-sm font-bold text-heading first-letter:uppercase">
                    {fmt.format(new Date(m.starts_at))}
                  </p>
                  <p className="text-xs text-muted">
                    {(m.leads as unknown as { name: string } | null)?.name} · {channels[m.channel]}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card">
      <dt className="flex items-center gap-2 text-sm text-muted">
        {dot && <span className={cn("h-2.5 w-2.5 rounded-full", dot)} aria-hidden />}
        {label}
      </dt>
      <dd className="mt-2 text-4xl font-bold tabular-nums text-heading">{value}</dd>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  desc,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  external?: boolean;
}) {
  const className =
    "group flex h-full flex-col rounded-3xl bg-surface p-6 ring-1 ring-line transition-shadow hover:shadow-card-hover dark:bg-card";
  const body = (
    <>
      {icon}
      <span className="mt-6 flex items-center justify-between gap-3 text-lg font-bold text-heading">
        {title}
        <ArrowUpRight className="h-4 w-4 text-muted" aria-hidden />
      </span>
      <span className="mt-1 text-sm text-muted">{desc}</span>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
