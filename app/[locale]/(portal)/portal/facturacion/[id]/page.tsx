import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { PrintButton } from "@/components/clientDomains/PrintButton";
import { InvoiceActions } from "@/components/billing/InvoiceActions";
import { fmtDay, INVOICE_TONE, moneyCop, type InvoiceReceipt } from "@/components/billing/format";
import { TestBadge } from "@/components/domains/OrderActions";
import { billingCopy } from "@/content/billing";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { verifyInvoicePayment } from "@/lib/invoices";
import { siteConfig } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientBilling, ClientInvoice } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ id?: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !UUID.test(id)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider", "admin", "sales", "support", "marketing"]);
  const t = billingCopy[locale];
  const r = t.invoice;
  const staff = profile.role !== "client" && profile.role !== "provider";

  // RLS: el cliente solo ve las suyas emitidas.
  let invoice = (await supabase.from("client_invoices").select("*").eq("id", id).maybeSingle()).data as ClientInvoice | null;
  if (!invoice) notFound();
  // Vuelta de Wompi (?id=<transacción>): confirma el pago sin esperar el webhook.
  const { id: txId } = await searchParams;
  let justPaid = false;
  if (txId && /^[\w-]{6,80}$/.test(txId) && (invoice.status === "issued" || invoice.status === "overdue")) {
    const db = createAdminClient();
    justPaid = (await verifyInvoicePayment(db, invoice, txId)) === "paid";
    // Se relee con la misma conexión que escribió el pago (ya autorizada arriba).
    if (justPaid) invoice = ((await db.from("client_invoices").select("*").eq("id", id).maybeSingle()).data as ClientInvoice | null) ?? invoice;
  }

  const [{ data: billingRow }, { data: account }, { data: project }] = await Promise.all([
    supabase.from("client_billing").select("*").eq("user_id", invoice.account_id).maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", invoice.account_id).maybeSingle(),
    invoice.project_id ? supabase.from("client_projects").select("name").eq("id", invoice.project_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const billing = billingRow as ClientBilling | null;
  const receipt = (invoice.receipt ?? {}) as InvoiceReceipt;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const status = invoice.status === "issued" && invoice.due_date && invoice.due_date < today ? "overdue" : invoice.status;
  const back = staff ? `/${locale}/portal/clientes/${invoice.account_id}?tab=invoices` : `/${locale}/portal/facturacion`;

  const meta: [string, string][] = [
    [r.issued, invoice.issued_at ? fmtDay(locale, invoice.issued_at) : "—"],
    [r.due, invoice.due_date ? fmtDay(locale, invoice.due_date) : "—"],
    ...(project ? ([[r.project, project.name]] as [string, string][]) : []),
    ...(invoice.payment_reference ? ([[r.reference, invoice.payment_reference]] as [string, string][]) : []),
  ];

  return (
    <>
      <PageHeader title={`${r.title} #${invoice.number}`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {r.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!staff && <InvoiceActions locale={locale} id={invoice.id} status={invoice.status} size="md" />}
          <PrintButton label={r.print} />
        </div>
      </div>

      {justPaid && (
        <p role="status" className="mx-auto mb-5 flex max-w-3xl items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 print:hidden">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {r.justPaid}
        </p>
      )}

      <article className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-6 sm:p-10 dark:bg-card print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <Image src="/images/logos/logo.png" alt={siteConfig.name} width={150} height={32} className="h-7 w-auto dark:invert" />
            <p className="mt-3 text-xs text-muted">
              {siteConfig.domain} · {siteConfig.email} · {siteConfig.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-lg font-bold text-heading">
              {r.title} #{invoice.number}
            </p>
            <p className="mt-1 flex items-center gap-1 sm:justify-end">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", INVOICE_TONE[status])}>{t.status[status]}</span>
              {invoice.is_test && <TestBadge locale={locale} />}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted">{r.billedTo}</p>
            {billing ? (
              <div className="mt-2 text-sm text-body">
                <p className="font-semibold text-heading">{billing.legal_name}</p>
                <p>{billing.tax_id}</p>
                <p>{billing.email}</p>
                {billing.phone && <p>{billing.phone}</p>}
                {(billing.address || billing.city) && <p>{[billing.address, billing.city].filter(Boolean).join(", ")}</p>}
              </div>
            ) : (
              <div className="mt-2 text-sm text-body">
                <p className="font-semibold text-heading">{account?.full_name ?? account?.email}</p>
                <p>{account?.email}</p>
                <p className="mt-1 text-xs text-muted">{r.noBilling}</p>
              </div>
            )}
          </div>
          <dl className="grid content-start gap-2 text-sm sm:justify-items-end sm:text-right">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-medium text-heading [overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="pt-6 font-semibold text-heading">{invoice.concept}</p>
        <div className="mt-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">{r.item}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{r.qty}</th>
                <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">{r.unit}</th>
                <th scope="col" className="py-2 pl-3 text-right font-medium">{r.amount}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, n) => (
                <tr key={n} className="border-b border-line">
                  <td className="py-3 pr-3 text-heading">{it.description}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-body">{it.quantity}</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums text-body sm:table-cell">{moneyCop(it.unit_price)}</td>
                  <td className="whitespace-nowrap py-3 pl-3 text-right tabular-nums text-heading">{moneyCop(Math.round(it.quantity * it.unit_price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto mt-4 grid max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{r.subtotal}</dt>
            <dd className="tabular-nums text-heading">{moneyCop(invoice.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{r.tax.replace("{rate}", String(Number(invoice.tax_rate)))}</dt>
            <dd className="tabular-nums text-heading">{moneyCop(invoice.tax)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-soft px-5 py-4 dark:bg-white/[0.04]">
          <span className="text-sm font-medium text-muted">{r.total}</span>
          <span className="text-2xl font-bold tabular-nums text-heading">{moneyCop(invoice.total)} COP</span>
        </div>

        {invoice.notes && (
          <div className="mt-6">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted">{r.notes}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-body">{invoice.notes}</p>
          </div>
        )}

        {invoice.status === "paid" && invoice.paid_at && (
          <div className="mt-6 rounded-xl border border-emerald-200 p-4 text-sm dark:border-emerald-500/30">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">{r.paidOn.replace("{date}", fmtDay(locale, invoice.paid_at))}</p>
            <dl className="mt-2 grid gap-1 text-body sm:grid-cols-2">
              <div>
                <dt className="inline text-muted">{r.method}: </dt>
                <dd className="inline">{receipt.manual ? t.manual : `Wompi${receipt.method ? ` · ${receipt.method}` : ""}`}</dd>
              </div>
              {(receipt.transaction_id || invoice.payment_id) && (
                <div>
                  <dt className="inline text-muted">{r.transaction}: </dt>
                  <dd className="inline font-mono text-xs">{receipt.transaction_id ?? invoice.payment_id}</dd>
                </div>
              )}
              {receipt.note && <dd className="sm:col-span-2">{receipt.note}</dd>}
            </dl>
          </div>
        )}
        {(invoice.status === "issued" || invoice.status === "overdue") && <p className="mt-6 text-sm text-muted print:hidden">{r.payHint}</p>}
        <p className="mt-6 text-xs text-muted">{r.docNote}</p>
      </article>
    </>
  );
}
