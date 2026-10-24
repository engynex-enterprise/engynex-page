import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatNav } from "@/components/chat/ChatNav";
import { TeamBoard, type TeamMember } from "@/components/chat/TeamBoard";
import { liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ChatTeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const [{ data }, { count }] = await Promise.all([
    supabase.rpc("chat_team"),
    supabase.from("chat_conversations").select("id", { count: "exact", head: true }).eq("status", "open").is("assigned_to", null),
  ]);

  return (
    <>
      <PageHeader title={liveChatCopy[locale].inbox.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ChatNav locale={locale} isAdmin={profile.role === "admin"} />
        <div className="px-4 py-6 sm:px-6">
          <TeamBoard
            locale={locale}
            initial={(data ?? []) as unknown as TeamMember[]}
            unassigned={count ?? 0}
            isAdmin={profile.role === "admin"}
          />
        </div>
      </div>
    </>
  );
}
