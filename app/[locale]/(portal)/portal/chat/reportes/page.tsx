import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatNav } from "@/components/chat/ChatNav";
import { ChatReports, type ChatReport } from "@/components/chat/ChatReports";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ChatReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const { r } = await searchParams;
  const days = r === "7" || r === "90" ? Number(r) : 30;
  const { data } = await supabase.rpc("chat_report", { p_days: days });

  return (
    <>
      <PageHeader title={liveChatCopy[locale].inbox.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ChatNav locale={locale} isAdmin={profile.role === "admin"} />
        <div className="px-4 pb-8 sm:px-6">
          <ChatReports locale={locale} report={data as unknown as ChatReport} days={days} />
        </div>
      </div>
    </>
  );
}
