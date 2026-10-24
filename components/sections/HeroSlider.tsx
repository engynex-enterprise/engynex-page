"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  A11y,
  Autoplay,
  EffectCreative,
  Keyboard,
  Parallax,
} from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import {
  BrandSwoosh,
  DotGrid,
  OrbitRings,
  PlusMark,
} from "@/components/ui/Backdrop";
import type { HeroSlide } from "@/lib/heroSlides";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/effect-creative";

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
 * Hero cinematográfico, al estilo de Slider Revolution, hecho con Swiper.
 *
 * Cada slide es una escena por capas: fotografía con zoom lento, velos de
 * pizarra y, encima, el mensaje y una composición visual. Al cambiar de slide
 * las capas entran con desplazamientos distintos (`data-swiper-parallax-*`), lo
 * que da la sensación de profundidad sin librerías de animación aparte.
 *
 * Vende e informa a la vez: titular, tres razones concretas, precio cuando hay
 * oferta, dos acciones y garantías debajo; a la derecha, tarjetas flotantes
 * con una cifra real del slide.
 */
export function HeroSlider({
  slides,
  controls,
  assurances,
}: {
  slides: HeroSlide[];
  controls: HeroSliderControls;
  /** Garantías cortas bajo las acciones ("Respuesta en 24 h"…). */
  assurances: string[];
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
      className="relative isolate overflow-hidden bg-deep-900 text-white"
    >
      <Swiper
        modules={[A11y, Autoplay, EffectCreative, Keyboard, Parallax]}
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
        speed={reduceMotion ? 0 : 1100}
        parallax
        effect="creative"
        creativeEffect={{
          prev: { translate: ["-25%", 0, -1], opacity: 0.4 },
          next: { translate: ["100%", 0, 0] },
        }}
        autoplay={
          autoplayOn
            ? {
                delay: SLIDE_DURATION,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        keyboard={{ enabled: true }}
        a11y={{
          prevSlideMessage: controls.prev,
          nextSlideMessage: controls.next,
          slideLabelMessage: `${controls.slideLabel} {{index}} / {{slidesLength}}`,
        }}
        className="[&_.swiper-slide]:!h-auto"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.key}>
            <Scene slide={slide} priority={i === 0} assurances={assurances} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navegación: pestañas con progreso + controles */}
      {total > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-deep-950/40 backdrop-blur-md">
          <Container className="flex items-center gap-4 py-3 sm:py-4">
            <div
              role="tablist"
              aria-label={controls.slideLabel}
              className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1"
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
                      "group relative flex shrink-0 items-baseline gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-colors sm:px-4",
                      active ? "bg-white/10" : "hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[0.62rem] font-bold tabular-nums",
                        active ? "text-brand-green" : "text-white/40",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        active
                          ? "text-white"
                          : "text-white/55 group-hover:text-white/85",
                      )}
                    >
                      {slide.navLabel}
                    </span>
                    {/* Progreso del slide activo: lo alimenta el autoplay */}
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/10 sm:inset-x-4"
                    >
                      {active && (
                        <span
                          ref={progressRef}
                          className="block h-full w-full origin-left rounded-full bg-gradient-to-r from-brand-green to-brand-blue"
                          style={{
                            transform: autoplayOn
                              ? "scaleX(var(--p, 0))"
                              : "scaleX(1)",
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="mr-2 hidden font-display text-sm font-bold tabular-nums text-white/60 md:inline">
                <span className="text-white">
                  {String(current + 1).padStart(2, "0")}
                </span>{" "}
                / {String(total).padStart(2, "0")}
              </span>
              {autoplayOn && (
                <ControlButton
                  label={paused ? controls.play : controls.pause}
                  onClick={togglePause}
                >
                  {paused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </ControlButton>
              )}
              <ControlButton
                label={controls.prev}
                onClick={() => swiperRef.current?.slidePrev()}
              >
                <ChevronLeft className="h-5 w-5" />
              </ControlButton>
              <ControlButton
                label={controls.next}
                onClick={() => swiperRef.current?.slideNext()}
              >
                <ChevronRight className="h-5 w-5" />
              </ControlButton>
            </div>
          </Container>
        </div>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/75 transition-colors hover:border-brand-green hover:bg-brand-green hover:text-deep-900"
    >
      {children}
    </button>
  );
}

/**
 * Una escena del hero. Las capas con `data-swiper-parallax-*` se desplazan a
 * distinta velocidad mientras el slide entra o sale.
 */
function Scene({
  slide,
  priority,
  assurances,
}: {
  slide: HeroSlide;
  priority: boolean;
  assurances: string[];
}) {
  const accentText =
    slide.accent === "green" ? "text-brand-green" : "text-brand-blue-light";

  return (
    <div className="relative flex h-full min-h-[46rem] flex-col lg:min-h-[100svh]">
      {/* -------- Fondo: fotografía + velos + figuras -------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={slide.image}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="hero-kb object-cover opacity-45"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-deep-950 via-deep-900/90 to-deep-900/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950 via-transparent to-deep-950/60" />
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
        <div
          className={cn(
            "absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full blur-[140px]",
            slide.accent === "green" ? "bg-brand-green/25" : "bg-brand-blue/30",
          )}
        />
        <div className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-brand-blue/20 blur-[130px]" />
        <BrandSwoosh className="-right-24 top-24 h-72 w-[48rem] opacity-80" />
      </div>

      {/* -------- Contenido -------- */}
      <Container className="relative flex flex-1 items-center pb-32 pt-36 sm:pt-40 lg:pb-36 lg:pt-36">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">
          {/* Mensaje */}
          <div className="min-w-0">
            <div
              data-swiper-parallax-x="-120"
              data-swiper-parallax-opacity="0"
              className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] py-1.5 pl-3 pr-4 ring-1 ring-white/15 backdrop-blur"
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  slide.accent === "green" ? "bg-brand-green" : "bg-brand-blue-light",
                )}
              />
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/80">
                {slide.eyebrow}
              </span>
              {slide.badge && (
                <span className="rounded-full bg-brand-green px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wide text-deep-900">
                  {slide.badge}
                </span>
              )}
            </div>

            <h1
              data-swiper-parallax-x="-260"
              data-swiper-parallax-opacity="0"
              className="mt-7 max-w-2xl text-balance text-[clamp(2.1rem,4.3vw,3.5rem)] font-extrabold text-white"
            >
              {slide.titleLead}{" "}
              <span className={accentText}>{slide.titleHighlight}</span>
            </h1>

            <p
              data-swiper-parallax-x="-360"
              data-swiper-parallax-opacity="0"
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/75"
            >
              {slide.subtitle}
            </p>

            {/* Lo que informa: tres razones concretas */}
            <ul
              data-swiper-parallax-x="-460"
              data-swiper-parallax-opacity="0"
              className="mt-7 grid max-w-xl gap-2.5"
            >
              {slide.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-green text-deep-900">
                    <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                  </span>
                  <span className="text-[0.95rem] leading-snug text-white/85">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            {slide.price && (
              <p
                data-swiper-parallax-x="-520"
                data-swiper-parallax-opacity="0"
                className="mt-7 flex flex-wrap items-baseline gap-x-3"
              >
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  {slide.price.label}
                </span>
                <span className="font-display text-4xl font-extrabold text-white">
                  {slide.price.value}
                </span>
                <span className="text-sm font-bold text-brand-green">
                  {slide.price.note}
                </span>
              </p>
            )}

            <div
              data-swiper-parallax-x="-580"
              data-swiper-parallax-opacity="0"
              className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href={slide.primary.href}
                className={buttonClasses(
                  "primary",
                  "lg",
                  "w-full shadow-lg shadow-brand-green/25 sm:w-auto",
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

            {/* Garantías: quitan fricción justo debajo de la acción */}
            <ul
              data-swiper-parallax-x="-640"
              data-swiper-parallax-opacity="0"
              className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
            >
              {assurances.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-bold text-white/65"
                >
                  <ShieldCheck
                    className="h-4 w-4 text-brand-green"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Composición visual */}
          <div aria-hidden className="relative mx-auto hidden w-full max-w-xl md:block">
            <OrbitRings
              spin
              className="-right-12 -top-16 h-56 w-56 text-white/15"
            />
            <DotGrid className="-bottom-10 -left-8 h-24 w-24 text-brand-green/40" />
            <PlusMark className="-left-8 top-6 h-5 w-5 text-brand-green" />
            <PlusMark className="-top-6 right-1/3 h-3.5 w-3.5 text-brand-blue-light" />

            {/* Ventana principal con la imagen del slide */}
            <div
              data-swiper-parallax-x="200"
              data-swiper-parallax-scale="0.9"
              data-swiper-parallax-opacity="0"
              className="relative overflow-hidden rounded-[1.75rem] bg-deep-800 shadow-2xl shadow-black/40 ring-1 ring-white/15"
            >
              <div className="flex items-center gap-2 border-b border-white/10 bg-deep-800/90 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 h-5 flex-1 rounded-full bg-white/[0.07]" />
              </div>
              <div className="relative aspect-[16/11]">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-900/50 to-transparent" />
              </div>
            </div>

            {/* Tarjeta flotante: cifra o precio del slide */}
            {(slide.proof || slide.price) && (
              <div
                data-swiper-parallax-y="120"
                data-swiper-parallax-opacity="0"
                className="absolute -bottom-10 -left-6 lg:-left-12"
              >
                <div className="animate-float rounded-2xl bg-white p-5 text-deep-700 shadow-2xl shadow-black/30">
                  <p className="font-display text-3xl font-extrabold leading-none">
                    {slide.proof?.value ?? slide.price?.value}
                  </p>
                  <p className="mt-2 max-w-40 text-xs font-bold leading-snug text-deep-500">
                    {slide.proof?.label ?? slide.price?.note}
                  </p>
                </div>
              </div>
            )}

            {/* Tarjeta flotante: mini gráfico */}
            <div
              data-swiper-parallax-y="-140"
              data-swiper-parallax-opacity="0"
              className="absolute -right-4 -top-8 lg:-right-10"
            >
              <div className="animate-float-slow w-44 rounded-2xl bg-deep-800/90 p-4 shadow-2xl shadow-black/30 ring-1 ring-white/15 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-green text-deep-900">
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.75} />
                  </span>
                  <span className="h-1.5 w-16 rounded-full bg-white/20" />
                </div>
                <div className="mt-3 flex h-12 items-end gap-1.5">
                  {[35, 55, 45, 70, 62, 92].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-blue to-brand-green"
                      style={{ height: `${h}%`, opacity: 0.5 + i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
