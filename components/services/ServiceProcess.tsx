import { RefreshCw } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { ProcessCopy } from "@/content/serviceProcess";
import type { ServiceFamily } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";

type Tone = "light" | "muted";

/**
 * Proceso de cada servicio con el lenguaje de meta.com: tarjetas lisas de
 * 24 px de radio y tipografía, sin raíles ni adornos.
 *
 * Lo que se entrega por proyecto (construir, crear, alquilar) se lee como una
 * secuencia de tarjetas en columnas; lo que se opera o se mejora mes a mes
 * (operación y datos) como una lista de filas, y la operación cierra
 * indicando que el ciclo vuelve a empezar.
 */
const layoutByFamily: Record<ServiceFamily, "columns" | "rows"> = {
  build: "columns",
  creative: "columns",
  hardware: "columns",
  ops: "rows",
  data: "rows",
};

/** Clases estáticas para que Tailwind las detecte. */
const lgCols: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export function ServiceProcess({
  process,
  family,
  tone = "muted",
  loopLabel,
}: {
  process: ProcessCopy;
  family: ServiceFamily;
  /** Se conserva por compatibilidad; el acento ya no cambia el estilo. */
  accent?: "green" | "blue";
  tone?: Tone;
  /** Texto del cierre cíclico (solo familia `ops`). */
  loopLabel?: string;
}) {
  const layout = layoutByFamily[family];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const steps = process.steps;

  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        subtitle={process.subtitle}
        size="lg"
      />

      {layout === "columns" ? (
        <ol
          className={cn(
            "mt-12 grid gap-4 sm:mt-16 md:grid-cols-2",
            lgCols[steps.length] ?? "lg:grid-cols-4",
          )}
        >
          {steps.map((step, i) => (
            <Reveal
              key={step.title}
              as="li"
              delay={(i % 5) * 70}
              className={cn("flex h-full flex-col rounded-3xl p-8", card)}
            >
              <p className="text-sm font-semibold text-accent">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 text-xl font-medium leading-snug text-heading">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-body">
                {step.description}
              </p>
              <p className="mt-auto pt-6 text-sm text-muted">{step.meta}</p>
            </Reveal>
          ))}
        </ol>
      ) : (
        <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <Reveal
                key={step.title}
                as="li"
                delay={(i % 5) * 60}
                className={cn(
                  "flex flex-col gap-3 rounded-3xl p-6 sm:flex-row sm:items-baseline sm:gap-8 sm:p-8",
                  card,
                )}
              >
                <span className="w-8 shrink-0 text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-medium leading-snug text-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">
                    {step.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-muted sm:max-w-52 sm:text-right">
                  {step.meta}
                </p>
              </Reveal>
            ))}
          </ol>

          {/* Cierre: el servicio no termina, se repite */}
          {loopLabel && (
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm font-semibold text-accent">
              <RefreshCw className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {loopLabel}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
