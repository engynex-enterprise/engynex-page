import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { SupportNav } from "@/components/support/SupportNav";
import { MacrosManager } from "@/components/support/MacrosManager";
import { supportProCopy } from "@/content/supportPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { TicketMacro } from "@/lib/supabase/types";

export default async function SupportMacrosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "support", "sales"]);
  const { data } = await supabase.from("ticket_macros").select("*").order("title");
  const macros = (data ?? []) as TicketMacro[];

  return (
    <>
      <PageHeader title={supportProCopy[locale].title} count={macros.length} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <SupportNav locale={locale} admin={profile.role === "admin"} />
        <MacrosManager locale={locale} initial={macros} />
      </div>
    </>
  );
}
