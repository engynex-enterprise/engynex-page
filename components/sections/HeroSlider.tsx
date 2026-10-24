"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade, Keyboard } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { Pause, Play } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import type { HeroSlide } from "@/lib/heroSlides";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/effect-fade";

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
 * Hero al estilo de meta.com, hecho con Swiper.
 *
 * Fotografía a sangre justo bajo la barra; la frase principal en blanco y a
 * gran tamaño arriba a la izquierda y la parte destacada, igual de grande,
 * abajo a la derecha. Abajo a la izquierda, la línea de apoyo y dos botones
 * píldora (azul y gris translúcido). Los slides cambian con un fundido y las
 * capas de texto entran escalonadas (`.hero-layer` en globals.css).
 */
export function HeroSlider({
  slides,
  controls,
}: {
  slides: HeroSlide[];
  controls: HeroSliderControls;
}) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const total = slides.length;
  const autoplayOn = !reduceMotion && total > 1;

  const togglePause = () => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    if (paused) swiper.autoplay.start();
    else swiper.autoplay.stop();
    setPaused(!paused);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={controls.slideLabel}
      className="relative isolate bg-deep-900 pt-16 text-white"
    >
      <div className="relative">
        <Swiper
          modules={[A11y, Autoplay, EffectFade, Keyboard]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onRealIndexChange={(swiper) => setCurrent(swiper.realIndex)}
          onAutoplayTimeLeft={(_, __, percentage) => {
            progressRef.current?.style.setProperty(
              "--p",
              String(1 - percentage),
            );
          }}
          loop={total > 1}
          speed={reduceMotion ? 0 : 900}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={
            autoplayOn
              ? { delay: SLIDE_DURATION, disableOnInteraction: false }
              : false
          }
          keyboard={{ enabled: true }}
          a11y={{
            prevSlideMessage: controls.prev,
            nextSlideMessage: controls.next,
            slideLabelMessage: `${controls.slideLabel} {{index}} / {{slidesLength}}`,
          }}
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={slide.key}>
              <Scene slide={slide} priority={i === 0} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Indicadores + pausa, discretos abajo a la derecha */}
        {total > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end px-4 pb-5 sm:px-8 sm:pb-7">
            <div className="pointer-events-auto flex items-center gap-3">
              <div
                role="tablist"
                aria-label={controls.slideLabel}
                className="flex items-center gap-1.5"
              >
                {slides.map((slide, i) => {
                  const active = i === current;
                  return (
                    <button
                      key={slide.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`${controls.slideLabel} ${i + 1}: ${slide.navLabel}`}
                      onClick={() => swiperRef.current?.slideToLoop(i)}
                      className={cn(
                        "relative h-2 overflow-hidden rounded-full bg-white/40 transition-all duration-300 hover:bg-white/70",
                        active ? "w-8" : "w-2",
                      )}
                    >
                      {active && (
                        <span
                          ref={progressRef}
                          className="absolute inset-0 origin-left rounded-full bg-white"
                          style={{
                            transform: autoplayOn
                              ? "scaleX(var(--p, 0))"
                              : "scaleX(1)",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {autoplayOn && (
                <button
                  type="button"
                  onClick={togglePause}
                  aria-label={paused ? controls.play : controls.pause}
                  title={paused ? controls.play : controls.pause}
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
                >
                  {paused ? (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Retardo escalonado de cada capa de texto al activarse el slide. */
const layer = (order: number): React.CSSProperties => ({
  transitionDelay: `${200 + order * 120}ms`,
});

function Scene({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  return (
    <div className="relative flex h-[calc(100svh-4rem)] max-h-[54rem] min-h-[36rem] flex-col justify-between overflow-hidden px-4 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-12">
      {/* Fotografía con zoom lento y velos para el contraste del texto */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={slide.image}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="hero-kb object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
      </div>

      {/* Frase principal, gigante arriba a la izquierda */}
      <h1 className="max-w-[16ch] text-balance text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white">
        <span style={layer(0)} className="hero-layer block">
          {slide.titleLead}
        </span>
        {/* En móvil la parte destacada sigue al titular; en escritorio baja a
            la esquina inferior derecha, como en meta.com. */}
        <span
          style={layer(1)}
          className="hero-layer mt-2 block text-brand-green md:sr-only"
        >
          {slide.titleHighlight}
        </span>
      </h1>

      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        {/* Apoyo y acciones */}
        <div style={layer(2)} className="hero-layer max-w-md">
          {slide.badge && (
            <span className="mb-4 inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-semibold text-deep-900">
              {slide.badge}
            </span>
          )}
          <p className="text-lg font-medium leading-snug text-white sm:text-xl">
            {slide.subtitle}
          </p>
          {slide.price && (
            <p className="mt-3 text-base text-white/90">
              {slide.price.label}{" "}
              <span className="font-semibold text-white">
                {slide.price.value}
              </span>{" "}
              {slide.price.note}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={slide.primary.href}
              className={buttonClasses("primary", "lg")}
            >
              {slide.primary.label}
            </Link>
            {slide.secondary && (
              <Link
                href={slide.secondary.href}
                className={buttonClasses("glass", "lg")}
              >
                {slide.secondary.label}
              </Link>
            )}
          </div>
        </div>

        {/* Parte destacada, gigante abajo a la derecha (escritorio) */}
        <p
          aria-hidden
          style={layer(1)}
          className="hero-layer hidden max-w-[14ch] text-balance text-right text-[clamp(2.75rem,7vw,6.5rem)] font-bold leading-[0.98] tracking-[-0.04em] text-white md:block"
        >
          {slide.titleHighlight}
        </p>
      </div>
    </div>
  );
}
