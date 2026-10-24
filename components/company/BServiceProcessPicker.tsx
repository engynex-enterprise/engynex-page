"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Select } from "@/components/ui/Select";

export interface BServiceProcessEntry {
  slug: string;
  title: string;
  href: string;
  steps: { title: string; description: string; meta: string }[];
}

/**
 * Selector de servicio (desplegable de meta.com) que muestra las etapas del
 * proceso propio de ese servicio, con su duración y entregable.
 */
export function BServiceProcessPicker({
  entries,
  selectLabel,
  viewService,
}: {
  entries: BServiceProcessEntry[];
  selectLabel: string;
  viewService: string;
}) {
  const [slug, setSlug] = useState(entries[0]?.slug ?? "");
  const current = entries.find((entry) => entry.slug === slug) ?? entries[0];
  if (!current) return null;

  return (
    <div className="mx-auto mt-10 max-w-5xl">
      <Select
        label={selectLabel}
        value={slug}
        onChange={setSlug}
        options={entries.map((entry) => ({
          value: entry.slug,
          label: entry.title,
        }))}
        className="mx-auto max-w-md"
      />

      <div aria-live="polite">
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {current.steps.map((step, i) => (
            <li
              key={`${current.slug}-${step.title}`}
              className="flex flex-col rounded-3xl bg-surface-soft p-6 sm:p-8"
            >
              <span className="text-sm font-bold text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl leading-snug text-heading">
                {step.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                {step.description}
              </p>
              <p className="mt-6 flex items-start gap-2 text-sm font-semibold text-heading">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {step.meta}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center">
          <Link
            href={current.href}
            className="inline-flex items-center gap-1.5 text-base font-semibold text-heading hover:underline"
          >
            <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
            {viewService}: {current.title}
          </Link>
        </p>
      </div>
    </div>
  );
}
