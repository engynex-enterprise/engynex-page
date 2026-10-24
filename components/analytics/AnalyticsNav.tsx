"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { analyticsProCopy } from "@/content/analyticsPro";
import { ANALYTICS_RANGES } from "@/lib/analyticsRange";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", path: "" },
  { key: "acquisition", path: "/adquisicion" },
  { key: "behavior", path: "/comportamiento" },
  { key: "conversions", path: "/conversiones" },
  { key: "live", path: "/en-vivo" },
  { key: "visitors", path: "/visitantes" },
] as const;

/**
 * Pestañas de la analítica y el selector de periodo (se conserva al cambiar
 * de pestaña). "En vivo" y "Visitantes" no usan periodo.
 */
export function AnalyticsNav({ locale, live }: { locale: Locale; live?: number }) {
  const t = analyticsProCopy[locale];
  const pathname = usePathname();
  const params = useSearchParams();
  const r = params.get("r") ?? "30";
  const base = `/${locale}/portal/analitica`;
  const current = TABS.find((x) => pathname === base + x.path)?.key ?? "overview";
  const withRange = current !== "live" && current !== "visitors";
  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
      <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.key === current;
          const keep = tab.key !== "live" && tab.key !== "visitors" && r !== "30" ? `?r=${r}` : "";
          return (
            <Link
              key={tab.key}
              href={base + tab.path + keep}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                active ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {tab.key === "live" && (
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              {t.nav[tab.key]}
              {tab.key === "live" && live != null && live > 0 && <span className="rounded-md bg-emerald-100 px-1.5 text-xs tabular-nums text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">{live}</span>}
            </Link>
          );
        })}
      </nav>
      {withRange && (
        <div role="group" aria-label="Periodo" className="my-2 flex rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]">
          {ANALYTICS_RANGES.map((x) => (
            <Link
              key={x}
              href={`${pathname}?r=${x}`}
              aria-current={x === r ? "true" : undefined}
              className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", x === r ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
            >
              {t.ranges[x]}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
