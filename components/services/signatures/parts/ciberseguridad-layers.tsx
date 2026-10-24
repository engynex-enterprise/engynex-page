"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface DefenseLayer {
  name: string;
  /** Característica real del servicio que protege esta capa. */
  feature: string;
  /** Entregable real relacionado. */
  deliverable: string;
  text: string;
}

/**
 * Diagrama de defensa en capas: anillos concéntricos (de afuera hacia
 * adentro) y una lista de botones que resalta cada capa y muestra qué
 * hacemos en ella. El SVG es decorativo; la información vive en los botones.
 */
export function DefenseLayers({
  layers,
  deliverableLabel,
  groupLabel,
}: {
  layers: DefenseLayer[];
  deliverableLabel: string;
  groupLabel: string;
}) {
  const [active, setActive] = useState(0);
  const radii = [190, 145, 100, 55];
  const current = layers[active];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-deep-900 p-6 sm:p-8">
        <svg viewBox="0 0 400 400" className="h-auto w-full" aria-hidden>
          {layers.map((layer, i) => {
            const on = i === active;
            return (
              <g key={layer.name}>
                <circle
                  cx={200}
                  cy={200}
                  r={radii[i]}
                  className={cn(
                    "transition-colors duration-300",
                    on
                      ? "fill-deep-600 stroke-brand-green"
                      : i % 2 === 0
                        ? "fill-deep-800 stroke-white/15"
                        : "fill-deep-700 stroke-white/15",
                  )}
                  strokeWidth={on ? 3 : 1}
                />
                <text
                  x={200}
                  y={i === radii.length - 1 ? 205 : 200 - radii[i] + 28}
                  textAnchor="middle"
                  className={cn(
                    "text-[15px] font-bold",
                    on ? "fill-brand-green" : "fill-white/75",
                  )}
                >
                  {layer.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <div
          role="group"
          aria-label={groupLabel}
          className="flex flex-wrap gap-2"
        >
          {layers.map((layer, i) => (
            <button
              key={layer.name}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-action",
                i === active
                  ? "bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  : "bg-card-soft text-heading hover:bg-line",
              )}
            >
              <span className="text-xs opacity-70">{i + 1}</span>
              {layer.name}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="mt-8">
          <h3 className="text-2xl font-bold text-heading">{current.feature}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            {current.text}
          </p>
          <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm text-heading">
            <span className="font-semibold text-accent">{deliverableLabel}</span>
            {current.deliverable}
          </p>
        </div>
      </div>
    </div>
  );
}
