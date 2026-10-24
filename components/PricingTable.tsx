import Link from "next/link";
import { Check, Info } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { buttonClasses } from "./ui/Button";
import { formatCOP, type Plan } from "@/content/pricing";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type PlansDict = Dictionary["servicesPage"]["plans"];

/**
 * Planes al estilo de las fichas de compra de meta.com: tarjetas lisas de
 * 24 px de radio sin bordes ni sombras, precio grande en peso medio y un
 * botón píldora. El plan destacado solo se distingue por un aro azul y su
 * etiqueta: nada de halos ni fondos oscuros.
 */
export function PricingTable({
  plans,
  locale,
  t,
  badges,
  ctaHref,
  surface = "white",
  showNote = true,
}: {
  plans: Plan[];
  locale: Locale;
  t: PlansDict;
  badges: Dictionary["badges"];
  ctaHref: string;
  /** Se conserva por compatibilidad; el acento ya no cambia el estilo. */
  accent?: "green" | "blue";
  /** `white` para secciones grises, `soft` para secciones blancas. */
  surface?: "white" | "soft";
  /** Nota de precios (COP, sin IVA). Se oculta cuando la página la muestra una vez. */
  showNote?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "grid items-stretch gap-4",
          plans.length === 2
            ? "mx-auto max-w-5xl sm:grid-cols-2"
            : "md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {plans.map((plan, i) => {
          const copy = plan[locale];
          const highlighted = Boolean(plan.highlight);

          return (
            <Reveal key={plan.key} delay={(i % 3) * 80} className="h-full">
              <article
                className={cn(
                  "flex h-full flex-col rounded-3xl p-8 sm:p-10",
                  surface === "white" ? "bg-card" : "bg-surface-soft",
                  highlighted && "ring-2 ring-action",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-heading">
                    {copy.name}
                  </h3>
                  {plan.badge && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                        highlighted
                          ? "bg-action text-deep-700"
                          : "bg-accent-soft text-accent",
                      )}
                    >
                      {badges[plan.badge]}
                    </span>
                  )}
                </div>

                {/* Precio */}
                <div className="mt-6">
                  {plan.price === null ? (
                    <p className="text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-heading">
                      {t.custom}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted">{t.from}</p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-heading">
                          {formatCOP(plan.price)}
                        </span>
                        <span className="text-sm text-muted">
                          {plan.billing === "monthly" ? t.monthly : t.once}
                        </span>
                      </p>
                    </>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {plan.price === null ? t.customPrice : "COP"}
                    {copy.note ? ` · ${copy.note}` : ""}
                  </p>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-body">
                  {copy.description}
                </p>

                <Link
                  href={ctaHref}
                  className={buttonClasses(
                    // Fuera del plan destacado, contorno: un botón gris se
                    // perdía sobre la tarjeta gris.
                    highlighted ? "primary" : "outline",
                    "md",
                    "mt-8 w-full",
                  )}
                >
                  {plan.price === null ? t.ctaCustom : t.cta}
                </Link>

                <p className="mt-8 text-sm font-semibold text-heading">
                  {t.includes}
                </p>
                <ul className="mt-4 flex-1 space-y-3">
                  {copy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="text-sm leading-snug text-body">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          );
        })}
      </div>

      {showNote && (
        <p className="mx-auto mt-8 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t.note}</span>
        </p>
      )}
    </div>
  );
}
