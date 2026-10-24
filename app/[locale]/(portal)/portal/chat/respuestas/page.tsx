import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { SavedRepliesManager } from "@/components/chat/SavedRepliesManager";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { ChatSavedReply } from "@/lib/supabase/types";

export default async function SavedRepliesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = liveChatCopy[locale].inbox.saved;
  const { data } = await supabase.from("chat_saved_replies").select("*").order("title");
  return (
    <>
      <Link href={`/${locale}/portal/chat`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <PageHeader title={t.title} subtitle={t.pageSubtitle} />
      <SavedRepliesManager locale={locale} initial={(data ?? []) as ChatSavedReply[]} />
    </>
  );
}
