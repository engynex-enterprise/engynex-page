import { Compass, PenTool, Code2, Rocket, type LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const stepIcons: LucideIcon[] = [Compass, PenTool, Code2, Rocket];

/**
 * "Cómo trabajamos" con el lenguaje de meta.com: cuatro tarjetas lisas de
 * 24 px de radio, icono azul, título grande en peso ligero y la duración al
 * pie. Sobre fondo blanco las tarjetas son grises y viceversa.
 */
export function ProcessSection({
  process,
  tone = "muted",
  id,
}: {
  process: Dictionary["process"];
  /** `mesh` se mantiene por compatibilidad y equivale a `muted`. */
  tone?: "mesh" | "light" | "muted";
  id?: string;
  /** Se conserva por compatibilidad: la escala ya es la misma en todo el sitio. */
  font?: "display" | "sans";
}) {
  const muted = tone !== "light";

  return (
    <Section tone={muted ? "muted" : "light"} id={id}>
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        subtitle={process.subtitle}
        size="lg"
      />

      <ol className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-4">
        {process.steps.map((step, i) => {
          const Icon = stepIcons[i % stepIcons.length];
          return (
            <Reveal
              key={step.title}
              as="li"
              delay={(i % 4) * 80}
              className={cn(
                "flex h-full flex-col rounded-3xl p-8 sm:p-10",
                muted ? "bg-card" : "bg-surface-soft",
              )}
            >
              <Icon
                className="h-7 w-7 text-accent"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="mt-8 text-sm font-semibold text-accent">
                {process.stepLabel} {i + 1}
              </p>
              <h3 className="mt-2 text-[1.75rem] font-bold leading-tight text-heading">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-body">
                {step.description}
              </p>
              <p className="mt-auto pt-6 text-sm text-muted">{step.meta}</p>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
