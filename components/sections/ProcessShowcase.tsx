"use client";

import { useCallback, useEffect, useState } from "react";
import { Compass, PenTool, Code2, Rocket, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DotGrid, PlusMark } from "@/components/ui/Backdrop";
import { hue, type AccentHue } from "@/lib/accents";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Tiempo que permanece abierta cada etapa (ms). */
const STEP_MS = 6000;

const stepMeta: { icon: LucideIcon; tone: AccentHue }[] = [
  { icon: Compass, tone: "green" },
  { icon: PenTool, tone: "violet" },
  { icon: Code2, tone: "blue" },
  { icon: Rocket, tone: "amber" },
];

/**
 * "Cómo trabajamos" como demostración, no como lista.
 *
 * A la izquierda las etapas en acordeón (solo la activa muestra su detalle) y
 * a la derecha un panel oscuro que cambia con cada etapa. Avanza solo, se
 * detiene al pasar el cursor y responde al clic.
 */
export function ProcessShowcase({
  process,
}: {
  process: Dictionary["process"];
}) {
  const steps = process.steps;
  const total = steps.length;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const next = useCallback(
    () => setCurrent((value) => (value + 1) % total),
    [total],
  );

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return;
    const timer = window.setTimeout(next, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [current, paused, reduceMotion, next, total]);

  return (
    <section className="relative isolate overflow-hidden bg-surface py-20 sm:py-28 lg:py-32">
      <DotGrid className="right-[6%] top-20 -z-10 hidden h-24 w-24 text-brand-green/30 lg:block" />
      <PlusMark className="right-[30%] top-36 -z-10 hidden h-4 w-4 text-brand-blue/50 lg:block" />

      <Container className="relative">
        <SectionHeading
          eyebrow={process.eyebrow}
          title={process.title}
          subtitle={process.subtitle}
          align="left"
          size="lg"
        />

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14"
        >
          {/* -------- Etapas -------- */}
          <ol className="flex min-w-0 flex-col">
            {steps.map((step, i) => {
              const active = i === current;
              const { icon: Icon, tone } = stepMeta[i % stepMeta.length];
              const c = hue[tone];
              return (
                <li key={step.title} className="border-t border-line last:border-b">
                  <button
                    type="button"
                    aria-expanded={active}
                    onClick={() => setCurrent(i)}
                    className="group flex w-full items-start gap-4 py-6 text-left"
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all duration-500",
                        active
                          ? cn(c.tile, "scale-105")
                          : "bg-card-soft text-muted group-hover:text-heading",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span
                          className={cn(
                            "text-[0.62rem] font-semibold tabular-nums transition-colors",
                            active ? c.text : "text-muted",
                          )}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "text-lg font-bold tracking-[-0.015em] transition-colors",
                            active
                              ? "text-heading"
                              : "text-heading/55 group-hover:text-heading",
                          )}
                        >
                          {step.title}
                        </span>
                      </span>

                      {/* Detalle: solo la etapa activa lo despliega */}
                      <span
                        className={cn(
                          "grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          active
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <span className="overflow-hidden">
                          <span className="mt-3 block max-w-md text-sm leading-relaxed text-body">
                            {step.description}
                          </span>
                          <span className="mt-3 block text-xs font-bold text-muted">
                            {step.meta}
                          </span>
                        </span>
                      </span>

                      {/* Riel de progreso de la etapa activa */}
                      <span
                        aria-hidden
                        className="mt-4 block h-0.5 w-full overflow-hidden rounded-full bg-line"
                      >
                        {active && (
                          <span
                            key={current}
                            data-paused={paused}
                            style={
                              {
                                "--slide-duration": `${STEP_MS}ms`,
                              } as React.CSSProperties
                            }
                            className={cn(
                              "slide-progress block h-full w-full rounded-full",
                              c.dot,
                            )}
                          />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* -------- Panel de la etapa -------- */}
          <div className="relative min-h-80 lg:min-h-[24rem]">
            <div className="relative grid h-full overflow-hidden rounded-[1.75rem] bg-deep-950 p-7 sm:p-9">
              {steps.map((step, i) => (
                <StagePanel
                  key={step.title}
                  index={i}
                  active={i === current}
                  label={`${process.stepLabel} ${i + 1}`}
                  title={step.title}
                  measureNote={process.measureNote}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================================================== */
/*  Paneles: una maqueta distinta por etapa                                    */
/* ========================================================================== */

function StagePanel({
  index,
  active,
  label,
  title,
  measureNote,
}: {
  index: number;
  active: boolean;
  label: string;
  title: string;
  measureNote: string;
}) {
  const { tone } = stepMeta[index % stepMeta.length];
  const c = hue[tone];

  return (
    <div
      inert={!active}
      aria-hidden={!active}
      className={cn(
        "relative col-start-1 row-start-1 flex min-w-0 flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] ring-1 ring-white/10",
            c.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
          {label}
        </span>
        <span className="text-[0.7rem] font-semibold text-white/40">
          {title}
        </span>
      </div>

      <div className="mt-7 flex-1">
        {index === 0 && <DiscoveryMock active={active} />}
        {index === 1 && <DesignMock active={active} />}
        {index === 2 && <CodeMock active={active} />}
        {index === 3 && (
          <LaunchMock active={active} note={measureNote} />
        )}
      </div>
    </div>
  );
}

/** Retardo escalonado para animar la entrada de cada fila de la maqueta. */
const step = (active: boolean, order: number) => ({
  className: cn(
    "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
    active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
  ),
  style: {
    transitionDelay: active ? `${220 + order * 110}ms` : "0ms",
  } as React.CSSProperties,
});

/** Etapa 1 — lista de hallazgos que se van marcando. */
function DiscoveryMock({ active }: { active: boolean }) {
  const rows = ["78%", "44%", "91%", "62%"];
  return (
    <div className="space-y-3">
      {rows.map((width, i) => {
        const s = step(active, i);
        return (
          <div
            key={i}
            {...s}
            className={cn(
              s.className,
              "flex items-center gap-3 rounded-xl bg-white/[0.05] p-3.5 ring-1 ring-white/[0.07]",
            )}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-hue-green/25">
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                <path
                  d="M2 6.4 4.6 9 10 3.2"
                  fill="none"
                  stroke="currentColor"
                  className="text-hue-green"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-hue-green to-brand-blue transition-[width] duration-1000 ease-out"
                style={{
                  width: active ? width : "0%",
                  transitionDelay: `${420 + i * 110}ms`,
                }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-[0.6rem] font-bold text-white/45">
              {width}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Etapa 2 — wireframe y paleta. */
function DesignMock({ active }: { active: boolean }) {
  const swatches = [
    "bg-hue-violet",
    "bg-brand-green",
    "bg-brand-blue",
    "bg-hue-amber",
    "bg-hue-rose",
  ];
  const s0 = step(active, 0);
  const s1 = step(active, 1);
  const s2 = step(active, 2);
  return (
    <div className="space-y-4">
      <div
        {...s0}
        className={cn(s0.className, "flex gap-2")}
      >
        {swatches.map((color, i) => (
          <span
            key={i}
            className={cn("h-9 flex-1 rounded-lg", color)}
            style={{ opacity: 0.85 }}
          />
        ))}
      </div>

      <div
        {...s1}
        className={cn(
          s1.className,
          "rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.07]",
        )}
      >
        <div className="h-2 w-2/3 rounded-full bg-hue-violet/70" />
        <div className="mt-2.5 h-2 w-1/3 rounded-full bg-white/15" />
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white/[0.06] p-2.5 ring-1 ring-white/[0.06]"
            >
              <span className="block h-6 w-6 rounded-md bg-hue-violet/30" />
              <span className="mt-2.5 block h-1.5 w-full rounded-full bg-white/12" />
              <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div
        {...s2}
        className={cn(s2.className, "flex gap-2.5")}
      >
        <span className="h-8 flex-1 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.06]" />
        <span className="h-8 w-24 rounded-lg bg-hue-violet/70" />
      </div>
    </div>
  );
}

/** Etapa 3 — editor de código. */
function CodeMock({ active }: { active: boolean }) {
  const lines: { indent: number; parts: [string, string][] }[] = [
    { indent: 0, parts: [["w-10 bg-hue-rose/70", ""], ["w-20 bg-brand-blue/60", ""]] },
    { indent: 1, parts: [["w-14 bg-hue-amber/60", ""], ["w-24 bg-white/20", ""]] },
    { indent: 1, parts: [["w-16 bg-brand-green/60", ""], ["w-12 bg-white/15", ""]] },
    { indent: 2, parts: [["w-20 bg-white/20", ""], ["w-16 bg-hue-violet/60", ""]] },
    { indent: 1, parts: [["w-12 bg-hue-rose/70", ""], ["w-28 bg-white/15", ""]] },
    { indent: 0, parts: [["w-8 bg-white/20", ""]] },
  ];
  return (
    <div className="rounded-2xl bg-deep-900/80 p-4 ring-1 ring-white/[0.07]">
      <div className="flex gap-1.5 pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-hue-rose/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-hue-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-green/70" />
      </div>
      <div className="space-y-2.5 font-mono">
        {lines.map((line, i) => {
          const s = step(active, i);
          return (
            <div
              key={i}
              {...s}
              className={cn(s.className, "flex items-center gap-2")}
            >
              <span className="w-4 shrink-0 text-right text-[0.55rem] text-white/25">
                {i + 1}
              </span>
              <span
                className="flex flex-1 items-center gap-2"
                style={{ paddingLeft: `${line.indent * 14}px` }}
              >
                {line.parts.map(([cls], p) => (
                  <span key={p} className={cn("h-2 rounded-full", cls)} />
                ))}
              </span>
            </div>
          );
        })}
        {/* Cursor parpadeante */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity duration-500",
            active ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDelay: active ? "900ms" : "0ms" }}
        >
          <span className="w-4 shrink-0 text-right text-[0.55rem] text-white/25">
            7
          </span>
          <span className="animate-pulse-slow h-3.5 w-1.5 rounded-sm bg-brand-green" />
        </div>
      </div>
    </div>
  );
}

/** Etapa 4 — métricas después del lanzamiento. */
function LaunchMock({ active, note }: { active: boolean; note: string }) {
  const bars = [38, 52, 44, 68, 60, 82, 74, 95];
  const s0 = step(active, 0);
  const s1 = step(active, 5);
  return (
    <div className="space-y-4">
      <div {...s0} className={cn(s0.className, "grid grid-cols-3 gap-2.5")}>
        {[
          { v: "+38%", l: "conversión" },
          { v: "1.2s", l: "carga" },
          { v: "99.9%", l: "uptime" },
        ].map((kpi) => (
          <div
            key={kpi.l}
            className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/[0.07]"
          >
            <p className="text-base font-extrabold text-white">{kpi.v}</p>
            <p className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-white/40">
              {kpi.l}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.07]">
        <div className="flex h-32 items-end gap-2">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-hue-amber/50 to-brand-green transition-[height] duration-1000 ease-out"
              style={{
                height: active ? `${h}%` : "6%",
                transitionDelay: `${300 + i * 70}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <p
        {...s1}
        className={cn(
          s1.className,
          "flex items-center gap-2 text-[0.7rem] font-semibold text-white/45",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
        {note}
      </p>
    </div>
  );
}
