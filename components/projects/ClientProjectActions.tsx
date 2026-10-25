"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, PencilLine, Send } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { projectsCopy } from "@/content/projects";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { ProjectMilestone } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const textarea =
  "w-full rounded-[var(--field-radius,0.75rem)] border border-line-strong bg-surface px-4 py-3 text-sm text-heading outline-none transition-colors hover:border-muted focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20";

/** Entregable que el cliente aprueba o para el que pide cambios. */
export function ApprovalCard({ locale, milestone }: { locale: Locale; milestone: ProjectMilestone }) {
  const t = projectsCopy[locale].approval;
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"approved" | "changes_requested" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = milestone.approval_status === "pending" || milestone.approval_status === null;

  const send = async (decision: "approved" | "changes_requested") => {
    if (decision === "changes_requested" && !comment.trim()) return setError(t.commentRequired);
    setBusy(decision);
    setError(null);
    const { error } = await createClient().rpc("project_milestone_review", { p_milestone: milestone.id, p_decision: decision, p_comment: comment.trim() || null });
    setBusy(null);
    if (error) return setError(t.error);
    setComment("");
    router.refresh();
  };

  return (
    <article className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">{t.title}</p>
          <h3 className="mt-1 font-semibold text-heading">{milestone.title}</h3>
        </div>
        {!pending && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              milestone.approval_status === "approved"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {milestone.approval_status === "approved" ? t.approved : t.changes_requested}
          </span>
        )}
      </div>
      {milestone.description && <p className="mt-2 whitespace-pre-line text-sm text-body">{milestone.description}</p>}
      {pending ? (
        <div className="mt-4">
          <p className="text-sm text-muted">{t.pending}</p>
          <label className="mt-3 block text-sm font-medium text-heading">
            {t.commentLabel}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} className={cn(textarea, "mt-1.5")} />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => send("approved")} disabled={!!busy} className={cn(buttonClasses("primary", "md"), "h-10 px-4")}>
              {busy === "approved" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
              {busy === "approved" ? t.sending : t.approve}
            </button>
            <button type="button" onClick={() => send("changes_requested")} disabled={!!busy} className={cn(buttonClasses("outline", "md"), "h-10 px-4")}>
              {busy === "changes_requested" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PencilLine className="h-4 w-4" aria-hidden />}
              {busy === "changes_requested" ? t.sending : t.requestChanges}
            </button>
          </div>
        </div>
      ) : (
        milestone.client_comment && (
          <p className="mt-3 rounded-lg bg-[var(--meta-hover)] px-3 py-2 text-sm text-body">
            <span className="font-medium text-heading">{t.yourComment}: </span>
            {milestone.client_comment}
          </p>
        )
      )}
    </article>
  );
}

/** Mensaje del cliente al equipo dentro del proyecto. */
export function CommentComposer({ locale, projectId }: { locale: Locale; projectId: string }) {
  const t = projectsCopy[locale].composer;
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(false);
    const { error } = await createClient().rpc("project_client_comment", { p_project: projectId, p_body: body.trim() });
    setBusy(false);
    if (error) return setError(true);
    setBody("");
    router.refresh();
  };

  return (
    <form onSubmit={submit}>
      <label className="block text-sm font-medium text-heading">
        {t.label}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} placeholder={t.placeholder} className={cn(textarea, "mt-1.5")} />
      </label>
      <div className="mt-2 flex items-center justify-end gap-3">
        {error && (
          <span role="alert" className="text-sm text-red-700 dark:text-red-400">
            {t.error}
          </span>
        )}
        <button type="submit" disabled={busy || !body.trim()} className={cn(buttonClasses("dark", "md"), "h-10 px-4")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {busy ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
