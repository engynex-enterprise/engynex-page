"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import type { LeadInsights } from "@/lib/aiTypes";
import { automationCopy } from "@/content/automation";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const urgencyTone: Record<string, string> = {
  alta: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  media: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  baja: "bg-surface-soft text-heading dark:bg-white/[0.08]",
};

/** Lectura con IA del problema del lead (no cambia el puntaje). */
export function LeadAiCard({
  locale,
  leadId,
  insights,
  analyzedAt,
  error,
  hasText,
  configured,
  canRun,
  bare = false,
  onAnalyzed,
}: {
  locale: Locale;
  leadId: string;
  insights: LeadInsights | null;
  analyzedAt: string | null;
  error: string | null;
  hasText: boolean;
  configured: boolean;
  canRun: boolean;
  /** Sin tarjeta propia (dentro del drawer del CRM). */
  bare?: boolean;
  /** Tras analizar; si no se pasa, se refresca la página. */
  onAnalyzed?: () => void;
}) {
  const t = automationCopy[locale].ai;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/ai/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(
        data.error === "not_configured"
          ? t.notConfigured
          : data.error === "refusal"
            ? t.refused
            : data.error === "no_text"
              ? t.noText
              : t.error.replace("{error}", data.error ?? String(res.status)),
      );
      return;
    }
    if (onAnalyzed) onAnalyzed();
    else router.refresh();
  };

  const serviceTitle = (slug: string) => services.find((s) => s.slug === slug)?.[locale].title ?? slug;
  const label = "text-xs font-semibold text-muted";

  return (
    <section className={bare ? undefined : "rounded-lg bg-surface p-6 shadow-meta dark:bg-card"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg text-heading">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            {t.title}
          </h2>
          <p className="mt-1 text-xs text-muted">{t.hint}</p>
        </div>
        {canRun && configured && hasText && (
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft disabled:opacity-60 dark:hover:bg-white/[0.06]"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            {busy ? t.analyzing : insights ? t.reanalyze : t.analyze}
          </button>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
          {message}
        </p>
      )}

      {!insights ? (
        <p className="mt-4 text-sm text-muted">
          {!hasText ? t.noText : !configured ? t.notConfigured : error === "refusal" ? t.refused : error ? t.error.replace("{error}", error) : t.pending}
        </p>
      ) : (
        <div className="mt-5 grid gap-5">
          <div>
            <p className={label}>{t.summary}</p>
            <p className="mt-1 text-sm leading-relaxed text-heading">{insights.summary}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className={label}>{t.urgency}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-body">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", urgencyTone[insights.urgency])}>
                  {t.urgencyLevels[insights.urgency]}
                </span>
                {insights.urgency_reason}
              </p>
            </div>
            <div>
              <p className={label}>{t.services}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {insights.suggested_services.map((slug) => (
                  <li key={slug} className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-heading dark:bg-white/[0.08]">
                    {serviceTitle(slug)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {insights.needs.length > 0 && (
            <div>
              <p className={label}>{t.needs}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-body">
                {insights.needs.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {insights.questions.length > 0 && (
            <div>
              <p className={label}>{t.questions}</p>
              <ol className="mt-1 list-decimal pl-5 text-sm text-body">
                {insights.questions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          )}
          {insights.red_flags.length > 0 && (
            <div>
              <p className={label}>{t.redFlags}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-body">
                {insights.red_flags.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className={label}>{t.nextStep}</p>
            <p className="mt-1 text-sm font-semibold text-heading">{insights.next_step}</p>
          </div>
          <div className="rounded-lg bg-surface-soft p-4 dark:bg-white/[0.05]">
            <div className="flex items-center justify-between gap-2">
              <p className={label}>{t.opening}</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(insights.opening_message);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-heading hover:bg-surface dark:hover:bg-white/[0.08]"
              >
                {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-heading">{insights.opening_message}</p>
          </div>
          {analyzedAt && (
            <p className="text-[0.7rem] text-muted">
              {t.analyzedAt.replace(
                "{date}",
                new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(analyzedAt)),
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
