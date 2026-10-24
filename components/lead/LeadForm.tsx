"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SubmitLeadResult } from "@/lib/supabase/types";
import { readAttribution } from "@/lib/attribution";
import { getVisitorId } from "@/lib/visitor";
import { trackEvent, trackLead } from "@/lib/tracking";
import { buttonClasses } from "@/components/ui/Button";
import { Booking } from "./Booking";
import {
  budgetKeys,
  decisionKeys,
  leadFormCopy,
  problemKeys,
  resourcesByProblem,
  timelineKeys,
  type ProblemKey,
} from "@/content/leadForm";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { cn } from "@/lib/utils";

type Step = "contact" | "problem" | "budget" | "decision" | "timeline";
const STEPS: Step[] = ["contact", "problem", "budget", "decision", "timeline"];

interface Answers {
  name: string;
  email: string;
  phone: string;
  company: string;
  problem_category: string;
  problem_text: string;
  budget: string;
  decision: string;
  timeline: string;
}

/** Avance guardado en este navegador (para no perderlo al recargar). */
const LOCAL_KEY = "engynex-lead-draft";

const EMPTY: Answers = {
  name: "",
  email: "",
  phone: "",
  company: "",
  problem_category: "",
  problem_text: "",
  budget: "",
  decision: "",
  timeline: "",
};

/**
 * Formulario de calificación de leads.
 *
 * Una pregunta por pantalla (contacto → problema → inversión → decisión →
 * inicio). Al enviar, la base de datos calcula el puntaje y el color:
 *  - verde: se muestra la agenda en el mismo paso;
 *  - amarillo: agradecimiento + recursos según el problema; ventas hace
 *    seguimiento desde el CRM;
 *  - rojo: agradecimiento amable + recursos.
 */
