"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Clock, Headset, Mail, MessageCircle, Search } from "lucide-react";
import { card } from "@/components/clientPortal/shared";
import { buttonClasses } from "@/components/ui/Button";
import { clientPortalCopy } from "@/content/clientPortal";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Faq = { cat: string; q: string; a: string };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Centro de ayuda del portal: buscador de preguntas, guías y canales. */
export function HelpCenter({ locale, general }: { locale: Locale; general: { q: string; a: string }[] }) {
  const t = clientPortalCopy[locale].help;
  const faqs: Faq[] = [...t.faqs, ...general.map((f) => ({ cat: "general", ...f }))];
  const cats = Object.keys(t.categories).filter((c) => faqs.some((f) => f.cat === c));
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const q = norm(useDeferredValue(query).trim());
  const shown = faqs.filter((f) => (!cat || f.cat === cat) && (!q || norm(`${f.q} ${f.a}`).includes(q)));
  const base = `/${locale}/portal`;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="grid min-w-0 content-start gap-5 lg:col-span-2">
        <section className={card}>
          <label className="relative block">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-4 text-[0.95rem] text-heading focus:border-deep-700 dark:bg-card dark:focus:border-brand-green"
              style={{ outline: "none" }}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t.faqsTitle}>
            {[null, ...cats].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                className={cn(
                  "h-8 rounded-full px-3 text-sm transition-colors",
                  cat === c ? "bg-deep-700 font-semibold text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
                )}
              >
                {c ? t.categories[c] : t.all}
              </button>
            ))}
          </div>

          <h2 className="mb-1 mt-6 text-base font-semibold text-heading">{t.faqsTitle}</h2>
          {shown.length === 0 ? (
            <p className="py-4 text-sm text-muted">{t.noResults}</p>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((f) => (
                <li key={f.q}>
                  <details className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-3 text-[0.95rem] font-medium text-heading [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">{f.q}</span>
                      <span className="hidden shrink-0 text-xs text-muted sm:inline">{t.categories[f.cat]}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="pb-3 pr-6 text-sm leading-relaxed text-body">{f.a}</p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-heading">{t.guidesTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.guides.map((g) => (
              <div key={g.key} className={card}>
                <h3 className="font-semibold text-heading">{g.title}</h3>
                <ol className="mt-3 grid gap-2">
                  {g.steps.map((s, i) => (
                    <li key={s} className="flex gap-2.5 text-sm text-body">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--meta-active)] text-[0.7rem] font-semibold tabular-nums text-heading">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 content-start gap-5">
        <section className={card}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-green text-deep-700">
            <Headset className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-4 font-semibold text-heading">{t.cta}</h2>
          <p className="mt-1 text-sm text-muted">{t.ctaDesc}</p>
          <Link href={`${base}/soporte/nueva`} className={cn(buttonClasses("primary", "md"), "mt-4 h-10 w-full")}>
            {t.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold text-heading">{t.contactTitle}</h2>
          <ul className="-mx-2 grid gap-0.5">
            <li>
              <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--meta-hover)]">
                <MessageCircle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{t.whatsapp}</span>
                  <span className="block text-sm font-medium text-heading">{siteConfig.phone}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--meta-hover)]">
                <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{t.email}</span>
                  <span className="block truncate text-sm font-medium text-heading">{siteConfig.email}</span>
                </span>
              </a>
            </li>
            <li className="flex items-center gap-3 px-2 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs text-muted">{t.hours}</span>
                <span className="block text-sm font-medium text-heading">{siteConfig.hours[locale]}</span>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
