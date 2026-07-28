"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ParallaxLayer } from "@/components/ui/Parallax";
import { buttonClasses } from "@/components/ui/Button";
import type { HeroSlide } from "@/lib/heroSlides";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/** Tiempo que permanece visible cada slide (ms). */
const SLIDE_DURATION = 7000;

export interface HeroSliderControls {
  prev: string;
  next: string;
  pause: string;
  play: string;
  slideLabel: string;
}

/**
 * Hero editorial a sangre completa.
 *
 * Un solo mensaje por slide (kicker, titular, una línea de apoyo y una acción)
 * sobre la fotografía, sin adornos flotantes: la jerarquía la marca la
 * tipografía y el espacio en blanco, no la decoración.
 */
export function HeroSlider({
  slides,
  controls,
}: {
  slides: HeroSlide[];
  controls: HeroSliderControls;
}) {
  const [current, setCurrent] = useState(0);
  /** Pausa explícita del usuario (botón). Se mantiene aunque salga el mouse. */
  const [userPaused, setUserPaused] = useState(false);
  /** Pausa temporal por hover o foco dentro del slider. */
  const [hovering, setHovering] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStart = useRef<number | null>(null);

  const total = slides.length;
  const paused = userPaused || hovering;

  const goTo = useCallback(
    (index: number) => setCurrent(((index % total) + total) % total),
    [total],
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return;
    const timer = window.setTimeout(next, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [current, paused, reduceMotion, next, total]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStart.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 55) {
      if (delta < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={controls.slideLabel}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative isolate flex min-h-[38rem] flex-col overflow-hidden bg-navy-950 text-white lg:min-h-[86vh]"
    >
      {/* Fotografía a sangre con fundido cruzado y zoom lento */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Una sola capa de parallax para las cinco fotos: se desplazan algo
            más lento que la página mientras el hero sale de pantalla. */}
        <ParallaxLayer distance={80}>
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-out",
              i === current ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover",
                reduceMotion
                  ? "scale-105"
                  : cn(
                      "transition-transform duration-[10000ms] ease-out",
                      i === current ? "scale-110" : "scale-100",
                    ),
              )}
            />
          </div>
        ))}
        </ParallaxLayer>

        {/* Los velos no se mueven: si lo hicieran, se verían los bordes. */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-navy-950/55" />
      </div>

      {/* Contenido */}
      <Container className="relative flex flex-1 items-center">
        <div className="grid w-full min-w-0 grid-cols-1 pt-36 pb-16 sm:pt-44 lg:pt-40 lg:pb-24">
          {slides.map((slide, i) => (
            <Slide
              key={slide.key}
              slide={slide}
              active={i === current}
              index={i}
              total={total}
            />
          ))}
        </div>
      </Container>

      {/* Barra inferior: indicadores numerados + controles */}
      {total > 1 && (
        <Container className="relative pb-8 sm:pb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div
              role="tablist"
              aria-label={controls.slideLabel}
              className="no-scrollbar -mx-1 flex min-w-0 gap-6 overflow-x-auto px-1 sm:gap-8"
            >
              {slides.map((slide, i) => {
                const isActive = i === current;
                return (
                  <button
                    key={slide.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${controls.slideLabel} ${i + 1}: ${slide.navLabel}`}
                    onClick={() => goTo(i)}
                    className="group flex shrink-0 flex-col gap-2.5 pt-1 text-left"
                  >
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-[0.62rem] font-semibold tabular-nums transition-colors",
                          isActive ? "text-brand-green" : "text-white/35",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-[0.8rem] font-semibold tracking-tight transition-colors",
                          isActive
                            ? "text-white"
                            : "text-white/50 group-hover:text-white/80",
                        )}
                      >
                        {slide.navLabel}
                      </span>
                    </span>
                    {/* Riel finísimo: el progreso solo se dibuja en el activo */}
                    <span
                      aria-hidden
                      className="block h-px w-24 overflow-hidden bg-white/20 sm:w-28"
                    >
                      {isActive && (
                        <span
                          key={current}
                          data-paused={paused}
                          style={
                            {
                              "--slide-duration": `${SLIDE_DURATION}ms`,
                            } as React.CSSProperties
                          }
                          className="slide-progress block h-full w-full bg-brand-green"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ControlButton
                label={userPaused ? controls.play : controls.pause}
                onClick={() => setUserPaused((value) => !value)}
              >
                {userPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </ControlButton>
              <ControlButton label={controls.prev} onClick={prev}>
                <ChevronLeft className="h-5 w-5" />
              </ControlButton>
              <ControlButton label={controls.next} onClick={next}>
                <ChevronRight className="h-5 w-5" />
              </ControlButton>
            </div>
          </div>
        </Container>
      )}
    </section>
  );
}

function ControlButton({
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
    >
      {children}
    </button>
  );
}

function Slide({
  slide,
  active,
  index,
  total,
}: {
  slide: HeroSlide;
  active: boolean;
  index: number;
  total: number;
}) {
  // Entrada escalonada: un mismo desplazamiento corto para todos los bloques.
  const anim = cn(
    "transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
    active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
  );
  const delay = (order: number): React.CSSProperties => ({
    transitionDelay: active ? `${100 + order * 110}ms` : "0ms",
  });

  return (
    <div
      // `inert` evita que los slides ocultos reciban foco o clics.
      inert={!active}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}`}
      className={cn(
        "col-start-1 row-start-1 min-w-0 transition-opacity duration-700",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {/* Kicker */}
      <div style={delay(0)} className={cn(anim, "flex items-center gap-3")}>
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            slide.accent === "green" ? "bg-brand-green" : "bg-brand-blue-light",
          )}
        />
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/70">
          {slide.eyebrow}
        </span>
        {slide.badge && (
          <>
            <span aria-hidden className="h-3 w-px bg-white/25" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-green">
              {slide.badge}
            </span>
          </>
        )}
      </div>

      {/* Titular. Usa la tipografía de cuerpo (no la display) para lograr el
          aire de titular editorial; el resto del sitio conserva OpenDyslexic. */}
      <h1
        style={delay(1)}
        className={cn(
          anim,
          "mt-7 max-w-4xl text-[clamp(1.85rem,3.9vw,3.15rem)] font-extrabold tracking-[-0.02em] text-white",
        )}
      >
        {slide.titleLead}{" "}
        {/* La parte destacada va en verde de marca (antes en gris): es lo que
            diferencia un slide de otro de un vistazo. */}
        <span className="text-brand-green">{slide.titleHighlight}</span>
      </h1>

      {/* Línea de apoyo */}
      <p
        style={delay(2)}
        className={cn(
          anim,
          "mt-7 max-w-xl text-lg leading-relaxed text-white/65 sm:text-xl",
        )}
      >
        {slide.subtitle}
      </p>

      {/* Precio, cuando el slide es una oferta concreta */}
      {slide.price && (
        <p
          style={delay(3)}
          className={cn(anim, "mt-8 flex flex-wrap items-baseline gap-x-3")}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {slide.price.label}
          </span>
          <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            {slide.price.value}
          </span>
          <span className="text-sm font-semibold text-brand-green">
            {slide.price.note}
          </span>
        </p>
      )}

      {/* Acciones */}
      <div
        style={delay(4)}
        className={cn(
          anim,
          "mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6",
        )}
      >
        <Link
          href={slide.primary.href}
          className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
        >
          {slide.primary.label}
          <ArrowRight className="h-5 w-5" />
        </Link>
        {slide.secondary && (
          <Link
            href={slide.secondary.href}
            className="group inline-flex items-center gap-2 text-base font-semibold text-white/85 underline-offset-8 transition-colors hover:text-white hover:underline"
          >
            {slide.secondary.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Cifras en una sola línea, sin protagonismo */}
      {slide.stats && (
        <dl
          style={delay(5)}
          className={cn(
            anim,
            "mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/12 pt-6 sm:gap-x-10",
          )}
        >
          {slide.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-lg font-extrabold text-white">
                {stat.value}
              </dd>
              <span className="text-xs font-medium text-white/55">
                {stat.label}
              </span>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
