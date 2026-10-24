import { Fragment } from "react";
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  FileSignature,
  LifeBuoy,
  RefreshCw,
  Settings2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { ProcessCopy } from "@/content/serviceProcess";
import type { ServiceFamily } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";

type Accent = "green" | "blue";
type Tone = "light" | "mesh" | "muted";

/** Cada familia de servicio dibuja su proceso de una forma distinta. */
const variantByFamily: Record<ServiceFamily, string> = {
  build: "pipeline",
  creative: "timeline",
  ops: "runbook",
  data: "stairs",
  hardware: "route",
};

export function ServiceProcess({
  process,
  family,
  accent = "green",
  tone = "mesh",
  loopLabel,
}: {
  process: ProcessCopy;
  family: ServiceFamily;
  accent?: Accent;
  tone?: Tone;
  /** Texto del cierre cíclico (solo familia `ops`). */
  loopLabel?: string;
}) {
  const variant = variantByFamily[family];

  return (
    <Section tone={tone} containerClassName="relative">
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        subtitle={process.subtitle}
      />

      <div className="mt-16">
        {variant === "pipeline" && (
          <Pipeline steps={process.steps} accent={accent} />
        )}
        {variant === "timeline" && <Timeline steps={process.steps} />}
        {variant === "runbook" && (
          <Runbook steps={process.steps} loopLabel={loopLabel} />
        )}
        {variant === "stairs" && <Stairs steps={process.steps} />}
        {variant === "route" && <Route steps={process.steps} />}
      </div>
    </Section>
  );
}

type Step = ProcessCopy["steps"][number];

const num = (i: number) => String(i + 1).padStart(2, "0");

/* ========================================================================== */
/*  build → pipeline: raíl conectado arriba y tarjetas con filete de acento    */
/* ========================================================================== */

