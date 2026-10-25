import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { PrintButton } from "@/components/clientDomains/PrintButton";
import { clientDomainsCopy } from "@/content/clientDomains";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import type { DomainOrder } from "@/lib/supabase/types";

export default async function ReceiptPage({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const { locale, reference } = await params;
  if (!isLocale(locale) || !/^DOM-[0-9]{6}-[A-F0-9]{8}$/.test(reference)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "support", "client", "provider"]);
  const t = clientDomainsCopy[locale];
  const r = t.receipt;

  // RLS: el cliente solo ve los suyos.
  const { data } = await supabase.from("domain_orders").select("*").eq("reference", reference).maybeSingle();
  const order = data as DomainOrder | null;
  if (!order || !order.paid_at) notFound();
  const receipt = (order.receipt ?? {}) as { transaction_id?: string; amount_cop?: number; status?: string; paid_at?: string };
  const { data: whois } = order.user_id
    ? await supabase.from("client_whois").select("first_name, last_name, company, entity_type, document_id").eq("user_id", order.user_id).maybeSingle()
    : { data: null };
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(receipt.amount_cop ?? order.price_cop);
  const concept = (order.kind === "renewal" ? r.conceptRenewal : r.conceptRegister).replace("{domain}", order.domain);
  const registrant = whois ? `${whois.entity_type === "organization" && whois.company ? whois.company : `${whois.first_name} ${whois.last_name}`}${whois.document_id ? ` · ${whois.document_id}` : ""}` : order.name;

  const rows: [string, string][] = [
    [r.reference, order.reference],
    [r.date, fmt(receipt.paid_at ?? order.paid_at)],
    [r.customer, `${order.name} · ${order.email}`],
    [r.registrant, registrant],
    [r.concept, concept],
    [r.method, "Wompi (PSE, tarjeta o Nequi)"],
    [r.transaction, receipt.transaction_id ?? order.payment_id ?? "—"],
    [r.status, t.purchases.statuses[order.status] ?? order.status],
  ];

  return (
    <>
      <PageHeader title={r.title} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/${locale}/portal/dominios?tab=purchases`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {r.back}
        </Link>
        <PrintButton label={r.print} />
      </div>

      <article className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-8 sm:p-10 dark:bg-card print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <Image src="/images/logos/logo.png" alt={siteConfig.name} width={150} height={32} className="h-7 w-auto dark:invert" />
            <p className="mt-3 text-xs text-muted">
              {siteConfig.domain} · {siteConfig.email} · {siteConfig.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-heading">{r.title}</p>
            <p className="font-mono text-sm text-muted">{order.reference}</p>
          </div>
        </header>
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="text-sm font-medium text-heading [overflow-wrap:anywhere]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-soft px-5 py-4 dark:bg-white/[0.04]">
          <span className="text-sm font-medium text-muted">{r.total}</span>
          <span className="text-2xl font-bold tabular-nums text-heading">{money} COP</span>
        </div>
        <p className="mt-6 text-xs text-muted">{r.note}</p>
      </article>
    </>
  );
}
