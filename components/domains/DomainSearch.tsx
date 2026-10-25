"use client";

import { useId, useState } from "react";
import { CheckCircle2, Globe2, Info, Loader2, Search, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { CheckoutDialog } from "@/components/domains/checkout/CheckoutDialog";
import { domainSearchCopy } from "@/content/domainSearch";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Result = { domain: string; tld: string; available: boolean; price: number | null; renewal: number | null; exact: boolean; suggestion: boolean; restriction: string | null };
type Response = { query: string; results: Result[]; source: "hostinger" | "rdap"; purchasable: boolean };

const QUICK_TLDS = [".com", ".co", ".com.co", ".net", ".store", ".online"];

/**
 * Buscador de dominios estilo Hostinger / GoDaddy: barra grande, resultado
 * exacto destacado, otras extensiones y sugerencias, con precio en COP y
 * compra en autoservicio (cuenta → titular → pago con Wompi).
 */
/**
 * Solo en desarrollo: con ?checkoutTest=1 se puede abrir la compra aunque
 * Wompi no esté conectado (para probar los pasos). En producción no aplica.
 */
const devCheckout = () => process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("checkoutTest");

export function DomainSearch({ locale }: { locale: Locale }) {
  const t = domainSearchCopy[locale];
  const inputId = useId();
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Response | null>(null);
  const [buying, setBuying] = useState<Result | null>(null);
  const money = (v: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

  const run = async (value: string) => {
    const term = value.trim();
    if (!term) return;
    if (!/^[\p{L}\p{N}.\-:/ ]+$/u.test(term) || /\s/.test(term.replace(/^https?:\/\//, "").trim())) {
      setError(t.invalid);
      setState("error");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(term)}`);
      if (res.status === 429) throw new Error(t.rateLimited);
      if (res.status === 422) throw new Error(t.invalid);
      if (!res.ok) throw new Error(t.error);
      setData((await res.json()) as Response);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setState("error");
    }
  };

  const canBuy = !!data && (data.purchasable || devCheckout());
  const exact = data?.results.find((r) => r.exact);
  const others = data?.results.filter((r) => !r.exact && !r.suggestion) ?? [];
  const suggestions = data?.results.filter((r) => !r.exact && r.suggestion) ?? [];

  const badge = (r: Result) =>
    r.available ? (
      <span className="flex flex-wrap items-center gap-x-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {t.available}
        {r.restriction === "approx" && <span className="font-normal text-muted">· {t.approx}</span>}
      </span>
    ) : r.restriction === "unverified" ? (
      <span className="text-xs font-medium text-muted">{t.unknown}</span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        {t.taken}
      </span>
    );

  const row = (r: Result) => (
    <li key={r.domain} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-6">
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <p className={cn("text-base font-semibold [overflow-wrap:anywhere]", r.available ? "text-heading" : "text-muted line-through decoration-1")}>{r.domain}</p>
        {badge(r)}
      </div>
      {r.available && r.price != null && (
        <div className="flex-1 sm:flex-none sm:text-right">
          <p className="text-base font-bold tabular-nums text-heading">
            {money(r.price)}
            <span className="text-xs font-medium text-muted">{t.perYear}</span>
          </p>
          {r.renewal && r.renewal !== r.price && <p className="text-xs text-muted">{t.renews.replace("{price}", money(r.renewal))}</p>}
        </div>
      )}
      <button
        type="button"
        disabled={!r.available || r.price == null || !canBuy}
        onClick={() => setBuying(r)}
        className={cn(buttonClasses(r.available ? "primary" : "outline", "md"), "h-10 min-w-[6.5rem] px-5 disabled:opacity-40")}
      >
        {t.buy}
      </button>
    </li>
  );

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void run(q);
        }}
        className="mx-auto max-w-4xl"
      >
        <label htmlFor={inputId} className="sr-only">{t.placeholder}</label>
        <div className="flex items-center gap-2 rounded-full bg-surface p-2 shadow-[0_10px_40px_-12px_rgba(20,28,49,0.25)] ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-green-dark dark:bg-card dark:focus-within:ring-brand-green">
          <Globe2 className="ml-4 h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            id={inputId}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.placeholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="url"
            maxLength={80}
            // El foco ya se ve en el contorno de la píldora (focus-within).
            style={{ outline: "none" }}
            className="h-12 min-w-0 flex-1 border-0 bg-transparent text-base text-heading shadow-none outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none sm:text-lg"
          />
          <button type="submit" disabled={state === "loading"} className={cn(buttonClasses("primary", "lg"), "h-12 shrink-0 px-6 sm:px-8")}>
            {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Search className="h-5 w-5" aria-hidden />}
            <span className="hidden sm:inline">{state === "loading" ? t.searching : t.search}</span>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted">{t.popular}:</span>
          {QUICK_TLDS.map((tld) => (
            <button
              key={tld}
              type="button"
              onClick={() => {
                const base = (q.trim().replace(/^https?:\/\//, "").split(".")[0] || "").trim();
                if (!base) return document.getElementById(inputId)?.focus();
                const next = `${base}${tld}`;
                setQ(next);
                void run(next);
              }}
              className="rounded-full bg-surface px-3 py-1 font-semibold text-heading ring-1 ring-line hover:bg-card-soft dark:bg-card"
            >
              {tld}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite" className="mx-auto mt-8 max-w-4xl">
        {state === "error" && error && <p role="alert" className="text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

        {state === "done" && data && (
          <div className="grid gap-5">
            {exact && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-6 gap-y-5 rounded-3xl p-6 sm:p-8 md:flex-nowrap",
                  exact.available ? "bg-deep-700 text-white dark:bg-white/[0.08]" : "bg-surface ring-1 ring-line dark:bg-card",
                )}
              >
                <div className="min-w-0 basis-full md:basis-0 md:flex-1">
                  <p className={cn("flex items-center gap-2 text-sm font-semibold", exact.available ? "text-brand-green" : "text-muted")}>
                    {exact.available ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
                    {exact.available ? t.available : t.taken}
                  </p>
                  <p className={cn("mt-1 text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight [overflow-wrap:anywhere]", exact.available ? "text-white" : "text-heading")}>
                    {(exact.available ? t.exactAvailable : t.exactTaken).split("{domain}").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="[word-break:break-all]">{exact.domain}</span>}
                      </span>
                    ))}
                  </p>
                  {!exact.available && <p className="mt-1 text-sm text-muted">{t.exactTakenHint}</p>}
                </div>
                {exact.available && exact.price != null && (
                  <div className="flex w-full items-center justify-between gap-5 md:w-auto">
                    <div className="md:text-right">
                      <p className="text-2xl font-bold tabular-nums">
                        {money(exact.price)}
                        <span className="text-sm font-medium text-white/70">{t.perYear}</span>
                      </p>
                      {exact.renewal && exact.renewal !== exact.price && <p className="text-xs text-white/70">{t.renews.replace("{price}", money(exact.renewal))}</p>}
                    </div>
                    <button type="button" disabled={!canBuy} onClick={() => setBuying(exact)} className={cn(buttonClasses("primary", "lg"), "h-12 disabled:opacity-50")}>
                      {t.buy}
                    </button>
                  </div>
                )}
              </div>
            )}

            {others.length > 0 && (
              <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line dark:bg-card">
                <h3 className="border-b border-line px-6 py-3 text-sm font-semibold text-muted">{t.others}</h3>
                <ul className="divide-y divide-line">{others.map(row)}</ul>
              </section>
            )}
            {suggestions.length > 0 && (
              <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line dark:bg-card">
                <h3 className="flex items-center gap-1.5 border-b border-line px-6 py-3 text-sm font-semibold text-muted">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                  {t.suggestions}
                </h3>
                <ul className="divide-y divide-line">{suggestions.map(row)}</ul>
              </section>
            )}
            {!canBuy && (
              <p className="flex items-center justify-center gap-1.5 text-center text-sm font-medium text-heading">
                <Info className="h-4 w-4 text-muted" aria-hidden />
                {t.soon}
              </p>
            )}
            {data.source === "rdap" && <p className="text-center text-xs text-muted">{t.referenceNote}</p>}
          </div>
        )}

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {t.perks.map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {buying && buying.price != null && (
        <CheckoutDialog locale={locale} domain={buying.domain} price={buying.price} renewal={buying.renewal} money={money} onClose={() => setBuying(null)} />
      )}
    </div>
  );
}
