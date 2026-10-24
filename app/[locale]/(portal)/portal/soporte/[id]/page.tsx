import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TicketControls, TicketThread } from "@/components/tickets/TicketThread";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { categoryLabel } from "@/lib/ticketCategories";
import { ticketStatusTone } from "@/lib/tickets";
import type { Ticket, TicketMessage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default async function TicketPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales", "client", "provider"]);
  const t = ticketsCopy[locale];
  const staff = ["admin", "support", "sales"].includes(profile.role);

  // RLS: el cliente solo encuentra las suyas.
  const { data } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const ticket = data as Ticket;
  const [{ data: messages }, employees] = await Promise.all([
    supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("id"),
    staff ? listEmployees(supabase) : Promise.resolve([]),
  ]);
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const card = "rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card";

  return (
    <>
      <LiveRefresh tables={["tickets"]} channel={`ticket-head-${id}`} />
      <Link href={`/${locale}/portal/soporte`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.thread.back}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-muted">#{ticket.number}</span>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", ticketStatusTone[ticket.status])}>
          {(staff ? t.staffStatus : t.status)[ticket.status]}
        </span>
      </div>
      <h1 className="mt-2 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight text-heading">{ticket.subject}</h1>
      <p className="mt-1 text-sm text-muted">{t.thread.opened.replace("{date}", fmt(ticket.created_at))}</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <section className={card}>
            <h2 className="text-lg text-heading">{t.thread.description}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-body">{ticket.description}</p>
          </section>
          <TicketThread
            locale={locale}
            ticket={ticket}
            initial={(messages ?? []) as TicketMessage[]}
            staff={staff}
            meId={profile.id}
            names={names}
          />
        </div>

        <aside className="grid content-start gap-6">
          {staff && (
            <section className={card}>
              <TicketControls key={ticket.updated_at} locale={locale} ticket={ticket} employees={employees} />
            </section>
          )}
          <section className={card}>
            <h2 className="text-base text-heading">{t.thread.details}</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              {staff && (
                <div>
                  <dt className="text-xs text-muted">{t.thread.requester}</dt>
                  <dd className="text-heading">
                    <span className="block font-semibold">{ticket.name}</span>
                    <a href={`mailto:${ticket.email}`} className="block break-all hover:underline">{ticket.email}</a>
                    {ticket.phone && <span className="block">{ticket.phone}</span>}
                    {ticket.company && <span className="block text-muted">{ticket.company}</span>}
                    {ticket.requester_id ? (
                      <Link href={`/${locale}/portal/clientes/${ticket.requester_id}`} className="mt-1 inline-block text-xs font-semibold text-accent hover:underline">
                        {t.thread.account}
                      </Link>
                    ) : (
                      <span className="mt-1 block text-xs text-muted">{t.thread.noAccount}</span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted">{t.thread.category}</dt>
                <dd className="text-heading">{categoryLabel(locale, ticket.category)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t.thread.priority}</dt>
                <dd className="text-heading">{t.priority[ticket.priority]}</dd>
              </div>
              {ticket.affected && (
                <div>
                  <dt className="text-xs text-muted">{t.thread.affected}</dt>
                  <dd className="text-heading">{ticket.affected}</dd>
                </div>
              )}
              {staff && (
                <div>
                  <dt className="text-xs text-muted">{t.thread.source}</dt>
                  <dd className="text-heading">{t.thread.sources[ticket.source]}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
