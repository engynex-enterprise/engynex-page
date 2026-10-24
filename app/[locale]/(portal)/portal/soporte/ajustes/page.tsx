import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { SupportNav } from "@/components/support/SupportNav";
import { SupportSettings } from "@/components/support/SupportSettings";
import { supportProCopy } from "@/content/supportPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { SupportConfig } from "@/lib/supabase/types";

export default async function SupportSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin"]);
  const t = supportProCopy[locale];
  const { data } = await supabase.from("support_settings").select("config, updated_at, updated_by").maybeSingle();

  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <SupportNav locale={locale} admin />
        <div className="px-4 py-6 sm:px-6">
          <SupportSettings
            locale={locale}
            meId={profile.id}
            initial={(data?.config ?? {}) as SupportConfig}
            updatedAt={data?.updated_by ? data.updated_at : null}
          />
        </div>
      </div>
    </>
  );
}
