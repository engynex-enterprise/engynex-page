"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { SHOWCASE_ICONS as ICONS } from "@/components/services/showcase/icons";
import type { ShowcaseIcon } from "@/content/servicePages/types";
import { cn } from "@/lib/utils";

export type UseCase = {
  key: string;
  icon: ShowcaseIcon;
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  more: string;
  href: string;
  trigger: string;
  steps: string[];
  systems: string[];
  results: { value: string; label: string }[];
};

/**
 * Explorador de casos de uso: pestañas por área y, para cada una, la receta
 * de la integración (disparador, pasos, sistemas y resultados). Las fichas de
 * arriba de la página enlazan a #sol-<key> y abren la pestaña correspondiente.
 */
export function UseCaseExplorer({
  items,
  labels,
  contactHref,
  quoteLabel,
}: {
  items: UseCase[];
  labels: { triggerLabel: string; stepsLabel: string; systemsLabel: string; resultsLabel: string };
  contactHref: string;
  quoteLabel: string;
}) {
  const [active, setActive] = useState(items[0]?.key);
  useEffect(() => {
    const pick = () => {
      const key = window.location.hash.replace("#sol-", "");
      if (items.some((it) => it.key === key)) setActive(key);
    };
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, [items]);
  const uc = items.find((it) => it.key === active) ?? items[0];
  if (!uc) return null;
  const Icon = ICONS[uc.icon];

  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-6">
      <div role="tablist" aria-orientation="vertical" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((it) => {
          const TabIcon = ICONS[it.icon];
          const on = it.key === uc.key;
          return (
            <button
              key={it.key}
              id={`sol-${it.key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="usecase-panel"
              onClick={() => setActive(it.key)}
              className={cn(
                "flex shrink-0 scroll-mt-40 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors lg:py-3.5",
                on ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "bg-surface-soft text-heading hover:bg-card-soft dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
              )}
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", on ? "bg-brand-green text-deep-700" : "bg-surface text-heading dark:bg-white/10")}>
                <TabIcon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[0.95rem] font-semibold leading-tight lg:whitespace-normal">{it.title}</span>
                <span className={cn("mt-0.5 hidden text-xs leading-snug lg:block", on ? "opacity-75" : "text-muted")}>{it.eyebrow}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="usecase-panel" role="tabpanel" aria-labelledby={`sol-${uc.key}`} className="overflow-hidden rounded-[2rem] bg-surface-soft dark:bg-white/[0.04]">
        <div key={uc.key} className="log-row">
          <div className="relative isolate flex min-h-52 items-end p-6 text-white sm:min-h-60 sm:p-8">
            <Image src={uc.image} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/10" aria-hidden />
            <div className="flex items-end gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-green text-deep-700">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-white/85">{uc.eyebrow}</p>
                <h3 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.05] tracking-tight">{uc.title}</h3>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-10">
            <div>
              <p className="text-[0.97rem] leading-relaxed text-muted">{uc.body}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{labels.stepsLabel}</p>
              <ol className="relative mt-3 grid gap-2.5">
                <span aria-hidden className="absolute bottom-5 left-[1.05rem] top-5 w-0.5 bg-line" />
                <li className="relative flex items-center gap-3 rounded-2xl bg-brand-green px-3 py-2.5 text-deep-700">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deep-700 text-brand-green">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-[0.95rem]">
                    <span className="font-semibold">{labels.triggerLabel} </span>
                    {uc.trigger.charAt(0).toLowerCase() + uc.trigger.slice(1)}
                  </span>
                </li>
                {uc.steps.map((step, i) => (
                  <li key={step} className="relative flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 dark:bg-card">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-soft text-xs font-bold tabular-nums text-heading ring-1 ring-line dark:bg-white/[0.06]">{i + 1}</span>
                    <span className="text-[0.95rem] text-heading">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{labels.systemsLabel}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {uc.systems.map((x) => (
                  <li key={x} className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-heading ring-1 ring-line dark:bg-card">
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{labels.resultsLabel}</p>
              <dl className="mt-3 grid gap-2">
                {uc.results.map((r) => (
                  <div key={r.label} className="flex items-baseline gap-3 rounded-2xl bg-surface px-4 py-3 dark:bg-card">
                    <dt className="sr-only">{r.label}</dt>
                    <dd className="shrink-0 text-xl font-bold tabular-nums text-brand-green-dark dark:text-brand-green">{r.value}</dd>
                    <dd className="text-sm text-body">{r.label}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7 flex flex-wrap gap-2.5 xl:mt-auto xl:pt-7">
                <Link href={contactHref} className={buttonClasses("primary", "md")}>
                  {quoteLabel}
                </Link>
                <Link href={uc.href} className={buttonClasses("outline", "md")}>
                  {uc.more}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
