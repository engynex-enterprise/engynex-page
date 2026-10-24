import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import {
  AvailabilityForm,
  BlocksForm,
  BookingForm,
  ScoringForm,
  type ScoringShape,
} from "@/components/crm/SettingsForms";
import { crmCopy } from "@/content/crm";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso } from "@/lib/dates";
import type { Availability, AvailabilityBlock, BookingSettings } from "@/lib/supabase/types";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const t = crmCopy[locale].settings;

  const [{ data: scoring }, { data: booking }, { data: availability }, { data: blocks }] = await Promise.all([
    supabase.from("scoring_config").select("config").eq("id", 1).single(),
    supabase.from("booking_settings").select("*").eq("id", 1).single(),
    supabase.from("availability").select("*").order("weekday").order("start_time"),
    supabase.from("availability_blocks").select("*").gte("ends_at", daysAgoIso(1)).order("starts_at"),
  ]);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-6">
        <ScoringForm locale={locale} initial={scoring?.config as unknown as ScoringShape} />
        <div className="grid gap-6 xl:grid-cols-2">
          <BookingForm locale={locale} initial={booking as BookingSettings} />
          <BlocksForm locale={locale} initial={(blocks ?? []) as AvailabilityBlock[]} />
        </div>
        <AvailabilityForm locale={locale} initial={(availability ?? []) as Availability[]} />
      </div>
    </>
  );
}
