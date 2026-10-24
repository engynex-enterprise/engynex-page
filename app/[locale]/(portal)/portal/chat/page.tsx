import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatInbox, type InboxConversation } from "@/components/chat/ChatInbox";
import { StatTile } from "@/components/analytics/Charts";
import { INBOX_COLUMNS, liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { ChatSavedReply } from "@/lib/supabase/types";

type Stats = {
  open: number;
  unanswered: number;
  conversations: number;
  answered_pct: number | null;
  median_first_response_s: number | null;
  rating_avg: number | null;
  ratings: number;
};

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const { c } = await searchParams;
  const t = liveChatCopy[locale].inbox;

  const [{ data }, employees, { data: replies }, { data: statsData }] = await Promise.all([
    supabase.from("chat_conversations").select(INBOX_COLUMNS).order("last_message_at", { ascending: false }).limit(300),
    listEmployees(supabase),
    supabase.from("chat_saved_replies").select("*").order("title"),
    supabase.rpc("chat_stats", { p_days: 7 }),
  ]);
  const s = (statsData ?? {}) as Stats;
  const seconds = s.median_first_response_s;
  const firstResponse =
    seconds == null
      ? "—"
      : seconds < 60
        ? t.duration.s.replace("{n}", String(seconds))
        : seconds < 3600
          ? t.duration.m.replace("{n}", String(Math.round(seconds / 60)))
          : t.duration.h.replace("{n}", (seconds / 3600).toFixed(1));

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label={t.stats.open} value={String(s.open ?? 0)} />
        <StatTile label={t.stats.unanswered} value={String(s.unanswered ?? 0)} />
        <StatTile label={t.stats.firstResponse} value={firstResponse} />
        <StatTile label={t.stats.answered} value={s.answered_pct != null ? `${s.answered_pct}%` : "—"} hint={`${s.conversations ?? 0}`} />
        <StatTile label={t.stats.rating} value={s.rating_avg != null ? `${s.rating_avg} / 5` : "—"} hint={s.ratings ? `${s.ratings}` : undefined} />
      </dl>
      <ChatInbox
        locale={locale}
        initial={(data ?? []) as unknown as InboxConversation[]}
        employees={employees}
        me={{ id: profile.id, name: profile.full_name ?? profile.email }}
        initialSelected={c ?? null}
        savedReplies={(replies ?? []) as ChatSavedReply[]}
      />
    </>
  );
}
