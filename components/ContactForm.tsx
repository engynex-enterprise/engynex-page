"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { services } from "@/content/services";
import { products } from "@/content/products";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
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
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-brand-green/30 bg-brand-green/[0.07] p-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/20 text-accent">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h3 className="mt-6 text-2xl font-extrabold text-heading">
          {form.successTitle}
        </h3>
        <p className="mt-3 max-w-sm text-body">
          {form.successBody}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        variant === "card" &&
          "rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8",
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={form.name} error={errors.name}>
          <input
            name="name"
            type="text"
            placeholder={form.namePlaceholder}
            className={inputClass(!!errors.name)}
          />
        </Field>
        <Field label={form.email} error={errors.email}>
          <input
            name="email"
            type="email"
            placeholder={form.emailPlaceholder}
            className={inputClass(!!errors.email)}
          />
        </Field>
        <Field label={form.company}>
          <input
            name="company"
            type="text"
            placeholder={form.companyPlaceholder}
            className={inputClass(false)}
          />
        </Field>
        <Field label={form.phone}>
          <input
            name="phone"
            type="tel"
            placeholder={form.phonePlaceholder}
            className={inputClass(false)}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label={form.service}>
          <select name="service" className={cn(inputClass(false), "appearance-none")}>
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
        </Field>
      </div>

      <div className="mt-5">
        <Field label={form.message} error={errors.message}>
          <textarea
            name="message"
            rows={5}
            placeholder={form.messagePlaceholder}
            className={cn(inputClass(!!errors.message), "resize-y")}
          />
        </Field>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-500/25 dark:text-red-300">
          {form.error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-green px-8 text-base font-bold text-navy-950 shadow-lg shadow-brand-green/25 transition-all hover:bg-brand-green-light hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {form.sending}
          </>
        ) : (
          <>
            {form.submit}
            <Send className="h-5 w-5" />
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
      <span className="mb-1.5 block text-sm font-bold text-heading">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-500 dark:text-red-400">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full rounded-xl border bg-surface-soft px-4 py-3 text-sm text-heading outline-none transition-all placeholder:text-muted focus:ring-2",
    hasError
      ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/20"
      : "border-line focus:border-brand-green focus:ring-brand-green/25",
  );
}
