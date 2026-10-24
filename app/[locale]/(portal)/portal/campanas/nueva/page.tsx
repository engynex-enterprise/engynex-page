import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { CampaignEditor } from "@/components/campaigns/CampaignEditor";
import { campaignsCopy } from "@/content/campaigns";
import { campaignEditorCopy } from "@/content/campaignEditor";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { channelReady } from "@/lib/campaignReady";
import type { CampaignSegment, WaTemplate } from "@/lib/supabase/types";

export default async function NewCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ canal?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const channel = (await searchParams).canal === "email" ? "email" : "whatsapp";
  const t = campaignsCopy[locale];
  const [{ data: templates }, employees, { data: segments }, ready] = await Promise.all([
    supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name"),
    listEmployees(supabase),
    supabase.from("campaign_segments").select("*").order("name"),
    channelReady(supabase, channel),
  ]);

  return (
    <>
      <Link href={`/${locale}/portal/campanas`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.editor.back}
      </Link>
      <PageHeader title={campaignEditorCopy[locale].newTitle} />
      <CampaignEditor
        locale={locale}
        channel={channel}
        templates={(templates ?? []) as WaTemplate[]}
        campaign={null}
        ready={ready}
        employees={employees}
        segments={(segments ?? []) as CampaignSegment[]}
      />
    </>
  );
}
