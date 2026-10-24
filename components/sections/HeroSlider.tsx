"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import {
  DotGrid,
  GradientBlob,
  OrbitRings,
  PlusMark,
} from "@/components/ui/Backdrop";
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
 * Hero claro, de corte corporativo.
 *
 * Un solo mensaje por slide (kicker, titular, una línea de apoyo y una acción)
 * a la izquierda y la imagen en una tarjeta redondeada a la derecha. Sin velos
 * ni fotografía a sangre: la jerarquía la marcan la tipografía y el espacio en
 * blanco, no la decoración.
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
      className="relative isolate overflow-hidden bg-surface"
    >
      {/* Retícula fina de fondo, desvanecida hacia la izquierda */}
      <div
        aria-hidden
        className="bg-grid-ink pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_75%_40%,black,transparent_65%)]"
      />
      <Container className="relative pt-36 pb-12 sm:pt-40 lg:pt-44 lg:pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          {/* Mensaje de cada slide, apilados en la misma celda */}
          <div className="grid min-w-0 grid-cols-1">
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

          {/* Imagen del slide en una tarjeta redondeada, con fundido cruzado,
              rodeada de figuras de marca y dos tarjetas flotantes de interfaz */}
          <div aria-hidden className="relative">
            <GradientBlob
              opacity={0.22}
              className="-bottom-16 -left-20 h-[26rem] w-[26rem] sm:-left-24"
            />
            <OrbitRings
              spin
              className="-right-14 -top-14 h-48 w-48 text-brand-blue/25 sm:-right-16 sm:-top-16 sm:h-56 sm:w-56"
            />
            <DotGrid className="-bottom-8 -right-6 h-24 w-24 text-brand-green/40" />
            <PlusMark className="-left-6 top-10 h-5 w-5 text-brand-green" />
            <PlusMark className="-top-8 left-1/3 h-3.5 w-3.5 text-brand-blue/60" />

            <div className="relative aspect-[16/11] overflow-hidden rounded-[2rem] bg-card-soft shadow-card-hover lg:aspect-[5/4]">
              {slides.map((slide, i) => (
                <div
                  key={slide.key}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-[1000ms] ease-out",
                    i === current ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className={cn(
                      "object-cover",
                      !reduceMotion &&
                        "transition-transform duration-[8000ms] ease-out",
                      i === current && !reduceMotion ? "scale-105" : "scale-100",
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Tarjeta flotante: mini gráfico de crecimiento */}
            <div className="animate-float absolute -left-4 bottom-8 hidden w-44 rounded-2xl bg-card/95 p-4 shadow-card-hover ring-1 ring-line backdrop-blur sm:block lg:-left-10">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-green/15 text-brand-green-dark dark:text-brand-green">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="h-1.5 w-16 rounded-full bg-line-strong" />
              </div>
              <div className="mt-3 flex h-12 items-end gap-1.5">
                {[35, 55, 45, 70, 62, 90].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-green to-brand-blue"
                    style={{ height: `${h}%`, opacity: 0.45 + i * 0.1 }}
                  />
                ))}
              </div>
            </div>

            {/* Tarjeta flotante: tarea completada */}
            <div className="animate-float-slow absolute -right-3 top-10 hidden items-center gap-3 rounded-2xl bg-card/95 py-3 pl-3 pr-5 shadow-card-hover ring-1 ring-line backdrop-blur sm:flex lg:-right-8">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-green text-navy-950">
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <span className="space-y-1.5">
                <span className="block h-1.5 w-20 rounded-full bg-heading/70" />
                <span className="block h-1.5 w-12 rounded-full bg-line-strong" />
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior: pestañas con progreso + controles */}
        {total > 1 && (
          <div className="mt-14 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-16">
            <div
              role="tablist"
              aria-label={controls.slideLabel}
              className="no-scrollbar -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1"
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
                    className={cn(
                      "relative h-9 shrink-0 overflow-hidden rounded-full px-4 text-sm font-bold transition-colors",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-body hover:bg-card-soft hover:text-heading",
                    )}
                  >
                    {slide.navLabel}
                    {/* Progreso del slide activo, como un subrayado fino */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-x-4 bottom-1 block h-0.5 overflow-hidden rounded-full bg-accent/15"
                      >
                        <span
                          key={current}
                          data-paused={paused}
                          style={
                            {
                              "--slide-duration": `${SLIDE_DURATION}ms`,
                            } as React.CSSProperties
                          }
                          className="slide-progress block h-full w-full bg-accent"
                        />
                      </span>
                    )}
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
        )}
      </Container>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-body transition-colors hover:bg-card-soft hover:text-heading"
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
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        {slide.badge && (
          <span className="rounded-full bg-brand-green/15 px-2.5 py-0.5 text-xs font-bold text-brand-green-dark dark:text-brand-green">
            {slide.badge}
          </span>
        )}
      </div>

      {/* Titular */}
      <h1
        style={delay(1)}
        className={cn(
          anim,
          "mt-6 max-w-2xl text-balance text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold text-heading",
        )}
      >
        {slide.titleLead}{" "}
        <span className="text-gradient-ink">
          {slide.titleHighlight}
        </span>
      </h1>

      {/* Línea de apoyo */}
      <p
        style={delay(2)}
        className={cn(
          anim,
          "mt-6 max-w-xl text-lg leading-relaxed text-body sm:text-xl sm:leading-relaxed",
        )}
      >
        {slide.subtitle}
      </p>

      {/* Precio, cuando el slide es una oferta concreta */}
      {slide.price && (
        <p
          style={delay(3)}
          className={cn(anim, "mt-7 flex flex-wrap items-baseline gap-x-3")}
        >
          <span className="text-sm text-muted">{slide.price.label}</span>
          <span className="font-display text-3xl font-extrabold text-heading sm:text-4xl">
            {slide.price.value}
          </span>
          <span className="text-sm font-bold text-accent">{slide.price.note}</span>
        </p>
      )}

      {/* Acciones */}
      <div
        style={delay(4)}
        className={cn(
          anim,
          "mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center",
        )}
      >
        <Link
          href={slide.primary.href}
          className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
        >
          {slide.primary.label}
        </Link>
        {slide.secondary && (
          <Link
            href={slide.secondary.href}
            className={buttonClasses("outline", "lg", "w-full sm:w-auto")}
          >
            {slide.secondary.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Cifras en una sola línea, sin protagonismo */}
      {slide.stats && (
        <dl
          style={delay(5)}
          className={cn(
            anim,
            "mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4",
          )}
        >
          {slide.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-2xl font-extrabold text-heading">
                {stat.value}
              </dd>
              <span className="mt-1 block text-xs leading-snug text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
