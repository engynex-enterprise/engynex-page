import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { FollowupNav } from "@/components/followups/FollowupNav";
import { SequenceEditor } from "@/components/followups/SequenceEditor";
import { automationCopy } from "@/content/automation";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function SequencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const { data } = await supabase.from("followup_settings").select("config, updated_at").maybeSingle();
  return (
    <>
      <PageHeader title={automationCopy[locale].followups.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <FollowupNav locale={locale} />
        <div className="px-4 pt-6 sm:px-6">
          <SequenceEditor
            locale={locale}
            initial={data?.config ?? null}
            updatedAt={data?.updated_at ?? null}
            canEdit={profile.role === "admin" || profile.role === "marketing"}
          />
        </div>
      </div>
    </>
  );
}
