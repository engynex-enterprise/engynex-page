import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { DomainOrders } from "@/components/domains/DomainOrders";
import { ClientDomainsView, type ClientTab } from "@/components/clientDomains/ClientDomainsView";
import { StaffClientDomains } from "@/components/clientDomains/StaffClientDomains";
import { clientDomainsCopy } from "@/content/clientDomains";
import { domainOrdersCopy } from "@/content/domainOrders";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { ClientDomain, DomainOrder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const CLIENT_TABS: ClientTab[] = ["domains", "purchases", "whois"];

export default async function DomainsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "client", "provider"]);
  const t = clientDomainsCopy[locale];
  const { tab } = await searchParams;
  // "Ahora" en el servidor: los días al vencimiento se cuentan con este valor.
  const now = new Date().getTime();

  // ---------------- Cliente / proveedor ----------------
  if (profile.role === "client" || profile.role === "provider") {
    const [{ data: domains }, { data: orders }] = await Promise.all([
      supabase.from("client_domains").select("*").eq("owner_id", profile.id).order("expires_at", { ascending: true }),
      supabase.from("domain_orders").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(200),
    ]);
    const current: ClientTab = CLIENT_TABS.includes(tab as ClientTab) ? (tab as ClientTab) : "domains";
    return (
      <>
        <LiveRefresh tables={["client_domains", "domain_orders"]} channel={`my-domains-${profile.id}`} />
        <PageHeader title={t.title} count={(domains ?? []).length} />
        <div className="-mx-4 -mt-6 sm:-mx-6">
          <ClientDomainsView locale={locale} tab={current} domains={(domains ?? []) as ClientDomain[]} orders={(orders ?? []) as DomainOrder[]} now={now} />
        </div>
      </>
    );
  }

  // ---------------- Equipo ----------------
  const staffTab = tab === "clientes" ? "domains" : "orders";
  const base = `/${locale}/portal/dominios`;
  const [{ data: orders }, { data: domains }] = await Promise.all([
    staffTab === "orders" ? supabase.from("domain_orders").select("*").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
    staffTab === "domains" ? supabase.from("client_domains").select("*").order("expires_at", { ascending: true }).limit(500) : Promise.resolve({ data: [] }),
  ]);
  const ownerIds = [...new Set(((domains ?? []) as ClientDomain[]).map((d) => d.owner_id))];
  const { data: people } = ownerIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds) : { data: [] };
  const owners = Object.fromEntries((people ?? []).map((p) => [p.id, { name: p.full_name ?? p.email, email: p.email }]));

  return (
    <>
      <LiveRefresh tables={["domain_orders", "client_domains"]} channel="domain-orders" />
      <PageHeader title={domainOrdersCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <nav aria-label={t.staffTitle} className="flex gap-1 border-b border-line px-4 sm:px-6">
          {(["orders", "domains"] as const).map((k) => (
            <Link
              key={k}
              href={k === "orders" ? base : `${base}?tab=clientes`}
              aria-current={staffTab === k ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-3.5 text-[0.94rem]",
                staffTab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.staffTabs[k]}
            </Link>
          ))}
        </nav>
        {staffTab === "orders" ? (
          <DomainOrders locale={locale} orders={(orders ?? []) as DomainOrder[]} admin={profile.role === "admin"} />
        ) : (
          <div className="px-4 py-6 sm:px-6">
            <StaffClientDomains locale={locale} domains={(domains ?? []) as ClientDomain[]} owners={owners} now={now} />
          </div>
        )}
      </div>
    </>
  );
}
