"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { WhoisForm } from "@/components/domains/WhoisForm";
import { domainSearchCopy } from "@/content/domainSearch";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "loading" | "account" | "whois" | "pay";

/**
 * Compra de un dominio en autoservicio, en tres pasos:
 *  1. Cuenta: crear una (POST /api/domains/account + inicio de sesión) o entrar.
 *  2. Titular: datos WHOIS del cliente (WhoisForm).
 *  3. Pago: resumen y Wompi (POST /api/domains/checkout).
 * No hay pedidos manuales: sin Wompi conectado el botón de compra no aparece.
 */
export function CheckoutDialog({
  locale,
  domain,
  price,
  renewal,
  money,
  onClose,
}: {
  locale: Locale;
  domain: string;
  price: number;
  renewal: number | null;
  money: (v: number) => string;
  onClose: () => void;
}) {
  const t = domainSearchCopy[locale].checkout;
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState<string | null>(null);

  // En desarrollo React monta dos veces: solo se abre, no se cierra en la limpieza.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  // ¿Ya inició sesión? Entonces salta al titular.
  useEffect(() => {
    let alive = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!alive) return;
        if (data.user) {
          setEmail(data.user.email ?? null);
          setStep("whois");
        } else setStep("account");
      });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    setEmail(null);
    setStep("account");
  };

  const steps: { key: Exclude<Step, "loading">; label: string }[] = [
    { key: "account", label: t.steps.account },
    { key: "whois", label: t.steps.whois },
    { key: "pay", label: t.steps.pay },
  ];
  const current = steps.findIndex((s) => s.key === step);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl bg-surface p-0 text-body shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:bg-card"
    >
      <div className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-heading [overflow-wrap:anywhere]">{t.title.replace("{domain}", domain)}</h2>
            <p className="mt-0.5 text-sm text-muted">
              <span className="font-semibold tabular-nums text-heading">{money(price)}</span> · {t.pay.firstYear}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-card-soft hover:text-heading">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Pasos */}
        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label={t.title.replace("{domain}", domain)}>
          {steps.map((s, i) => {
            const done = current > i;
            const active = current === i;
            return (
              <li key={s.key} aria-current={active ? "step" : undefined}>
                <span className={cn("block h-1.5 rounded-full transition-colors", done || active ? "bg-brand-green" : "bg-line")} />
                <span className={cn("mt-2 flex items-center gap-1.5 text-xs", active ? "font-semibold text-heading" : "text-muted")}>
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[0.65rem] font-bold tabular-nums",
                      done ? "bg-brand-green text-deep-700" : active ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "bg-surface-soft text-muted dark:bg-white/[0.06]",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {email && step !== "account" && step !== "loading" && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 rounded-2xl bg-surface-soft px-4 py-2.5 text-sm dark:bg-white/[0.04]">
            <span className="text-heading [overflow-wrap:anywhere]">{t.account.as.replace("{email}", email)}</span>
            <button type="button" onClick={signOut} className="text-muted underline underline-offset-2 hover:text-heading">
              {t.account.notYou}
            </button>
          </p>
        )}

        <div className="mt-5">
          {step === "loading" && <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted" aria-label="…" />}
          {step === "account" && (
            <AccountStep
              locale={locale}
              onDone={(mail) => {
                setEmail(mail);
                setStep("whois");
              }}
            />
          )}
          {step === "whois" && (
            <div className="grid gap-4">
              <p className="text-sm text-muted">{t.whois.intro}</p>
              <WhoisForm locale={locale} compact submitLabel={t.whois.next} onSaved={() => setStep("pay")} />
            </div>
          )}
          {step === "pay" && (
            <PayStep
              locale={locale}
              domain={domain}
              price={price}
              renewal={renewal}
              money={money}
              onBack={() => setStep("whois")}
              onNeedWhois={() => setStep("whois")}
              onNeedLogin={() => {
                setEmail(null);
                setStep("account");
              }}
            />
          )}
        </div>
      </div>
    </dialog>
  );
}

/** Paso 1: crear cuenta o entrar. */
function AccountStep({ locale, onDone }: { locale: Locale; onDone: (email: string) => void }) {
  const t = domainSearchCopy[locale].checkout.account;
  const uid = useId();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", accept: false, website: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const signIn = async (email: string, password: string) => {
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return !error;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (tab === "login") {
      setBusy(true);
      const ok = await signIn(form.email, form.password);
      setBusy(false);
      if (!ok) return setMsg({ tone: "error", text: t.wrong });
      return onDone(form.email.trim().toLowerCase());
    }
    if (form.full_name.trim().length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) || form.password.length < 8 || !form.accept) {
      return setMsg({ tone: "error", text: t.invalid });
    }
    setBusy(true);
    const res = await fetch("/api/domains/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password, website: form.website }),
    }).catch(() => null);
    if (res?.status === 409) {
      setBusy(false);
      setTab("login");
      setForm((f) => ({ ...f, password: "" }));
      return setMsg({ tone: "info", text: t.exists });
    }
    if (!res?.ok) {
      setBusy(false);
      return setMsg({ tone: "error", text: res?.status === 429 ? t.rateLimited : res?.status === 422 ? t.invalid : t.error });
    }
    const ok = await signIn(form.email, form.password);
    setBusy(false);
    if (!ok) return setMsg({ tone: "error", text: t.error });
    onDone(form.email.trim().toLowerCase());
  };

  const field = "h-11 text-[0.95rem]";
  const label = "mb-1.5 block text-sm font-medium text-heading";
  const legal = (text: string, href: string) => (
    <Link href={href} target="_blank" className="font-semibold text-heading underline underline-offset-2">
      {text}
    </Link>
  );
  const [before, middle] = t.accept.split("{terms}");
  const [between, after] = (middle ?? "").split("{privacy}");

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">{t.intro}</p>
      <div className="flex gap-1 rounded-full bg-surface-soft p-1 dark:bg-white/[0.06]" role="tablist">
        {(["signup", "login"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setMsg(null);
            }}
            className={cn("flex-1 rounded-full px-4 py-2 text-sm", tab === k ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted")}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {/* Trampa para bots: invisible para personas. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden />
        {tab === "signup" && (
          <div>
            <label htmlFor={`${uid}-name`} className={label}>{t.name}</label>
            <input id={`${uid}-name`} autoComplete="name" value={form.full_name} onChange={set("full_name")} className={cn(inputClass, field)} />
          </div>
        )}
        <div className={cn("grid gap-4", tab === "signup" && "sm:grid-cols-2")}>
          <div>
            <label htmlFor={`${uid}-email`} className={label}>{t.email}</label>
            <input id={`${uid}-email`} type="email" autoComplete="email" value={form.email} onChange={set("email")} className={cn(inputClass, field)} />
          </div>
          {tab === "signup" && (
            <div>
              <label htmlFor={`${uid}-phone`} className={label}>{t.phone}</label>
              <input id={`${uid}-phone`} type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={cn(inputClass, field)} />
            </div>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-password`} className={label}>{t.password}</label>
          <div className="relative">
            <input
              id={`${uid}-password`}
              type={show ? "text" : "password"}
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              value={form.password}
              onChange={set("password")}
              className={cn(inputClass, field, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? t.hide : t.show}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-heading"
            >
              {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {tab === "signup" ? (
            <p className="mt-1 text-xs text-muted">{t.passwordHint}</p>
          ) : (
            <Link href={`/${locale}/acceso/recuperar`} target="_blank" className="mt-1.5 inline-block text-xs font-semibold text-heading underline underline-offset-2">
              {t.forgot}
            </Link>
          )}
        </div>
        {tab === "signup" && (
          <label className="flex items-start gap-2.5 text-sm text-body">
            <input type="checkbox" checked={form.accept} onChange={(e) => setForm((f) => ({ ...f, accept: e.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 accent-[#467316]" />
            <span>
              {before}
              {legal(t.terms, `/${locale}/legal/terminos`)}
              {between}
              {legal(t.privacy, `/${locale}/legal/privacidad`)}
              {after}
            </span>
          </label>
        )}
        {msg && (
          <p role={msg.tone === "error" ? "alert" : "status"} className={cn("text-sm font-medium", msg.tone === "error" ? "text-red-600 dark:text-red-400" : "text-heading")}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(buttonClasses("primary", "lg"), "w-full disabled:opacity-60")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {tab === "signup" ? t.create : t.login}
        </button>
      </form>
    </div>
  );
}

/** Paso 3: resumen y pago con Wompi. */
function PayStep({
  locale,
  domain,
  price,
  renewal,
  money,
  onBack,
  onNeedWhois,
  onNeedLogin,
}: {
  locale: Locale;
  domain: string;
  price: number;
  renewal: number | null;
  money: (v: number) => string;
  onBack: () => void;
  onNeedWhois: () => void;
  onNeedLogin: () => void;
}) {
  const t = domainSearchCopy[locale].checkout;
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/domains/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, kind: "register", accept, locale }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (res?.ok && body?.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(false);
    const code = body?.error ?? "server";
    if (code === "whois_required") return onNeedWhois();
    if (code === "login_required") return onNeedLogin();
    setError(t.pay.errors[code] ?? t.pay.errors.server);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-surface-soft p-4 dark:bg-white/[0.04]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-heading [overflow-wrap:anywhere]">{domain}</span>
          <span className="shrink-0 text-sm text-muted">{t.pay.firstYear}</span>
        </div>
        <p className="mt-2 text-xs text-muted">{t.pay.renewal}</p>
        {renewal != null && renewal !== price && <p className="mt-1 text-xs text-muted">{t.pay.renewalPrice.replace("{price}", money(renewal))}</p>}
      </div>
      <ul className="grid gap-2 text-sm text-heading sm:grid-cols-2">
        {t.pay.includes.map((x) => (
          <li key={x} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
            {x}
          </li>
        ))}
      </ul>
      <label className="flex items-start gap-2.5 text-sm text-body">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#467316]" />
        <span>
          {t.pay.accept}{" "}
          <Link href={`/${locale}/legal/terminos`} target="_blank" className="font-semibold text-heading underline underline-offset-2">
            ↗
          </Link>
        </span>
      </label>
      <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
        <span className="text-sm text-muted">{t.pay.total}</span>
        <span className="text-lg font-bold tabular-nums text-heading">{money(price)} COP</span>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={onBack} className={cn(buttonClasses("outline", "lg"), "w-full sm:w-auto")}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.back}
        </button>
        <button type="button" onClick={pay} disabled={busy || !accept} className={cn(buttonClasses("primary", "lg"), "w-full disabled:opacity-50 sm:w-auto sm:flex-1")}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
          {busy ? t.pay.paying : t.pay.pay}
        </button>
      </div>
      <p className="text-center text-xs text-muted">{t.pay.secure}</p>
    </div>
  );
}
