"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Gift, Loader2, MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { card, fmtDay } from "@/components/clientPortal/shared";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { clientPortalCopy } from "@/content/clientPortal";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Referral = { id: string; name: string; company: string | null; email: string; created_at: string; lead_status: string; reward_status: string };

const STATUS_TONE: Record<string, string> = {
  new: "bg-surface-soft text-heading dark:bg-white/[0.06]",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  meeting: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  proposal: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  won: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  lost: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};
const REWARD_TONE: Record<string, string> = {
  eligible: "text-emerald-700 ring-emerald-300 dark:text-emerald-300 dark:ring-emerald-500/40",
  paid: "text-emerald-700 ring-emerald-300 dark:text-emerald-300 dark:ring-emerald-500/40",
};

/** Recomendar empresas y seguir el estado de cada recomendación. */
export function ReferralsView({ locale, referrals }: { locale: Locale; referrals: Referral[] }) {
  const t = clientPortalCopy[locale].referrals;
  const router = useRouter();
  const id = useId();
  const empty = { name: "", company: "", email: "", phone: "", note: "" };
  const [values, setValues] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const message = t.share.message.replace("{url}", `${siteConfig.url}/${locale}`);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.name.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      setStatus("error");
      return setMsg(t.form.invalid);
    }
    setStatus("sending");
    setMsg(null);
    const { error } = await createClient().rpc("client_refer", { p: values });
    if (error) {
      setStatus("error");
      return setMsg(error.message.includes("rate_limited") ? t.form.limited : error.message.includes("invalid") ? t.form.invalid : t.form.error);
    }
    setStatus("sent");
    setMsg(t.form.sent);
    setValues(empty);
    setConsent(false);
    router.refresh();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(message).catch(() => null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const field = (k: keyof typeof empty, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label htmlFor={`${id}-${k}`} className="block text-sm font-medium text-heading">
      {label}
      <input
        id={`${id}-${k}`}
        value={values[k]}
        onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
        className={cn(inputClass, "mt-1.5 h-11")}
        {...props}
      />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="grid min-w-0 content-start gap-5 lg:col-span-3">
        <section className={cn(card, "flex gap-4")}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-green text-deep-700">
            <Gift className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-heading">{t.benefitTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.benefit}</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3">
              {t.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-2 text-sm text-heading">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--meta-active)] text-xs font-semibold tabular-nums">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-base font-semibold text-heading">{t.form.title}</h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {field("name", t.form.name, { required: true, maxLength: 120, autoComplete: "off" })}
            {field("company", t.form.company, { maxLength: 160, autoComplete: "off" })}
            {field("email", t.form.email, { type: "email", required: true, maxLength: 160, autoComplete: "off" })}
            {field("phone", t.form.phone, { type: "tel", maxLength: 30, autoComplete: "off" })}
            <label htmlFor={`${id}-note`} className="block text-sm font-medium text-heading sm:col-span-2">
              {t.form.note}
              <textarea
                id={`${id}-note`}
                value={values.note}
                onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
                rows={3}
                maxLength={1000}
                className={cn(inputClass, "mt-1.5 h-auto py-2.5")}
              />
            </label>
            <label className="flex items-start gap-2.5 text-sm text-heading sm:col-span-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green-dark" />
              {t.form.consent}
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={!consent || status === "sending"} className={buttonClasses("primary", "md")}>
                {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {t.form.submit}
              </button>
              {msg && (
                <span role={status === "error" ? "alert" : "status"} className={cn("text-sm", status === "error" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                  {msg}
                </span>
              )}
            </div>
          </form>
        </section>
      </div>

      <div className="grid min-w-0 content-start gap-5 lg:col-span-2">
        <section className={card}>
          <h2 className="mb-3 text-base font-semibold text-heading">
            {t.list.title} <span className="font-normal tabular-nums text-muted">{referrals.length}</span>
          </h2>
          {referrals.length === 0 ? (
            <p className="py-3 text-sm text-muted">{t.list.empty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {referrals.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">{r.name}</p>
                      <p className="truncate text-xs text-muted">
                        {[r.company, fmtDay(locale, r.created_at)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", STATUS_TONE[r.lead_status] ?? STATUS_TONE.contacted)}>
                      {t.status[r.lead_status] ?? t.status.contacted}
                    </span>
                  </div>
                  {r.lead_status === "won" || r.reward_status !== "pending" ? (
                    <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1", REWARD_TONE[r.reward_status] ?? "text-muted ring-line")}>
                      <Gift className="h-3 w-3" aria-hidden />
                      {t.reward[r.reward_status] ?? r.reward_status}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="text-base font-semibold text-heading">{t.share.title}</h2>
          <p className="mt-1 text-sm text-muted">{t.share.body}</p>
          <p className="mt-3 rounded-lg bg-[var(--meta-hover)] p-3 text-sm text-heading">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? t.share.copied : t.share.copy}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-green px-3 text-sm font-semibold text-deep-700 hover:brightness-95"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.share.whatsapp}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
