"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfiguratorPlan {
  key: string;
  name: string;
  price: string;
  note?: string;
  features: string[];
}

/**
 * Selector de planes de la cabecera de alquiler: al elegir un plan cambia la
 * lista de lo que incluye. Botones con `aria-pressed`, operables por teclado.
 */
export function AlquilerConfigurator({
  plans,
  label,
}: {
  plans: ConfiguratorPlan[];
  label: string;
}) {
  const [active, setActive] = useState(0);
  const plan = plans[active];
  if (!plan) return null;

  return (
    <div className="rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10 sm:p-5">
      <p id="alquiler-plan-label" className="px-1 text-sm font-semibold text-white/80">
        {label}
      </p>
      <div role="group" aria-labelledby="alquiler-plan-label" className="mt-3 grid gap-2 sm:grid-cols-3">
        {plans.map((p, i) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={i === active}
            aria-controls="alquiler-plan-features"
            onClick={() => setActive(i)}
            className={cn(
              "rounded-2xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
              i === active
                ? "bg-action text-deep-700"
                : "bg-white/[0.07] text-white hover:bg-white/[0.12]",
            )}
          >
            <span className="block text-sm font-bold leading-tight">{p.name}</span>
            <span
              className={cn(
                "mt-1 block text-xs",
                i === active ? "text-deep-700/80" : "text-white/65",
              )}
            >
              {p.price}
            </span>
          </button>
        ))}
      </div>
      <ul
        id="alquiler-plan-features"
        aria-live="polite"
        className="mt-4 space-y-2.5 px-1"
      >
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-sm text-white/85">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" strokeWidth={2.5} aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      {plan.note && <p className="mt-4 px-1 text-xs text-white/55">{plan.note}</p>}
    </div>
  );
}
