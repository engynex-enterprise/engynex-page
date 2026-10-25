import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ClientBillingView, type BillingTab } from "@/components/billing/ClientBillingView";
import { billingCopy } from "@/content/billing";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { ClientBilling, ClientInvoice, DomainOrder } from "@/lib/supabase/types";

const TABS: BillingTab[] = ["invoices", "payments", "details"];

export default async function BillingPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider"]);
  const { tab } = await searchParams;
  const current: BillingTab = TABS.includes(tab as BillingTab) ? (tab as BillingTab) : "invoices";
  // RLS: el cliente ve sus facturas emitidas (no los borradores).
  const [{ data: invoices }, { data: orders }, { data: billing }] = await Promise.all([
    supabase.from("client_invoices").select("*").eq("account_id", profile.id).order("number", { ascending: false }).limit(300),
    supabase.from("domain_orders").select("*").eq("user_id", profile.id).not("paid_at", "is", null).order("paid_at", { ascending: false }).limit(200),
    supabase.from("client_billing").select("*").eq("user_id", profile.id).maybeSingle(),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  return (
    <>
      <PageHeader title={billingCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ClientBillingView
          locale={locale}
          tab={current}
          userId={profile.id}
          invoices={(invoices ?? []) as ClientInvoice[]}
          orders={(orders ?? []) as DomainOrder[]}
          billing={billing as ClientBilling | null}
          fallback={{ name: profile.full_name ?? "", email: profile.email ?? "", phone: profile.phone ?? "" }}
          today={today}
        />
      </div>
    </>
  );
}
