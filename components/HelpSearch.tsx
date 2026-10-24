"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export interface HelpEntry {
  q: string;
  a: string;
  href: string;
  /** Dónde vive la respuesta ("Servicio · Desarrollo Web"). */
  source: string;
}

/** Minúsculas y sin tildes, para que "garantia" encuentre "garantía". */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const MAX_RESULTS = 8;

/**
 * Buscador del centro de ayuda (la barra de meta.com/help). Filtra en el
 * navegador todas las preguntas frecuentes del sitio: cada palabra escrita
 * debe aparecer en la pregunta, la respuesta o su origen. Las preguntas pesan
 * más que las respuestas al ordenar.
 */
export function HelpSearch({
  entries,
  copy,
  contactHref,
}: {
  entries: HelpEntry[];
  copy: Dictionary["help"];
  contactHref: string;
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const resultsId = useId();

  const index = useMemo(
    () =>
      entries.map((entry) => ({
        entry,
        q: normalize(entry.q),
        all: normalize(`${entry.q} ${entry.a} ${entry.source}`),
      })),
    [entries],
  );

  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  const results =
    terms.length === 0
      ? []
      : index
          .filter((item) => terms.every((t) => item.all.includes(t)))
          .map((item) => ({
            entry: item.entry,
            score: terms.filter((t) => item.q.includes(t)).length,
          }))
          .sort((a, b) => b.score - a.score)
          .map((item) => item.entry);

  const searching = terms.length > 0;

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl text-left">
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="flex items-center gap-3 rounded-full bg-surface py-2 pl-5 pr-2 shadow-[0_2px_16px_-2px_rgba(31,42,70,0.18)] ring-1 ring-line focus-within:ring-2 focus-within:ring-deep-700 dark:bg-card dark:focus-within:ring-brand-green"
      >
        <label htmlFor={inputId} className="sr-only">
          {copy.searchLabel}
        </label>
        <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
          aria-controls={resultsId}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-heading outline-none focus-visible:outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" className={buttonClasses("primary", "md", "shrink-0")}>
          {copy.searchButton}
        </button>
      </form>

      <div id={resultsId} aria-live="polite">
        {searching && (
          <div className="mt-4 overflow-hidden rounded-3xl bg-surface ring-1 ring-line dark:bg-card">
            {results.length > 0 ? (
              <>
                <p className="border-b border-line px-6 py-3 text-sm text-muted">
                  {copy.resultsCount.replace("{n}", String(results.length))}
                </p>
                <ul className="divide-y divide-line">
                  {results.slice(0, MAX_RESULTS).map((entry) => (
                    <li key={`${entry.href}-${entry.q}`}>
                      <Link
                        href={entry.href}
                        className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-surface-soft"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-accent">
                            {entry.source}
                          </span>
                          <span className="mt-1 block font-bold text-heading">
                            {entry.q}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted">
                            {entry.a}
                          </span>
                        </span>
                        <ArrowRight
                          className="mt-6 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-col items-start gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-body">{copy.noResults}</p>
                <Link
                  href={contactHref}
                  className={cn(buttonClasses("dark", "md"), "shrink-0")}
                >
                  {copy.noResultsCta}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
