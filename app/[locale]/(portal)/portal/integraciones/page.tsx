import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { IntegrationsForm, type StoredSetting } from "@/components/portal/IntegrationsForm";
import type { JobsStatus } from "@/components/portal/JobsPanel";
import { integrationsCopy } from "@/content/integrations";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { envOnlyKeys, hasSecretKey } from "@/lib/integrations";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export default async function IntegrationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = integrationsCopy[locale];

  const [{ data: settings }, { data: conversions }, { data: jobs }] = await Promise.all([
    supabase.rpc("admin_get_integrations"),
    supabase.rpc("ads_offline_conversions", { p_days: 90 }),
    supabase.rpc("admin_jobs_status"),
  ]);
  const stored = (settings ?? {}) as Record<string, StoredSetting>;
  const secretKey = hasSecretKey();

  const leadIds = [...new Set((conversions ?? []).map((c) => c.lead_id))];
  const { data: leads } = leadIds.length
    ? await supabase.from("leads").select("id, name").in("id", leadIds)
    : { data: [] as { id: string; name: string }[] };
  const leadName = Object.fromEntries((leads ?? []).map((l) => [l.id, l.name]));
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <p className="flex items-start gap-3 rounded-3xl bg-surface p-5 text-sm text-body ring-1 ring-line dark:bg-card">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          {t.consentNote}
        </p>
        <div className={cn("flex items-start gap-3 rounded-3xl p-5 text-sm ring-1", secretKey ? "bg-surface ring-line dark:bg-card" : "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30")}>
          {secretKey ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          )}
          <div>
            <p className="font-bold text-heading">
              {t.serverKey.title} · {secretKey ? t.connected : t.missing}
            </p>
            <p className="mt-1 text-body">{t.serverKey.body}</p>
            {!secretKey && <p className="mt-1 text-muted">{t.serverKey.where}</p>}
          </div>
        </div>
      </div>

      <IntegrationsForm
        locale={locale}
        stored={stored}
        envOnly={envOnlyKeys(stored)}
        siteUrl={siteConfig.url}
        jobs={(jobs ?? null) as unknown as JobsStatus | null}
      />

      <section className="mt-6 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8 dark:bg-card">
        <h2 className="text-lg text-heading">{t.preview}</h2>
        {!conversions?.length ? (
          <p className="mt-2 text-sm text-muted">{t.previewEmpty}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="py-2 font-semibold">{t.cols.lead}</th>
                  <th scope="col" className="py-2 font-semibold">{t.cols.kind}</th>
                  <th scope="col" className="py-2 font-semibold">{t.cols.when}</th>
                  <th scope="col" className="py-2 text-right font-semibold">{t.cols.value}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {conversions.slice(-50).reverse().map((c) => (
                  <tr key={`${c.lead_id}-${c.kind}`}>
                    <td className="py-2">
                      <Link href={`/${locale}/portal/crm/${c.lead_id}`} className="font-semibold text-heading hover:underline">
                        {leadName[c.lead_id] ?? "—"}
                      </Link>
                    </td>
                    <td className="py-2 text-body">{t.kinds[c.kind] ?? c.kind}</td>
                    <td className="py-2 text-body">{fmt(c.converted_at)}</td>
                    <td className="py-2 text-right tabular-nums text-heading">
                      {c.value != null ? new Intl.NumberFormat(locale, { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(c.value) : "—"}
                    </td>
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
