"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  q: string;
  a: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-navy-900/10 overflow-hidden rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white/70 dark:bg-navy-800/70 backdrop-blur">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-navy-900/[0.02]"
            >
              <span className="text-base font-extrabold text-navy-900 dark:text-white">
                {item.q}
              </span>
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green-dark dark:text-brand-green transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 text-slate-600 dark:text-ink-300 leading-relaxed">
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
