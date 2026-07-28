"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/dictionaries";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/** Tiempo por testimonio (ms). */
const ROTATE_MS = 8000;

type Copy = Dictionary["testimonials"];

/**
 * Un solo testimonio a la vez, en tipografía grande y centrada.
 *
 * Sin tarjetas ni panel lateral: la cita es la sección. Debajo, las iniciales
 * de cada cliente hacen de navegación, y la activa lleva el anillo de progreso.
 */
export function Testimonials({
  testimonials,
  tone = "light",
}: {
  testimonials: Copy;
  tone?: "mesh" | "light" | "muted";
}) {
  const items = testimonials.items;
  const total = items.length;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStart = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => setCurrent(((index % total) + total) % total),
    [total],
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return;
    const timer = window.setTimeout(next, ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [current, paused, reduceMotion, next, total]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStart.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  return (
    <Section tone={tone}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="mx-auto max-w-4xl text-center"
      >
        <Eyebrow className="justify-center">{testimonials.eyebrow}</Eyebrow>

        {/* Citas apiladas en la misma celda: la altura la marca la más larga */}
        <div className="mt-10 grid min-w-0 grid-cols-1">
          {items.map((item, i) => {
            const active = i === current;
            return (
              <figure
                key={item.name}
                inert={!active}
                aria-hidden={!active}
                className={cn(
                  "col-start-1 row-start-1 min-w-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
                )}
              >
                <blockquote>
                  <p className="text-balance font-sans text-[clamp(1.5rem,3.1vw,2.5rem)] font-extrabold leading-[1.2] tracking-[-0.025em] text-heading">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </blockquote>

                <figcaption className="mt-10 flex flex-col items-center gap-1.5">
                  <span className="flex gap-0.5 text-brand-green">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden
                      />
                    ))}
                  </span>
                  <p className="mt-2 text-base font-extrabold text-heading">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted">{item.role}</p>
                  {item.metric && (
                    <p className="mt-3 text-sm font-extrabold text-accent">
                      {item.metric}
                    </p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Navegación: iniciales de cada cliente */}
        <div
          role="tablist"
          aria-label={testimonials.title}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {items.map((item, i) => {
            const active = i === current;
            return (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={item.name}
                title={`${item.name} · ${item.company ?? item.role}`}
                onClick={() => goTo(i)}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-full text-xs font-extrabold transition-all duration-300",
                  active
                    ? "bg-gradient-to-br from-brand-green to-brand-blue text-navy-950"
                    : "bg-surface-soft text-muted ring-1 ring-line hover:text-heading hover:ring-line-strong",
                )}
              >
                {initials(item.name)}
                {/* Riel de progreso del testimonio activo */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-3 left-1/2 block h-0.5 w-11 -translate-x-1/2 overflow-hidden rounded-full bg-line"
                  >
                    <span
                      key={current}
                      data-paused={paused}
                      style={
                        {
                          "--slide-duration": `${ROTATE_MS}ms`,
                        } as React.CSSProperties
                      }
                      className="slide-progress block h-full w-full bg-brand-green"
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-12 text-sm text-muted">
          <span className="font-extrabold text-heading">
            {testimonials.ratingValue}
          </span>{" "}
          · {testimonials.ratingNote}
        </p>
      </div>
    </Section>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
