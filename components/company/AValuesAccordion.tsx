"use client";

import { useId, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AValueItem {
  title: string;
  description: string;
  practice: string[];
}

/**
 * Lista de principios al estilo "Our principles" de about.meta.com: tarjetas
 * grises redondeadas que se abren de una en una con el botón + / −. La
 * primera arranca abierta.
 */
export function AValuesAccordion({
  items,
  practiceLabel,
  expandLabel,
  collapseLabel,
}: {
  items: AValueItem[];
  practiceLabel: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const expanded = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const headingId = `${baseId}-heading-${i}`;
        return (
          <li key={item.title} className="rounded-3xl bg-surface-soft">
            <h3 id={headingId} className="text-heading">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center justify-between gap-6 rounded-3xl px-6 py-6 text-left text-[clamp(1.25rem,2vw,1.5rem)] font-bold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action sm:px-8"
              >
                <span>{item.title}</span>
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors",
                    expanded
                      ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                      : "bg-surface text-heading",
                  )}
                >
                  {expanded ? (
                    <Minus className="h-5 w-5" aria-hidden />
                  ) : (
                    <Plus className="h-5 w-5" aria-hidden />
                  )}
                  <span className="sr-only">
                    {expanded ? collapseLabel : expandLabel}
                  </span>
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              hidden={!expanded}
              className="px-6 pb-8 sm:px-8"
            >
              <p className="max-w-xl text-lg leading-relaxed text-body">
                {item.description}
              </p>
              <p className="mt-6 text-sm font-bold text-heading">
                {practiceLabel}
              </p>
              <ul className="mt-3 space-y-2.5">
                {item.practice.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 text-base leading-relaxed text-muted"
                  >
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
