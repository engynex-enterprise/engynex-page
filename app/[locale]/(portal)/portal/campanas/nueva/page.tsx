import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { CampaignEditor } from "@/components/campaigns/CampaignEditor";
import { campaignsCopy } from "@/content/campaigns";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { whatsappMissingFrom } from "@/lib/whatsapp";
import { hasSecretKey, integrationStatus } from "@/lib/integrations";
import type { WaTemplate } from "@/lib/supabase/types";

export default async function NewCampaignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const t = campaignsCopy[locale];
  const { data: templates } = await supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name");

  return (
    <>
      <Link href={`/${locale}/portal/campanas`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.editor.back}
      </Link>
      <PageHeader title={t.newCampaign} subtitle={t.subtitle} />
      <CampaignEditor locale={locale} templates={(templates ?? []) as WaTemplate[]} campaign={null} ready={whatsappMissingFrom(await integrationStatus(supabase), hasSecretKey()).length === 0} />
    </>
  );
}
