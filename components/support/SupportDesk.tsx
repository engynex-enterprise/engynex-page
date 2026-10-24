"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { supportIcons } from "@/components/support/icons";
import { Select, type SelectOption } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { supportIssues, type SupportCopy } from "@/content/support";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Tab = "technical" | "account";
type Status = "idle" | "sending" | "sent" | "error";

/**
 * "¿Con qué necesitas ayuda?" + formulario de solicitud, como el soporte de
 * Meta Quest: dos pestañas con tarjetas de problemas frecuentes; "Obtener
 * ayuda" baja al formulario con el tipo de problema ya elegido y deja el
 * cursor en la descripción.
 */
export function SupportDesk({
  locale,
  copy,
  affectedOptions,
  privacyHref,
  privacyLabel,
  consentText,
}: {
  locale: Locale;
  copy: SupportCopy;
  /** Servicios y productos para "Servicio o producto afectado". */
  affectedOptions: SelectOption[];
  privacyHref: string;
  privacyLabel: string;
  /** Texto de autorización antes del enlace a la política. */
  consentText: string;
}) {
  const f = copy.form;
  const [tab, setTab] = useState<Tab>("technical");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [affected, setAffected] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const tabsId = useId();

  const issues = supportIssues.filter((issue) => issue.tab === tab);

  const pickIssue = (key: string) => {
    setCategory(key);
    setErrors((e) => ({ ...e, category: "" }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Tras el desplazamiento, el foco va a la descripción.
    window.setTimeout(() => descriptionRef.current?.focus(), 450);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next: Record<string, string> = {};
    if (!String(data.get("name") ?? "").trim()) next.name = f.required;
    const email = String(data.get("email") ?? "").trim();
    if (!email) next.email = f.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = f.invalidEmail;
    if (!category) next.category = f.required;
    if (!String(data.get("description") ?? "").trim())
      next.description = f.required;
    if (!data.get("consent")) next.consent = f.required;
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          consent: true,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("sent");
      form.reset();
      setCategory("");
      setPriority("medium");
      setAffected("");
    } catch {
      setStatus("error");
    }
  };

  const tabs: Tab[] = ["technical", "account"];

  return (
    <>
      {/* -------- ¿Con qué necesitas ayuda? -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
          <div className="text-center">
            <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
              {copy.needTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              {copy.needSubtitle}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={copy.needTitle}
            className="mt-8 flex justify-center gap-2"
          >
            {tabs.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`${tabsId}-${key}`}
                aria-selected={tab === key}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setTab(key)}
                className={cn(
                  "h-10 rounded-full px-5 text-sm font-semibold transition-colors",
                  tab === key
                    ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                    : "text-heading ring-1 ring-line-strong hover:bg-surface-soft",
                )}
              >
                {copy.tabs[key]}
              </button>
            ))}
          </div>

          <ul
            id={`${tabsId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-${tab}`}
            className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {issues.map((issue) => {
              const Icon = supportIcons[issue.icon];
              return (
                <li key={issue.key}>
                  <button
                    type="button"
                    onClick={() => pickIssue(issue.key)}
                    className="group flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 text-left transition-colors hover:bg-surface-soft"
                  >
                    <Icon
                      className="h-7 w-7 text-accent"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <span className="mt-5 text-lg font-bold leading-snug text-heading">
                      {issue[locale].title}
                    </span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {issue[locale].desc}
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-heading">
                      <span className="grid h-7 w-7 place-items-center rounded-full ring-1 ring-line-strong transition-colors group-hover:bg-deep-700 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-deep-700">
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                      {copy.getHelp}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* -------- Formulario de solicitud -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <div
          ref={formRef}
          id="solicitud"
          className="mx-auto max-w-3xl scroll-mt-28 px-4 sm:px-8"
        >
          <h2 className="text-center text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
            {copy.formTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
            {copy.formSubtitle}
          </p>

          <div className="mt-10 rounded-3xl bg-card p-6 sm:p-10">
            {status === "sent" ? (
              <div role="status" className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-accent" aria-hidden />
                <p className="mt-5 max-w-md text-lg text-heading">{f.success}</p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className={buttonClasses("outline", "md", "mt-6")}
                >
                  {copy.formTitle}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField name="name" label={f.name} error={errors.name} autoComplete="name" />
                  <TextField
                    name="email"
                    type="email"
                    label={f.email}
                    error={errors.email}
                    autoComplete="email"
                  />
                  <TextField name="company" label={f.company} autoComplete="organization" />
                  <TextField name="phone" type="tel" label={f.phone} autoComplete="tel" />
                </div>

                <div>
                  <Select
                    name="category"
                    size="md"
                    label={f.category}
                    placeholder={f.categoryPlaceholder}
                    value={category}
                    onChange={(value) => {
                      setCategory(value);
                      setErrors((e) => ({ ...e, category: "" }));
                    }}
                    invalid={!!errors.category}
                    options={supportIssues.map((issue) => ({
                      value: issue.key,
                      label: issue[locale].title,
                      group: copy.tabs[issue.tab],
                    }))}
                  />
                  <FieldError message={errors.category} />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Select
                    name="priority"
                    size="md"
                    label={f.priority}
                    value={priority}
                    onChange={setPriority}
                    options={(
                      ["critical", "high", "medium", "low"] as const
                    ).map((key) => ({ value: key, label: f.priorities[key] }))}
                  />
                  <Select
                    name="affected"
                    size="md"
                    label={f.affected}
                    placeholder={f.affectedPlaceholder}
                    value={affected}
                    onChange={setAffected}
                    options={[
                      ...affectedOptions,
                      { value: "unknown", label: f.affectedOther },
                    ]}
                  />
                </div>

                {priority === "critical" && (
                  <p className="rounded-2xl bg-accent-soft px-5 py-4 text-sm text-heading">
                    {f.urgentNote}
                  </p>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-heading">
                    {f.description}
                  </span>
                  <textarea
                    ref={descriptionRef}
                    name="description"
                    rows={6}
                    placeholder={f.descriptionPlaceholder}
                    aria-invalid={!!errors.description || undefined}
                    className={cn(
                      "w-full rounded-2xl border bg-surface px-4 py-3 text-base text-heading outline-none transition-colors placeholder:text-muted focus:ring-2 dark:bg-card",
                      errors.description
                        ? "border-red-500 focus:ring-red-500/25"
                        : "border-line-strong hover:border-muted focus:border-deep-700 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20",
                    )}
                  />
                  <FieldError message={errors.description} />
                </label>

                <div>
                  <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
                    <input
                      type="checkbox"
                      name="consent"
                      aria-invalid={!!errors.consent || undefined}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded accent-deep-700 dark:accent-brand-green"
                    />
                    <span>
                      {consentText}{" "}
                      <Link
                        href={privacyHref}
                        className="font-semibold text-heading underline underline-offset-2"
                      >
                        {privacyLabel}
                      </Link>
                      .
                    </span>
                  </label>
                  <FieldError message={errors.consent} />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {f.error}
                  </p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
                  >
                    {status === "sending" && (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    )}
                    {status === "sending" ? f.sending : f.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function TextField({
  name,
  label,
  type = "text",
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-heading">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error || undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-surface px-4 text-base text-heading outline-none transition-colors focus:ring-2 dark:bg-card",
          error
            ? "border-red-500 focus:ring-red-500/25"
            : "border-line-strong hover:border-muted focus:border-deep-700 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20",
        )}
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="mt-1.5 block text-sm text-red-600 dark:text-red-400">
      {message}
    </span>
  );
}
