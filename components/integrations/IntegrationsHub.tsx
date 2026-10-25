"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { integrationsHubCopy } from "@/content/integrationsHub";
import type { Locale } from "@/i18n/config";
import { INTEGRATION_CATEGORIES, INTEGRATIONS, type IntegrationCategory } from "@/lib/integrationCatalog";
import { cn } from "@/lib/utils";
import { BUILTIN_PATH, firstLink } from "./helpers";
import { IntegrationLogo, PricingBadge, StatusPill, type IntegrationStatus } from "./shared";

/**
 * Centro de integraciones: búsqueda, categorías, filtro por estado y una
 * tarjeta por integración con su estado, precio y enlaces del proveedor.
 */
export function IntegrationsHub({
  locale,
  statuses,
  summaries,
}: {
  locale: Locale;
  statuses: Record<string, IntegrationStatus>;
  summaries: Record<string, string>;
}) {
  const t = integrationsHubCopy[locale];
  const [cat, setCat] = useState<IntegrationCategory | "all">("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const base = `/${locale}/portal/integraciones`;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: INTEGRATIONS.length };
    for (const d of INTEGRATIONS) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, []);

  const list = INTEGRATIONS.filter((d) => {
    const s = statuses[d.slug];
    const term = q.trim().toLowerCase();
    return (
      (cat === "all" || d.category === cat) &&
      (status === "all" || (status === "builtin" ? s === "builtin" || s === "via" : s === status)) &&
      (!term || [d.name, d.vendor, summaries[d.slug] ?? "", t.categories[d.category]].some((v) => v.toLowerCase().includes(term)))
    );
  });

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(["all", ...INTEGRATION_CATEGORIES] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={cat === key}
              onClick={() => setCat(key)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                cat === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.categories[key]}
              <span className="rounded-full bg-[var(--meta-active)] px-1.5 text-xs tabular-nums text-heading">{counts[key] ?? 0}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label className="sr-only" htmlFor="integration-search">{t.search}</label>
          <input
            ref={searchRef}
            id="integration-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="h-9 w-72 max-w-full rounded-[10px] bg-transparent pl-9 pr-8 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line px-1 text-[0.7rem] text-muted">/</kbd>
        </div>
        <div className="w-52">
          <Select
            size="sm"
            label={t.statusFilter.all}
            value={status}
            onChange={setStatus}
            options={Object.entries(t.statusFilter).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {list.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((d) => {
              const s = statuses[d.slug] ?? "off";
              const account = firstLink(d, ["account", "console"]);
              const docs = firstLink(d, ["docs", "help"]);
              const href = d.builtin ? `${base}/${BUILTIN_PATH[d.builtin]}` : `${base}/${d.slug}`;
              return (
                <li key={d.slug} className="flex flex-col rounded-xl border border-line bg-surface p-5 dark:bg-card">
                  <div className="flex items-start gap-3">
                    <IntegrationLogo def={d} />
                    <div className="min-w-0 flex-1">
                      <Link href={href} className="block truncate text-[0.98rem] font-semibold text-heading hover:underline">
                        {d.name}
                      </Link>
                      <p className="text-xs text-muted">{t.by.replace("{vendor}", d.vendor)}</p>
                    </div>
                    <PricingBadge pricing={d.pricing} label={t.pricing[d.pricing]} />
                  </div>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-body">{summaries[d.slug] ?? t.categories[d.category]}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusPill status={s} label={t.status[s]} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
                    {account && (
                      <a href={account.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-heading">
                        {t.openAccount}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">{t.external}</span>
                      </a>
                    )}
                    {docs && (
                      <a href={docs.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-heading">
                        {t.docs}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">{t.external}</span>
                      </a>
                    )}
                    <Link href={href} className="ml-auto inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                      {d.builtin ? t.open : t.configure}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
