import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { WebhooksManager } from "@/components/webhooks/WebhooksManager";
import { integrationToolsCopy } from "@/content/integrationTools";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso } from "@/lib/dates";
import type { WebhookEndpoint } from "@/lib/supabase/types";

export default async function WebhooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = integrationToolsCopy[locale].webhooks;
  const since = daysAgoIso(1);

  const [{ data: endpoints }, { data: deliveries }, { data: day }] = await Promise.all([
    supabase.from("webhook_endpoints").select("*").order("created_at"),
    supabase
      .from("webhook_deliveries")
      .select("id, endpoint_id, event, payload, status, status_code, error, created_at, completed_at")
      .order("id", { ascending: false })
      .limit(100),
    supabase.from("webhook_deliveries").select("status").gte("created_at", since),
  ]);
  const last24 = day ?? [];

  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <WebhooksManager
          locale={locale}
          endpoints={(endpoints ?? []) as WebhookEndpoint[]}
          deliveries={deliveries ?? []}
          stats={{ total: last24.length, ok: last24.filter((d) => d.status === "ok").length, failed: last24.filter((d) => d.status === "failed").length }}
        />
      </div>
    </>
  );
}
