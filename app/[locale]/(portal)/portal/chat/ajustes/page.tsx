import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatNav } from "@/components/chat/ChatNav";
import { ChatSettingsForm } from "@/components/chat/ChatSettingsForm";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ChatSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin"]);
  const { data } = await supabase.from("chat_settings").select("config, updated_at").maybeSingle();
  return (
    <>
      <PageHeader title={liveChatCopy[locale].inbox.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ChatNav locale={locale} isAdmin />
        <div className="px-4 pt-6 sm:px-6">
          <ChatSettingsForm locale={locale} initial={data?.config ?? null} updatedAt={data?.updated_at ?? null} />
        </div>
      </div>
    </>
  );
}
