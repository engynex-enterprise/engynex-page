"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Accordion, type AccordionItem } from "@/components/Accordion";
import { cn } from "@/lib/utils";

export interface BFaqCategory {
  id: string;
  label: string;
}

export interface BFaqGroup {
  /** Ancla del grupo (#pagos, #desarrollo-web…). */
  id: string;
  category: string;
  title: string;
  /** Página donde vive la información completa. */
  href?: string;
  items: AccordionItem[];
}

/**
 * Explorador de preguntas frecuentes al estilo de meta.com/help: fila de
 * temas en píldoras y, debajo, los grupos de preguntas del tema elegido.
 *
 * Todos los grupos se pintan en el HTML (los demás quedan con `hidden`), así
 * que el contenido completo es indexable. Si la URL trae un ancla de grupo
 * (#pagos), se abre su tema y se desplaza hasta él.
 */
export function BFaqExplorer({
  categories,
  groups,
  filterLabel,
  viewPage,
  countLabel,
}: {
  categories: BFaqCategory[];
  groups: BFaqGroup[];
  filterLabel: string;
  viewPage: string;
  /** "{n} preguntas". */
  countLabel: string;
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    /** Abre el tema del grupo `id` y lleva la vista hasta él. */
    const reveal = (id: string) => {
      const group = groups.find((g) => g.id === id);
      if (!group) return false;
      setActive(group.category);
      // Dos cuadros: el primero pinta el tema, el segundo ya puede medir.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(id)?.scrollIntoView({ block: "start" }),
        ),
      );
      return true;
    };
    const fromHash = () =>
      reveal(decodeURIComponent(window.location.hash.slice(1)));

    // Los enlaces de Next a un ancla de esta misma página (resultados del
    // buscador) cambian la URL con pushState, sin "hashchange".
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href*='#']");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.pathname !== window.location.pathname) return;
      reveal(decodeURIComponent(link.hash.slice(1)));
    };

    const frame = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", onClick, true);
    };
  }, [groups]);

  const countFor = (category: string) =>
    groups
      .filter((g) => g.category === category)
      .reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div>
      <div
        role="group"
        aria-label={filterLabel}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        {categories.map((category) => {
          const selected = category.id === active;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(category.id)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-action",
                selected
                  ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                  : "bg-card text-heading hover:bg-card-soft",
              )}
            >
              {category.label}
              <span
                className={cn(
                  "text-xs font-medium",
                  selected ? "text-white/75 dark:text-deep-700/75" : "text-muted",
                )}
              >
                {countFor(category.id)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-12 grid gap-14 sm:mt-16">
        {groups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`${group.id}-title`}
            hidden={group.category !== active}
            className="scroll-mt-32"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div>
                <h2
                  id={`${group.id}-title`}
                  className="text-2xl leading-tight text-heading sm:text-[1.75rem]"
                >
                  {group.title}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {countLabel.replace("{n}", String(group.items.length))}
                </p>
              </div>
              {group.href && (
                <Link
                  href={group.href}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
                >
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  {viewPage}
                  <span className="sr-only">: {group.title}</span>
                </Link>
              )}
            </div>
            <Accordion items={group.items} defaultOpen={null} className="mt-4" />
          </section>
        ))}
      </div>
    </div>
  );
}
