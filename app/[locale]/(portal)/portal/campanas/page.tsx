import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { CampaignsNav } from "@/components/campaigns/CampaignsNav";
import { CampaignsList, type ListCampaign } from "@/components/campaigns/CampaignsList";
import { SegmentsPanel } from "@/components/campaigns/SegmentsPanel";
import { TemplatesPanel } from "@/components/campaigns/TemplatesPanel";
import { pct, type CampaignStats } from "@/components/campaigns/shared";
import { campaignsCopy } from "@/content/campaigns";
import { campaignsListCopy } from "@/content/campaignsList";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { whatsappMissingFrom } from "@/lib/whatsapp";
import { hasSecretKey, integrationStatus } from "@/lib/integrations";
import type { CampaignSegment, WaTemplate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Overview = {
  campaigns: number;
  wa_delivered: number;
  wa_read: number;
  wa_replied: number;
  email_sent: number;
  email_delivered: number;
  email_opened: number;
  email_clicked: number;
  unsubscribed: number;
  reachable_wa: number;
  reachable_email: number;
};

export default async function CampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const { tab } = await searchParams;
  const t = campaignsListCopy[locale];
  const view = tab === "plantillas" ? "templates" : tab === "segmentos" ? "segments" : "campaigns";
  const status = await integrationStatus(supabase);
  const waMissing = whatsappMissingFrom(status, hasSecretKey());
  const emailReady = !!status.resend_api_key && !!status.email_from;

  const [{ data: campaigns }, { data: templates }, { data: stats }, { data: overview }, { data: segments }, employees] = await Promise.all([
    supabase
      .from("wa_campaigns")
      .select("id, name, channel, status, subject, template_id, scheduled_at, started_at, created_at, total")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("wa_templates").select("*").order("name"),
    supabase.rpc("campaign_stats"),
    supabase.rpc("campaigns_overview", { p_days: 30 }),
    view === "segments" ? supabase.from("campaign_segments").select("*").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    view === "segments" ? listEmployees(supabase) : Promise.resolve([]),
  ]);
  const o = (overview ?? {}) as Partial<Overview>;
  const active = (campaigns ?? []).filter((c) => c.status === "sending" || c.status === "paused" || c.status === "scheduled").length;
  const emailBase = o.email_delivered || o.email_sent;

  const kpis = [
    { key: "campaigns", value: String(o.campaigns ?? 0), hint: null },
    {
      key: "reachable",
      value: ((o.reachable_wa ?? 0) + (o.reachable_email ?? 0)).toLocaleString(locale),
      hint: t.kpis.reachableHint.replace("{wa}", (o.reachable_wa ?? 0).toLocaleString(locale)).replace("{email}", (o.reachable_email ?? 0).toLocaleString(locale)),
    },
    { key: "waRead", value: pct(o.wa_read, o.wa_delivered), hint: o.wa_delivered ? t.kpis.waHint.replace("{pct}", pct(o.wa_replied, o.wa_delivered)) : null },
    { key: "emailOpen", value: pct(o.email_opened, emailBase), hint: emailBase ? t.kpis.emailHint.replace("{pct}", pct(o.email_clicked, emailBase)) : null },
    { key: "unsubscribed", value: String(o.unsubscribed ?? 0), hint: null },
  ] as { key: keyof typeof t.kpis; value: string; hint: string | null }[];

  const notices = [waMissing.length > 0 && t.notices.whatsapp, !emailReady && t.notices.email].filter(Boolean) as string[];
  const templateNames = Object.fromEntries((templates ?? []).map((x) => [x.id, x.name]));

  return (
    <>
      <PageHeader title={campaignsCopy[locale].title} count={active} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        {/* Métricas */}
        <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-5">
          {kpis.map((x) => (
            <div key={x.key} className="border-line px-6 py-4 sm:border-r xl:last:border-r-0">
              <p className="text-sm text-muted">{t.kpis[x.key]}</p>
              <p className={cn("mt-1 text-[1.7rem] font-semibold leading-none tabular-nums text-heading")}>{x.value}</p>
              {x.hint && <p className="mt-1 text-xs text-muted">{x.hint}</p>}
            </div>
          ))}
        </div>

        <CampaignsNav locale={locale} />

        <div className="px-4 py-4 sm:px-6">
          {notices.length > 0 && (
            <div className="mb-4 grid gap-2">
              {notices.map((n) => (
                <p key={n} className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">{n}</span>
                  <Link href={`/${locale}/portal/integraciones`} className="shrink-0 font-semibold underline">
                    {t.notices.go}
                  </Link>
                </p>
              ))}
            </div>
          )}

          {view === "templates" ? (
            <TemplatesPanel locale={locale} templates={(templates ?? []) as WaTemplate[]} ready={waMissing.length === 0} />
          ) : view === "segments" ? (
            <SegmentsPanel
              locale={locale}
              segments={(segments ?? []) as CampaignSegment[]}
              names={Object.fromEntries((employees as { id: string; name: string }[]).map((e) => [e.id, e.name]))}
            />
          ) : (
            <CampaignsList
              locale={locale}
              campaigns={(campaigns ?? []) as ListCampaign[]}
              stats={(stats ?? []) as CampaignStats[]}
              templateNames={templateNames}
            />
          )}
        </div>
      </div>
    </>
  );
}
