import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ApiKeysManager } from "@/components/apiKeys/ApiKeysManager";
import { integrationToolsCopy } from "@/content/integrationTools";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { siteConfig } from "@/lib/site";

export default async function ApiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = integrationToolsCopy[locale].api;
  // Sin el hash: no hace falta en el navegador.
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, created_by, created_at, last_used_at, uses, revoked_at")
    .order("revoked_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ApiKeysManager locale={locale} keys={data ?? []} baseUrl={siteConfig.url} />
      </div>
    </>
  );
}
