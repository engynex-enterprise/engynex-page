import {
  Compass,
  PenTool,
  Code2,
  Rocket,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

const stepIcons: LucideIcon[] = [Compass, PenTool, Code2, Rocket];

/**
 * "Cómo trabajamos" dibujado como una ruta: los hitos se apoyan sobre una
 * línea punteada que fluye de izquierda a derecha, con flechas entre etapas
 * (y una ruta vertical en móvil).
 */
export function ProcessSection({
  process,
  tone = "mesh",
  id,
}: {
  process: Dictionary["process"];
  tone?: "mesh" | "light" | "muted";
  id?: string;
}) {
  const steps = process.steps;
  const last = steps.length - 1;

  return (
    <Section tone={tone} id={id} containerClassName="relative">
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        subtitle={process.subtitle}
      />

      <div className="relative mt-16 lg:mt-20">
        {/* Ruta punteada que atraviesa los nodos (solo desktop).
            `top-8 -mt-px` la deja exactamente en el centro vertical del nodo
            (que mide 64 px de alto). */}
        <span
          aria-hidden
          className="process-route pointer-events-none absolute inset-x-0 top-8 z-0 hidden h-[3px] -mt-px lg:block"
        />

        <ol className="relative z-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, i) => {
            const Icon = stepIcons[i % stepIcons.length];
            return (
              <Reveal
                key={step.title}
                as="li"
                delay={(i % 4) * 110}
                className="relative flex h-full flex-col"
              >
                {/* Nodo de la ruta + flecha a la siguiente etapa */}
                <div className="flex items-center gap-3">
                  <span className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-navy-950 shadow-lg shadow-brand-blue/25">
                    <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
                    <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-card text-[0.65rem] font-extrabold text-accent ring-1 ring-line-strong">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>

                  {i < last && (
                    <span
                      aria-hidden
                      className="relative z-10 hidden flex-1 items-center justify-end lg:flex"
                    >
                      <ChevronRight
                        className="h-6 w-6 text-brand-blue/70"
                        strokeWidth={3}
                      />
                    </span>
                  )}
                </div>

                {/* Continuación vertical de la ruta en móvil (una columna) */}
                {i < last && (
                  <span
                    aria-hidden
                    className="absolute -bottom-10 left-8 flex h-10 -translate-x-1/2 flex-col items-center md:hidden"
                  >
                    <span className="w-0.5 flex-1 rounded-full bg-gradient-to-b from-brand-green/60 to-brand-blue/30" />
                    <ChevronDown
                      className="-mt-1.5 h-4 w-4 text-brand-blue/70"
                      strokeWidth={3}
                    />
                  </span>
                )}

                {/* Tarjeta del hito */}
                <div className="group relative mt-6 flex flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-2 -top-5 text-7xl font-extrabold leading-none text-heading/[0.05] transition-colors duration-300 group-hover:text-accent/15"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-accent">
                    {process.stepLabel} {i + 1}
                  </span>
                  <h3 className="relative mt-3 text-lg font-extrabold text-heading">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-body">
                    {step.description}
                  </p>
                  {/* `mt-auto` alinea la línea de duración al pie de todas las
                      tarjetas, aunque los textos tengan distinto largo. */}
                  <p className="relative mt-auto border-t border-line pt-3 text-xs font-bold text-muted">
                    {step.meta}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
