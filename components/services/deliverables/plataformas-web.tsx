import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Plataformas web — los entregables como capas apiladas de una arquitectura:
 * la primera capa (el análisis) es la base y cada entrega se monta sobre la
 * anterior. A la derecha, las características y el stack reales.
 */
const copy = {
  es: {
    subtitle:
      "Una plataforma se construye por capas. Cada entrega se apoya en la anterior, desde el análisis hasta la documentación, para que el resultado sea sólido y fácil de mantener.",
    layer: "Capa",
    base: "Base",
    features: "Lo que puede incluir",
    stack: "Tecnologías habituales",
  },
  en: {
    subtitle:
      "A platform is built in layers. Each deliverable rests on the previous one, from analysis to documentation, so the result is solid and easy to maintain.",
    layer: "Layer",
    base: "Foundation",
    features: "What it can include",
    stack: "Usual technologies",
  },
};

/** Color de cada capa, de la base (verde) hacia arriba (marino). */
const layerTone = [
  "bg-action text-deep-700",
  "bg-deep-500 text-white",
  "bg-deep-600 text-white",
  "bg-deep-700 text-white",
];
const edgeTone = [
  "bg-brand-green-dark",
  "bg-deep-600",
  "bg-deep-700",
  "bg-deep-900",
];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];
  const chip =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-center lg:gap-16">
          {/* Pila de capas: el DOM va de la base a la cima; se ve de abajo hacia arriba. */}
          <div className="order-2 lg:order-1">
            <ol className="flex flex-col-reverse gap-3 [--layer-step:0.5rem] sm:gap-4 sm:[--layer-step:1.75rem]">
              {c.deliverables.map((item, i) => {
                const k = i % layerTone.length;
                return (
                  <li
                    key={item}
                    className="relative"
                    style={{ marginInline: `calc(${i} * var(--layer-step))` }}
                  >
                    <div
                      className={cn(
                        "relative z-10 flex min-h-24 items-center gap-4 rounded-3xl px-5 py-5 sm:gap-6 sm:px-8",
                        layerTone[k],
                      )}
                    >
                      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide opacity-75 sm:w-20">
                        {i === 0
                          ? t.base
                          : `${t.layer} ${String(i + 1).padStart(2, "0")}`}
                      </span>
                      <span className="min-w-0 flex-1 text-lg font-bold leading-snug sm:text-xl">
                        {item}
                      </span>
                      <span
                        aria-hidden
                        className="hidden shrink-0 gap-1.5 sm:flex"
                      >
                        {Array.from({ length: i + 1 }, (_, d) => (
                          <span
                            key={d}
                            className="h-2 w-2 rounded-full bg-current opacity-50"
                          />
                        ))}
                      </span>
                    </div>
                    {/* Canto inferior de la losa, para dar volumen. */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 -bottom-1.5 h-6 rounded-b-3xl",
                        edgeTone[k],
                      )}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {t.subtitle}
            </p>

            <h3 className="mt-10 text-sm font-semibold text-muted">
              {t.features}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.features.map((f) => (
                <li
                  key={f}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold text-heading",
                    chip,
                  )}
                >
                  {f}
                </li>
              ))}
            </ul>

            {stack.length > 0 && (
              <>
                <h3 className="mt-8 text-sm font-semibold text-muted">
                  {t.stack}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-heading">
                  {stack.join(" · ")}
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
