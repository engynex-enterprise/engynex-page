import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Gift,
  Globe2,
  Headset,
  Mail,
  MessageCircle,
  Receipt,
  Search,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { BookMeetingButton } from "@/components/clientPortal/BookMeetingButton";
import { card, fmtDay, fmtShortWhen, fmtWhen, moneyCop } from "@/components/clientPortal/shared";
import { clientPortalCopy } from "@/content/clientPortal";
import { ticketsCopy } from "@/content/tickets";
import { ticketStatusTone } from "@/lib/tickets";
import { siteConfig } from "@/lib/site";
import { nowIso } from "@/lib/dates";
import type { Database, Profile } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Client = SupabaseClient<Database>;
type Pending = { key: string; href: string; icon: LucideIcon; title: string; desc: string; tone?: "warn" };

const DAY = 24 * 3600 * 1000;

/** Inicio del portal para clientes y proveedores. */
export async function ClientHome({
  locale,
  supabase,
  profile,
  hello,
}: {
  locale: Locale;
  supabase: Client;
  profile: Pick<Profile, "id" | "kind" | "full_name" | "email">;
  hello: string;
}) {
  const t = clientPortalCopy[locale].home;
  const tk = ticketsCopy[locale];
  const isClient = profile.kind === "client";
  const base = `/${locale}/portal`;
  const now = nowIso();
  const nowMs = Date.parse(now);
  const none = Promise.resolve({ data: null });

  const [{ data: tickets }, { data: docs }, { data: meetings }, { data: projects }, { data: invoices }, { data: domains }, { data: manager }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("id, number, subject, status, last_activity_at")
        .eq("requester_id", profile.id)
        .in("status", ["open", "in_progress", "waiting"])
        .order("last_activity_at", { ascending: false })
        .limit(20),
      supabase.from("documents").select("id, title, kind, created_at").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(4),
      isClient ? supabase.rpc("my_appointments") : none,
      isClient
        ? supabase
            .from("client_projects")
            .select("id, name, status, progress, due_date")
            .eq("account_id", profile.id)
            .in("status", ["planning", "in_progress", "review", "paused"])
            .order("updated_at", { ascending: false })
        : none,
      isClient
        ? supabase.from("client_invoices").select("id, number, total, status, due_date").eq("account_id", profile.id).in("status", ["issued", "overdue"]).order("due_date")
        : none,
      isClient
        ? supabase.from("client_domains").select("id, domain, status, expires_at").eq("owner_id", profile.id).order("expires_at", { nullsFirst: false }).limit(20)
        : none,
      isClient ? supabase.rpc("my_account_manager") : none,
    ]);

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: approvals } = projectIds.length
    ? await supabase
        .from("project_milestones")
        .select("id, title, project_id")
        .in("project_id", projectIds)
        .eq("needs_approval", true)
        .eq("approval_status", "pending")
        .order("position")
    : { data: null };

  const upcoming = (meetings ?? []).filter((m) => m.status === "scheduled" && m.ends_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const liveDomains = (domains ?? []).filter((d) => ["active", "expiring", "pending", "expired"].includes(d.status));
  const daysLeft = (iso: string | null) => (iso ? Math.ceil((Date.parse(iso) - nowMs) / DAY) : null);
  const projectName = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const due = (invoices ?? []).reduce((n, i) => n + Number(i.total), 0);
  const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

  const pending: Pending[] = [
    ...(approvals ?? []).map((m) => ({
      key: `m${m.id}`,
      href: `${base}/proyectos/${m.project_id}`,
      icon: CheckCircle2,
      title: fill(t.pending.approve, { title: m.title }),
      desc: fill(t.pending.approveIn, { project: projectName.get(m.project_id) ?? "" }),
    })),
    ...(invoices ?? []).map((i) => ({
      key: `i${i.id}`,
      href: `${base}/facturacion`,
      icon: Receipt,
      title: `${fill(t.pending.invoice, { n: i.number })} · ${moneyCop(Number(i.total))}`,
      desc: i.due_date ? fill(i.status === "overdue" ? t.pending.invoiceOverdue : t.pending.invoiceDue, { date: fmtDay(locale, i.due_date) }) : "",
      tone: i.status === "overdue" ? ("warn" as const) : undefined,
    })),
    ...liveDomains
      .filter((d) => {
        const n = daysLeft(d.expires_at);
        return n !== null && n <= 30;
      })
      .map((d) => ({
        key: `d${d.id}`,
        href: `${base}/dominios/${d.id}`,
        icon: Globe2,
        title: fill(t.pending.domain, { domain: d.domain }),
        desc: fill(t.pending.domainIn, { n: Math.max(daysLeft(d.expires_at) ?? 0, 0) }),
        tone: "warn" as const,
      })),
    ...(tickets ?? [])
      .filter((x) => x.status === "waiting")
      .map((x) => ({
        key: `t${x.id}`,
        href: `${base}/soporte/${x.id}`,
        icon: Headset,
        title: fill(t.pending.ticket, { n: x.number }),
        desc: `${x.subject} · ${t.pending.ticketDesc}`,
      })),
  ];

  const kpis = [
    { key: "projects", value: String(projects?.length ?? 0), href: `${base}/proyectos` },
    { key: "tickets", value: String(tickets?.length ?? 0), href: `${base}/soporte` },
    { key: "due", value: moneyCop(due), href: `${base}/facturacion`, tone: (invoices ?? []).some((i) => i.status === "overdue") },
    { key: "meeting", value: upcoming[0] ? fmtShortWhen(locale, upcoming[0].starts_at) : t.noMeeting, href: `${base}/reuniones`, small: true },
  ] as const;

  const seeAll = (href: string) => (
    <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-medium text-muted hover:text-heading">
      {t.seeAll}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </Link>
  );
  const head = (title: string, href?: string) => (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      {href && seeAll(href)}
    </div>
  );
  const empty = (s: string) => <p className="py-3 text-sm text-muted">{s}</p>;
  const action = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--meta-hover)]";
  const actionBody = (Icon: LucideIcon, title: string, desc: string) => (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--meta-active)] text-heading">
        <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-heading">{title}</span>
        <span className="block truncate text-xs text-muted">{desc}</span>
      </span>
    </>
  );

  const pendingCard = (
    <section className={card}>
      {head(t.pending.title)}
      {pending.length === 0 ? (
        <p className="flex items-center gap-2 py-2 text-sm text-muted">
          <CheckCircle2 className="h-4 w-4 text-brand-green-dark dark:text-brand-green" aria-hidden />
          {t.pending.empty}
        </p>
      ) : (
        <ul className="-mx-2 grid gap-0.5">
          {pending.map((p) => (
            <li key={p.key}>
              <Link href={p.href} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--meta-hover)]">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    p.tone === "warn" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" : "bg-[var(--meta-active)] text-heading",
                  )}
                >
                  <p.icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-heading">{p.title}</span>
                  {p.desc && <span className={cn("block truncate text-xs", p.tone === "warn" ? "text-amber-700 dark:text-amber-400" : "text-muted")}>{p.desc}</span>}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const ticketsCard = (
    <section className={card}>
      {head(t.tickets.title, `${base}/soporte`)}
      {!tickets?.length
        ? empty(t.tickets.empty)
        : (
          <ul className="-mx-2 grid gap-0.5">
            {tickets.slice(0, 5).map((x) => (
              <li key={x.id}>
                <Link href={`${base}/soporte/${x.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--meta-hover)]">
                  <span className="font-mono text-xs text-muted">#{x.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-heading">{x.subject}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", ticketStatusTone[x.status])}>{tk.status[x.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </section>
  );

  const docsCard = (
    <section className={card}>
      {head(t.docs.title, `${base}/documentos`)}
      {!docs?.length
        ? empty(t.docs.empty)
        : (
          <ul className="grid gap-1">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-1.5">
                <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-heading">{d.title}</span>
                <span className="shrink-0 text-xs text-muted">{tk.docs.kinds[d.kind] ?? d.kind}</span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );

  // ---------------------- Proveedor: versión simple ----------------------
  if (!isClient) {
    return (
      <>
        <PageHeader title={hello} subtitle={t.providerSubtitle} />
        <LiveRefresh tables={["tickets", "documents"]} channel="client-home" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="grid content-start gap-5 lg:col-span-2">
            {pendingCard}
            {ticketsCard}
            {docsCard}
          </div>
          <section className={cn(card, "content-start self-start")}>
            {head(t.actions.title)}
            <div className="-mx-2 grid gap-0.5">
              <Link href={`${base}/soporte/nueva`} className={action}>
                {actionBody(Headset, t.actions.ticket, t.actions.ticketDesc)}
              </Link>
              <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className={action}>
                {actionBody(MessageCircle, t.actions.contact, t.actions.contactDesc)}
              </a>
              <Link href={`${base}/ayuda`} className={action}>
                {actionBody(CircleHelp, t.actions.help, t.actions.helpDesc)}
              </Link>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ---------------------- Cliente ----------------------
  const mgr = manager?.[0];
  const firstName = (profile.full_name ?? profile.email).split(/\s+/)[0];
  const waText = encodeURIComponent(locale === "es" ? `Hola${mgr ? ` ${mgr.full_name.split(/\s+/)[0]}` : ""}, soy ${firstName}.` : `Hi${mgr ? ` ${mgr.full_name.split(/\s+/)[0]}` : ""}, this is ${firstName}.`);
  const initials = (mgr?.full_name ?? "Engynex")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <PageHeader title={hello} subtitle={t.subtitle} />
      <LiveRefresh tables={["tickets", "documents", "client_projects", "project_milestones", "client_invoices", "client_domains", "appointments"]} channel="client-home" />
      <div className="-mx-4 sm:-mx-6">
        <div className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {kpis.map((k, i) => (
            <Link
              key={k.key}
              href={k.href}
              className={cn(
                "min-w-0 border-line px-4 py-4 hover:bg-[var(--meta-hover)] sm:px-6",
                i % 2 === 0 && "border-r",
                i < 2 && "border-b lg:border-b-0",
                i === 1 && "lg:border-r",
                i === 2 && "lg:border-r",
              )}
            >
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p
                className={cn(
                  "mt-1 truncate font-semibold tabular-nums leading-tight",
                  "small" in k ? "text-lg first-letter:uppercase" : "text-[1.6rem] leading-none",
                  "tone" in k && k.tone ? "text-amber-700 dark:text-amber-400" : "text-heading",
                )}
              >
                {k.value}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 px-4 py-6 sm:px-6 lg:grid-cols-3">
          <div className="grid min-w-0 content-start gap-5 lg:col-span-2">
            {pendingCard}

            <section className={card}>
              {head(t.projects.title, `${base}/proyectos`)}
              {!projects?.length
                ? empty(t.projects.empty)
                : (
                  <ul className="grid gap-4">
                    {projects.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link href={`${base}/proyectos/${p.id}`} className="group block">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-semibold text-heading group-hover:underline">{p.name}</span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-heading">{p.progress}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--meta-active)]" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={p.name}>
                            <div className="h-full rounded-full bg-brand-green" style={{ width: `${Math.min(Math.max(p.progress, 0), 100)}%` }} />
                          </div>
                          {p.due_date && <p className="mt-1 text-xs text-muted">{fill(t.projects.due, { date: fmtDay(locale, p.due_date) })}</p>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              {ticketsCard}
              {docsCard}
            </div>
          </div>

          <div className="grid min-w-0 content-start gap-5">
            <section className={card}>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{t.manager.title}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-deep-700 text-sm font-semibold text-white dark:bg-white dark:text-deep-700">{initials}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-heading">{mgr?.full_name ?? t.manager.none}</p>
                  <p className="truncate text-sm text-muted">{mgr?.email ?? t.manager.noneDesc}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-green text-sm font-semibold text-deep-700 hover:brightness-95"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t.manager.whatsapp}
                </a>
                <a
                  href={`mailto:${mgr?.email ?? siteConfig.email}`}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {t.manager.email}
                </a>
              </div>
            </section>

            <section className={card}>
              {head(t.actions.title)}
              <div className="-mx-2 grid gap-0.5">
                <Link href={`${base}/soporte/nueva`} className={action}>
                  {actionBody(Headset, t.actions.ticket, t.actions.ticketDesc)}
                </Link>
                <BookMeetingButton locale={locale} className={cn(action, "w-full disabled:opacity-60")}>
                  {actionBody(CalendarDays, t.actions.meeting, t.actions.meetingDesc)}
                </BookMeetingButton>
                <Link href={`${base}/referidos`} className={action}>
                  {actionBody(Gift, t.actions.refer, t.actions.referDesc)}
                </Link>
                <Link href={`/${locale}/servicios/desarrollo-web#dominios`} className={action}>
                  {actionBody(Search, t.actions.domain, t.actions.domainDesc)}
                </Link>
              </div>
            </section>

            <section className={card}>
              {head(t.meetings.title, `${base}/reuniones`)}
              {upcoming.length === 0
                ? empty(t.meetings.empty)
                : (
                  <ul className="grid gap-2">
                    {upcoming.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex gap-3 rounded-lg bg-[var(--meta-hover)] px-3 py-2.5">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-heading first-letter:uppercase">{fmtWhen(locale, m.starts_at)}</p>
                          <p className="truncate text-xs text-muted">
                            {clientPortalCopy[locale].meetings.channels[m.channel]}
                            {m.host_name ? ` · ${m.host_name}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </section>

            <section className={card}>
              {head(t.domains.title, `${base}/dominios`)}
              {liveDomains.length === 0
                ? empty(t.domains.empty)
                : (
                  <ul className="-mx-2 grid gap-0.5">
                    {liveDomains.slice(0, 4).map((d) => {
                      const n = daysLeft(d.expires_at);
                      return (
                        <li key={d.id}>
                          <Link href={`${base}/dominios/${d.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--meta-hover)]">
                            <Globe2 className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-heading">{d.domain}</span>
                            {d.expires_at && (
                              <span className={cn("shrink-0 text-xs", n !== null && n <= 30 ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted")}>
                                {fill(t.domains.expires, { date: fmtDay(locale, d.expires_at) })}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
