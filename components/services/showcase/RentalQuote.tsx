"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCopy, Loader2, MessageCircle, Minus, Plus } from "lucide-react";
import type { ShowcaseCopy } from "@/content/servicePages/types";
import type { SubmitLeadResult } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { readAttribution } from "@/lib/attribution";
import { getVisitorId } from "@/lib/visitor";
import { trackLead } from "@/lib/tracking";
import { localizedHref, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const MAX_DEVICES = 500;
const MAX_DAYS = 365;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Timeline = "week" | "month" | "browsing";

/** Botones − / número / + para una cantidad. */
function Stepper({ value, onChange, max, label, decrease, increase }: { value: number; onChange: (n: number) => void; max: number; label: string; decrease: string; increase: string }) {
  const set = (n: number) => onChange(Math.max(0, Math.min(max, Number.isFinite(n) ? Math.round(n) : 0)));
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => set(value - 1)} disabled={value === 0} aria-label={`${decrease}: ${label}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-40">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label={label}
        className="h-10 w-16 rounded-xl bg-white/10 text-center text-lg font-bold tabular-nums text-white [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-brand-green [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`${increase}: ${label}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-40">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Calculadora de renting en dos pasos: (1) equipos, modalidad (días o meses)
 * y plazo, con la fórmula desglosada en vivo; (2) datos de contacto, que se
 * registran como lead en el CRM con el resumen, o se envían por WhatsApp.
 */
export function RentalQuote({ copy: t, locale }: { copy: NonNullable<ShowcaseCopy["quote"]>; locale: Locale }) {
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(t.items.map((it, i) => [it.key, i === 0 ? 10 : 0])));
  const [extras, setExtras] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"days" | "months">("months");
  const [term, setTerm] = useState(t.terms[0]);
  const [days, setDays] = useState(7);
  const [step, setStep] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", city: "", start: "", notes: "", timeline: "month" as Timeline, consent: false });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const fmt = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const [daysPerMonth, setDaysPerMonth] = useState(t.defaultDaysPerMonth);
  const devices = t.items.reduce((sum, it) => sum + (qty[it.key] ?? 0), 0);
  const chosenExtras = t.extras.filter((x) => extras[x.key]);
  // Por meses: cuota = equipos × precio día × días de uso al mes; total = cuota × meses.
  // Por días: total = equipos × precio día × días.
  const usedDays = mode === "months" ? daysPerMonth : days;
  const period = t.items.reduce((sum, it) => sum + (qty[it.key] ?? 0) * it.dayPrice * usedDays, 0);
  const units = mode === "months" ? term : 1;
  const total = period * units;
  const formula = (n: number, price: number) =>
    [`${n} × ${fmt.format(price)}`, `${usedDays} ${t.daysUnit}`, ...(mode === "months" ? [`${term} ${t.monthsUnit}`] : [])].join(" × ");

  const lines = t.items.filter((it) => (qty[it.key] ?? 0) > 0);
  const summary = [
    ...lines.map((it) => `${qty[it.key]} × ${it.name}`),
    mode === "months" ? `${t.modes.months}: ${daysPerMonth} ${t.daysUnit} × ${term} ${t.monthsUnit}` : `${t.modes.days}: ${days} ${t.daysUnit}`,
    `${t.totalLabel}: ${fmt.format(total)}${mode === "months" ? ` (${fmt.format(period)} ${t.perMonth})` : ""}`,
    ...chosenExtras.map((x) => `+ ${x.name} (${t.quoteLater})`),
  ].join("\n");
  const wa = (extra = "") => `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(t.message.replace("{summary}", summary) + extra)}`;
  const empty = devices === 0 && chosenExtras.length === 0;

  const copySummary = async () => {
    await navigator.clipboard.writeText(summary).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = t.form;
    if (empty) return setError(f.errors.empty);
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return setError(f.errors.required);
    if (!EMAIL_RE.test(form.email.trim())) return setError(f.errors.email);
    if (!form.consent) return setError(f.errors.required);
    setError(null);
    setStatus("sending");
    const origin = readAttribution();
    const details = [summary, form.city && `${f.city}: ${form.city}`, form.start && `${f.start}: ${form.start}`, form.notes.trim() && `${f.notes}: ${form.notes.trim()}`].filter(Boolean).join("\n");
    const { data, error: rpcError } = await createClient().rpc("submit_lead", {
      p: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        problem_category: "other",
        problem_text: `[Renting] ${details}`,
        budget: mode === "months" ? "monthly" : total < 2_000_000 ? "lt2" : total < 5_000_000 ? "2to5" : total < 15_000_000 ? "5to15" : total < 40_000_000 ? "15to40" : "gt40",
        decision: "shared",
        timeline: form.timeline,
        consent: true,
        locale,
        source_page: window.location.pathname,
        referrer: origin?.referrer ?? null,
        utm: origin?.utm ?? null,
        gclid: origin?.gclid ?? null,
        landing: origin?.landing ?? null,
        visitor_id: getVisitorId(),
      },
    });
    if (rpcError) {
      setStatus("idle");
      return setError(rpcError.message.includes("rate_limited") ? f.errors.rateLimited : f.errors.generic);
    }
    const lead = data as unknown as SubmitLeadResult;
    trackLead({ tier: lead.tier, category: lead.category, email: form.email.trim(), phone: form.phone.trim() });
    setStatus("done");
  };

  const field = "h-11 w-full rounded-xl bg-surface px-3.5 text-[0.95rem] text-heading ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-green dark:bg-card";
  const labelCls = "mb-1.5 block text-sm font-medium text-heading";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
      {/* Texto y fórmula desglosada */}
      <div className="lg:sticky lg:top-40">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green-dark dark:text-brand-green">{t.eyebrow}</p>
        <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.08] text-heading">{t.title}</h2>
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t.subtitle}</p>

        <div className="mt-8 rounded-[1.75rem] bg-surface-soft p-5 sm:p-6 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t.breakdownTitle}</p>
            <button type="button" onClick={copySummary} disabled={empty} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line hover:bg-surface disabled:opacity-40 dark:hover:bg-white/[0.06]">
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <dl className="mt-4 grid gap-2 font-mono text-[0.85rem]">
            {lines.length === 0 && <p className="rounded-xl bg-surface px-3.5 py-2.5 text-muted dark:bg-card">{t.form.errors.empty}</p>}
            {lines.map((it) => (
              <div key={it.key} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 rounded-xl bg-surface px-3.5 py-2.5 dark:bg-card">
                <dt className="min-w-0 text-body">
                  <span className="font-sans font-semibold text-heading">{it.name}</span>
                  <span className="block text-muted">{formula(qty[it.key], it.dayPrice)}</span>
                </dt>
                <dd className="self-end font-semibold tabular-nums text-heading">{fmt.format(qty[it.key] * it.dayPrice * usedDays * units)}</dd>
              </div>
            ))}
            {devices > 0 && (
              <>
                {mode === "months" && (
                  <>
                    <div className="flex justify-between gap-3 px-3.5 pt-1 text-muted">
                      <dt>{t.subtotalMonth.replace("{n}", String(devices)).replace("{d}", String(daysPerMonth))}</dt>
                      <dd className="tabular-nums">{fmt.format(period)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 px-3.5 text-muted">
                      <dt>{t.termRow}</dt>
                      <dd className="tabular-nums">× {term} {t.monthsUnit}</dd>
                    </div>
                  </>
                )}
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line px-3.5 pt-3">
                  <dt className="font-sans font-semibold text-heading">{t.totalLabel}</dt>
                  <dd className="text-xl font-bold tabular-nums text-brand-green-dark dark:text-brand-green">{fmt.format(total)}</dd>
                </div>
              </>
            )}
            {chosenExtras.map((x) => (
              <div key={x.key} className="flex justify-between gap-3 px-3.5 text-muted">
                <dt>+ {x.name}</dt>
                <dd className="shrink-0 font-sans text-xs">{t.quoteLater}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-heading">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-dark dark:text-brand-green" strokeWidth={3} aria-hidden />
          {t.volumeNote}
        </p>
      </div>

      {/* Configurador y formulario */}
      <div className="overflow-hidden rounded-[2rem] bg-deep-700 text-white shadow-[0_30px_80px_-30px_rgba(20,28,49,0.6)] dark:bg-white/[0.06]">
        <ol className="grid grid-cols-2 border-b border-white/10 text-sm">
          {t.steps.map((label, i) => (
            <li key={label} className={cn("flex items-center gap-2.5 px-5 py-4 sm:px-7", step === i + 1 ? "text-white" : "text-white/50")}>
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold", step > i + 1 || status === "done" ? "bg-brand-green text-deep-700" : step === i + 1 ? "bg-white text-deep-700" : "bg-white/15")}>
                {step > i + 1 || status === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className="font-semibold">{label}</span>
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <div className="grid gap-4 p-5 sm:p-7">
            <div>
              <p className="mb-2 text-sm font-semibold text-white/80">{t.modeLabel}</p>
              <div role="radiogroup" aria-label={t.modeLabel} className="grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.07] p-1">
                {(["months", "days"] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("h-10 rounded-xl text-sm font-semibold transition-colors", mode === m ? "bg-white text-deep-700" : "text-white/80 hover:bg-white/10")}>
                    {t.modes[m]}
                  </button>
                ))}
              </div>
            </div>

            {t.items.map((it) => (
              <div key={it.key} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-white/[0.07] p-4">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-semibold">{it.name}</p>
                  <p className="mt-0.5 text-sm text-white/70">{it.desc}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-green">
                    {fmt.format(it.dayPrice)} <span className="font-normal text-white/60">{t.perDay}</span>
                  </p>
                </div>
                <Stepper value={qty[it.key] ?? 0} onChange={(n) => setQty((q) => ({ ...q, [it.key]: n }))} max={MAX_DEVICES} label={it.name} decrease={t.decrease} increase={t.increase} />
              </div>
            ))}

            {mode === "months" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.07] p-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="font-semibold">{t.daysPerMonthLabel}</p>
                    <p className="mt-0.5 text-sm text-white/70">{t.daysPerMonthHint}</p>
                  </div>
                  <Stepper value={daysPerMonth} onChange={(n) => setDaysPerMonth(Math.max(1, n))} max={31} label={t.daysPerMonthLabel} decrease={t.decrease} increase={t.increase} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-white/80">{t.termLabel}</p>
                  <div role="radiogroup" aria-label={t.termLabel} className="grid grid-cols-3 gap-2">
                    {t.terms.map((m) => (
                      <button key={m} type="button" role="radio" aria-checked={term === m} onClick={() => setTerm(m)} className={cn("h-11 rounded-xl text-sm font-semibold transition-colors", term === m ? "bg-brand-green text-deep-700" : "bg-white/10 text-white hover:bg-white/20")}>
                        {m} {t.monthsUnit}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.07] p-4">
                <p className="font-semibold">{t.daysLabel}</p>
                <Stepper value={days} onChange={(n) => setDays(Math.max(1, n))} max={MAX_DAYS} label={t.daysLabel} decrease={t.decrease} increase={t.increase} />
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-white/80">{t.extrasLabel}</p>
              <div className="grid gap-2">
                {t.extras.map((x) => (
                  <label key={x.key} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{x.name}</span>
                      <span className="block text-xs text-white/65">{x.desc}</span>
                    </span>
                    <input type="checkbox" checked={!!extras[x.key]} onChange={(e) => setExtras((s) => ({ ...s, [x.key]: e.target.checked }))} className="peer sr-only" />
                    <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-green peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green" />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-4 rounded-2xl bg-black/20 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">{t.devicesLabel}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{devices}</p>
              </div>
              {mode === "months" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">{t.monthlyLabel}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{fmt.format(period)}</p>
                </div>
              )}
              <div className={cn(mode === "days" && "sm:col-span-2")}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">{t.totalLabel}</p>
                <p aria-live="polite" className="mt-1 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-none tabular-nums text-brand-green">
                  {fmt.format(total)}
                </p>
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)} disabled={empty} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-green px-6 font-semibold text-deep-700 transition hover:brightness-95 disabled:opacity-50">
              {t.next}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-xs leading-relaxed text-white/55">{t.note}</p>
          </div>
        ) : status === "done" ? (
          <div className="p-6 text-center sm:p-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" aria-hidden />
            <p className="mt-4 text-2xl font-bold">{t.form.successTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-white/75">{t.form.successBody}</p>
            <a href={wa()} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/20">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.form.whatsapp}
            </a>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4 bg-surface p-5 text-heading sm:p-7 dark:bg-card">
            <div>
              <p className="text-lg font-bold">{t.form.title}</p>
              <p className="mt-1 text-sm text-muted">{t.form.subtitle}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", t.form.name, "text", "name", true],
                  ["company", t.form.company, "text", "organization", false],
                  ["email", t.form.email, "email", "email", true],
                  ["phone", t.form.phone, "tel", "tel", true],
                  ["city", t.form.city, "text", "address-level2", false],
                  ["start", t.form.start, "date", "off", false],
                ] as const
              ).map(([key, label, type, auto, req]) => (
                <label key={key} className="block">
                  <span className={labelCls}>
                    {label}
                    {req && <span className="text-rose-600"> *</span>}
                  </span>
                  <input type={type} autoComplete={auto} required={req} value={form[key]} onChange={(e) => { setError(null); setForm((f) => ({ ...f, [key]: e.target.value })); }} className={field} />
                </label>
              ))}
            </div>
            <fieldset>
              <legend className={labelCls}>{t.form.timeline}</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["week", "month", "browsing"] as const).map((k) => (
                  <label key={k} className={cn("flex h-11 cursor-pointer items-center justify-center rounded-xl px-2 text-center text-sm font-semibold ring-1 transition-colors", form.timeline === k ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700" : "ring-line hover:bg-surface-soft dark:hover:bg-white/[0.06]")}>
                    <input type="radio" name="timeline" value={k} checked={form.timeline === k} onChange={() => setForm((f) => ({ ...f, timeline: k }))} className="sr-only" />
                    {t.form.timelines[k]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className={labelCls}>{t.form.notes}</span>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={t.form.notesPlaceholder} className={cn(field, "h-auto py-3")} />
            </label>
            <label className="flex items-start gap-3 text-sm text-body">
              <input type="checkbox" checked={form.consent} onChange={(e) => { setError(null); setForm((f) => ({ ...f, consent: e.target.checked })); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[#467316]" />
              <span>
                {t.form.consent}{" "}
                <Link href={localizedHref(locale, "legal/privacidad")} className="font-medium underline underline-offset-2">
                  {t.form.privacy}
                </Link>
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setStep(1)} className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 ring-line hover:bg-surface-soft dark:hover:bg-white/[0.06]">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t.back}
              </button>
              <button type="submit" disabled={status === "sending"} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-green px-6 text-sm font-semibold text-deep-700 hover:brightness-95 disabled:opacity-60">
                {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {status === "sending" ? t.form.sending : t.form.submit}
              </button>
            </div>
            <a href={wa(form.name.trim() ? `\n${form.name.trim()}${form.company.trim() ? ` · ${form.company.trim()}` : ""}` : "")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-heading underline-offset-4 hover:underline">
              <MessageCircle className="h-4 w-4 text-brand-green-dark dark:text-brand-green" aria-hidden />
              {t.form.whatsapp}
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
