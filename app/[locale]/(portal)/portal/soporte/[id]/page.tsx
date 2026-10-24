import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { TicketThread } from "@/components/tickets/TicketThread";
import { TicketSidebar } from "@/components/support/TicketSidebar";
import { buttonClasses } from "@/components/ui/Button";
import { ticketsCopy } from "@/content/tickets";
import { supportProCopy } from "@/content/supportPro";
import { supportTicketCopy } from "@/content/supportTicket";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { nowIso } from "@/lib/dates";
import { listEmployees } from "@/lib/employees";
import { categoryLabel, ticketCategories } from "@/lib/ticketCategories";
import { shortDuration, slaState, slaTone } from "@/lib/supportSla";
import { ticketPriorityTone, ticketStatusTone } from "@/lib/tickets";
import type { Ticket, TicketMacro, TicketMessage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default async function TicketPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales", "client", "provider"]);
  const tk = ticketsCopy[locale];
  const t = supportTicketCopy[locale];
  const pro = supportProCopy[locale];
  const staff = ["admin", "support", "sales"].includes(profile.role);

  // RLS: el cliente solo encuentra las suyas.
  const { data } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const ticket = data as Ticket;
  const [{ data: messages }, employees, { data: macros }, { data: others }, { data: merged }] = await Promise.all([
    supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("id"),
    staff ? listEmployees(supabase) : Promise.resolve([]),
    staff ? supabase.from("ticket_macros").select("*").order("title") : Promise.resolve({ data: [] as TicketMacro[] }),
    staff
      ? supabase.from("tickets").select("id, number, subject, status, created_at").eq("email", ticket.email).neq("id", id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    ticket.merged_into ? supabase.from("tickets").select("number").eq("id", ticket.merged_into).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const now = Date.parse(nowIso());
  const sla = staff ? slaState(ticket, now) : null;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const done = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <>
      <LiveRefresh tables={["tickets"]} channel={`ticket-head-${id}`} />
      <PageHeader title={staff ? pro.title : tk.client.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="border-b border-line px-4 py-4 sm:px-6">
          <Link href={`/${locale}/portal/soporte`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted">#{ticket.number}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", ticketStatusTone[ticket.status])}>{(staff ? tk.staffStatus : tk.status)[ticket.status]}</span>
            {staff && <span className={cn("text-xs font-semibold", ticketPriorityTone[ticket.priority])}>{tk.priority[ticket.priority]}</span>}
            {sla && (
              <span className={cn("rounded-full bg-[var(--meta-active)]/60 px-2.5 py-0.5 text-xs font-semibold", slaTone(sla))}>
                {(sla.kind === "first" ? pro.sla.first : pro.sla.resolve) + " · "}
                {(sla.breached ? pro.sla.breached : pro.sla.left).replace("{t}", shortDuration(sla.left, pro.units))}
              </span>
            )}
            {merged && <span className="rounded-full bg-[var(--meta-active)] px-2.5 py-0.5 text-xs text-heading">{pro.merged.replace("{n}", String(merged.number))}</span>}
            {staff && ticket.tags.map((x) => (
              <span key={x} className="rounded-md bg-[var(--meta-active)] px-2 py-0.5 text-xs text-heading">
                {x}
              </span>
            ))}
          </div>
          <h1 className="mt-1.5 text-[clamp(1.25rem,2vw,1.6rem)] font-semibold leading-tight text-heading">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.opened.replace("{date}", fmt(ticket.created_at)).replace("{name}", staff ? ticket.name : t.you.toLowerCase())}
            {staff && ` · ${t.via.replace("{source}", pro.sources[ticket.source] ?? ticket.source)}`}
            {" · "}
            {categoryLabel(locale, ticket.category)}
          </p>
        </div>

        <div className="grid gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 content-start gap-5">
            {!staff && done && !ticket.merged_into && (
              <section className={cn(card, "flex flex-wrap items-center justify-between gap-3")}>
                {ticket.csat_rating == null ? (
                  <>
                    <div>
                      <h2 className="text-[0.98rem] font-semibold text-heading">{t.rate.title}</h2>
                      <p className="text-sm text-muted">{t.rate.text}</p>
                    </div>
                    <Link href={`/${locale}/soporte/encuesta?t=${ticket.csat_token}`} className={cn(buttonClasses("primary", "md"), "h-10")}>
                      <Star className="h-4 w-4" aria-hidden />
                      {t.rate.cta}
                    </Link>
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-heading">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {t.rate.done.replace("{n}", String(ticket.csat_rating))}
                  </p>
                )}
              </section>
            )}
            <TicketThread
              locale={locale}
              ticket={ticket}
              initial={(messages ?? []) as TicketMessage[]}
              staff={staff}
              meId={profile.id}
              names={names}
              macros={(macros ?? []) as TicketMacro[]}
              mergedNumber={merged?.number ?? null}
            />
          </div>

          {staff ? (
            <TicketSidebar
              key={ticket.updated_at}
              locale={locale}
              ticket={ticket}
              employees={employees}
              categories={ticketCategories(locale)}
              meId={profile.id}
              initialNow={now}
              others={(others ?? []) as Pick<Ticket, "id" | "number" | "subject" | "status" | "created_at">[]}
            />
          ) : (
            <aside className="grid content-start gap-5">
              <section className={card}>
                <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{tk.thread.details}</h2>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{tk.thread.status}</dt>
                    <dd className="text-heading">{tk.status[ticket.status]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{tk.thread.category}</dt>
                    <dd className="text-heading">{categoryLabel(locale, ticket.category)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{tk.thread.priority}</dt>
                    <dd className="text-heading">{tk.priority[ticket.priority]}</dd>
                  </div>
                  {ticket.affected && (
                    <div>
                      <dt className="text-xs text-muted">{tk.thread.affected}</dt>
                      <dd className="text-heading">{ticket.affected}</dd>
                    </div>
                  )}
                  {ticket.assigned_to && (
                    <div>
                      <dt className="text-xs text-muted">{tk.thread.owner}</dt>
                      <dd className="text-heading">{t.team}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
