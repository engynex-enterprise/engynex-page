import { Bot, Plug, ScanSearch, Workflow } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * IA & Automatización — "Lo que queda funcionando": un diagrama de flujo
 * (ilustrativo) donde cada entregable es un nodo conectado de izquierda a
 * derecha, y debajo la misma secuencia como lista de texto.
 */
const copy = {
  es: {
    lead: "Lo que queda funcionando",
    subtitle:
      "No te entregamos una presentación: te entregamos un sistema en marcha, conectado a tus herramientas y vigilado después del lanzamiento.",
    kinds: ["Diagnóstico", "Asistente", "Flujo", "Integración"],
    running: "En marcha",
    after: "Después de la entrega",
  },
  en: {
    lead: "What keeps running",
    subtitle:
      "We don't hand you a slide deck: we hand you a running system, connected to your tools and monitored after launch.",
    kinds: ["Assessment", "Assistant", "Workflow", "Integration"],
    running: "Running",
    after: "After delivery",
  },
};

const icons = [ScanSearch, Bot, Workflow, Plug];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const lastStep = getServiceProcess(service.slug)?.[locale].steps.at(-1);
  const n = c.deliverables.length;

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
            {t.subtitle}
          </p>
        </div>

        {/* Diagrama de flujo: cada nodo es un entregable real (texto legible). */}
        <div className="mt-12 rounded-3xl bg-deep-900 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] p-5 [background-size:20px_20px] sm:mt-16 sm:p-10">
          <ol className="flex flex-col items-stretch lg:flex-row lg:items-center">
            {c.deliverables.map((item, i) => {
              const Icon = icons[i % icons.length];
              const last = i === n - 1;
              return (
                <li
                  key={item}
                  className="flex flex-col items-stretch lg:flex-1 lg:flex-row lg:items-center"
                >
                  <div
                    className={cn(
                      "rounded-2xl p-4 ring-1 lg:flex-1",
                      last
                        ? "bg-action text-deep-700 ring-action"
                        : "bg-deep-800 text-white ring-white/10",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          last
                            ? "bg-deep-700 text-brand-green"
                            : "bg-white/10 text-brand-green",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        {t.kinds[i % t.kinds.length]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-snug">
                      {item}
                    </p>
                    {i > 0 && (
                      <p
                        aria-hidden
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium opacity-70"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full motion-safe:animate-pulse-slow",
                            last ? "bg-deep-700" : "bg-brand-green",
                          )}
                        />
                        {t.running}
                      </p>
                    )}
                  </div>
                  {!last && (
                    <span
                      aria-hidden
                      className="relative mx-auto block h-6 w-px bg-brand-green/60 lg:mx-0 lg:h-px lg:w-8"
                    >
                      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-brand-green lg:bottom-auto lg:left-auto lg:-right-0.5 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:-rotate-45" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* La misma secuencia como lista de lectura (solo en escritorio; el diagrama ya la anuncia). */}
        <ol aria-hidden className="mt-10 hidden gap-x-8 lg:grid lg:grid-cols-4">
          {c.deliverables.map((item, i) => (
            <li key={item} className="border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {String(i + 1).padStart(2, "0")} · {t.kinds[i % t.kinds.length]}
              </p>
              <p className="mt-2 text-base font-bold leading-snug text-heading sm:text-lg">
                {item}
              </p>
            </li>
          ))}
        </ol>

        {lastStep && (
          <p className="mt-10 text-center text-sm text-muted">
            <span className="font-semibold text-heading">{t.after}:</span>{" "}
            {lastStep.title} · {lastStep.meta}
          </p>
        )}
      </Container>
    </section>
  );
};
