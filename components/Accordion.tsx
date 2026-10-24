"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  q: string;
  a: string;
}

/**
 * Preguntas frecuentes al estilo de meta.com: filas a todo el ancho separadas
 * por filetes finos, pregunta grande en negrita y un botón redondo con "+" /
 * "−" a la derecha; la respuesta aparece debajo en gris, con sangría.
 */
export function Accordion({
  items,
  defaultOpen = 0,
  className,
}: {
  items: AccordionItem[];
  /** Índice abierto al cargar; `null` = todas cerradas. */
  defaultOpen?: number | null;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        const Icon = isOpen ? Minus : Plus;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="text-lg font-bold leading-snug text-heading sm:text-xl">
                  {item.q}
                </span>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-colors duration-200",
                    isOpen
                      ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700 dark:ring-white"
                      : "text-heading ring-line-strong group-hover:bg-card-soft",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-3xl pb-8 pl-0 pr-14 text-base leading-relaxed text-muted sm:pl-6 sm:text-lg">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
