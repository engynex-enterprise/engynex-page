"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  projects,
  categoryLabels,
  type ProjectCategory,
} from "@/content/portfolio";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Rejilla de proyectos al estilo "The latest from Meta": fotografía con radio
 * de 24 px y, debajo, la categoría, el título en negrita, el resumen y el
 * resultado en una píldora junto a las tecnologías.
 * Los filtros son píldoras grises; la activa va en el color del titular.
 */
export function PortfolioGrid({
  locale,
  allLabel,
  resultLabel,
}: {
  locale: Locale;
  allLabel: string;
  resultLabel: string;
}) {
  const [active, setActive] = useState<ProjectCategory | "all">("all");

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category))),
    [],
  );

  const filtered = useMemo(
    () =>
      active === "all"
        ? projects
        : projects.filter((p) => p.category === active),
    [active],
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2">
        <FilterButton
          active={active === "all"}
          onClick={() => setActive("all")}
        >
          {allLabel}
        </FilterButton>
        {categories.map((cat) => (
          <FilterButton
            key={cat}
            active={active === cat}
            onClick={() => setActive(cat)}
          >
            {categoryLabels[cat][locale]}
          </FilterButton>
        ))}
      </div>

      {/* Rejilla */}
      <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2">
        {filtered.map((project) => {
          const copy = project[locale];
          return (
            <article key={project.slug} className="group flex flex-col">
              <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-surface-soft">
                <Image
                  src={project.image}
                  alt={copy.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="mt-5 px-1">
                <p className="text-sm font-semibold text-accent">
                  {categoryLabels[project.category][locale]}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-heading">
                  {copy.title}
                </h3>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
                  {copy.summary}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="inline-flex items-center rounded-full bg-surface-soft px-4 py-1.5 text-sm text-muted">
                    {resultLabel}:&nbsp;
                    <span className="font-bold text-heading">
                      {copy.result}
                    </span>
                  </p>
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-10 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        active
          ? "bg-heading text-surface"
          : "bg-surface-soft text-heading hover:bg-line",
      )}
    >
      {children}
    </button>
  );
}
