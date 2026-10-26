"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, MessageCircle, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Appointment, ChatConversation, ChatMessage, EmailQueueRow, Lead, PageView, Task, WaMessage } from "@/lib/supabase/types";
import { LeadTasks } from "@/components/crm/LeadDetail";
import { LeadAiCard } from "@/components/crm/LeadAiCard";
import { Journey } from "@/components/analytics/Journey";
import type { LeadInsights } from "@/lib/aiTypes";
import { crmCopy } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import { leadDrawerCopy } from "@/content/leadDrawer";
import { automationCopy } from "@/content/automation";
import { campaignsCopy } from "@/content/campaigns";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Client = ReturnType<typeof createClient>;

/** Carga los datos de una pestaña la primera vez que se muestra. */
function useLoad<T>(load: (supabase: Client) => Promise<T>, deps: unknown[]) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    void load(supabase).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, tick, ...deps]);
  return { data, reload: () => setTick((n) => n + 1) };
}

export function PanelLoading({ locale }: { locale: Locale }) {
  return (
    <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {leadDrawerCopy[locale].loading}
    </p>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}

const fmtWhen = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

/* ---------------- Respuestas del formulario + desglose ---------------- */

export function AnswersPanel({ locale, lead }: { locale: Locale; lead: Lead }) {
  const t = crmCopy[locale];
  const f = leadFormCopy[locale];
  const breakdown = (lead.score_breakdown ?? {}) as Record<string, number | string | null>;
  const answers: [string, string][] = [
    [t.lead.problem, f.steps.problem.options[lead.problem_category as keyof typeof f.steps.problem.options] ?? lead.problem_category],
    ...(lead.problem_text ? ([[t.lead.detail, lead.problem_text]] as [string, string][]) : []),
    [t.lead.budget, f.steps.budget.options[lead.budget as keyof typeof f.steps.budget.options] ?? lead.budget],
    [t.lead.decision, f.steps.decision.options[lead.decision as keyof typeof f.steps.decision.options] ?? lead.decision],
    [t.lead.timeline, f.steps.timeline.options[lead.timeline as keyof typeof f.steps.timeline.options] ?? lead.timeline],
  ];
  return (
    <div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {answers.map(([label, value]) => (
          <div key={label} className={cn(label === t.lead.detail && "sm:col-span-2")}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm font-semibold text-heading">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-heading">{t.lead.breakdown}</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {(["problem", "budget", "decision", "timeline"] as const).map((k) => (
            <li key={k} className="rounded-lg bg-surface-soft p-3 dark:bg-white/[0.05]">
              <p className="text-xs text-muted">{t.lead[k]}</p>
              <p className="text-lg font-bold tabular-nums text-heading">+{breakdown[k] ?? 0}</p>
            </li>
          ))}
        </ul>
        {typeof breakdown.rule === "string" && <p className="mt-3 text-xs font-semibold text-muted">{t.lead.rules[breakdown.rule] ?? breakdown.rule}</p>}
      </div>
    </div>
  );
}

/* ---------------- Origen ---------------- */

export function OriginPanel({ locale, lead }: { locale: Locale; lead: Lead }) {
  const t = crmCopy[locale].lead;
  const c = campaignsCopy[locale].lead;
  const utm = (lead.utm ?? {}) as Record<string, string>;
  return (
    <dl className="grid gap-4 text-sm">
      <div>
        <dt className="text-xs text-muted">WhatsApp</dt>
        <dd className={cn("font-semibold", lead.whatsapp_opt_out_at ? "text-red-600 dark:text-red-400" : lead.whatsapp_opt_in_at ? "text-emerald-700 dark:text-emerald-400" : "text-muted")}>
          {lead.whatsapp_opt_out_at ? c.optOut : lead.whatsapp_opt_in_at ? c.optIn : c.noOptIn}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">{t.page}</dt>
        <dd className="break-all text-heading">{lead.source_page ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">{t.referrer}</dt>
        <dd className="break-all text-heading">{lead.referrer ?? t.direct}</dd>
      </div>
      {Object.keys(utm).length > 0 && (
        <div>
          <dt className="text-xs text-muted">{t.campaign}</dt>
          <dd className="text-heading">
            {Object.entries(utm).map(([k, v]) => (
              <span key={k} className="mr-1.5 mt-1 inline-block rounded-full bg-surface-soft px-2 py-0.5 text-xs dark:bg-white/[0.06]">
                {k.replace("utm_", "")}: {v}
              </span>
            ))}
          </dd>
        </div>
      )}
      {lead.gclid && (
        <div>
          <dt className="text-xs text-muted">{t.gclid}</dt>
          <dd className="break-all font-mono text-xs text-heading">{lead.gclid}</dd>
        </div>
      )}
    </dl>
  );
}

/* ---------------- Tareas ---------------- */

export function TasksPanel({ locale, lead, canWrite, meId, onCount }: { locale: Locale; lead: Lead; canWrite: boolean; meId: string; onCount: (n: number) => void }) {
  const { data } = useLoad(async (s) => {
    const { data: rows } = await s.from("tasks").select("*").eq("lead_id", lead.id).order("due_at", { ascending: true, nullsFirst: false });
    return (rows ?? []) as Task[];
  }, [lead.id]);
  useEffect(() => {
    if (data) onCount(data.filter((x) => !x.done).length);
  }, [data, onCount]);
  if (!data) return <PanelLoading locale={locale} />;
  return <LeadTasks locale={locale} leadId={lead.id} initial={data} canWrite={canWrite} defaultAssignee={lead.assigned_to ?? meId} />;
}

/* ---------------- Citas ---------------- */

export function MeetingsPanel({ locale, lead }: { locale: Locale; lead: Lead }) {
  const t = crmCopy[locale];
  const f = leadFormCopy[locale];
  const d = leadDrawerCopy[locale];
  const { data } = useLoad(async (s) => {
    const { data: rows } = await s.from("appointments").select("*").eq("lead_id", lead.id).order("starts_at", { ascending: false });
    return (rows ?? []) as Appointment[];
  }, [lead.id]);
  if (!data) return <PanelLoading locale={locale} />;
  if (data.length === 0) return <Empty>{d.meetings.empty}</Empty>;
  return (
    <ul className="grid gap-3">
      {data.map((m) => (
        <li key={m.id} className="rounded-lg bg-surface-soft p-3 dark:bg-white/[0.05]">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-heading first-letter:uppercase">{fmtWhen(locale, m.starts_at)}</p>
              <p className="text-xs text-muted">
                {f.booking.channels[m.channel]} · {t.agenda.statuses[m.status]}
              </p>
            </div>
            {m.meeting_url && m.status !== "cancelled" && (
              <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-heading ring-1 ring-line-strong hover:bg-surface dark:hover:bg-white/[0.06]">
                <Video className="h-3.5 w-3.5" aria-hidden />
                {d.meetings.join}
              </a>
            )}
          </div>
          {m.notes && <p className="mt-1 text-xs text-body">{m.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Chat (web y WhatsApp) ---------------- */

export function ChatPanel({ locale, lead, names }: { locale: Locale; lead: Lead; names: Record<string, string> }) {
  const d = leadDrawerCopy[locale].chat;
  const { data } = useLoad(async (s) => {
    const [conv, wa] = await Promise.all([
      s.from("chat_conversations").select("id, channel, status, topic, last_message, last_message_at, created_at, unread_agent").eq("lead_id", lead.id).order("last_message_at", { ascending: false }),
      s.from("wa_messages").select("id, status, sent_at, read_at, replied_at, created_at, error").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      conversations: (conv.data ?? []) as Pick<ChatConversation, "id" | "channel" | "status" | "topic" | "last_message" | "last_message_at" | "created_at" | "unread_agent">[],
      wa: (wa.data ?? []) as Pick<WaMessage, "id" | "status" | "sent_at" | "read_at" | "replied_at" | "created_at" | "error">[],
    };
  }, [lead.id]);
  const [open, setOpen] = useState<string | null>(null);
  const current = open ?? data?.conversations[0]?.id ?? null;

  if (!data) return <PanelLoading locale={locale} />;
  if (data.conversations.length === 0 && data.wa.length === 0) return <Empty>{d.empty}</Empty>;
  return (
    <div className="grid gap-4">
      {data.conversations.length > 0 && (
        <>
          <ul className="grid gap-2">
            {data.conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c.id)}
                  aria-pressed={current === c.id}
                  className={cn("flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 transition-colors", current === c.id ? "bg-[var(--meta-active)] ring-brand-green-dark/30" : "ring-line hover:bg-[var(--meta-hover)]")}
                >
                  <MessageCircle className={cn("mt-0.5 h-4 w-4 shrink-0", c.channel === "whatsapp" ? "text-[#25D366]" : "text-muted")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-heading">{d.channels[c.channel] ?? c.channel}</span>
                      <span>· {d.statuses[c.status] ?? c.status}</span>
                      <span className="ml-auto shrink-0">{fmtWhen(locale, c.last_message_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-body">{c.last_message ?? c.topic}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {current && <Messages key={current} locale={locale} conversationId={current} names={names} />}
        </>
      )}
      {data.wa.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">{d.campaigns}</p>
          <ul className="grid gap-1.5">
            {data.wa.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-soft px-3 py-2 text-xs dark:bg-white/[0.05]">
                <span className="text-body">{fmtWhen(locale, w.sent_at ?? w.created_at)}</span>
                <span className={cn("font-semibold", w.status === "failed" ? "text-red-600 dark:text-red-400" : "text-heading")}>
                  {w.replied_at ? d.replied : d.waStatuses[w.status] ?? w.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Messages({ locale, conversationId, names }: { locale: Locale; conversationId: string; names: Record<string, string> }) {
  const d = leadDrawerCopy[locale].chat;
  const { data } = useLoad(async (s) => {
    const { data: rows } = await s
      .from("chat_messages")
      .select("id, sender, author_id, body, created_at, internal")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(50);
    return ((rows ?? []) as Pick<ChatMessage, "id" | "sender" | "author_id" | "body" | "created_at" | "internal">[]).reverse();
  }, [conversationId]);
  if (!data) return <PanelLoading locale={locale} />;
  const who = (m: (typeof data)[number]) => (m.sender === "agent" ? (m.author_id && names[m.author_id]) || d.agent : d[m.sender]);
  return (
    <div className="rounded-xl bg-surface-soft p-3 dark:bg-white/[0.04]">
      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{d.messagesEmpty}</p>
      ) : (
        <ol className="grid max-h-80 gap-2 overflow-y-auto pr-1">
          {data.map((m) => {
            const mine = m.sender === "agent" || m.sender === "bot";
            return (
              <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.internal ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" : m.sender === "system" ? "bg-transparent text-xs text-muted" : mine ? "bg-deep-700 text-white dark:bg-white/15" : "bg-surface text-heading ring-1 ring-line dark:bg-card",
                  )}
                >
                  <p className="text-[0.68rem] font-semibold opacity-75">
                    {m.internal ? d.internal : who(m)} · {fmtWhen(locale, m.created_at)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Link href={`/${locale}/portal/chat?c=${conversationId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-heading hover:underline">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {d.open}
      </Link>
    </div>
  );
}

/* ---------------- Correos ---------------- */

export function EmailsPanel({ locale, lead }: { locale: Locale; lead: Lead }) {
  const d = leadDrawerCopy[locale].emails;
  const a = automationCopy[locale].followups;
  const { data } = useLoad(async (s) => {
    const { data: rows } = await s
      .from("email_queue")
      .select("id, kind, to_email, status, send_at, sent_at, opened_at, clicked_at, bounced_at, open_count, click_count, error")
      .eq("lead_id", lead.id)
      .order("send_at", { ascending: false });
    return (rows ?? []) as Pick<EmailQueueRow, "id" | "kind" | "to_email" | "status" | "send_at" | "sent_at" | "opened_at" | "clicked_at" | "bounced_at" | "open_count" | "click_count" | "error">[];
  }, [lead.id]);
  if (!data) return <PanelLoading locale={locale} />;
  const tone: Record<string, string> = {
    sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    queued: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    sending: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
  };
  return (
    <div className="grid gap-2">
      {data.length === 0 ? (
        <Empty>{d.empty}</Empty>
      ) : (
        data.map((e) => (
          <div key={e.id} className="rounded-xl border border-line p-3">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold text-heading">{a.kinds[e.kind] ?? e.kind}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", tone[e.status])}>{a.statuses[e.status] ?? e.status}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {[e.to_email, fmtWhen(locale, e.sent_at ?? e.send_at)].filter(Boolean).join(" · ")}
            </p>
            {(e.opened_at || e.clicked_at || e.bounced_at) && (
              <p className="mt-1.5 flex flex-wrap gap-1.5 text-[0.7rem] font-semibold">
                {e.opened_at && <span className="rounded-full bg-surface-soft px-2 py-0.5 text-heading dark:bg-white/[0.06]">{d.opened} ×{e.open_count}</span>}
                {e.clicked_at && <span className="rounded-full bg-surface-soft px-2 py-0.5 text-heading dark:bg-white/[0.06]">{d.clicked} ×{e.click_count}</span>}
                {e.bounced_at && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">{d.bounced}</span>}
              </p>
            )}
            {e.error && e.status === "failed" && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{e.error}</p>}
          </div>
        ))
      )}
      <Link href={`/${locale}/portal/seguimiento`} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-heading hover:underline">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {d.open}
      </Link>
    </div>
  );
}

/* ---------------- Lectura con IA ---------------- */

export function AiPanel({ locale, lead, canRun, onAnalyzed }: { locale: Locale; lead: Lead; canRun: boolean; onAnalyzed: () => void }) {
  const { data } = useLoad(async (s) => {
    const { data: status } = await s.rpc("integration_status");
    const keys = status as Record<string, boolean> | null;
    return !!(keys?.anthropic_api_key || keys?.openai_api_key || keys?.gemini_api_key);
  }, []);
  if (data === null) return <PanelLoading locale={locale} />;
  return (
    <LeadAiCard
      bare
      locale={locale}
      leadId={lead.id}
      insights={(lead.ai_insights ?? null) as LeadInsights | null}
      analyzedAt={lead.ai_analyzed_at}
      error={lead.ai_error}
      hasText={!!lead.problem_text?.trim()}
      configured={data}
      canRun={canRun}
      onAnalyzed={onAnalyzed}
    />
  );
}

/* ---------------- Recorrido en el sitio ---------------- */

export function JourneyPanel({ locale, lead }: { locale: Locale; lead: Lead }) {
  const { data } = useLoad(async (s) => {
    if (!lead.visitor_id) return [] as PageView[];
    const { data: rows } = await s
      .from("page_views")
      .select("id, path, title, created_at, duration_ms, max_scroll, session_id")
      .eq("visitor_id", lead.visitor_id)
      .lte("created_at", lead.created_at)
      .order("created_at")
      .limit(200);
    return (rows ?? []) as PageView[];
  }, [lead.id]);
  if (!data) return <PanelLoading locale={locale} />;
  return <Journey locale={locale} views={data} />;
}
