"use client";

import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { services } from "@/content/services";
import { products } from "@/content/products";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type FormDict = Dictionary["contactPage"]["form"];
type Status = "idle" | "sending" | "success" | "error";

export function ContactForm({
  locale,
  form,
  variant = "card",
}: {
  locale: Locale;
  form: FormDict;
  variant?: "card" | "plain";
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Llega desde la fila "Recibe una propuesta" (QuickStart) con ?email=…:
  // precarga el correo y lleva el foco al primer campo que falta.
  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (!email || !emailRef.current) return;
    emailRef.current.value = email;
    nameRef.current?.focus();
  }, []);

  const validate = (data: FormData) => {
    const next: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) next.name = form.required;
    if (!email) next.email = form.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = form.invalidEmail;
    if (!message) next.message = form.required;
    return next;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const data = new FormData(formEl);

    const validationErrors = validate(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      formEl.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center rounded-3xl bg-card p-10 text-center"
      >
        <CheckCircle2
          className="h-10 w-10 text-accent"
          strokeWidth={1.75}
          aria-hidden
        />
        <h3 className="mt-6 text-[1.75rem] font-light leading-tight text-heading">
          {form.successTitle}
        </h3>
        <p className="mt-3 max-w-sm text-body">{form.successBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        variant === "card" && "rounded-3xl bg-surface-soft p-6 sm:p-10",
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={form.name} error={errors.name}>
          <input
            ref={nameRef}
            name="name"
            type="text"
            placeholder={form.namePlaceholder}
            aria-invalid={!!errors.name}
            className={cn(inputClass(!!errors.name), "h-12")}
          />
        </Field>
        <Field label={form.email} error={errors.email}>
          <input
            ref={emailRef}
            name="email"
            type="email"
            placeholder={form.emailPlaceholder}
            aria-invalid={!!errors.email}
            className={cn(inputClass(!!errors.email), "h-12")}
          />
        </Field>
        <Field label={form.company}>
          <input
            name="company"
            type="text"
            placeholder={form.companyPlaceholder}
            className={cn(inputClass(false), "h-12")}
          />
        </Field>
        <Field label={form.phone}>
          <input
            name="phone"
            type="tel"
            placeholder={form.phonePlaceholder}
            className={cn(inputClass(false), "h-12")}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label={form.service}>
          <div className="relative">
            <select
              name="service"
              className={cn(inputClass(false), "h-12 appearance-none pr-11")}
            >
              <option value="">{form.servicePlaceholder}</option>
              <optgroup label={form.serviceGroupProducts}>
                {products.map((product) => (
                  <option key={product.slug} value={product[locale].title}>
                    {product[locale].title}
                  </option>
                ))}
              </optgroup>
              <optgroup label={form.serviceGroupServices}>
                {services.map((service) => (
                  <option key={service.slug} value={service[locale].title}>
                    {service[locale].title}
                  </option>
                ))}
              </optgroup>
              <option value="other">{form.serviceOther}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <Field label={form.message} error={errors.message}>
          <textarea
            name="message"
            rows={5}
            placeholder={form.messagePlaceholder}
            aria-invalid={!!errors.message}
            className={cn(inputClass(!!errors.message), "resize-y py-3")}
          />
        </Field>
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {form.error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className={buttonClasses("primary", "lg", "mt-8 w-full sm:w-auto")}
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {form.sending}
          </>
        ) : (
          <>
            {form.submit}
            <Send className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-heading">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-4 text-base text-heading outline-none transition-colors placeholder:text-muted focus:ring-2 dark:bg-card",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/25"
      : "border-line-strong hover:border-muted focus:border-action focus:ring-action/25",
  );
}
