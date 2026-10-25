import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Webhook, Code2, Database } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { JobsPanel, type JobsStatus } from "@/components/portal/JobsPanel";
import { AuditLog, type AuditRow } from "@/components/integrations/AuditLog";
import { IntegrationFields } from "@/components/integrations/IntegrationFields";
import { IntegrationGuideView } from "@/components/integrations/IntegrationGuideView";
import { IntegrationLinks } from "@/components/integrations/IntegrationLinks";
import { IntegrationTechnical } from "@/components/integrations/IntegrationTechnical";
import { TestConnection } from "@/components/integrations/TestConnection";
import { SnippetInstaller } from "@/components/integrations/SnippetInstaller";
import { SNIPPET_KEYS } from "@/lib/tagSnippets";
import { BUILTIN_PATH, firstLink } from "@/components/integrations/helpers";
import { CopyButton, IntegrationLogo, PricingBadge, StatusPill } from "@/components/integrations/shared";
import { integrationsCopy } from "@/content/integrations";
import { integrationGuides } from "@/content/integrationGuides";
import { integrationsHubCopy } from "@/content/integrationsHub";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { integrationBySlug } from "@/lib/integrationCatalog";
import { loadIntegrations } from "@/lib/integrationHub";
import { hasSecretKey } from "@/lib/integrations";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const TABS = ["config", "guide", "technical", "links", "log"] as const;
type Tab = (typeof TABS)[number];
const TAB_PARAM: Record<Tab, string> = { config: "", guide: "guia", technical: "tecnico", links: "enlaces", log: "registro" };

/** Pruebas que envían un mensaje real (chat del equipo). */
const SENDS_MESSAGE = new Set(["slack", "microsoft-teams", "google-chat"]);
/** Sección del formulario anterior con la descripción de cada integración. */
const OLD_SECTION: Record<string, "google" | "meta" | "whatsapp" | "social" | "feed" | "email" | "ai" | "automation"> = {
  "google-tag-manager": "google",
  "google-analytics": "google",
  "meta-pixel": "meta",
  whatsapp: "whatsapp",
  "messenger-instagram": "social",
  "google-ads": "feed",
  resend: "email",
  claude: "ai",
  "scheduled-jobs": "automation",
};

