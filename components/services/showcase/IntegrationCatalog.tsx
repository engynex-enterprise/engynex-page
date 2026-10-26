"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MessageCircle, Search } from "lucide-react";
import type { ShowcaseCopy } from "@/content/servicePages/types";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Catálogo de sistemas que conectamos: búsqueda y filtro por categoría. */
export function IntegrationCatalog({ copy: t }: { copy: NonNullable<ShowcaseCopy["catalog"]> }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const labels = useMemo(() => Object.fromEntries(t.categories.map((c) => [c.key, c.label])), [t.categories]);
  const shown = useMemo(() => {
    const needle = fold(q.trim());
    return t.items.filter((it) => (cat === "all" || it.category === cat) && (!needle || fold(`${it.name} ${it.syncs} ${labels[it.category]}`).includes(needle)));
  }, [t.items, cat, q, labels]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={t.title} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ key: "all", label: t.all }, ...t.categories].map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={cat === c.key}
              onClick={() => setCat(c.key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                cat === c.key ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "bg-surface text-heading ring-1 ring-line hover:bg-[var(--meta-hover,var(--surface-soft))] dark:bg-card",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="relative block lg:w-80">
          <span className="sr-only">{t.searchLabel}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full bg-surface pl-11 pr-4 text-[0.95rem] text-heading ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-green dark:bg-card"
          />
        </label>
      </div>

      <p role="status" className="mt-5 text-sm text-muted">
        {t.count.replace("{n}", String(shown.length))}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((it) => (
            <li key={it.name} className="flex gap-3.5 rounded-2xl bg-surface p-4 dark:bg-white/[0.06]">
              {it.logo ? (
                <span aria-hidden className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl p-2 ring-1 ring-line dark:ring-0", it.logoDark ? "bg-deep-700" : "bg-white")}>
                  <Image src={it.logo} alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                </span>
              ) : (
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-[0.85rem] font-bold text-brand-green-dark dark:text-brand-green">
                  {it.mark ?? it.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2)}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold leading-tight text-heading">{it.name}</p>
                <p className="mt-0.5 text-xs font-medium text-muted">{labels[it.category]}</p>
                <p className="mt-1.5 text-sm leading-snug text-body">{it.syncs}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface p-6 text-center text-sm text-muted dark:bg-white/[0.06]">{t.empty}</p>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] bg-surface p-6 sm:flex-row sm:items-center sm:p-8 dark:bg-white/[0.06]">
        <div>
          <p className="text-lg font-bold text-heading">{t.ctaTitle}</p>
          <p className="mt-1 text-[0.95rem] text-muted">{t.ctaBody}</p>
        </div>
        <a
          href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(q.trim() ? `${t.ctaLabel}: ${q.trim()}` : t.ctaLabel)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-green px-5 text-sm font-semibold text-deep-700 hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t.ctaLabel}
        </a>
      </div>
    </div>
  );
}