export function LeadForm({
  locale,
  consent,
}: {
  locale: Locale;
  consent: { text: string; link: string; required: string; href: string };
}) {
  const t = leadFormCopy[locale];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [accepted, setAccepted] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<SubmitLeadResult | null>(null);
  const [honeypot, setHoneypot] = useState("");
  // Recuperación: solo si la persona lo permite (casilla en el primer paso).
  const [recoveryOk, setRecoveryOk] = useState(false);
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const baseId = useId();
  const firstRender = useRef(true);

  // Analítica propia: inicio del formulario y hasta qué paso llega.
  const maxStep = useRef(0);
  useEffect(() => {
    if (step <= maxStep.current) return;
    if (maxStep.current === 0) trackEvent("form_start");
    maxStep.current = step;
    trackEvent("form_step", String(step + 1));
  }, [step]);

  // Al cambiar de paso, el foco va al título (lectores de pantalla y teclado).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result]);

  // Retomar: primero un enlace ?retomar= del correo; si no, lo guardado aquí.
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const token = new URLSearchParams(window.location.search).get("retomar");
      if (token && /^[0-9a-f-]{36}$/i.test(token)) {
        const { data } = await createClient().rpc("get_lead_draft", { p_token: token });
        const draft = data as { name?: string; email?: string; phone?: string; company?: string; step?: number; answers?: Partial<Answers> } | null;
        if (draft) {
          setAnswers((a) => ({
            ...a,
            ...draft.answers,
            name: draft.name ?? "",
            email: draft.email ?? "",
            phone: draft.phone ?? "",
            company: draft.company ?? "",
          }));
          setStep(Math.min(draft.step ?? 1, STEPS.length - 1));
          setDraftToken(token);
          setRecoveryOk(true);
          return;
        }
      }
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null") as { answers: Answers; step: number } | null;
        if (saved?.answers) {
          setAnswers({ ...EMPTY, ...saved.answers });
          setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
        }
      } catch {
        // Sin almacenamiento o datos dañados: se empieza de cero.
      }
    })();
  }, []);

  // Guardar el avance en el navegador.
  useEffect(() => {
    if (result) return;
    try {
      if (answers.name || answers.email) localStorage.setItem(LOCAL_KEY, JSON.stringify({ answers, step }));
    } catch {
      // Sin almacenamiento: solo se pierde el avance al recargar.
    }
  }, [answers, step, result]);

  const current = STEPS[step];
  const set = (key: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (which: Step): boolean => {
    const next: Record<string, string> = {};
    if (which === "contact") {
      if (answers.name.trim().length < 2) next.name = t.required;
      if (!answers.email.trim()) next.email = t.required;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim()))
        next.email = t.invalidEmail;
      const digits = answers.phone.replace(/\D/g, "");
      if (!answers.phone.trim()) next.phone = t.required;
      else if (digits.length < 7) next.phone = t.invalidPhone;
    }
    if (which === "problem" && !answers.problem_category) next.choice = t.pickOne;
    if (which === "budget" && !answers.budget) next.choice = t.pickOne;
    if (which === "decision" && !answers.decision) next.choice = t.pickOne;
    if (which === "timeline") {
      if (!answers.timeline) next.choice = t.pickOne;
      if (!accepted) next.consent = consent.required;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validate(current)) return;
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    // Con permiso, el avance también se guarda para poder escribirle si no termina.
    if (recoveryOk) {
      const { name, email, phone, company, ...rest } = answers;
      void createClient()
        .rpc("save_lead_draft", {
          p: { token: draftToken, name, email, phone, company, step: next, answers: rest, locale, source_page: window.location.pathname },
        })
        .then(({ data }) => {
          if (data) setDraftToken(data);
        });
    }
  };

  const submit = async () => {
    if (!validate("timeline")) return;
    // Trampa para bots: un campo invisible que una persona nunca llena.
    if (honeypot) return;
    setStatus("sending");
    const origin = readAttribution();
    const { data, error } = await createClient().rpc("submit_lead", {
      p: {
        ...answers,
        consent: true,
        whatsapp_opt_in: whatsappOptIn,
        locale,
        source_page: window.location.pathname,
        referrer: origin?.referrer ?? null,
        utm: origin?.utm ?? null,
        gclid: origin?.gclid ?? null,
        landing: origin?.landing ?? null,
        visitor_id: getVisitorId(),
      },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("rate_limited")
          ? t.errors.rate_limited
          : t.errors.generic,
      );
      return;
    }
    setStatus("idle");
    const submitted = data as unknown as SubmitLeadResult;
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      // Nada que limpiar.
    }
    trackLead({
      tier: submitted.tier,
      category: answers.problem_category,
      email: answers.email.trim(),
      phone: answers.phone,
    });
    setResult(submitted);
  };

  // -------------------------- Resultado --------------------------
  if (result) {
    const firstName = answers.name.trim().split(/\s+/)[0];
    const copy = t.results[result.tier];
    const title = copy.title.replace("{name}", firstName);
    return (
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[clamp(1.6rem,3vw,2.2rem)] leading-tight text-heading outline-none"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
          {copy.subtitle}
        </p>

        {result.tier === "green" && result.booking_token ? (
          <Booking
            locale={locale}
            token={result.booking_token}
            name={answers.name}
          />
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {resourcesByProblem[
              (result.category as ProblemKey) ?? "other"
            ].map((path) => (
              <li key={path}>
                <Link
                  href={localizedHref(locale, path)}
                  className="group flex h-full items-start justify-between gap-3 rounded-2xl bg-surface p-5 text-sm font-bold text-heading ring-1 ring-line transition-colors hover:bg-card-soft dark:bg-card"
                >
                  {t.results.resourceLabels[path] ?? path}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // -------------------------- Pasos --------------------------
  const stepCopy = t.steps[current];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (step === STEPS.length - 1) void submit();
        else goNext();
      }}
    >
      {/* Progreso */}
      <div className="flex items-center justify-between gap-4 text-sm text-muted">
        <span aria-live="polite">
          {t.stepOf
            .replace("{n}", String(step + 1))
            .replace("{total}", String(STEPS.length))}
        </span>
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setStep((s) => s - 1);
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-heading hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </button>
        )}
      </div>
      <div
        aria-hidden
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-action transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 text-[clamp(1.5rem,2.8vw,2rem)] leading-tight text-heading outline-none"
      >
        {stepCopy.title}
      </h2>
      <p className="mt-2 text-base text-muted">{stepCopy.subtitle}</p>

      {/* Trampa para bots (invisible para personas y lectores de pantalla) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
        aria-hidden
      />

      <div className="mt-8">
        {current === "contact" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id={`${baseId}-name`}
              label={t.steps.contact.name}
              value={answers.name}
              onChange={(v) => set("name", v)}
              error={errors.name}
              autoComplete="name"
            />
            <TextField
              id={`${baseId}-email`}
              label={t.steps.contact.email}
              type="email"
              value={answers.email}
              onChange={(v) => set("email", v)}
              error={errors.email}
              autoComplete="email"
            />
            <TextField
              id={`${baseId}-phone`}
              label={t.steps.contact.phone}
              type="tel"
              value={answers.phone}
              onChange={(v) => set("phone", v)}
              error={errors.phone}
              autoComplete="tel"
            />
            <TextField
              id={`${baseId}-company`}
              label={t.steps.contact.company}
              value={answers.company}
              onChange={(v) => set("company", v)}
              autoComplete="organization"
            />
            <label className="flex items-start gap-3 text-sm leading-relaxed text-body sm:col-span-2">
              <input
                type="checkbox"
                checked={recoveryOk}
                onChange={(event) => setRecoveryOk(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-deep-700 dark:accent-brand-green"
              />
              <span>{t.recoveryOptIn}</span>
            </label>
          </div>
        )}

        {current === "problem" && (
          <>
            <Choices
              name="problem_category"
              legend={t.steps.problem.title}
              options={problemKeys.map((key) => ({
                value: key,
                label: t.steps.problem.options[key],
              }))}
              value={answers.problem_category}
              onChange={(v) => set("problem_category", v)}
              columns={2}
            />
            {answers.problem_category && answers.problem_category !== "none" && (
              <label className="mt-6 block">
                <span className="text-sm font-semibold text-heading">
                  {t.steps.problem.detail}
                </span>
                <textarea
                  value={answers.problem_text}
                  onChange={(event) => set("problem_text", event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder={t.steps.problem.detailPlaceholder}
                  className="mt-2 w-full resize-y rounded-2xl border border-line-strong bg-surface px-4 py-3 text-base text-heading outline-none transition-colors placeholder:text-muted focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20"
                />
              </label>
            )}
          </>
        )}

        {current === "budget" && (
          <Choices
            name="budget"
            legend={t.steps.budget.title}
            options={budgetKeys.map((key) => ({
              value: key,
              label: t.steps.budget.options[key],
            }))}
            value={answers.budget}
            onChange={(v) => set("budget", v)}
            columns={2}
          />
        )}

        {current === "decision" && (
          <Choices
            name="decision"
            legend={t.steps.decision.title}
            options={decisionKeys.map((key) => ({
              value: key,
              label: t.steps.decision.options[key],
            }))}
            value={answers.decision}
            onChange={(v) => set("decision", v)}
          />
        )}

        {current === "timeline" && (
          <>
            <Choices
              name="timeline"
              legend={t.steps.timeline.title}
              options={timelineKeys.map((key) => ({
                value: key,
                label: t.steps.timeline.options[key],
              }))}
              value={answers.timeline}
              onChange={(v) => set("timeline", v)}
            />
            <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-body">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  setErrors((e) => ({ ...e, consent: "" }));
                }}
                aria-invalid={!!errors.consent || undefined}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-deep-700 dark:accent-brand-green"
              />
              <span>
                {consent.text}{" "}
                <Link
                  href={consent.href}
                  className="font-semibold text-heading underline underline-offset-2"
                >
                  {consent.link}
                </Link>
                .
              </span>
            </label>
            <FieldError message={errors.consent} />
            {/* Opcional y aparte: WhatsApp exige consentimiento explícito
                para mensajes de marketing. */}
            <label className="mt-3 flex items-start gap-3 text-sm leading-relaxed text-body">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(event) => setWhatsappOptIn(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-deep-700 dark:accent-brand-green"
              />
              <span>{t.whatsappOptIn}</span>
            </label>
          </>
        )}

        <FieldError message={errors.choice} />
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={status === "sending"}
          className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
        >
          {status === "sending" && (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          )}
          {step === STEPS.length - 1
            ? status === "sending"
              ? t.sending
              : t.submit
            : t.next}
        </button>
      </div>
    </form>
  );
}

/** Opciones como tarjetas grandes (radios nativos, accesibles). */
function Choices({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 1,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2")}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 text-base transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-deep-700 dark:has-[:focus-visible]:ring-brand-green",
                checked
                  ? "border-deep-700 bg-surface font-bold text-heading shadow-[inset_0_0_0_1px_var(--color-deep-700)] dark:border-brand-green dark:bg-card dark:shadow-[inset_0_0_0_1px_var(--color-brand-green)]"
                  : "border-line-strong bg-surface text-heading hover:border-muted dark:bg-card",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  checked
                    ? "border-deep-700 bg-deep-700 text-white dark:border-brand-green dark:bg-brand-green dark:text-deep-700"
                    : "border-line-strong",
                )}
              >
                {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className="leading-snug">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-heading">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-surface px-4 text-base text-heading outline-none transition-colors focus:ring-2 dark:bg-card",
          error
            ? "border-red-500 focus:ring-red-500/25"
            : "border-line-strong hover:border-muted focus:border-deep-700 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20",
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