export default async function IntegrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const def = integrationBySlug(slug);
  if (!def) notFound();
  const base = `/${locale}/portal/integraciones`;
  // Las incluidas tienen su propia página (si llegamos aquí con su ruta, no existe).
  if (def.builtin) {
    if (BUILTIN_PATH[def.builtin] === slug) notFound();
    redirect(`${base}/${BUILTIN_PATH[def.builtin]}`);
  }

  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = integrationsHubCopy[locale];
  const old = integrationsCopy[locale];
  const rawTab = (await searchParams).tab;
  const tab: Tab = (Object.entries(TAB_PARAM).find(([, v]) => v && v === rawTab)?.[0] as Tab | undefined) ?? "config";
  const guide = integrationGuides[locale][slug] ?? integrationGuides.es[slug];
  const site = siteConfig.url;

  const [{ stored, envOnly, statuses }, audit, employees, conversions, jobs] = await Promise.all([
    loadIntegrations(supabase),
    tab === "log"
      ? supabase
          .from("integration_audit")
          .select("*")
          .in("key", [...def.keys, slug])
          .order("created_at", { ascending: false })
          .limit(100)
          .then((r) => (r.data ?? []) as AuditRow[])
      : Promise.resolve([] as AuditRow[]),
    tab === "log" ? listEmployees(supabase) : Promise.resolve([]),
    tab === "config" && slug === "google-ads" ? supabase.rpc("ads_offline_conversions", { p_days: 90 }).then((r) => r.data ?? []) : Promise.resolve([]),
    tab === "config" && slug === "scheduled-jobs" ? supabase.rpc("admin_jobs_status").then((r) => (r.data ?? null) as unknown as JobsStatus | null) : Promise.resolve(null),
  ]);
  const status = statuses[slug] ?? "off";

  const leadIds = [...new Set(conversions.map((c) => c.lead_id))];
  const { data: leads } = leadIds.length ? await supabase.from("leads").select("id, name").in("id", leadIds) : { data: [] as { id: string; name: string }[] };
  const leadName = Object.fromEntries((leads ?? []).map((l) => [l.id, l.name]));

  const account = firstLink(def, ["account", "console"]);
  const docs = firstLink(def, ["docs"]);
  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const section = OLD_SECTION[slug];

  // URLs que se pegan en el servicio del tercero.
  const urls: { label: string; url: string }[] = [];
  if (slug === "whatsapp") urls.push({ label: old.sections.whatsapp.webhook, url: `${site}/api/whatsapp/webhook` });
  if (slug === "messenger-instagram") urls.push({ label: old.sections.social.webhook, url: `${site}/api/meta/webhook` });
  if (slug === "resend") urls.push({ label: old.sections.email.webhook, url: `${site}/api/email/webhook` });
  if (slug === "wompi") urls.push({ label: locale === "en" ? "Events URL (Wompi → Developers → Events URL)" : "URL de eventos (Wompi → Desarrolladores → URL de eventos)", url: `${site}/api/payments/wompi` });
  if (slug === "google-ads") urls.push({ label: old.sections.feed.url, url: `${site}/api/ads/conversions` });
  if (slug === "scheduled-jobs") urls.push({ label: old.sections.automation.url, url: `${site}/api/jobs/run` });
  const steps = slug === "messenger-instagram" ? old.sections.social.steps : slug === "google-ads" ? old.sections.feed.steps : [];
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <>
      <PageHeader title={def.name} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        {/* Encabezado */}
        <div className="border-b border-line px-4 pb-5 pt-4 sm:px-6">
          <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </Link>
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <IntegrationLogo def={def} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-heading">{def.name}</h2>
                <StatusPill status={status} label={t.status[status]} />
                <PricingBadge pricing={def.pricing} label={t.pricing[def.pricing]} />
              </div>
              <p className="text-sm text-muted">
                {t.by.replace("{vendor}", def.vendor)} · {t.categories[def.category]}
              </p>
              {guide?.summary && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body">{guide.summary}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {account && (
                <a href={account.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                  {t.openAccount}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{t.external}</span>
                </a>
              )}
              {docs && (
                <a href={docs.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                  {t.docs}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{t.external}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <nav aria-label={def.name} className="-mb-px flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
          {TABS.map((key) => (
            <Link
              key={key}
              href={TAB_PARAM[key] ? `${base}/${slug}?tab=${TAB_PARAM[key]}` : `${base}/${slug}`}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[key]}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-6 sm:px-6">
          {tab === "config" && (
            <div className="grid gap-5">
              {def.via ? (
                <section className={card}>
                  <h2 className="text-[0.98rem] font-semibold text-heading">{t.viaTitle}</h2>
                  <p className="mt-1 max-w-3xl text-sm text-body">{t.viaBody}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`${base}/webhooks`} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                      <Webhook className="h-4 w-4" aria-hidden />
                      {t.goWebhooks}
                    </Link>
                    <Link href={`${base}/api`} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                      <Code2 className="h-4 w-4" aria-hidden />
                      {t.goApi}
                    </Link>
                  </div>
                </section>
              ) : slug === "supabase" ? (
                <section className={card}>
                  <h2 className="flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
                    <Database className="h-4 w-4 text-accent" aria-hidden />
                    {t.supabaseTitle}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm text-body">{t.supabaseBody}</p>
                  <p className="mt-3 text-sm font-semibold text-heading">
                    {old.serverKey.title} · {hasSecretKey() ? old.connected : old.missing}
                  </p>
                  {!hasSecretKey() && <p className="mt-1 text-sm text-muted">{old.serverKey.where}</p>}
                </section>
              ) : null}

              {SNIPPET_KEYS[slug] && (
                <SnippetInstaller
                  locale={locale}
                  keys={SNIPPET_KEYS[slug]}
                  current={Object.fromEntries(SNIPPET_KEYS[slug].map((k) => [k, stored[k]?.value ?? null]))}
                />
              )}

              {def.keys.length > 0 && (
                <section className={card}>
                  {section && <p className="mb-5 max-w-3xl text-sm text-muted">{old.sections[section].desc}</p>}
                  {(urls.length > 0 || steps.length > 0) && (
                    <div className="mb-6 grid gap-3">
                      {urls.map((u) => (
                        <div key={u.url}>
                          <p className="mb-1.5 text-xs font-medium text-muted">{u.label}</p>
                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 truncate rounded-[10px] bg-[var(--meta-active)] px-3 py-2 text-sm text-heading">{u.url}</code>
                            <CopyButton value={u.url} label={old.copy} done={old.copied} />
                          </div>
                        </div>
                      ))}
                      {steps.length > 0 && (
                        <ol className="grid list-decimal gap-1 pl-5 text-sm text-body">
                          {steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                  {slug === "scheduled-jobs" && (
                    <div className="mb-6">
                      <JobsPanel locale={locale} siteUrl={site} initial={jobs} hasKey={!!stored.cron_secret?.set || envOnly.includes("cron_secret")} />
                    </div>
                  )}
                  <IntegrationFields locale={locale} keys={def.keys} stored={stored} envOnly={envOnly} />
                  {slug !== "scheduled-jobs" && (
                    <div className="mt-5 border-t border-line pt-5">
                      <TestConnection locale={locale} slug={slug} sendsMessage={SENDS_MESSAGE.has(slug)} />
                    </div>
                  )}
                </section>
              )}

              {slug === "google-ads" && (
                <section className={card}>
                  <h2 className="text-[0.98rem] font-semibold text-heading">{old.preview}</h2>
                  {!conversions.length ? (
                    <p className="mt-2 text-sm text-muted">{old.previewEmpty}</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                            <th scope="col" className="py-2.5 font-medium">{old.cols.lead}</th>
                            <th scope="col" className="py-2.5 font-medium">{old.cols.kind}</th>
                            <th scope="col" className="py-2.5 font-medium">{old.cols.when}</th>
                            <th scope="col" className="py-2.5 text-right font-medium">{old.cols.value}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversions
                            .slice(-50)
                            .reverse()
                            .map((c) => (
                              <tr key={`${c.lead_id}-${c.kind}`} className="border-b border-line last:border-0">
                                <td className="py-2.5">
                                  <Link href={`/${locale}/portal/crm/${c.lead_id}`} className="font-medium text-heading hover:underline">
                                    {leadName[c.lead_id] ?? "—"}
                                  </Link>
                                </td>
                                <td className="py-2.5 text-body">{old.kinds[c.kind] ?? c.kind}</td>
                                <td className="py-2.5 text-body">{fmt(c.converted_at)}</td>
                                <td className="py-2.5 text-right tabular-nums text-heading">
                                  {c.value != null ? new Intl.NumberFormat(locale, { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(c.value) : "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {!def.keys.length && !def.via && slug !== "supabase" && <p className={cn(card, "text-sm text-muted")}>{t.noKeys}</p>}
            </div>
          )}
          {tab === "guide" && <IntegrationGuideView guide={guide} t={t} />}
          {tab === "technical" && <IntegrationTechnical locale={locale} guide={guide} siteUrl={site} />}
          {tab === "links" && <IntegrationLinks def={def} t={t} />}
          {tab === "log" && (
            <AuditLog
              locale={locale}
              rows={audit}
              names={Object.fromEntries(employees.map((e) => [e.id, e.name]))}
              labels={{ ...Object.fromEntries(def.keys.map((k) => [k, old.fields[k]?.label ?? k])), [slug]: def.name }}
              t={t}
            />
          )}
        </div>
      </div>
    </>
  );
}
