"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import {
  projects,
  categoryLabels,
  type ProjectCategory,
} from "@/content/portfolio";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

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

  const categories = useMemo(() => {
    const present = Array.from(new Set(projects.map((p) => p.category)));
    return present;
  }, []);

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
      <div className="flex flex-wrap justify-center gap-2.5">
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

      {/* Grid */}
      <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => {
          const copy = project[locale];
          return (
            <article
              key={project.slug}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
            >
              {/* Imagen del proyecto */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={project.image}
                  alt={copy.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-60 mix-blend-multiply",
                    project.gradient,
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-950/60 to-transparent" />
                <div className="absolute left-5 top-5">
                  <span className="rounded-full bg-deep-950/70 px-3 py-1 text-xs font-bold text-ink-100 backdrop-blur">
                    {categoryLabels[project.category][locale]}
                  </span>
                </div>
                {/* El círculo es blanco en los dos temas: el icono debe ser
                    oscuro siempre (antes en oscuro quedaba blanco sobre blanco). */}
                <span className="absolute right-4 top-4 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-deep-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>

              {/* Contenido */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-extrabold text-heading">
                  {copy.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                  {copy.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-body ring-1 ring-line"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <TrendingUp className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {resultLabel}:
                  </span>
                  <span className="text-sm font-extrabold text-heading">
                    {copy.result}
                  </span>
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
      className={cn(
        "rounded-full px-5 py-2 text-sm font-bold transition-all",
        active
          ? "bg-gradient-to-r from-brand-green to-brand-blue text-deep-950 shadow-md shadow-brand-blue/25"
          : "bg-card text-body ring-1 ring-line hover:text-heading hover:ring-brand-green/50",
      )}
    >
      {children}
    </button>
  );
}
