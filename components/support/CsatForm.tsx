"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { supportCsatCopy } from "@/content/supportCsat";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const FACES = ["😞", "🙁", "😐", "🙂", "😍"];

/** Calificación de 1 a 5 (grupo de radios accesible) con comentario opcional. */
export function CsatForm({ locale, token, initial }: { locale: Locale; token: string; initial: number | null }) {
  const t = supportCsatCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [rating, setRating] = useState<number | null>(initial);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const name = useId();

  const submit = async () => {
    if (!rating) return setError(t.required);
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("ticket_csat", { p_token: token, p_rating: rating, p_comment: comment.trim() || null });
    setBusy(false);
    if (err || !data) return setError(t.error);
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center dark:bg-card" role="status">
        <CircleCheck className="mx-auto h-12 w-12 text-accent" aria-hidden />
        <h2 className="mt-4 text-2xl text-heading">{t.thanks}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{t.thanksText}</p>
        <Link href={`/${locale}`} className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
          {t.home}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8 dark:bg-card"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-heading">{t.question}</legend>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
          {FACES.map((face, i) => {
            const value = i + 1;
            const checked = rating === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-green-dark",
                  checked ? "bg-[var(--meta-active)] ring-brand-green-dark dark:ring-brand-green" : "ring-line hover:bg-[var(--meta-hover)]",
                )}
              >
                <input type="radio" name={name} value={value} checked={checked} onChange={() => setRating(value)} className="sr-only" />
                <span className={cn("text-3xl transition-transform sm:text-4xl", checked && "scale-110")} aria-hidden>
                  {face}
                </span>
                <span className={cn("text-xs sm:text-sm", checked ? "font-semibold text-heading" : "text-muted")}>{t.options[i]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {rating != null && rating <= 2 && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t.lowHint}</p>}

      <label className="mt-6 grid gap-1.5 text-sm">
        <span className="font-semibold text-heading">{t.comment}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t.commentPlaceholder}
          className="resize-y rounded-xl bg-transparent px-4 py-3 leading-relaxed text-heading outline-none ring-1 ring-line-strong focus-visible:ring-2 focus-visible:ring-brand-green-dark"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-deep-700 px-6 font-semibold text-white hover:bg-deep-600 disabled:opacity-50 sm:w-auto dark:bg-brand-green dark:text-deep-950"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t.submit}
      </button>
    </form>
  );
}
