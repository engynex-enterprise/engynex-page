import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Star } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { Documents } from "@/components/documents/Documents";
import { AccountHeader } from "@/components/accounts/AccountHeader";
import { AccountProfileCard } from "@/components/accounts/AccountProfileCard";
import { AccountContacts } from "@/components/accounts/AccountContacts";
import { AccountTimeline } from "@/components/accounts/AccountTimeline";
import { AccountProjects } from "@/components/projects/AccountProjects";
import { AccountInvoices } from "@/components/billing/AccountInvoices";
import { accountDetailCopy } from "@/content/accountDetail";
import { accountsProCopy } from "@/content/accountsPro";
import { supportProCopy } from "@/content/supportPro";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysUntil, money } from "@/lib/accounts";
import { nowIso } from "@/lib/dates";
import { listEmployees } from "@/lib/employees";
import { shortDuration, slaState, slaTone } from "@/lib/supportSla";
import { ticketPriorityTone, ticketStatusTone } from "@/lib/tickets";
import type { AccountContact, AccountDetails, AccountEvent, AccountNote, AccountRow, ClientInvoice, PortalDocument, Ticket } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TABS = ["summary", "activity", "tickets", "projects", "invoices", "documents", "meetings"] as const;
type Tab = (typeof TABS)[number];

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = accountDetailCopy[locale];
  const p = accountsProCopy[locale];
  const tk = ticketsCopy[locale];
  const sp = supportProCopy[locale];
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "summary";

  const { data: account } = await supabase.from("profiles").select("*").eq("id", id).in("kind", ["client", "provider"]).maybeSingle();
  if (!account) notFound();

  const [{ data: details }, { data: list }, { data: contacts }, { data: pinned }, { data: tickets }, { data: docs }, { data: timeline }, employees] = await Promise.all([
    supabase.from("account_details").select("*").eq("profile_id", id).maybeSingle(),
    supabase.rpc("accounts_list"),
    supabase.from("account_contacts").select("*").eq("profile_id", id).order("created_at"),
    supabase.from("account_notes").select("*").eq("profile_id", id).eq("pinned", true).order("created_at", { ascending: false }),
    supabase.from("tickets").select("*").eq("requester_id", id).order("last_activity_at", { ascending: false }).limit(100),
    supabase.from("documents").select("*").eq("owner_id", id).order("created_at", { ascending: false }),
    tab === "activity" ? supabase.rpc("account_timeline", { p_account: id, p_limit: 150 }) : Promise.resolve({ data: [] }),
    listEmployees(supabase),
  ]);
  const d = (details ?? {
    profile_id: id,
    owner_id: null,
    stage: "active",
    plan: null,
    services: [],
    monthly_value: 0,
    contract_start: null,
    renewal_date: null,
    tax_id: null,
    website: null,
    address: null,
    city: null,
    industry: null,
    tags: [],
    notes: null,
    lead_id: null,
    updated_at: account.created_at,
    updated_by: null,
  }) as AccountDetails;
  const row = ((list ?? []) as unknown as AccountRow[]).find((r) => r.id === id);
  const leadId = d.lead_id;
  const { data: meetings } =
    tab === "meetings" && leadId
      ? await supabase.from("appointments").select("id, starts_at, channel, status, kind, outcome").eq("lead_id", leadId).order("starts_at", { ascending: false })
      : { data: [] };
  const [{ data: invoices }, { data: projects }] =
    tab === "invoices"
      ? await Promise.all([
          supabase.from("client_invoices").select("*").eq("account_id", id).order("number", { ascending: false }),
          supabase.from("client_projects").select("id, name").eq("account_id", id).order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

  const now = nowIso();
  const nowMs = new Date(now).getTime();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(now));
  const names = { ...Object.fromEntries(employees.map((e) => [e.id, e.name])), [account.id]: account.full_name ?? account.email };
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(iso));
  const base = `/${locale}/portal/clientes/${id}`;
  const ticketRows = (tickets ?? []) as Ticket[];

  const renewal = d.renewal_date ? daysUntil(d.renewal_date, today) : null;
  const kpis: { key: keyof typeof t.kpis; value: string; hint?: string; tone?: string }[] = [
    { key: "monthly", value: d.monthly_value ? money(d.monthly_value, locale) : "—", hint: d.plan ?? undefined },
    {
      key: "renewal",
      value: renewal == null ? t.noRenewal : renewal === 0 ? t.renewToday : renewal > 0 ? t.renewIn.replace("{n}", String(renewal)) : t.renewOverdue.replace("{n}", String(-renewal)),
      hint: d.renewal_date ? fmtDay(`${d.renewal_date}T12:00:00Z`) : undefined,
      tone: renewal != null && renewal < 0 ? "text-red-600 dark:text-red-400" : renewal != null && renewal <= 30 ? "text-amber-700 dark:text-amber-400" : undefined,
    },
    {
      key: "tickets",
      value: String(row?.open_tickets ?? 0),
      hint: row?.breached ? t.breached.replace("{n}", String(row.breached)) : undefined,
      tone: row?.breached ? "text-red-600 dark:text-red-400" : undefined,
    },
    { key: "csat", value: row?.csat != null ? `${row.csat} / 5` : "—" },
    { key: "docs", value: String((docs ?? []).length) },
    { key: "lastSeen", value: account.last_seen_at ? fmtDay(account.last_seen_at) : p.never },
    { key: "won", value: row?.won_value ? money(row.won_value, locale) : "—" },
  ];

  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

  return (
    <>
      <PageHeader title={p.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AccountHeader
          locale={locale}
          account={{ id: account.id, name: account.full_name ?? account.email, email: account.email, phone: account.phone, company: account.company, kind: account.kind, active: account.active }}
          stage={d.stage}
          ownerId={d.owner_id}
          health={row?.health ?? null}
          leadId={leadId}
          employees={employees}
          canManageAccess={profile.role === "admin"}
        />

        <div className="grid grid-cols-2 border-b border-line lg:grid-cols-4 xl:grid-cols-7">
          {kpis.map((k) => (
            <div key={k.key} className="min-w-0 border-b border-r border-line px-4 py-4 sm:px-6 xl:border-b-0 xl:last:border-r-0">
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p className={cn("mt-1 break-words text-[1.2rem] font-semibold leading-tight tabular-nums text-heading", k.tone)}>{k.value}</p>
              {k.hint && <p className={cn("mt-0.5 truncate text-xs", k.tone ?? "text-muted")}>{k.hint}</p>}
            </div>
          ))}
        </div>

        <nav aria-label={account.full_name ?? account.email} className="-mb-px flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
          {TABS.map((key) => {
            const count = key === "tickets" ? ticketRows.length : key === "documents" ? (docs ?? []).length : null;
            return (
              <Link
                key={key}
                href={key === "summary" ? base : `${base}?tab=${key}`}
                aria-current={tab === key ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                  tab === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
                )}
              >
                {t.tabs[key]}
                {count ? <span className="rounded-full bg-[var(--meta-active)] px-1.5 text-xs tabular-nums text-heading">{count}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 sm:px-6">
          {tab === "summary" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <AccountProfileCard key={d.updated_at} locale={locale} details={d} />
              <div className="grid content-start gap-5">
                <AccountContacts locale={locale} accountId={id} contacts={(contacts ?? []) as AccountContact[]} />
                <section className={card}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-[0.98rem] font-semibold text-heading">{t.pinned.title}</h3>
                    <Link href={`${base}?tab=activity`} className="text-sm font-medium text-accent hover:underline">
                      {t.pinned.all}
                    </Link>
                  </div>
                  {!pinned?.length ? (
                    <p className="text-sm text-muted">{t.pinned.empty}</p>
                  ) : (
                    <ul className="grid gap-2">
                      {(pinned as AccountNote[]).map((n) => (
                        <li key={n.id} className="rounded-lg bg-[var(--meta-active)]/50 px-3 py-2.5">
                          <p className="text-xs text-muted">
                            {p.noteKinds[n.kind]} · {fmtDay(n.created_at)}
                            {n.author_id && names[n.author_id] ? ` · ${names[n.author_id]}` : ""}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-heading">{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}

          {tab === "activity" && (
            <div className="max-w-4xl">
              <AccountTimeline
                locale={locale}
                accountId={id}
                events={(timeline ?? []) as unknown as AccountEvent[]}
                names={names}
                meId={profile.id}
                admin={profile.role === "admin"}
              />
            </div>
          )}

          {tab === "tickets" &&
            (ticketRows.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">{t.tickets.empty}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                      {(Object.keys(t.tickets.cols) as (keyof typeof t.tickets.cols)[]).map((c) => (
                        <th key={c} scope="col" className="px-4 py-2.5 font-medium">{t.tickets.cols[c]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketRows.map((x) => {
                      const s = slaState(x, nowMs);
                      return (
                        <tr key={x.id} className="border-b border-line last:border-0 hover:bg-[var(--meta-hover)]">
                          <td className="px-4 py-3 font-mono text-muted">#{x.number}</td>
                          <td className="max-w-xs px-4 py-3">
                            <Link href={`/${locale}/portal/soporte/${x.id}`} className="block truncate font-medium text-heading hover:underline">{x.subject}</Link>
                          </td>
                          <td className={cn("px-4 py-3 font-medium", ticketPriorityTone[x.priority])}>{tk.priority[x.priority]}</td>
                          <td className="px-4 py-3">
                            <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", ticketStatusTone[x.status])}>{tk.staffStatus[x.status]}</span>
                          </td>
                          <td className={cn("whitespace-nowrap px-4 py-3 text-xs", slaTone(s))}>
                            {s ? (s.breached ? sp.sla.breached : sp.sla.left).replace("{t}", shortDuration(s.left, sp.units)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {x.csat_rating != null ? (
                              <span className="inline-flex items-center gap-1 tabular-nums text-heading">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                                {x.csat_rating}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(x.last_activity_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === "documents" && (
            <Documents
              locale={locale}
              ownerId={account.id}
              docs={(docs ?? []) as PortalDocument[]}
              kinds={["proposal", "contract", "invoice", "deliverable", "report", "purchase_order", "other"]}
              meId={profile.id}
              staff
              names={names}
            />
          )}

          {tab === "invoices" && (
            <AccountInvoices
              locale={locale}
              accountId={id}
              invoices={(invoices ?? []) as ClientInvoice[]}
              projects={projects ?? []}
              canWrite={profile.role === "admin" || profile.role === "sales"}
            />
          )}

          {tab === "projects" && <AccountProjects locale={locale} accountId={id} employees={employees} today={today} />}

          {tab === "meetings" && (
            <section className={cn(card, "max-w-3xl")}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[0.98rem] font-semibold text-heading">{t.tabs.meetings}</h3>
                <Link href={`/${locale}/portal/agenda`} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {t.meetings.agenda}
                </Link>
              </div>
              {!leadId ? (
                <p className="text-sm text-muted">{t.meetings.noLead}</p>
              ) : !meetings?.length ? (
                <p className="text-sm text-muted">{t.meetings.empty}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {meetings.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                      <span className="min-w-0 flex-1 font-medium text-heading first-letter:uppercase">{fmt(m.starts_at)}</span>
                      <span className="text-muted">{tk.home.channels[m.channel]}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          m.status === "done"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : m.status === "scheduled"
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300"
                              : "bg-surface-soft text-muted dark:bg-white/[0.06]",
                        )}
                      >
                        {t.statuses[m.status] ?? m.status}
                      </span>
                      {m.outcome && <p className="w-full text-xs text-muted">{m.outcome}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
