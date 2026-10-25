import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { MeetingsView, type MeetingsTab } from "@/components/clientPortal/MeetingsView";
import { clientPortalCopy } from "@/content/clientPortal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { nowIso } from "@/lib/dates";

export default async function MeetingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["client"]);
  const { tab } = await searchParams;
  const t = clientPortalCopy[locale].meetings;
  const { data: meetings } = await supabase.rpc("my_appointments");

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <LiveRefresh tables={["appointments"]} channel="client-meetings" />
      <MeetingsView locale={locale} tab={(tab === "past" ? "past" : "upcoming") as MeetingsTab} meetings={meetings ?? []} now={Date.parse(nowIso())} />
    </>
  );
}