function Pipeline({ steps, accent }: { steps: Step[]; accent: Accent }) {
  const isGreen = accent === "green";
  return (
    <div>
      {/* Raíl de etapas, como un pipeline de integración continua */}
      <div className="mb-10 hidden items-center lg:flex">
        {steps.map((step, i) => (
          <Fragment key={step.title}>
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.65rem] font-extrabold",
                isGreen
                  ? "bg-brand-green text-deep-950"
                  : "bg-brand-blue text-white",
              )}
            >
              {num(i)}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="mx-2 h-0.5 flex-1 rounded-full bg-gradient-to-r from-brand-green/70 to-brand-blue/70"
              />
            )}
          </Fragment>
        ))}
      </div>

      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {steps.map((step, i) => (
          <Reveal
            key={step.title}
            as="li"
            delay={(i % 4) * 100}
            className="flex h-full flex-col"
          >
            <article className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover">
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  isGreen
                    ? "bg-gradient-to-r from-brand-green to-brand-green-light"
                    : "bg-gradient-to-r from-brand-blue to-brand-blue-light",
                )}
              />
              <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-accent lg:hidden">
                {num(i)}
              </span>
              <h3 className="mt-1 text-base font-extrabold text-heading lg:mt-0">
                {step.title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-body">
                {step.description}
              </p>
              <p className="mt-5 border-t border-line pt-3 text-xs font-bold text-muted">
                {step.meta}
              </p>
            </article>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/* ========================================================================== */
/*  creative → timeline: línea central y tarjetas alternando lados             */
/* ========================================================================== */

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative mx-auto max-w-5xl">
      {/* Línea vertical: a la izquierda en móvil, al centro en desktop */}
      <span
        aria-hidden
        className="absolute bottom-8 left-5 top-8 w-px bg-gradient-to-b from-brand-green via-brand-blue to-transparent md:left-1/2 md:-translate-x-1/2"
      />

      <div className="space-y-10 md:space-y-0">
        {steps.map((step, i) => {
          const right = i % 2 === 1;
          return (
            <Reveal
              key={step.title}
              as="li"
              delay={(i % 2) * 120}
              className="relative pl-14 md:grid md:grid-cols-2 md:items-center md:gap-14 md:py-5 md:pl-0"
            >
              {/* Marcador sobre la línea */}
              <span
                aria-hidden
                className="absolute left-5 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-brand-green ring-4 ring-surface md:left-1/2 md:top-1/2 md:-translate-y-1/2"
              />

              <div
                className={cn(
                  right ? "md:col-start-2" : "md:col-start-1 md:row-start-1",
                )}
              >
                <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:border-brand-green/40 hover:shadow-card-hover">
                  {/* Numeral grande de fondo */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -top-4 select-none text-7xl font-extrabold leading-none text-heading/[0.05]",
                      right ? "right-4" : "left-4",
                    )}
                  >
                    {num(i)}
                  </span>
                  <span className="relative text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-accent">
                    {step.meta}
                  </span>
                  <h3 className="relative mt-3 text-xl font-extrabold text-heading">
                    {step.title}
                  </h3>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-body">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </ol>
  );
}

/* ========================================================================== */
/*  ops → runbook: filas numeradas y cierre que indica que el ciclo se repite  */
/* ========================================================================== */

function Runbook({ steps, loopLabel }: { steps: Step[]; loopLabel?: string }) {
  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line bg-card shadow-card">
      <ol className="divide-y divide-line">
        {steps.map((step, i) => (
          <Reveal
            key={step.title}
            as="li"
            delay={(i % 5) * 70}
            className="group flex flex-col gap-4 p-6 transition-colors hover:bg-accent-soft/30 sm:flex-row sm:items-start sm:gap-6 sm:p-7"
          >
            <span className="flex shrink-0 items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-sm font-extrabold text-accent transition-colors group-hover:bg-brand-green group-hover:text-deep-950">
                {num(i)}
              </span>
              <span
                aria-hidden
                className="hidden h-px w-6 bg-line-strong sm:block"
              />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-heading">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-body">
                {step.description}
              </p>
            </div>

            <p className="shrink-0 self-start rounded-full bg-surface-soft px-3.5 py-1.5 text-xs font-bold text-muted ring-1 ring-line sm:max-w-52 sm:text-right">
              {step.meta}
            </p>
          </Reveal>
        ))}
      </ol>

      {/* Cierre: el servicio no termina, se repite */}
      {loopLabel && (
        <div className="flex items-center gap-3 border-t border-line bg-accent-soft/40 px-6 py-4 sm:px-7">
          <RefreshCw
            className="h-4 w-4 shrink-0 text-accent"
            strokeWidth={2.5}
            aria-hidden
          />
          <p className="text-sm font-bold text-accent">{loopLabel}</p>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  data → stairs: escalera de tarjetas, cada etapa refina la anterior         */
/* ========================================================================== */

/** Sangrado creciente por etapa (solo desde `lg`, en móvil todo se alinea). */
const stairIndent = ["", "lg:ms-10", "lg:ms-20", "lg:ms-30", "lg:ms-40"];

function Stairs({ steps }: { steps: Step[] }) {
  return (
    <ol className="mx-auto max-w-4xl">
      {steps.map((step, i) => (
        <Reveal
          key={step.title}
          as="li"
          delay={(i % 5) * 90}
          className={cn(
            "block",
            stairIndent[Math.min(i, stairIndent.length - 1)],
          )}
        >
          <article className="group flex flex-col gap-4 rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-card-hover sm:flex-row sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-blue/12 text-sm font-extrabold text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light">
              {num(i)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-heading">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-body">
                {step.description}
              </p>
            </div>
            <p className="shrink-0 text-xs font-bold text-muted sm:max-w-44 sm:text-right">
              {step.meta}
            </p>
          </article>

          {/* Codo que baja a la etapa siguiente */}
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="ms-6 flex h-8 w-px items-end bg-line-strong"
            >
              <ChevronDown
                className="-ms-2 h-4 w-4 text-brand-blue/60"
                strokeWidth={3}
              />
            </span>
          )}
        </Reveal>
      ))}
    </ol>
  );
}

/* ========================================================================== */
/*  hardware → route: seguimiento tipo envío, con hitos e iconos               */
/* ========================================================================== */

const routeIcons: LucideIcon[] = [
  ClipboardList,
  FileSignature,
  Settings2,
  Truck,
  LifeBuoy,
];

function Route({ steps }: { steps: Step[] }) {
  return (
    <div>
      {/* Línea de seguimiento, como el rastreo de un envío */}
      <div className="mb-10 hidden items-center lg:flex">
        {steps.map((step, i) => {
          const Icon = routeIcons[i % routeIcons.length];
          return (
            <Fragment key={step.title}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-green text-deep-950 shadow-lg shadow-brand-blue/25">
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="mx-2 flex flex-1 items-center gap-1"
                >
                  <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-brand-blue/60 to-brand-green/60" />
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-brand-green"
                    strokeWidth={3}
                  />
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      <ol className="grid gap-5 md:grid-cols-2">
        {steps.map((step, i) => {
          const Icon = routeIcons[i % routeIcons.length];
          const isLast = i === steps.length - 1;
          return (
            <Reveal
              key={step.title}
              as="li"
              delay={(i % 3) * 90}
              className={cn(
                "flex h-full flex-col",
                // El último hito ocupa el ancho completo: cierra la ruta.
                isLast && steps.length % 2 === 1 && "md:col-span-2",
              )}
            >
              <article className="group flex flex-1 gap-4 rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-blue/12 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light lg:hidden">
                  <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-accent">
                    {`${num(i)} · ${step.meta}`}
                  </span>
                  <h3 className="mt-2 text-base font-extrabold text-heading">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">
                    {step.description}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
