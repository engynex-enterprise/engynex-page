"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/dictionaries";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/** Tiempo por testimonio (ms). */
const ROTATE_MS = 8000;

type Copy = Dictionary["testimonials"];
type Item = Copy["items"][number];

/**
 * Un testimonio a la vez, con la foto del cliente y la cita en grande.
 *
 * Debajo, los retratos de los demás hacen de navegación: el activo crece y
 * lleva el anillo de progreso.
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
    // "mesh" se conserva por compatibilidad, pero ya no lleva fondo decorativo.
    <Section tone={tone === "mesh" ? "light" : tone}>
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
        <div className="mt-12 grid min-w-0 grid-cols-1">
          {items.map((item, i) => {
            const active = i === current;
            return (
              <figure
                key={item.name}
                inert={!active}
                aria-hidden={!active}
                className={cn(
                  "col-start-1 row-start-1 flex min-w-0 flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
                )}
              >
                {/* Retrato del cliente */}
                <Avatar item={item} size="lg" />

                <blockquote className="mt-9">
                  <p className="text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.25] tracking-[-0.015em] text-heading">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </blockquote>

                <figcaption className="mt-8 flex flex-col items-center gap-1.5">
                  <span className="flex gap-0.5 text-heading">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden
                      />
                    ))}
                  </span>
                  <p className="mt-2 text-base font-bold text-heading">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted">{item.role}</p>
                  {item.metric && (
                    <p className="mt-4 inline-flex items-center rounded-full bg-surface-soft px-4 py-1.5 text-sm font-bold text-heading">
                      {item.metric}
                    </p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Navegación: los retratos del resto de clientes */}
        <div
          role="tablist"
          aria-label={testimonials.title}
          className="mt-14 flex flex-wrap items-center justify-center gap-4"
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
                  "relative rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-4 focus-visible:ring-offset-surface",
                  active
                    ? "scale-110 ring-2 ring-action ring-offset-4 ring-offset-surface"
                    : "opacity-45 grayscale hover:scale-105 hover:opacity-90 hover:grayscale-0",
                )}
              >
                <Avatar item={item} />
                {/* Riel de progreso del testimonio activo */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-5 left-1/2 block h-0.5 w-12 -translate-x-1/2 overflow-hidden rounded-full bg-line"
                  >
                    <span
                      key={current}
                      data-paused={paused}
                      style={
                        {
                          "--slide-duration": `${ROTATE_MS}ms`,
                        } as React.CSSProperties
                      }
                      className="slide-progress block h-full w-full bg-action"
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-14 text-sm text-muted">
          <span className="font-semibold text-heading">
            {testimonials.ratingValue}
          </span>{" "}
          · {testimonials.ratingNote}
        </p>
      </div>
    </Section>
  );
}

/**
 * Retrato del cliente. Si aún no hay foto cargada, cae a un monograma sobre
 * gris en vez de dejar un hueco.
 */
function Avatar({ item, size = "md" }: { item: Item; size?: "md" | "lg" }) {
  const dimension = size === "lg" ? 112 : 48;

  if (item.avatar) {
    return (
      <Image
        src={item.avatar}
        alt={item.name}
        width={dimension}
        height={dimension}
        className={cn(
          "rounded-full object-cover",
          size === "lg" ? "h-28 w-28" : "h-12 w-12",
        )}
      />
    );
  }

  const initials = item.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-full bg-card-soft font-medium text-heading",
        size === "lg" ? "h-28 w-28 text-3xl" : "h-12 w-12 text-sm",
      )}
    >
      {initials}
    </span>
  );
}
