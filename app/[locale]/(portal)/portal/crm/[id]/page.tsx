import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { LeadControls, LeadTasks, LeadTimeline } from "@/components/crm/LeadDetail";
import { crmCopy } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import { isLocale, type Locale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { tierStyles } from "@/lib/tiers";
import type { Appointment, Lead, LeadActivity, PageView, Task } from "@/lib/supabase/types";
import { Journey } from "@/components/analytics/Journey";
import { analyticsCopy } from "@/content/analytics";
import { campaignsCopy } from "@/content/campaigns";
import { LeadAiCard } from "@/components/crm/LeadAiCard";
import type { LeadInsights } from "@/lib/aiTypes";
import { integrationStatus } from "@/lib/integrations";
import { cn } from "@/lib/utils";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();

  const [{ data: activities }, { data: tasks }, { data: meetings }, employees, { data: journey }] = await Promise.all([
    supabase.from("lead_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("lead_id", id).order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("appointments").select("*").eq("lead_id", id).order("starts_at", { ascending: false }),
    listEmployees(supabase),
    lead.visitor_id
      ? supabase
          .from("page_views")
          .select("id, path, title, created_at, duration_ms, max_scroll, session_id")
          .eq("visitor_id", lead.visitor_id)
          .lte("created_at", lead.created_at)
          .order("created_at")
          .limit(200)
      : Promise.resolve({ data: [] as PageView[] }),
  ]);

  const status = await integrationStatus(supabase);
  const t = crmCopy[locale];
  const f = leadFormCopy[locale as Locale];
  const l = lead as Lead;
  const canEdit = ["admin", "sales"].includes(profile.role);
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const breakdown = (l.score_breakdown ?? {}) as Record<string, number | string | null>;
  const utm = (l.utm ?? {}) as Record<string, string>;
  const digits = l.phone.replace(/\D/g, "");
  const waNumber = digits.length === 10 ? `57${digits}` : digits;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }).format(new Date(iso));

  const answers: [string, string][] = [
    [t.lead.problem, f.steps.problem.options[l.problem_category as keyof typeof f.steps.problem.options] ?? l.problem_category],
    ...(l.problem_text ? ([[t.lead.detail, l.problem_text]] as [string, string][]) : []),
    [t.lead.budget, f.steps.budget.options[l.budget as keyof typeof f.steps.budget.options] ?? l.budget],
    [t.lead.decision, f.steps.decision.options[l.decision as keyof typeof f.steps.decision.options] ?? l.decision],
    [t.lead.timeline, f.steps.timeline.options[l.timeline as keyof typeof f.steps.timeline.options] ?? l.timeline],
  ];

  const card = "rounded-lg bg-surface p-6 shadow-meta dark:bg-card";

  return (
    <>
      <Link
        href={`/${locale}/portal/crm`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.lead.back}
      </Link>

      {/* Cabecera */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", tierStyles[l.tier].pill)}>
              <span className={cn("h-2 w-2 rounded-full", tierStyles[l.tier].dot)} aria-hidden />
              {t.tier[l.tier]} · {t.tierHint[l.tier]}
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold tabular-nums text-heading shadow-meta dark:bg-card">
              {t.lead.score} {l.score}/100
            </span>
          </div>
          <h1 className="mt-3 text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight text-heading">{l.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {[l.company, l.email, l.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-card-soft dark:bg-card">
            <Phone className="h-4 w-4" aria-hidden />
            {t.lead.callAction}
          </a>
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-deep-950 hover:bg-[#1fbe5b]">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t.lead.whatsappAction}
          </a>
          <a href={`mailto:${l.email}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-card-soft dark:bg-card">
            <Mail className="h-4 w-4" aria-hidden />
            {t.lead.emailAction}
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Columna principal */}
        <div className="grid content-start gap-6">
          <section className={card}>
            <h2 className="text-lg text-heading">{t.lead.answers}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {answers.map(([label, value]) => (
                <div key={label} className={cn(label === t.lead.detail && "sm:col-span-2")}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm font-semibold text-heading">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-sm text-heading">{t.lead.breakdown}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["problem", "budget", "decision", "timeline"] as const).map((k) => (
                  <li key={k} className="rounded-lg bg-surface-soft p-3 dark:bg-white/[0.05]">
                    <p className="text-xs text-muted">{t.lead[k]}</p>
                    <p className="text-lg font-bold tabular-nums text-heading">+{breakdown[k] ?? 0}</p>
                  </li>
                ))}
              </ul>
              {typeof breakdown.rule === "string" && (
                <p className="mt-3 text-xs font-semibold text-muted">{t.lead.rules[breakdown.rule] ?? breakdown.rule}</p>
              )}
            </div>
          </section>

          <LeadAiCard
            locale={locale}
            leadId={l.id}
            insights={(l.ai_insights ?? null) as LeadInsights | null}
            analyzedAt={l.ai_analyzed_at}
            error={l.ai_error}
            hasText={!!l.problem_text?.trim()}
            configured={!!status.anthropic_api_key}
            canRun={["admin", "sales", "marketing"].includes(profile.role)}
          />

          <section className={card}>
            <h2 className="text-lg text-heading">{analyticsCopy[locale].journeyTitle}</h2>
            <div className="mt-4">
              <Journey locale={locale} views={(journey ?? []) as PageView[]} />
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg text-heading">{t.lead.timelineTitle}</h2>
            <div className="mt-4">
              <LeadTimeline
                locale={locale}
                leadId={l.id}
                initial={(activities ?? []) as LeadActivity[]}
                names={names}
                currentUserId={profile.id}
                canWrite={["admin", "sales", "support"].includes(profile.role)}
                isAdmin={profile.role === "admin"}
              />
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <div className="grid content-start gap-6">
          <section className={card}>
            <LeadControls locale={locale} lead={l} employees={employees} canEdit={canEdit} />
          </section>

          <section className={card}>
            <h2 className="text-lg text-heading">{t.lead.tasks}</h2>
            <div className="mt-4">
              <LeadTasks
                locale={locale}
                leadId={l.id}
                initial={(tasks ?? []) as Task[]}
                canWrite={["admin", "sales", "support"].includes(profile.role)}
                defaultAssignee={l.assigned_to ?? profile.id}
              />
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg text-heading">{t.lead.meetings}</h2>
            {!meetings || meetings.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t.lead.noMeetings}</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {(meetings as Appointment[]).map((m) => (
                  <li key={m.id} className="rounded-lg bg-surface-soft p-3 dark:bg-white/[0.05]">
                    <p className="text-sm font-bold text-heading first-letter:uppercase">{fmt(m.starts_at)}</p>
                    <p className="text-xs text-muted">
                      {f.booking.channels[m.channel]} · {t.agenda.statuses[m.status]}
                    </p>
                    {m.notes && <p className="mt-1 text-xs text-body">{m.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="text-lg text-heading">{t.lead.origin}</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">WhatsApp</dt>
                <dd className={cn("font-semibold", l.whatsapp_opt_out_at ? "text-red-600 dark:text-red-400" : l.whatsapp_opt_in_at ? "text-emerald-700 dark:text-emerald-400" : "text-muted")}>
                  {l.whatsapp_opt_out_at
                    ? campaignsCopy[locale].lead.optOut
                    : l.whatsapp_opt_in_at
                      ? campaignsCopy[locale].lead.optIn
                      : campaignsCopy[locale].lead.noOptIn}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t.lead.page}</dt>
                <dd className="break-all text-heading">{l.source_page ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t.lead.referrer}</dt>
                <dd className="break-all text-heading">{l.referrer ?? t.lead.direct}</dd>
              </div>
              {Object.keys(utm).length > 0 && (
                <div>
                  <dt className="text-xs text-muted">{t.lead.campaign}</dt>
                  <dd className="text-heading">
                    {Object.entries(utm).map(([k, v]) => (
                      <span key={k} className="mr-1.5 mt-1 inline-block rounded-full bg-surface-soft px-2 py-0.5 text-xs dark:bg-white/[0.06]">
                        {k.replace("utm_", "")}: {v}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {l.gclid && (
                <div>
                  <dt className="text-xs text-muted">{t.lead.gclid}</dt>
                  <dd className="break-all font-mono text-xs text-heading">{l.gclid}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
