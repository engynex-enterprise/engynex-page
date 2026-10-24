"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AMilestone {
  year: string;
  title: string;
  desc: string;
  image: string;
  imageAlt: string;
}

/**
 * "Our history" de about.meta.com: un eje horizontal con todos los años
 * (los años con hito llevan punto y se pueden pulsar) y, debajo, un carrusel
 * de tarjetas con foto a la izquierda y fecha + texto a la derecha, con
 * botones redondos de anterior / siguiente.
 */
export function AHistoryTimeline({
  milestones,
  axisLabel,
  carouselLabel,
  prevLabel,
  nextLabel,
  counterTemplate,
}: {
  milestones: AMilestone[];
  axisLabel: string;
  carouselLabel: string;
  prevLabel: string;
  nextLabel: string;
  /** "Hito {i} de {n}" */
  counterTemplate: string;
}) {
  const [current, setCurrent] = useState(0);
  const total = milestones.length;

  const first = Number(milestones[0]?.year);
  const last = Number(milestones[total - 1]?.year);
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const indexByYear = new Map(milestones.map((m, i) => [Number(m.year), i]));
  const activeYear = Number(milestones[current]?.year);
  const progress = last > first ? (activeYear - first) / (last - first) : 0;

  const go = (index: number) =>
    setCurrent(Math.min(Math.max(index, 0), total - 1));

  const counter = counterTemplate
    .replace("{i}", String(current + 1))
    .replace("{n}", String(total));

  return (
    <div>
      {/* Eje de años */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="relative min-w-[38rem] px-8 py-2">
          <div
            aria-hidden
            className="absolute left-8 right-8 top-[calc(2.75rem-1px)] h-0.5 rounded-full bg-line-strong"
          />
          <div
            aria-hidden
            className="absolute left-8 top-[calc(2.75rem-1px)] h-0.5 rounded-full bg-deep-700 transition-[width] duration-500 ease-out dark:bg-white"
            style={{ width: `calc((100% - 4rem) * ${progress})` }}
          />
          <ol
            aria-label={axisLabel}
            className="relative flex justify-between"
          >
            {years.map((year) => {
              const index = indexByYear.get(year);
              const isMilestone = index !== undefined;
              const active = index === current;
              return (
                <li
                  key={year}
                  className="relative flex w-0 flex-col items-center"
                >
                  {isMilestone ? (
                    <button
                      type="button"
                      onClick={() => go(index)}
                      aria-current={active ? "step" : undefined}
                      aria-label={`${year}: ${milestones[index].title}`}
                      className="group flex flex-col items-center rounded-full px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action"
                    >
                      <span
                        className={cn(
                          "block h-6 text-sm font-bold leading-6 transition-colors",
                          active ? "text-heading" : "text-muted group-hover:text-heading",
                        )}
                      >
                        {year}
                      </span>
                      <span className="flex h-6 items-center" aria-hidden>
                      <span
                        className={cn(
                          "block rounded-full transition-all",
                          active
                            ? "h-4 w-4 bg-action ring-4 ring-surface"
                            : "h-3 w-3 bg-deep-700 ring-4 ring-surface dark:bg-white",
                        )}
                      />
                      </span>
                    </button>
                  ) : (
                    <>
                      <span className="block h-6 text-xs leading-6 text-muted">
                        {year}
                      </span>
                      <span aria-hidden className="flex h-6 items-center">
                        <span className="block h-2.5 w-px bg-line-strong" />
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Carrusel de hitos */}
      <section
        aria-roledescription="carousel"
        aria-label={carouselLabel}
        className="mt-12 sm:mt-16"
      >
        <div className="overflow-hidden">
          <ul
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {milestones.map((m, i) => (
              <li
                key={m.year}
                aria-roledescription="slide"
                aria-label={`${m.year} · ${m.title}`}
                aria-hidden={i !== current}
                inert={i !== current}
                className="w-full shrink-0"
              >
                <article className="grid overflow-hidden rounded-3xl bg-surface-soft md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[24rem]">
                    <Image
                      src={m.image}
                      alt={m.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-8 sm:p-12">
                    <p className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-none tracking-[-0.02em] text-heading">
                      {m.year}
                    </p>
                    <h3 className="mt-5 text-2xl leading-snug text-heading">
                      {m.title}
                    </h3>
                    <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">
                      {m.desc}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            {counter}
          </p>
          <div className="flex gap-2">
            <RoundButton
              label={prevLabel}
              disabled={current === 0}
              onClick={() => go(current - 1)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </RoundButton>
            <RoundButton
              label={nextLabel}
              disabled={current === total - 1}
              onClick={() => go(current + 1)}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </RoundButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoundButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-12 w-12 place-items-center rounded-full bg-surface-soft text-heading transition-colors hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface-soft dark:focus-visible:ring-action"
    >
      {children}
    </button>
  );
}
