"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Check,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { iconRegistry, fallbackIcon } from "@/components/icons";
import type { HeroSlide, SlideChip } from "@/lib/heroSlides";
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

  // Autoplay: se detiene al pausar, al pasar el mouse/foco y con
  // `prefers-reduced-motion`.
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

  const activeAccent = slides[current]?.accent ?? "green";

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
      className="relative isolate overflow-hidden bg-navy-950 text-ink-100"
    >
      {/* Fondos con cross-fade + zoom lento */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
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
                      "transition-transform duration-[9000ms] ease-out",
                      i === current ? "scale-115" : "scale-100",
                    ),
              )}
            />
          </div>
        ))}

        {/* Velos y luces de marca */}
        <div className="absolute inset-0 bg-navy-950/78" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/45" />
        <div className="bg-grid absolute inset-0 opacity-35" />
        <div
          className={cn(
            "animate-pulse-slow absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full blur-[140px] transition-colors duration-1000",
            activeAccent === "green" ? "bg-brand-green/25" : "bg-brand-blue/28",
          )}
        />
        <div className="animate-pulse-slow absolute right-0 top-32 h-[26rem] w-[26rem] rounded-full bg-brand-blue/20 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-navy-950" />
      </div>

      <Container className="relative">
        {/* Todos los slides comparten la misma celda del grid: la altura la
            marca el más alto, así que no hay saltos al cambiar. */}
        <div className="grid min-w-0 grid-cols-1 pt-32 pb-14 sm:pt-40 lg:pb-20">
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

      {/* Flechas */}
      {total > 1 && (
        <>
          <ArrowButton
            side="left"
            label={controls.prev}
            onClick={prev}
            icon={<ChevronLeft className="h-6 w-6" />}
          />
          <ArrowButton
            side="right"
            label={controls.next}
            onClick={next}
            icon={<ChevronRight className="h-6 w-6" />}
          />
        </>
      )}

      {/* Pestañas de navegación + progreso */}
      {total > 1 && (
        <div className="relative border-t border-white/10 bg-navy-950/55 backdrop-blur">
          <Container>
            <div className="flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                aria-label={userPaused ? controls.play : controls.pause}
                title={userPaused ? controls.play : controls.pause}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-ink-200 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                {userPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </button>

              <div
                role="tablist"
                aria-label={controls.slideLabel}
                className="no-scrollbar flex flex-1 items-stretch gap-1.5 overflow-x-auto"
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
                        // `min-w-36` evita que la etiqueta quede truncada en
                        // móvil; en desktop `flex-1` reparte el ancho igual.
                        "group relative flex min-w-36 flex-1 flex-col justify-center overflow-hidden rounded-xl px-3 py-2 text-left transition-colors sm:px-4",
                        isActive ? "bg-white/10" : "hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[0.62rem] font-extrabold tabular-nums transition-colors",
                            isActive ? "text-brand-green" : "text-ink-400",
                          )}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "truncate text-xs font-bold transition-colors sm:text-[0.8rem]",
                            isActive
                              ? "text-white"
                              : "text-ink-300 group-hover:text-white",
                          )}
                        >
                          {slide.navLabel}
                        </span>
                      </span>

                      {/* Riel + barra de progreso del slide activo */}
                      <span
                        aria-hidden
                        className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-white/12"
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
                            className="slide-progress block h-full w-full rounded-full bg-gradient-to-r from-brand-green to-brand-blue"
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Container>
        </div>
      )}
    </section>
  );
}

/* ========================================================================== */

