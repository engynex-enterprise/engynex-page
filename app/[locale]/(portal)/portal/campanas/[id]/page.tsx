import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { CampaignEditor } from "@/components/campaigns/CampaignEditor";
import { CampaignReport, type CampaignReportData } from "@/components/campaigns/CampaignReport";
import { toRecipientRows } from "@/components/campaigns/recipients";
import type { CampaignStats } from "@/components/campaigns/shared";
import { campaignsCopy } from "@/content/campaigns";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { channelReady } from "@/lib/campaignReady";
import { campaignStatusTone } from "@/lib/campaigns";
import type { CampaignSegment, WaCampaign, WaTemplate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const LIMIT = 2000;

export default async function CampaignPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const t = campaignsCopy[locale];

  const { data } = await supabase.from("wa_campaigns").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const campaign = data as WaCampaign;
  const back = (
    <Link href={`/${locale}/portal/campanas`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t.editor.back}
    </Link>
  );

  // Antes de enviar: se edita.
  if (campaign.status === "draft" || campaign.status === "scheduled") {
    const [{ data: templates }, employees, { data: segments }, ready] = await Promise.all([
      supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name"),
      listEmployees(supabase),
      supabase.from("campaign_segments").select("*").order("name"),
      channelReady(supabase, campaign.channel),
    ]);
    return (
      <>
        {back}
        <PageHeader
          title={campaign.name}
          action={<span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", campaignStatusTone[campaign.status])}>{t.status[campaign.status]}</span>}
        />
        <CampaignEditor
          locale={locale}
          channel={campaign.channel}
          templates={(templates ?? []) as WaTemplate[]}
          campaign={campaign}
          ready={ready}
          employees={employees}
          segments={(segments ?? []) as CampaignSegment[]}
        />
      </>
    );
  }

  // Enviando, en pausa o terminada: informe.
  const [{ data: rows }, { data: stats }, { data: report }, { data: template }, { data: ab }] = await Promise.all([
    campaign.channel === "email"
      ? supabase
          .from("email_queue")
          .select("id, lead_id, to_email, status, error, sent_at, delivered_at, opened_at, clicked_at, bounced_at, open_count, leads(name)")
          .eq("campaign_id", id)
          .order("id")
          .limit(LIMIT)
      : supabase.from("wa_messages").select("*").eq("campaign_id", id).order("id").limit(LIMIT),
    supabase.rpc("campaign_stats"),
    supabase.rpc("campaign_report", { p_campaign: id }),
    campaign.template_id ? supabase.from("wa_templates").select("*").eq("id", campaign.template_id).maybeSingle() : Promise.resolve({ data: null }),
    campaign.subject_b ? supabase.rpc("campaign_ab", { p_campaign: id }) : Promise.resolve({ data: null }),
  ]);
  const s = ((stats ?? []) as CampaignStats[]).find((x) => x.campaign_id === id) ?? null;

  return (
    <>
      {back}
      <PageHeader title={campaign.name} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <CampaignReport
          locale={locale}
          campaign={campaign}
          stats={s}
          report={report as unknown as CampaignReportData | null}
          recipients={toRecipientRows(campaign.channel, (rows ?? []) as never[])}
          template={(template as WaTemplate | null) ?? null}
          ab={ab as never}
        />
      </div>
    </>
  );
}
