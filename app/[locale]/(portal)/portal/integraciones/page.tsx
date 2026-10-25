import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { IntegrationsHub } from "@/components/integrations/IntegrationsHub";
import { integrationsCopy } from "@/content/integrations";
import { integrationGuides } from "@/content/integrationGuides";
import { integrationsHubCopy } from "@/content/integrationsHub";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { INTEGRATIONS } from "@/lib/integrationCatalog";
import { loadIntegrations } from "@/lib/integrationHub";
import { hasSecretKey } from "@/lib/integrations";
import { cn } from "@/lib/utils";

export default async function IntegrationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = integrationsHubCopy[locale];
  const old = integrationsCopy[locale];

  const [{ statuses }, { data: lastAudit }] = await Promise.all([
    loadIntegrations(supabase),
    supabase.from("integration_audit").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const secretKey = hasSecretKey();
  const guides = integrationGuides[locale];
  const summaries = Object.fromEntries(
    INTEGRATIONS.map((d) => [d.slug, guides[d.slug]?.summary ?? integrationGuides.es[d.slug]?.summary]).filter(([, s]) => s),
  ) as Record<string, string>;

  const values = Object.values(statuses);
  const count = (s: string) => values.filter((v) => v === s).length;
  const freeOff = INTEGRATIONS.filter((d) => (d.pricing === "free" || d.pricing === "freemium") && (statuses[d.slug] === "off" || statuses[d.slug] === "partial")).length;
  const kpis = [
    { key: "connected", value: String(count("connected")), tone: "text-emerald-700 dark:text-emerald-400" },
    { key: "partial", value: String(count("partial")), tone: count("partial") ? "text-amber-700 dark:text-amber-400" : "" },
    { key: "off", value: String(count("off")) },
    { key: "free", value: String(freeOff) },
    {
      key: "lastChange",
      value: lastAudit
        ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(lastAudit.created_at))
        : t.never,
    },
    { key: "serverKey", value: secretKey ? t.serverOk : t.serverMissing, tone: secretKey ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
  ] as { key: keyof typeof t.kpis; value: string; tone?: string }[];

  return (
    <>
      <PageHeader title={t.title} count={INTEGRATIONS.length} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r xl:border-b-0 xl:[&:nth-child(6n)]:border-r-0">
              <p className="text-sm text-muted">{t.kpis[k.key]}</p>
              <p className={cn("mt-1 truncate text-[1.6rem] font-semibold leading-none tabular-nums text-heading", k.tone)}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 border-b border-line px-4 py-4 sm:px-6 lg:grid-cols-2">
          <p className="flex items-start gap-3 rounded-xl bg-[var(--meta-active)]/50 p-4 text-sm text-body">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            {old.consentNote}
          </p>
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl p-4 text-sm ring-1",
              secretKey ? "bg-surface ring-line dark:bg-card" : "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30",
            )}
          >
            {secretKey ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
            )}
            <div>
              <p className="font-semibold text-heading">
                {old.serverKey.title} · {secretKey ? old.connected : old.missing}
              </p>
              <p className="mt-1 text-body">{old.serverKey.body}</p>
              {!secretKey && <p className="mt-1 text-muted">{old.serverKey.where}</p>}
            </div>
          </div>
        </div>

        <IntegrationsHub locale={locale} statuses={statuses} summaries={summaries} />
      </div>
    </>
  );
}
