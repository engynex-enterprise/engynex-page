import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { buttonClasses } from "@/components/ui/Button";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { ticketPriorityTone, ticketStatusTone } from "@/lib/tickets";
import type { Ticket, TicketStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Filter = "active" | "mine" | "unassigned" | "waiting" | "done";
const ACTIVE: TicketStatus[] = ["open", "in_progress", "waiting"];

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales", "client", "provider"]);
  const t = ticketsCopy[locale];
  const staff = ["admin", "support", "sales"].includes(profile.role);
  const base = `/${locale}/portal/soporte`;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  // ---------------- Cliente / proveedor ----------------
  if (!staff) {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("requester_id", profile.id)
      .order("last_activity_at", { ascending: false });
    const tickets = (data ?? []) as Ticket[];
    return (
      <>
        <LiveRefresh tables={["tickets"]} channel="my-tickets" />
        <PageHeader
          title={t.client.title}
          subtitle={t.client.subtitle}
          action={
            <Link href={`${base}/nueva`} className={buttonClasses("primary", "md")}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.client.new}
            </Link>
          }
        />
        {tickets.length === 0 ? (
          <p className="rounded-lg bg-surface p-10 text-center text-sm text-muted shadow-meta dark:bg-card">{t.client.empty}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg bg-surface shadow-meta dark:bg-card">
            {tickets.map((x) => (
              <li key={x.id}>
                <Link href={`${base}/${x.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-surface-soft/60 dark:hover:bg-white/[0.03]">
                  <span className="w-16 font-mono text-sm text-muted">#{x.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-heading">{x.subject}</span>
                  <span className="text-xs text-muted">{fmt(x.last_activity_at)}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", ticketStatusTone[x.status])}>{t.status[x.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  // ---------------- Equipo ----------------
  const { f, q } = await searchParams;
  const filter: Filter = (["active", "mine", "unassigned", "waiting", "done"] as const).includes(f as Filter) ? (f as Filter) : "active";
  let query = supabase.from("tickets").select("*").order("last_activity_at", { ascending: false }).limit(300);
  if (filter === "done") query = query.in("status", ["resolved", "closed"]);
  else if (filter === "waiting") query = query.eq("status", "waiting");
  else query = query.in("status", ACTIVE);
  if (filter === "mine") query = query.eq("assigned_to", profile.id);
  if (filter === "unassigned") query = query.is("assigned_to", null);
  const term = q?.trim();
  if (term) {
    const n = Number(term.replace("#", ""));
    const safe = term.replace(/[%,()]/g, " ");
    query = Number.isInteger(n) && n > 0
      ? query.eq("number", n)
      : query.or(`subject.ilike.%${safe}%,name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  const [{ data }, employees] = await Promise.all([query, listEmployees(supabase)]);
  const tickets = (data ?? []) as Ticket[];
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  // Las críticas y altas primero dentro de las activas.
  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  if (filter !== "done") tickets.sort((a, b) => rank[a.priority] - rank[b.priority] || b.last_activity_at.localeCompare(a.last_activity_at));

  return (
    <>
      <LiveRefresh tables={["tickets"]} channel="ticket-queue" />
      <PageHeader title={t.staff.title} subtitle={t.staff.subtitle} />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t.staff.title} className="flex flex-wrap gap-1.5">
          {(Object.keys(t.staff.filters) as Filter[]).map((key) => (
            <Link
              key={key}
              href={`${base}?f=${key}`}
              aria-current={filter === key ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition-colors",
                filter === key ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface-soft",
              )}
            >
              {t.staff.filters[key]}
            </Link>
          ))}
        </nav>
        <form action={base} className="relative w-full lg:w-80">
          <input type="hidden" name="f" value={filter} />
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label className="sr-only" htmlFor="ticket-search">{t.staff.search}</label>
          <input
            id="ticket-search"
            name="q"
            defaultValue={term}
            placeholder={t.staff.search}
            className="h-10 w-full rounded-full bg-surface pl-10 pr-4 text-sm text-heading outline-none shadow-meta focus:ring-deep-700/40 dark:bg-card"
          />
        </form>
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-lg bg-surface p-10 text-center text-sm text-muted shadow-meta dark:bg-card">{t.staff.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {(["number", "subject", "requester", "priority", "status", "owner", "activity"] as const).map((k) => (
                  <th key={k} scope="col" className="px-4 py-3 font-semibold">{t.staff.cols[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((x) => (
                <tr key={x.id} className="hover:bg-surface-soft/60 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-muted">#{x.number}</td>
                  <td className="max-w-xs px-4 py-3">
                    <Link href={`${base}/${x.id}`} className="block truncate font-bold text-heading hover:underline">{x.subject}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-heading">{x.name}</span>
                    <span className="block text-xs text-muted">{x.company ?? x.email}</span>
                  </td>
                  <td className={cn("px-4 py-3 font-semibold", ticketPriorityTone[x.priority])}>{t.priority[x.priority]}</td>
                  <td className="px-4 py-3">
                    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", ticketStatusTone[x.status])}>{t.staffStatus[x.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-body">{x.assigned_to ? names[x.assigned_to] ?? "—" : t.staff.unassigned}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(x.last_activity_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
