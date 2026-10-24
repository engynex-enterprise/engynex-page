import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { ClientTickets } from "@/components/support/ClientTickets";
import { SupportNav } from "@/components/support/SupportNav";
import { TicketQueue } from "@/components/support/TicketQueue";
import { supportProCopy } from "@/content/supportPro";
import { supportQueueCopy } from "@/content/supportQueue";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso, nowIso } from "@/lib/dates";
import { listEmployees } from "@/lib/employees";
import { shortDuration } from "@/lib/supportSla";
import { ticketCategories } from "@/lib/ticketCategories";
import type { Ticket } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Kpis = {
  open: number;
  unassigned: number;
  breached: number;
  due_soon: number;
  first_response_s: number | null;
  csat: number | null;
  csat_count: number;
};

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales", "client", "provider"]);
  const t = ticketsCopy[locale];
  const staff = ["admin", "support", "sales"].includes(profile.role);

  // ---------------- Cliente / proveedor ----------------
  if (!staff) {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("requester_id", profile.id)
      .order("last_activity_at", { ascending: false });
    return (
      <>
        <LiveRefresh tables={["tickets"]} channel="my-tickets" />
        <PageHeader title={t.client.title} />
        <ClientTickets locale={locale} tickets={(data ?? []) as Ticket[]} />
      </>
    );
  }

  // ---------------- Equipo ----------------
  const q = supportQueueCopy[locale];
  const pro = supportProCopy[locale];
  // Activas siempre; resueltas y cerradas de los últimos 90 días.
  const [{ data }, { data: kpiData }, employees] = await Promise.all([
    supabase
      .from("tickets")
      .select("*")
      .or(`status.in.(open,in_progress,waiting),last_activity_at.gte.${daysAgoIso(90)}`)
      .order("last_activity_at", { ascending: false })
      .limit(1000),
    supabase.rpc("support_kpis", { p_days: 30 }),
    listEmployees(supabase),
  ]);
  const k = (kpiData ?? {}) as Partial<Kpis>;
  const kpis = [
    { key: "open", value: String(k.open ?? 0) },
    { key: "unassigned", value: String(k.unassigned ?? 0), tone: (k.unassigned ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined },
    { key: "breached", value: String(k.breached ?? 0), tone: (k.breached ?? 0) > 0 ? "text-red-600 dark:text-red-400" : undefined },
    { key: "dueSoon", value: String(k.due_soon ?? 0), tone: (k.due_soon ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined },
    { key: "firstResponse", value: k.first_response_s != null ? shortDuration(k.first_response_s * 1000, pro.units) : "—", hint: q.kpiHints.last30 },
    {
      key: "csat",
      value: k.csat != null ? `${k.csat} / 5` : "—",
      hint: k.csat_count ? q.kpiHints.ratings.replace("{n}", String(k.csat_count)) : q.kpiHints.noRatings,
    },
  ] as { key: keyof typeof q.kpis; value: string; tone?: string; hint?: string }[];

  return (
    <>
      <LiveRefresh tables={["tickets"]} channel="ticket-queue" />
      <PageHeader title={pro.title} count={k.open ?? 0} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <SupportNav locale={locale} admin={profile.role === "admin"}>
          <Link
            href={`/${locale}/portal/soporte/nueva`}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-3.5 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {pro.newTicket}
          </Link>
        </SupportNav>

        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((x) => (
            <div key={x.key} className="border-b border-line px-6 py-4 sm:border-r xl:border-b-0 sm:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:[&:nth-child(6n)]:border-r-0">
              <p className="text-sm text-muted">{q.kpis[x.key]}</p>
              <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums text-heading", x.tone)}>{x.value}</p>
              {x.hint && <p className="mt-1 text-xs text-muted">{x.hint}</p>}
            </div>
          ))}
        </div>

        <TicketQueue
          locale={locale}
          tickets={(data ?? []) as Ticket[]}
          employees={employees}
          categories={ticketCategories(locale)}
          me={profile.id}
          initialNow={nowIso()}
        />
      </div>
    </>
  );
}
