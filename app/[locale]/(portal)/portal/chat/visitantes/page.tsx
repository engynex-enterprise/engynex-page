import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatNav } from "@/components/chat/ChatNav";
import { VisitorsLive } from "@/components/chat/VisitorsLive";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ChatVisitorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const me = (profile.full_name ?? profile.email).split(/\s+/)[0];

  return (
    <>
      <PageHeader title={liveChatCopy[locale].inbox.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ChatNav locale={locale} isAdmin={profile.role === "admin"} />
        <div className="px-4 py-6 sm:px-6">
          <VisitorsLive locale={locale} me={me} />
        </div>
      </div>
    </>
  );
}
