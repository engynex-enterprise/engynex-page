import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { BillingForm } from "@/components/billing/BillingForm";
import { InvoiceActions } from "@/components/billing/InvoiceActions";
import { fmtDay, INVOICE_TONE, moneyCop, type InvoiceReceipt } from "@/components/billing/format";
import { TestBadge } from "@/components/domains/OrderActions";
import { billingCopy } from "@/content/billing";
import type { Locale } from "@/i18n/config";
import type { ClientBilling, ClientInvoice, DomainOrder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type BillingTab = "invoices" | "payments" | "details";

type Payment = { key: string; date: string; concept: string; method: string; amount: number; href: string; test: boolean };

/** Portal del cliente: facturas, pagos (facturas y dominios) y datos de facturación. */
export function ClientBillingView({
  locale,
  tab,
  userId,
  invoices,
  orders,
  billing,
  fallback,
  today,
}: {
  locale: Locale;
  tab: BillingTab;
  userId: string;
  invoices: ClientInvoice[];
  orders: DomainOrder[];
  billing: ClientBilling | null;
  fallback: { name: string; email: string; phone: string };
  /** YYYY-MM-DD en Bogotá. */
  today: string;
}) {
  const t = billingCopy[locale];
  const base = `/${locale}/portal/facturacion`;
  const open = invoices.filter((i) => i.status === "issued" || i.status === "overdue");
  const overdue = invoices.filter((i) => i.status === "overdue" || (i.status === "issued" && i.due_date && i.due_date < today));
  const year = today.slice(0, 4);
  const payments: Payment[] = [
    ...invoices
      .filter((i) => i.status === "paid" && i.paid_at)
      .map((i) => {
        const r = (i.receipt ?? {}) as InvoiceReceipt;
        return {
          key: i.id,
          date: i.paid_at!,
          concept: t.invoicePayment.replace("{n}", String(i.number)).replace("{concept}", i.concept),
          method: r.manual ? t.manual : `${t.methodWompi}${r.method ? ` · ${r.method}` : ""}`,
          amount: i.total,
          href: `${base}/${i.id}`,
          test: i.is_test,
        };
      }),
    ...orders
      .filter((o) => o.paid_at)
      .map((o) => ({ key: o.id, date: o.paid_at!, concept: t.domainPayment.replace("{domain}", o.domain), method: t.methodWompi, amount: o.price_cop, href: `/${locale}/portal/dominios/compras/${o.reference}`, test: o.is_test })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const paidYear = payments.filter((p) => p.date.slice(0, 4) === year).reduce((n, p) => n + p.amount, 0);
  const next = open.filter((i) => i.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];
  const kpis = [
    { key: "due", value: moneyCop(open.reduce((n, i) => n + i.total, 0)) },
    { key: "overdue", value: String(overdue.length), tone: overdue.length > 0 },
    { key: "paidYear", value: moneyCop(paidYear) },
    { key: "next", value: next ? t.nextOn.replace("{n}", String(next.number)).replace("{date}", fmtDay(locale, next.due_date!)) : t.noNext, small: true },
  ] as const;

  return (
    <div>
      <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="min-w-0 border-b border-line px-6 py-4 sm:border-r lg:border-b-0 lg:[&:nth-child(4n)]:border-r-0">
            <p className="text-sm text-muted">{t.kpis[k.key]}</p>
            <p
              className={cn(
                "mt-1 font-semibold leading-tight tabular-nums [overflow-wrap:anywhere]",
                "small" in k && k.small ? "text-lg" : "text-[1.6rem] leading-none",
                "tone" in k && k.tone ? "text-red-600 dark:text-red-400" : "text-heading",
              )}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <nav aria-label={t.title} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
        {(Object.keys(t.tabs) as BillingTab[]).map((k) => (
          <Link
            key={k}
            href={k === "invoices" ? base : `${base}?tab=${k}`}
            aria-current={tab === k ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
              tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.tabs[k]}
            {k === "invoices" && open.length > 0 && <span className="ml-1.5 rounded-full bg-[var(--meta-active)] px-1.5 text-xs font-semibold tabular-nums">{open.length}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-6 sm:px-6">
        {tab === "invoices" &&
          (invoices.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--meta-active)] text-heading">
                <Receipt className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-5 text-sm text-muted">{t.emptyInvoices}</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {invoices.map((i) => {
                const late = i.status === "overdue" || (i.status === "issued" && !!i.due_date && i.due_date < today);
                const status = late ? "overdue" : i.status;
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-surface p-5 dark:bg-card">
                    <div className="flex min-w-0 basis-full items-center gap-4 md:basis-0 md:flex-1">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--meta-active)] text-heading">
                        <FileText className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`${base}/${i.id}`} className="font-semibold text-heading [overflow-wrap:anywhere] hover:underline">
                            #{i.number} · {i.concept}
                          </Link>
                          <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", INVOICE_TONE[status])}>{t.status[status]}</span>
                          {i.is_test && <TestBadge locale={locale} />}
                        </div>
                        <p className={cn("mt-0.5 text-sm", late ? "text-red-600 dark:text-red-400" : "text-muted")}>
                          {i.issued_at && `${t.cols.issued} ${fmtDay(locale, i.issued_at)}`}
                          {i.due_date && i.status !== "paid" && ` · ${t.cols.due} ${fmtDay(locale, i.due_date)}`}
                          {i.paid_at && ` · ${t.invoice.paidOn.replace("{date}", fmtDay(locale, i.paid_at))}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-heading">{moneyCop(i.total)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <InvoiceActions locale={locale} id={i.id} status={i.status} />
                      <Link href={`${base}/${i.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t.view}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === "payments" &&
          (payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{t.emptyPayments}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    {(["date", "concept", "method", "amount", "receipt"] as const).map((c) => (
                      <th key={c} scope="col" className={cn("px-4 py-2.5 font-medium", c === "amount" && "text-right")}>{t.payCols[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.key} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-body">{fmtDay(locale, p.date)}</td>
                      <td className="px-4 py-3 font-medium text-heading">
                        {p.concept}
                        {p.test && <TestBadge locale={locale} />}
                      </td>
                      <td className="px-4 py-3 text-body">{p.method}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{moneyCop(p.amount)}</td>
                      <td className="px-4 py-3">
                        <Link href={p.href} className="inline-flex items-center gap-1 font-medium text-heading hover:underline">
                          <FileText className="h-4 w-4" aria-hidden />
                          {t.view}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "details" && (
          <section className="max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6 dark:bg-card">
            <BillingForm
              locale={locale}
              userId={userId}
              initial={{
                legal_name: billing?.legal_name ?? fallback.name,
                tax_id: billing?.tax_id ?? "",
                email: billing?.email ?? fallback.email,
                phone: billing?.phone ?? fallback.phone,
                address: billing?.address ?? "",
                city: billing?.city ?? "",
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
