import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatNav } from "@/components/chat/ChatNav";
import { SavedRepliesManager } from "@/components/chat/SavedRepliesManager";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { ChatSavedReply } from "@/lib/supabase/types";

export default async function SavedRepliesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = liveChatCopy[locale].inbox;
  const { data } = await supabase.from("chat_saved_replies").select("*").order("title");
  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ChatNav locale={locale} isAdmin={profile.role === "admin"} />
        <div className="px-4 py-6 sm:px-6">
          <p className="mb-5 max-w-3xl text-sm text-muted">{t.saved.pageSubtitle}</p>
          <SavedRepliesManager locale={locale} initial={(data ?? []) as ChatSavedReply[]} />
        </div>
      </div>
    </>
  );
}
