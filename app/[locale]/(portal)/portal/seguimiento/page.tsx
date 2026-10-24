import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { CancelEmailButton } from "@/components/portal/CancelEmailButton";
import { automationCopy } from "@/content/automation";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { integrationStatus } from "@/lib/integrations";
import type { EmailQueueRow, LeadDraft } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Filter = "queued" | "sent" | "problems";
const tone: Record<string, string> = {
  queued: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  sending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

export default async function FollowupsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = automationCopy[locale].followups;
  const { f } = await searchParams;
  const filter: Filter = f === "sent" || f === "problems" ? f : "queued";

  let query = supabase.from("email_queue").select("*, leads(name)").limit(200);
  query =
    filter === "queued"
      ? query.in("status", ["queued", "sending"]).order("send_at")
      : filter === "sent"
        ? query.eq("status", "sent").order("sent_at", { ascending: false })
        : query.in("status", ["failed", "cancelled"]).order("created_at", { ascending: false });

  const [{ data: rows }, { data: drafts }, status] = await Promise.all([
    query,
    supabase.from("lead_drafts").select("*").is("completed_at", null).order("updated_at", { ascending: false }).limit(100),
    integrationStatus(supabase),
  ]);
  const emailReady = !!status.resend_api_key && !!status.email_from;
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso)) : "—";
  const base = `/${locale}/portal/seguimiento`;
  const card = "rounded-lg bg-surface shadow-meta dark:bg-card";

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {!emailReady && (
        <p className="mb-6 rounded-lg bg-amber-50 p-5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
          {t.notConfigured}{" "}
          <Link href={`/${locale}/portal/integraciones`} className="underline">
            →
          </Link>
        </p>
      )}

      <nav aria-label={t.queue} className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(t.filters) as Filter[]).map((key) => (
          <Link
            key={key}
            href={key === "queued" ? base : `${base}?f=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold",
              filter === key ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface-soft",
            )}
          >
            {t.filters[key]}
          </Link>
        ))}
      </nav>

      {!rows?.length ? (
        <p className={cn(card, "p-10 text-center text-sm text-muted")}>{t.empty}</p>
      ) : (
        <div className={cn(card, "overflow-x-auto")}>
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {(["when", "kind", "to", "status"] as const).map((k) => (
                  <th key={k} scope="col" className="px-4 py-3 font-semibold">{t.cols[k]}</th>
                ))}
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t.cancel}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(rows as unknown as (EmailQueueRow & { leads: { name: string } | null })[]).map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(r.sent_at ?? r.send_at)}</td>
                  <td className="px-4 py-3 font-semibold text-heading">{t.kinds[r.kind] ?? r.kind}</td>
                  <td className="px-4 py-3">
                    {r.lead_id ? (
                      <Link href={`/${locale}/portal/crm/${r.lead_id}`} className="font-semibold text-heading hover:underline">
                        {r.leads?.name ?? r.to_email}
                      </Link>
                    ) : (
                      <span className="text-body">{r.to_email ?? t.team}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", tone[r.status])}>{t.statuses[r.status]}</span>
                    {r.error && <span className="ml-2 text-xs text-muted">{t.reasons[r.error] ?? r.error}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{r.status === "queued" && <CancelEmailButton id={r.id} label={t.cancel} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className={cn(card, "mt-8 p-6")}>
        <h2 className="text-lg text-heading">{t.drafts}</h2>
        <p className="mt-1 text-sm text-muted">{t.draftsHint}</p>
        {!drafts?.length ? (
          <p className="mt-4 text-sm text-muted">{t.draftsEmpty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  {(["contact", "step", "updated", "reminded"] as const).map((k) => (
                    <th key={k} scope="col" className="py-2 pr-4 font-semibold">{t.draftCols[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(drafts as LeadDraft[]).map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 pr-4">
                      <span className="block font-semibold text-heading">{d.name ?? "—"}</span>
                      <span className="block text-xs text-muted">
                        {d.email}
                        {d.phone ? ` · ${d.phone}` : ""}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-body">{d.step + 1} / 5</td>
                    <td className="py-2.5 pr-4 text-body">{fmt(d.updated_at)}</td>
                    <td className="py-2.5 pr-4 text-body">{d.reminded_at ? t.reminded : t.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
