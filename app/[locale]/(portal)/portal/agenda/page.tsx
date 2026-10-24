import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { AgendaList, type AgendaRow } from "@/components/crm/AgendaList";
import { crmCopy } from "@/content/crm";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso, nowIso } from "@/lib/dates";

export default async function AgendaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales"]);
  const t = crmCopy[locale].agenda;
  const now = nowIso();
  const select = "*, lead:leads(id, name, phone, email)";

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.from("appointments").select(select).gte("starts_at", now).order("starts_at").limit(200),
    supabase
      .from("appointments")
      .select(select)
      .lt("starts_at", now)
      .gte("starts_at", daysAgoIso(60))
      .order("starts_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <AgendaList
        locale={locale}
        upcoming={(upcoming ?? []) as unknown as AgendaRow[]}
        past={(past ?? []) as unknown as AgendaRow[]}
      />
    </>
  );
}
