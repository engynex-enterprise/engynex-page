"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Star, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, PageView } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { crmCopy } from "@/content/crm";
import { budgetKeys, decisionKeys, leadFormCopy, problemKeys, timelineKeys } from "@/content/leadForm";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { tierStyles } from "@/lib/tiers";
import type { InboxConversation } from "./ChatInbox";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Evento para abrir otra conversación desde el contexto. */
export const SELECT_CHAT_EVENT = "engynex-chat-select";

type LeadCard = Pick<Lead, "id" | "name" | "tier" | "score" | "status">;
type Previous = Pick<InboxConversation, "id" | "created_at" | "last_message" | "status" | "rating">;

/**
 * Contexto del visitante: dónde está ahora, su lead (o crearlo con el mismo
 * puntaje del formulario), su calificación, las páginas que vio y sus
 * conversaciones anteriores.
 */
export function ChatContext({
  locale,
  conversation: c,
  presencePage,
}: {
  locale: Locale;
  conversation: InboxConversation;
  presencePage: string | null;
}) {
  const t = liveChatCopy[locale].inbox;
  const ctx = t.context;
  const crm = crmCopy[locale];
  const form = leadFormCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [lead, setLead] = useState<LeadCard | null>(null);
  const [journey, setJourney] = useState<Pick<PageView, "id" | "path" | "created_at">[] | null>(null);
  const [previous, setPrevious] = useState<Previous[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    problem_category: "other",
    budget: "unknown",
    decision: "self",
    timeline: "month",
    email: c.email ?? "",
    phone: c.phone ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (c.lead_id) {
      void supabase
        .from("leads")
        .select("id, name, tier, score, status")
        .eq("id", c.lead_id)
        .maybeSingle()
        .then(({ data }) => alive && setLead(data as LeadCard | null));
    }
    if (c.visitor_id) {
      void supabase
        .from("page_views")
        .select("id, path, created_at")
        .eq("visitor_id", c.visitor_id)
        .order("created_at", { ascending: false })
        .limit(15)
        .then(({ data }) => alive && setJourney(data ?? []));
    }
    const filters = [c.email && `email.eq.${c.email}`, c.phone && `phone.eq.${c.phone}`].filter(Boolean).join(",");
    if (filters) {
      void supabase
        .from("chat_conversations")
        .select("id, created_at, last_message, status, rating")
        .or(filters)
        .neq("id", c.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data }) => alive && setPrevious((data ?? []) as Previous[]));
    }
    return () => {
      alive = false;
    };
  }, [supabase, c.id, c.lead_id, c.visitor_id, c.email, c.phone]);

  const create = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim()) || draft.phone.replace(/\D/g, "").length < 7) {
      return setError(ctx.contactRequired);
    }
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("chat_create_lead", { p_conversation: c.id, p: draft });
    setBusy(false);
    if (rpcError) return setError(rpcError.message);
    setCreating(false);
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const duration = (from: string, to: string) => {
    const s = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000));
    if (s < 60) return t.duration.s.replace("{n}", String(s));
    if (s < 3600) return t.duration.m.replace("{n}", String(Math.round(s / 60)));
    return t.duration.h.replace("{n}", (s / 3600).toFixed(1));
  };
  const block = "border-b border-line px-5 py-4";
  const label = "text-xs font-semibold text-muted";

  return (
    <aside aria-label={ctx.title} className="hidden min-h-0 flex-col overflow-y-auto xl:flex">
      <h2 className="border-b border-line px-5 py-4 text-sm text-heading">{ctx.title}</h2>

      {c.channel === "web" && (
        <div className={block}>
          <p className={label}>{ctx.viewingNow}</p>
          {presencePage ? (
            <p className="mt-1 flex items-center gap-1.5 break-all font-mono text-xs text-heading">
              <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              {presencePage}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">{ctx.notOnSite}</p>
          )}
        </div>
      )}

      {/* Lead */}
      <div className={block}>
        <p className={label}>{ctx.lead}</p>
        {lead ? (
          <Link href={`/${locale}/portal/crm/${lead.id}`} className="mt-2 flex items-center gap-2 rounded-2xl bg-surface-soft p-3 hover:bg-card-soft dark:bg-white/[0.05]">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-heading">{lead.name}</span>
              <span className="block text-xs text-muted">
                {crm.tier[lead.tier]} · {lead.score}/100 · {crm.status[lead.status]}
              </span>
            </span>
          </Link>
        ) : c.lead_id ? (
          <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted" aria-hidden />
        ) : creating ? (
          <div className="mt-3 grid gap-3">
            <p className="text-xs text-muted">{ctx.createLeadHint}</p>
            <Select
              size="sm"
              label={form.steps.problem.title}
              value={draft.problem_category}
              onChange={(v) => setDraft((d) => ({ ...d, problem_category: v }))}
              options={problemKeys.map((k) => ({ value: k, label: form.steps.problem.options[k] }))}
            />
            <Select
              size="sm"
              label={form.steps.budget.title}
              value={draft.budget}
              onChange={(v) => setDraft((d) => ({ ...d, budget: v }))}
              options={budgetKeys.map((k) => ({ value: k, label: form.steps.budget.options[k] }))}
            />
            <Select
              size="sm"
              label={form.steps.decision.title}
              value={draft.decision}
              onChange={(v) => setDraft((d) => ({ ...d, decision: v }))}
              options={decisionKeys.map((k) => ({ value: k, label: form.steps.decision.options[k] }))}
            />
            <Select
              size="sm"
              label={form.steps.timeline.title}
              value={draft.timeline}
              onChange={(v) => setDraft((d) => ({ ...d, timeline: v }))}
              options={timelineKeys.map((k) => ({ value: k, label: form.steps.timeline.options[k] }))}
            />
            <input
              value={draft.email}
              onChange={(event) => setDraft((d) => ({ ...d, email: event.target.value }))}
              placeholder={form.steps.contact.email}
              aria-label={form.steps.contact.email}
              className={cn(inputClass, "h-10 text-sm")}
            />
            <input
              value={draft.phone}
              onChange={(event) => setDraft((d) => ({ ...d, phone: event.target.value }))}
              placeholder={form.steps.contact.phone}
              aria-label={form.steps.contact.phone}
              className={cn(inputClass, "h-10 text-sm")}
            />
            {error && (
              <p role="alert" className="text-xs font-semibold text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={create} disabled={busy} className={buttonClasses("primary", "md", "h-10 flex-1 px-4 disabled:opacity-60")}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {ctx.create}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="h-10 rounded-full px-3 text-sm font-semibold text-muted hover:text-heading">
                ×
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)} className={buttonClasses("outline", "md", "mt-2 h-10 w-full")}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {ctx.createLead}
          </button>
        )}
      </div>

      {/* Calidad */}
      <div className={cn(block, "grid grid-cols-2 gap-3")}>
        <div>
          <p className={label}>{ctx.firstResponse}</p>
          <p className="mt-1 text-sm font-bold text-heading">{c.first_response_at ? duration(c.created_at, c.first_response_at) : ctx.notAnswered}</p>
        </div>
        <div>
          <p className={label}>{ctx.rating}</p>
          {c.rating ? (
            <p className="mt-1 flex items-center gap-0.5" aria-label={`${c.rating}/5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn("h-4 w-4", n <= c.rating! ? "fill-amber-400 text-amber-400" : "text-line-strong")} aria-hidden />
              ))}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">{ctx.notRated}</p>
          )}
        </div>
        {c.rating_comment && <p className="col-span-2 rounded-xl bg-surface-soft px-3 py-2 text-xs italic text-body dark:bg-white/[0.05]">“{c.rating_comment}”</p>}
      </div>

      {/* Recorrido */}
      {c.channel === "web" && (
        <div className={block}>
          <p className={label}>{ctx.journey}</p>
          {!c.visitor_id || (journey && journey.length === 0) ? (
            <p className="mt-1 text-xs text-muted">{ctx.noJourney}</p>
          ) : (
            <ol className="mt-2 grid gap-1.5">
              {(journey ?? []).map((v) => (
                <li key={v.id} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-mono text-heading">{v.path}</span>
                  <span className="shrink-0 text-muted">{fmt(v.created_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Anteriores */}
      <div className="px-5 py-4">
        <p className={label}>{ctx.previous}</p>
        {!previous || previous.length === 0 ? (
          <p className="mt-1 text-xs text-muted">{ctx.noPrevious}</p>
        ) : (
          <ul className="mt-2 grid gap-1">
            {previous.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent(SELECT_CHAT_EVENT, { detail: p.id }))}
                  className="w-full rounded-xl px-2 py-2 text-left hover:bg-surface-soft dark:hover:bg-white/[0.05]"
                >
                  <span className="block text-xs font-semibold text-heading">{fmt(p.created_at)}</span>
                  <span className="block truncate text-xs text-muted">{p.last_message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
