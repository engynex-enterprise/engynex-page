import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Documents } from "@/components/documents/Documents";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { ticketStatusTone } from "@/lib/tickets";
import type { PortalDocument, Ticket } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default async function AccountPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = ticketsCopy[locale];

  const { data: account } = await supabase.from("profiles").select("*").eq("id", id).in("kind", ["client", "provider"]).maybeSingle();
  if (!account) notFound();

  const [{ data: docs }, { data: tickets }, { data: leads }, employees] = await Promise.all([
    supabase.from("documents").select("*").eq("owner_id", id).order("created_at", { ascending: false }),
    supabase.from("tickets").select("*").eq("requester_id", id).order("last_activity_at", { ascending: false }).limit(50),
    supabase.from("leads").select("id, created_at").ilike("email", account.email.replace(/[\\%_]/g, "\\$&")).order("created_at", { ascending: false }).limit(1),
    listEmployees(supabase),
  ]);
  const lead = leads?.[0];
  const { data: meetings } = lead
    ? await supabase.from("appointments").select("id, starts_at, channel, status").eq("lead_id", lead.id).order("starts_at", { ascending: false })
    : { data: [] };
  const names = { ...Object.fromEntries(employees.map((e) => [e.id, e.name])), [account.id]: account.full_name ?? account.email };
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const card = "rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card";

  return (
    <>
      <Link href={`/${locale}/portal/clientes`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.accounts.back}
      </Link>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-bold text-heading dark:bg-white/[0.08]">{t.accounts.kinds[account.kind]}</span>
          <h1 className="mt-3 text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight text-heading">{account.full_name ?? account.email}</h1>
          <p className="mt-1 text-sm text-muted">{account.company ?? ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${account.email}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-card-soft dark:bg-card">
            <Mail className="h-4 w-4" aria-hidden />
            {account.email}
          </a>
          {account.phone && (
            <a href={`tel:${account.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-card-soft dark:bg-card">
              <Phone className="h-4 w-4" aria-hidden />
              {account.phone}
            </a>
          )}
          {lead && (
            <Link href={`/${locale}/portal/crm/${lead.id}`} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-accent ring-1 ring-line-strong hover:bg-card-soft">
              {t.accounts.lead}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 className="mb-4 text-lg text-heading">{t.docs.title}</h2>
          <Documents
            locale={locale}
            ownerId={account.id}
            docs={(docs ?? []) as PortalDocument[]}
            kinds={["proposal", "contract", "invoice", "deliverable", "report", "purchase_order", "other"]}
            meId={profile.id}
            staff
            names={names}
          />
        </div>
        <aside className="grid content-start gap-6">
          <section className={card}>
            <h2 className="text-base text-heading">{t.accounts.tickets}</h2>
            {!tickets?.length ? (
              <p className="mt-3 text-sm text-muted">{t.accounts.noTickets}</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {(tickets as Ticket[]).map((x) => (
                  <li key={x.id}>
                    <Link href={`/${locale}/portal/soporte/${x.id}`} className="flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-surface-soft dark:hover:bg-white/[0.05]">
                      <span className="font-mono text-xs text-muted">#{x.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">{x.subject}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-bold", ticketStatusTone[x.status])}>{t.staffStatus[x.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={card}>
            <h2 className="text-base text-heading">{t.accounts.meetings}</h2>
            {!meetings?.length ? (
              <p className="mt-3 text-sm text-muted">{t.home.noMeetings}</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {meetings.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-surface-soft px-3 py-2 dark:bg-white/[0.05]">
                    <span className="block font-semibold text-heading first-letter:uppercase">{fmt(m.starts_at)}</span>
                    <span className="text-xs text-muted">{t.home.channels[m.channel]}</span>
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
