"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Quote,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Decor } from "@/components/Decor";
import type { Dictionary } from "@/i18n/dictionaries";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/** Tiempo por testimonio (ms). */
const ROTATE_MS = 8000;

type Copy = Dictionary["testimonials"];

export function Testimonials({
  testimonials,
  tone = "mesh",
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
    <Section tone={tone} containerClassName="relative">
      <Decor className="opacity-60" />

      <div className="relative">
        <SectionHeading
          eyebrow={testimonials.eyebrow}
          title={testimonials.title}
          subtitle={testimonials.subtitle}
        />

        {/* Resumen de valoración */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="flex gap-0.5 text-brand-green">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" aria-hidden />
            ))}
          </span>
          <span className="text-sm font-extrabold text-heading">
            {testimonials.ratingValue}
          </span>
          <span aria-hidden className="h-4 w-px bg-line-strong" />
          <span className="text-sm font-semibold text-body">
            {testimonials.ratingNote}
          </span>
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8"
        >
          {/* -------- Testimonio destacado -------- */}
          <div className="relative grid min-w-0 grid-cols-1">
            {items.map((item, i) => {
              const active = i === current;
              return (
                <figure
                  key={item.name}
                  inert={!active}
                  aria-hidden={!active}
                  className={cn(
                    "relative col-start-1 row-start-1 flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-line bg-card p-8 shadow-card transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-10",
                    active
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-3 opacity-0",
                  )}
                >
                  {/* Marca de agua: dentro del recorte de la tarjeta, si no
                      queda cortada y parece un artefacto. */}
                  <Quote
                    aria-hidden
                    className="pointer-events-none absolute right-6 top-16 h-40 w-40 text-heading/[0.035]"
                    strokeWidth={1}
                  />

                  <div className="relative flex items-center justify-between gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-navy-950 shadow-lg shadow-brand-blue/20">
                      <Quote className="h-6 w-6" strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className="flex gap-0.5 text-brand-green">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="h-4 w-4 fill-current"
                          aria-hidden
                        />
                      ))}
                    </span>
                  </div>

                  <blockquote className="relative mt-7 flex-1">
                    <p className="text-xl font-semibold leading-relaxed text-heading sm:text-2xl sm:leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </blockquote>

                  {item.metric && (
                    <p className="relative mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-extrabold text-accent">
                      <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                      {item.metric}
                    </p>
                  )}

                  <figcaption className="relative mt-7 flex items-center gap-4 border-t border-line pt-6">
                    <Avatar name={item.name} size="lg" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-heading">{item.name}</p>
                      <p className="truncate text-sm text-muted">{item.role}</p>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          {/* -------- Selector de testimonios -------- */}
          <div className="flex min-w-0 flex-col gap-3">
            <div
              role="tablist"
              aria-label={testimonials.title}
              className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto lg:flex-col lg:overflow-visible"
            >
              {items.map((item, i) => {
                const active = i === current;
                return (
                  <button
                    key={item.name}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goTo(i)}
                    className={cn(
                      "group relative flex min-w-56 flex-1 items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 lg:min-w-0",
                      active
                        ? "border-brand-green/45 bg-card shadow-card"
                        : "border-line bg-card/60 hover:border-brand-green/30 hover:bg-card",
                    )}
                  >
                    <Avatar name={item.name} dimmed={!active} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-heading">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.company ?? item.role}
                      </span>
                    </span>

                    {/* Progreso del testimonio activo */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 block h-0.5 overflow-hidden bg-line"
                      >
                        <span
                          key={current}
                          data-paused={paused}
                          style={
                            {
                              "--slide-duration": `${ROTATE_MS}ms`,
                            } as React.CSSProperties
                          }
                          className="slide-progress block h-full w-full bg-gradient-to-r from-brand-green to-brand-blue"
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Controles */}
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold tabular-nums text-muted">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 opacity-50">/</span>
                {String(total).padStart(2, "0")}
              </span>
              <span className="flex gap-2">
                <NavButton label={testimonials.prev} onClick={prev}>
                  <ChevronLeft className="h-5 w-5" />
                </NavButton>
                <NavButton label={testimonials.next} onClick={next}>
                  <ChevronRight className="h-5 w-5" />
                </NavButton>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-heading transition-all hover:border-brand-green hover:bg-brand-green hover:text-navy-950"
    >
      {children}
    </button>
  );
}

/** Monograma con las iniciales del cliente. */
function Avatar({
  name,
  size = "md",
  dimmed = false,
}: {
  name: string;
  size?: "md" | "lg";
  dimmed?: boolean;
}) {
  const initials = name
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
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-blue font-extrabold text-navy-950 transition-opacity duration-300",
        size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm",
        dimmed && "opacity-55 group-hover:opacity-100",
      )}
    >
      {initials}
    </span>
  );
}
