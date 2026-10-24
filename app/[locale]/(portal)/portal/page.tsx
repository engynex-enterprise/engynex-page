import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileText, Headset, MessageCircle } from "lucide-react";
import { ticketsCopy } from "@/content/tickets";
import { ticketStatusTone } from "@/lib/tickets";
import { PageHeader } from "@/components/portal/PageHeader";
import { BusinessHome } from "@/components/portal/BusinessHome";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import { nowIso } from "@/lib/dates";
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
    const card = "rounded-lg bg-surface p-6 shadow-meta dark:bg-card";
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
                    <Link href={`/${locale}/portal/soporte/${x.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-soft dark:hover:bg-white/[0.05]">
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
                    <li key={m.id} className="rounded-lg bg-surface-soft px-4 py-3 dark:bg-white/[0.05]">
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
  return <BusinessHome locale={locale} supabase={supabase} profile={profile} hello={hello} />;
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
    "group flex h-full flex-col rounded-lg bg-surface p-6 shadow-meta transition-shadow hover:shadow-card-hover dark:bg-card";
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
