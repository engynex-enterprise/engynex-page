import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { ChatInbox, type InboxConversation } from "@/components/chat/ChatInbox";
import { ChatNav } from "@/components/chat/ChatNav";
import { Sparkline } from "@/components/crm/leads/Sparkline";
import { INBOX_COLUMNS, liveChatCopy } from "@/content/liveChat";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { ChatAgentRow, ChatSavedReply } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Stats = { open: number; unanswered: number };
type Report = {
  kpis: {
    conversations: number;
    conversations_prev: number;
    median_first_response_s: number | null;
    median_first_response_prev_s: number | null;
    rating_avg: number | null;
    ratings: number;
    leads: number;
    leads_pct: number | null;
  };
  daily: { web: number; whatsapp: number; social: number; first_response_s: number | null }[];
};

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ c?: string; agent?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const { c, agent } = await searchParams;
  const t = liveChatCopy[locale].inbox;

  const [{ data }, employees, { data: replies }, { data: statsData }, { data: reportData }, { data: mine }] = await Promise.all([
    supabase.from("chat_conversations").select(INBOX_COLUMNS).order("last_message_at", { ascending: false }).limit(300),
    listEmployees(supabase),
    supabase.from("chat_saved_replies").select("*").order("title"),
    supabase.rpc("chat_stats", { p_days: 7 }),
    supabase.rpc("chat_report", { p_days: 7 }),
    supabase.from("chat_agents").select("*").eq("profile_id", profile.id).maybeSingle(),
  ]);
  const s = (statsData ?? {}) as Stats;
  const r = reportData as unknown as Report | null;
  const k = r?.kpis;
  const me = mine as ChatAgentRow | null;

  const duration = (seconds: number | null | undefined) =>
    seconds == null
      ? "—"
      : seconds < 60
        ? t.duration.s.replace("{n}", String(seconds))
        : seconds < 3600
          ? t.duration.m.replace("{n}", String(Math.round(seconds / 60)))
          : t.duration.h.replace("{n}", (seconds / 3600).toFixed(1));
  const delta = (now: number | null | undefined, prev: number | null | undefined, lowerIsBetter = false) => {
    if (now == null || !prev) return null;
    const d = Math.round(((now - prev) / prev) * 100);
    return { d, good: lowerIsBetter ? d <= 0 : d >= 0 };
  };

  const kpis = [
    {
      key: "conversations",
      value: String(k?.conversations ?? 0),
      delta: delta(k?.conversations, k?.conversations_prev),
      series: (r?.daily ?? []).map((d) => d.web + d.whatsapp + d.social),
      hint: null,
    },
    { key: "unanswered", value: String(s.unanswered ?? 0), delta: null, series: null, hint: `${s.open ?? 0} ${t.filters.open.toLowerCase()}` },
    {
      key: "firstResponse",
      value: duration(k?.median_first_response_s),
      delta: delta(k?.median_first_response_s, k?.median_first_response_prev_s, true),
      series: (r?.daily ?? []).map((d) => d.first_response_s ?? 0),
      hint: null,
    },
    { key: "rating", value: k?.rating_avg != null ? `${k.rating_avg} / 5` : "—", delta: null, series: null, hint: k?.ratings ? `${k.ratings} ★` : null },
    { key: "leads", value: k?.leads_pct != null ? `${k.leads_pct}%` : "—", delta: null, series: null, hint: k?.leads ? `${k.leads} leads` : null },
  ] as const;

  return (
    <>
      <PageHeader title={t.title} count={s.open ?? 0} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        {/* Métricas */}
        <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((x) => (
            <div key={x.key} className="flex items-center justify-between gap-3 border-line px-6 py-4 sm:border-r lg:last:border-r-0">
              <div className="min-w-0">
                <p className="text-sm leading-snug text-muted">{t.kpis[x.key]}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-[1.7rem] font-semibold leading-none tabular-nums text-heading">{x.value}</span>
                  {x.delta && (
                    <span className={cn("inline-flex items-center gap-0.5 text-sm font-semibold", x.delta.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {x.delta.d >= 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
                      {Math.abs(x.delta.d)}%
                    </span>
                  )}
                </p>
                {x.hint && <p className="mt-1 text-xs text-muted">{x.hint}</p>}
              </div>
              {x.series && x.series.some((v) => v > 0) && <Sparkline values={[...x.series]} label={t.kpis[x.key]} className="text-brand-green-dark dark:text-brand-green max-2xl:hidden" />}
            </div>
          ))}
        </div>

        <ChatNav locale={locale} isAdmin={profile.role === "admin"} />

        <ChatInbox
          locale={locale}
          initial={(data ?? []) as unknown as InboxConversation[]}
          employees={employees}
          me={{ id: profile.id, name: profile.full_name ?? profile.email }}
          initialSelected={c ?? null}
          initialAgent={agent ?? null}
          savedReplies={(replies ?? []) as ChatSavedReply[]}
          myStatus={{ status: me?.status ?? "available", sound: me?.sound ?? true }}
        />
      </div>
    </>
  );
}
