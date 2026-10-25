"use client";

import Link from "next/link";
import { ArrowRight, FileText, Globe2, Search, Settings2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { WhoisForm } from "@/components/domains/WhoisForm";
import { OrderActions, TestBadge } from "@/components/domains/OrderActions";
import { AutoRenewSwitch, daysLeft, ExpiryText, fmtDate, moneyCop, RenewButton, StatusChip } from "@/components/clientDomains/shared";
import { clientDomainsCopy } from "@/content/clientDomains";
import type { Locale } from "@/i18n/config";
import type { ClientDomain, DomainOrder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type ClientTab = "domains" | "purchases" | "whois";

const ORDER_TONE: Record<string, string> = {
  registered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  paid: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  registering: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  pending_payment: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  failed: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

/** Portal del cliente: sus dominios, sus compras y los datos del titular. */
export function ClientDomainsView({
  locale,
  tab,
  domains,
  orders,
  now,
}: {
  locale: Locale;
  tab: ClientTab;
  domains: ClientDomain[];
  orders: DomainOrder[];
  now: number;
}) {
  const t = clientDomainsCopy[locale];
  const base = `/${locale}/portal/dominios`;
  const active = domains.filter((d) => ["active", "expiring", "pending"].includes(d.status));
  const next = active.filter((d) => d.expires_at).sort((a, b) => a.expires_at!.localeCompare(b.expires_at!))[0];
  const nextDays = next ? daysLeft(next.expires_at, now) : null;
  const invested = orders.filter((o) => o.paid_at).reduce((n, o) => n + o.price_cop, 0);
  const kpis = [
    { key: "active", value: String(active.length) },
    { key: "next", value: next && nextDays !== null ? t.nextIn.replace("{domain}", next.domain).replace("{n}", String(Math.max(nextDays, 0))) : t.noNext, small: true, tone: nextDays !== null && nextDays <= 30 },
    { key: "autoRenew", value: `${active.filter((d) => d.auto_renew).length} / ${active.length}` },
    { key: "invested", value: moneyCop(invested) },
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
                "tone" in k && k.tone ? "text-amber-700 dark:text-amber-400" : "text-heading",
              )}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(Object.keys(t.tabs) as ClientTab[]).map((k) => (
            <Link
              key={k}
              href={k === "domains" ? base : `${base}?tab=${k}`}
              aria-current={tab === k ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[k]}
            </Link>
          ))}
        </nav>
        <Link href={`/${locale}/servicios/desarrollo-web#dominios`} className={cn(buttonClasses("primary", "md"), "my-2 hidden h-9 px-3.5 sm:inline-flex")}>
          <Search className="h-4 w-4" aria-hidden />
          {t.search}
        </Link>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {tab === "domains" &&
          (domains.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--meta-active)] text-heading">
                <Globe2 className="h-7 w-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-heading">{t.emptyTitle}</h2>
              <p className="mt-2 text-sm text-muted">{t.emptyBody}</p>
              <Link href={`/${locale}/servicios/desarrollo-web#dominios`} className={cn(buttonClasses("primary", "md"), "mt-6")}>
                {t.search}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3">
              {domains.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line bg-surface p-5 dark:bg-card">
                  <div className="flex min-w-0 basis-full items-center gap-4 md:basis-0 md:flex-1">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--meta-active)] text-heading">
                      <Globe2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${base}/${d.id}`} className="text-lg font-semibold text-heading [overflow-wrap:anywhere] hover:underline">
                          {d.domain}
                        </Link>
                        <StatusChip locale={locale} status={d.status} />
{d.is_test && <TestBadge locale={locale} />}
                      </div>
                      <p className="mt-0.5 text-sm">
                        <ExpiryText locale={locale} iso={d.expires_at} now={now} />
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-heading" title={t.autoRenewHint}>
                    <AutoRenewSwitch locale={locale} domainId={d.id} initial={d.auto_renew} />
                    {t.autoRenew}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["active", "expiring", "expired"].includes(d.status) && (
                      <RenewButton locale={locale} domainId={d.id} domain={d.domain} price={d.renewal_price_cop} />
                    )}
                    <Link href={`${base}/${d.id}`} className={cn(buttonClasses("dark", "md"), "h-9 px-3.5")}>
                      <Settings2 className="h-4 w-4" aria-hidden />
                      {t.manage}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === "purchases" &&
          (orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{t.purchases.empty}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    {(["date", "domain", "kind", "amount", "status", "receipt"] as const).map((c) => (
                      <th key={c} scope="col" className={cn("px-4 py-2.5 font-medium", c === "amount" && "text-right")}>{t.purchases.cols[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-body">{fmtDate(locale, o.created_at)}</td>
                      <td className="px-4 py-3 font-semibold text-heading">
                        {o.domain}
                        {o.is_test && <TestBadge locale={locale} />}
                      </td>
                      <td className="px-4 py-3 text-body">{t.purchases.kinds[o.kind]}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{moneyCop(o.price_cop)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", ORDER_TONE[o.status] ?? "bg-surface-soft text-muted dark:bg-white/[0.06]")}>
                          {t.purchases.statuses[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {o.paid_at ? (
                          <Link href={`${base}/compras/${o.reference}`} className="inline-flex items-center gap-1 font-medium text-heading hover:underline">
                            <FileText className="h-4 w-4" aria-hidden />
                            {t.purchases.view}
                          </Link>
                        ) : ["pending_payment", "declined"].includes(o.status) ? (
                          <OrderActions locale={locale} reference={o.reference} status={o.status} payable={!o.payment_id} variant="client" />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "whois" && (
          <section className="max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6 dark:bg-card">
            <p className="mb-5 text-sm text-muted">{t.whoisIntro}</p>
            <WhoisForm locale={locale} />
          </section>
        )}
      </div>
    </div>
  );
}