function ArrowButton({
  side,
  label,
  onClick,
  icon,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-ink-200 ring-1 ring-white/15 backdrop-blur transition-all hover:bg-brand-green hover:text-navy-950 hover:ring-brand-green xl:inline-flex",
        side === "left" ? "left-4 2xl:left-8" : "right-4 2xl:right-8",
      )}
    >
      {icon}
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
  const isGreen = slide.accent === "green";

  // Entrada escalonada: misma transición para todos los bloques, con un
  // retardo creciente. Al salir el retardo es 0 para que se apague en bloque.
  const anim = cn(
    "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
    active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
  );
  const delay = (order: number): React.CSSProperties => ({
    transitionDelay: active ? `${110 + order * 90}ms` : "0ms",
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
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-16">
        {/* -------- Texto -------- */}
        <div className="min-w-0 text-center lg:text-left">
          <div
            style={delay(0)}
            className={cn(
              anim,
              "flex flex-wrap items-center justify-center gap-2 lg:justify-start",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ring-1",
                isGreen
                  ? "bg-brand-green/10 text-brand-green-light ring-brand-green/30"
                  : "bg-brand-blue/10 text-brand-blue-light ring-brand-blue/30",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {slide.eyebrow}
            </span>
            {slide.badge && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-navy-950">
                {slide.badge}
              </span>
            )}
          </div>

          <h1
            style={delay(1)}
            className={cn(
              anim,
              "mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl",
            )}
          >
            {slide.titleLead}{" "}
            <span className="text-gradient">{slide.titleHighlight}</span>
            {slide.titleTail ? ` ${slide.titleTail}` : ""}
          </h1>

          <p
            style={delay(2)}
            className={cn(
              anim,
              "mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-300 lg:mx-0",
            )}
          >
            {slide.subtitle}
          </p>

          {/* En el slide de promoción los beneficios ya se listan dentro de la
              tarjeta de precio: repetirlos aquí sería redundante. */}
          {slide.kind !== "promo" && slide.bullets && slide.bullets.length > 0 && (
            <ul
              style={delay(3)}
              className={cn(
                anim,
                "mx-auto mt-6 grid max-w-xl gap-2 text-left sm:grid-cols-2 lg:mx-0",
              )}
            >
              {slide.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                      isGreen
                        ? "bg-brand-green/20 text-brand-green"
                        : "bg-brand-blue/20 text-brand-blue-light",
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-sm leading-snug text-ink-200">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div
            style={delay(4)}
            className={cn(
              anim,
              "mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start",
            )}
          >
            <Link
              href={slide.primary.href}
              className={buttonClasses(
                isGreen ? "primary" : "secondary",
                "lg",
                "w-full sm:w-auto",
              )}
            >
              {slide.primary.label}
              <ArrowRight className="h-5 w-5" />
            </Link>
            {slide.secondary && (
              <Link
                href={slide.secondary.href}
                className={buttonClasses("ghost", "lg", "w-full sm:w-auto")}
              >
                {slide.secondary.label}
              </Link>
            )}
          </div>

          {slide.stats && (
            <dl
              style={delay(5)}
              className={cn(
                anim,
                "mx-auto mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:mx-0",
              )}
            >
              {slide.stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-3xl font-extrabold text-white">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* -------- Visual -------- */}
        <div
          style={delay(3)}
          className={cn(anim, "relative mx-auto hidden w-full max-w-lg lg:block")}
        >
          <SlideVisual slide={slide} />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */

function ChipIcon({
  name,
  accent,
  size = "md",
}: {
  name: string;
  accent: "green" | "blue";
  size?: "sm" | "md";
}) {
  const Icon = iconRegistry[name] ?? fallbackIcon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "h-8 w-8" : "h-11 w-11",
        accent === "green"
          ? "bg-brand-green/18 text-brand-green"
          : "bg-brand-blue/20 text-brand-blue-light",
      )}
    >
      <Icon
        className={size === "sm" ? "h-4.5 w-4.5" : "h-5.5 w-5.5"}
        strokeWidth={1.75}
        aria-hidden
      />
    </span>
  );
}

function SlideVisual({ slide }: { slide: HeroSlide }) {
  switch (slide.kind) {
    case "intro":
      return <IntroVisual chips={slide.chips ?? []} />;
    case "services":
      return <ChipGridVisual chips={slide.chips ?? []} />;
    case "products":
      return <ChipListVisual chips={slide.chips ?? []} />;
    case "promo":
      return <PriceVisual slide={slide} />;
    case "rental":
      return <RackVisual slide={slide} />;
  }
}

/** Slide 1 — maqueta de aplicación con chips de servicio flotando. */
function IntroVisual({ chips }: { chips: SlideChip[] }) {
  const positions = [
    "left-0 top-8",
    "right-0 top-20",
    "left-2 bottom-28",
    "right-2 bottom-10",
    "left-1/2 -top-2 -translate-x-1/2",
    "left-1/2 -bottom-3 -translate-x-1/2",
  ];

  return (
    <div className="relative aspect-square">
      <div className="absolute left-1/2 top-1/2 w-76 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/12 bg-gradient-to-br from-navy-800 to-navy-900 p-5 shadow-2xl shadow-brand-blue/20">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
          <span className="ml-auto h-2 w-16 rounded-full bg-white/10" />
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-2.5 w-3/4 rounded-full bg-gradient-to-r from-brand-green to-brand-blue" />
          <div className="h-2.5 w-1/2 rounded-full bg-white/15" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="h-8 w-8 rounded-lg bg-brand-green/25" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
            </div>
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="h-8 w-8 rounded-lg bg-brand-blue/30" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
            </div>
          </div>
          {/* Mini gráfico de barras */}
          <div className="flex h-10 items-end gap-1.5 pt-2">
            {[38, 62, 46, 78, 58, 92, 70].map((height, i) => (
              <span
                key={i}
                style={{ height: `${height}%` }}
                className={cn(
                  "flex-1 rounded-t-sm",
                  i % 2 === 0 ? "bg-brand-green/60" : "bg-brand-blue/60",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {chips.slice(0, 6).map((chip, i) => (
        <div
          key={chip.title}
          style={{ animationDelay: `${i * 0.6}s` }}
          className={cn(
            "animate-float absolute flex items-center gap-2 rounded-2xl border border-white/12 bg-navy-800/90 px-3 py-2 shadow-lg backdrop-blur",
            positions[i],
          )}
        >
          <ChipIcon name={chip.icon} accent={chip.accent} size="sm" />
          <span className="text-xs font-bold text-white">{chip.title}</span>
        </div>
      ))}
    </div>
  );
}

/** Slide 2 — rejilla de servicios. */
function ChipGridVisual({ chips }: { chips: SlideChip[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {chips.slice(0, 8).map((chip, i) => (
        <Link
          key={chip.title}
          href={chip.href ?? "#"}
          style={{ animationDelay: `${i * 0.35}s` }}
          className="animate-float rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-brand-green/40 hover:bg-white/[0.09]"
        >
          <ChipIcon name={chip.icon} accent={chip.accent} size="sm" />
          <p className="mt-3 text-sm font-extrabold leading-tight text-white">
            {chip.title}
          </p>
          {chip.desc && (
            <p className="mt-1 line-clamp-2 text-[0.72rem] leading-snug text-ink-400">
              {chip.desc}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

/** Slide 3 — lista de productos destacados. */
function ChipListVisual({ chips }: { chips: SlideChip[] }) {
  return (
    <div className="space-y-3">
      {chips.map((chip, i) => (
        <Link
          key={chip.title}
          href={chip.href ?? "#"}
          style={{ animationDelay: `${i * 0.5}s` }}
          className="group animate-float flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-brand-green/40 hover:bg-white/[0.09]"
        >
          <ChipIcon name={chip.icon} accent={chip.accent} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">
              {chip.title}
            </span>
            {chip.desc && (
              <span className="mt-0.5 block truncate text-xs text-ink-400">
                {chip.desc}
              </span>
            )}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition-all group-hover:translate-x-1 group-hover:text-brand-green" />
        </Link>
      ))}
    </div>
  );
}

/** Slide 4 — tarjeta de precio de la promoción. */
function PriceVisual({ slide }: { slide: HeroSlide }) {
  if (!slide.price) return null;
  return (
    <div className="relative mx-auto max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-brand-green/25 to-brand-blue/25 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-navy-900/85 p-8 text-center backdrop-blur">
        <div className="bg-grid absolute inset-0 opacity-25" aria-hidden />
        <div className="relative">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-400">
            {slide.price.label}
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-tight text-white">
            {slide.price.value}
          </p>
          <p className="mt-1 text-sm font-bold text-brand-green">
            {slide.price.note}
          </p>
          <div className="mt-7 space-y-2.5 text-left">
            {(slide.bullets ?? []).map((bullet) => (
              <div key={bullet} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/20 text-brand-green">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[0.82rem] leading-snug text-ink-200">
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Slide 5 — rack de servidores + equipos de cómputo. */
function RackVisual({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-blue/25 to-brand-green/20 blur-3xl"
      />
      <div className="relative flex items-end gap-4">
        {/* Rack */}
        <div className="w-40 shrink-0 rounded-2xl border border-white/12 bg-navy-900/85 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-400">
              RACK
            </span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
            </span>
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1.5 ring-1 ring-white/[0.08]"
              >
                <span
                  style={{ animationDelay: `${i * 0.35}s` }}
                  className={cn(
                    "animate-pulse-slow h-1.5 w-1.5 rounded-full",
                    i % 3 === 0 ? "bg-brand-blue-light" : "bg-brand-green",
                  )}
                />
                <span className="h-1 flex-1 rounded-full bg-white/12" />
                <span className="h-1 w-3 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Portátil + tarjeta de precio */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="rounded-t-xl border border-white/12 bg-gradient-to-br from-navy-800 to-navy-900 p-3">
              <div className="space-y-1.5">
                <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-brand-green to-brand-blue" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/12" />
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="h-5 rounded bg-white/[0.07]" />
                  ))}
                </div>
              </div>
            </div>
            <div className="h-1.5 rounded-b-xl bg-white/15" />
          </div>

          {slide.price && (
            <div className="rounded-2xl border border-white/12 bg-navy-900/85 px-4 py-3 backdrop-blur">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-ink-400">
                {slide.price.label}
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-white">
                {slide.price.value}
              </p>
              <p className="text-[0.68rem] font-semibold text-brand-green">
                {slide.price.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
