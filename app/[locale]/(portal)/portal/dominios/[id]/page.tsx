import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { DomainDetail, type DetailTab } from "@/components/clientDomains/DomainDetail";
import { clientDomainsCopy } from "@/content/clientDomains";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { ClientDomain, DomainOrder } from "@/lib/supabase/types";

const TABS: DetailTab[] = ["summary", "dns", "nameservers", "transfer", "history"];

export default async function DomainDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string; renovar?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "support", "client", "provider"]);
  const { tab, renovar } = await searchParams;

  // RLS: el cliente solo encuentra los suyos; el equipo, todos.
  const { data } = await supabase.from("client_domains").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const domain = data as ClientDomain;
  const [{ data: orders }, { data: whois }] = await Promise.all([
    supabase.from("domain_orders").select("*").eq("domain_id", id).order("created_at", { ascending: false }),
    supabase.from("client_whois").select("first_name, last_name, company, entity_type").eq("user_id", domain.owner_id).maybeSingle(),
  ]);
  const owner = whois ? (whois.entity_type === "organization" && whois.company ? whois.company : `${whois.first_name} ${whois.last_name}`) : null;
  const now = new Date().getTime();

  return (
    <>
      <PageHeader title={clientDomainsCopy[locale].title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <DomainDetail
          locale={locale}
          domain={domain}
          orders={(orders ?? []) as DomainOrder[]}
          owner={owner}
          tab={TABS.includes(tab as DetailTab) ? (tab as DetailTab) : "summary"}
          now={now}
          openRenew={renovar === "1"}
          canRenew={["active", "expiring", "expired"].includes(domain.status)}
        />
      </div>
    </>
  );
}
