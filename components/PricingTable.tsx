import Link from "next/link";
import { Check, ArrowRight, Info } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { buttonClasses } from "./ui/Button";
import { formatCOP, type Plan } from "@/content/pricing";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type PlansDict = Dictionary["servicesPage"]["plans"];

export function PricingTable({
  plans,
  locale,
  t,
  badges,
  ctaHref,
  accent = "green",
}: {
  plans: Plan[];
  locale: Locale;
  t: PlansDict;
  badges: Dictionary["badges"];
  ctaHref: string;
  accent?: "green" | "blue";
}) {
  return (
    <div>
      <div
        className={cn(
          "grid items-stretch gap-6",
          plans.length === 2 ? "sm:grid-cols-2" : "lg:grid-cols-3",
        )}
      >
        {plans.map((plan, i) => {
          const copy = plan[locale];
          const highlighted = Boolean(plan.highlight);

          return (
            <Reveal key={plan.key} delay={(i % 3) * 80} className="h-full">
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300",
                  highlighted
                    ? "border-transparent bg-navy-950 text-ink-200 shadow-2xl shadow-brand-green/15 ring-2 ring-brand-green/50 lg:-translate-y-2"
                    : "border-line bg-card shadow-card hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover",
                )}
              >
                {highlighted && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                    <div className="bg-grid absolute inset-0 opacity-25" />
                    <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand-green/25 blur-[70px]" />
                    <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-brand-blue/25 blur-[70px]" />
                  </div>
                )}

                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={cn(
                        "text-lg font-extrabold",
                        highlighted ? "text-white" : "text-heading",
                      )}
                    >
                      {copy.name}
                    </h3>
                    {plan.badge && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide",
                          highlighted
                            ? "bg-brand-green text-navy-950"
                            : "bg-brand-green/15 text-accent",
                        )}
                      >
                        {badges[plan.badge]}
                      </span>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="mt-5">
                    {plan.price === null ? (
                      <p
                        className={cn(
                          "text-3xl font-extrabold",
                          highlighted ? "text-white" : "text-heading",
                        )}
                      >
                        {t.custom}
                      </p>
                    ) : (
                      <>
                        <p
                          className={cn(
                            "text-xs font-extrabold uppercase tracking-[0.14em]",
                            highlighted
                              ? "text-brand-green-light"
                              : "text-muted",
                          )}
                        >
                          {t.from}
                        </p>
                        <p className="mt-1 flex flex-wrap items-baseline gap-1.5">
                          <span
                            className={cn(
                              "text-3xl font-extrabold tracking-tight sm:text-4xl",
                              highlighted
                                ? "text-white"
                                : "text-heading",
                            )}
                          >
                            {formatCOP(plan.price)}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              highlighted
                                ? "text-ink-300"
                                : "text-muted",
                            )}
                          >
                            {plan.billing === "monthly" ? t.monthly : t.once}
                          </span>
                        </p>
                      </>
                    )}
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        highlighted ? "text-ink-400" : "text-muted",
                      )}
                    >
                      {plan.price === null ? t.customPrice : "COP"}
                      {copy.note ? ` · ${copy.note}` : ""}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "mt-5 text-sm leading-relaxed",
                      highlighted ? "text-ink-300" : "text-body",
                    )}
                  >
                    {copy.description}
                  </p>

                  <p
                    className={cn(
                      "mt-6 text-[0.7rem] font-extrabold uppercase tracking-[0.14em]",
                      highlighted ? "text-ink-400" : "text-muted",
                    )}
                  >
                    {t.includes}
                  </p>
                  <ul className="mt-3 flex-1 space-y-2.5">
                    {copy.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            highlighted
                              ? "bg-brand-green/20 text-brand-green"
                              : accent === "green"
                                ? "bg-brand-green/15 text-accent"
                                : "bg-brand-blue/15 text-brand-blue dark:text-brand-blue-light",
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        <span
                          className={cn(
                            "text-sm leading-snug",
                            highlighted
                              ? "text-ink-200"
                              : "text-body",
                          )}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ctaHref}
                    className={buttonClasses(
                      highlighted
                        ? "primary"
                        : accent === "green"
                          ? "outline"
                          : "secondary",
                      "md",
                      "mt-7 w-full",
                    )}
                  >
                    {plan.price === null ? t.ctaCustom : t.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <p className="mx-auto mt-8 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{t.note}</span>
      </p>
    </div>
  );
}
