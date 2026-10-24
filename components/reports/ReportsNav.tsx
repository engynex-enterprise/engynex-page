"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { reportsProCopy } from "@/content/reportsPro";
import { REPORT_PERIODS } from "@/lib/reportPeriod";
import { Select } from "@/components/ui/Select";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "panel", path: "" },
  { key: "team", path: "/equipo" },
  { key: "trends", path: "/tendencias" },
  { key: "saved", path: "/guardados" },
] as const;

/**
 * Pestañas de los reportes y el selector de periodo (con fechas propias).
 * "Tendencias" e "Informes guardados" no usan periodo. Imprimir = PDF.
 */
export function ReportsNav({ locale, fromDay, toDay }: { locale: Locale; fromDay?: string; toDay?: string }) {
  const t = reportsProCopy[locale];
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const p = params.get("p") ?? "this_month";
  const base = `/${locale}/portal/reportes`;
  const current = TABS.find((x) => pathname === base + x.path)?.key ?? "panel";
  const withPeriod = current === "panel" || current === "team";
  const [range, setRange] = useState({ from: fromDay ?? "", to: toDay ?? "" });
  const query = (extra: Record<string, string>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    if (extra.p && extra.p !== "custom") {
      q.delete("from");
      q.delete("to");
    }
    return q.toString();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 print:hidden sm:px-6">
      <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const keep = (tab.key === "panel" || tab.key === "team") && params.toString() ? `?${params.toString()}` : "";
          return (
            <Link
              key={tab.key}
              href={base + tab.path + keep}
              aria-current={tab.key === current ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab.key === current ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.nav[tab.key]}
            </Link>
          );
        })}
      </nav>
      <div className="my-2 flex flex-wrap items-center gap-2">
        {withPeriod && (
          <>
            <div className="w-48">
              <Select
                size="sm"
                label={t.periods[p]}
                value={p}
                onChange={(v) => router.push(`${pathname}?${query({ p: v })}`)}
                options={REPORT_PERIODS.map((x) => ({ value: x, label: t.periods[x] }))}
              />
            </div>
            {p === "custom" && (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`${pathname}?${query({ p: "custom", from: range.from, to: range.to })}`);
                }}
              >
                <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} aria-label={t.from} className="h-9 rounded-[10px] bg-[#f4f4f5] px-2 text-sm text-heading dark:bg-white/[0.06]" />
                <span className="text-muted">–</span>
                <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} aria-label={t.to} className="h-9 rounded-[10px] bg-[#f4f4f5] px-2 text-sm text-heading dark:bg-white/[0.06]" />
                <button type="submit" className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                  {t.apply}
                </button>
              </form>
            )}
          </>
        )}
        <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
          <Printer className="h-4 w-4" aria-hidden />
          {t.print}
        </button>
      </div>
    </div>
  );
}
