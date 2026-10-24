import Image from "next/image";
import { Check, LifeBuoy, ListChecks, Settings2, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { servicePlans, formatCOP, type Plan } from "@/content/pricing";
import { getServiceProcess } from "@/content/serviceProcess";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import { AlquilerConfigurator } from "./parts/alquiler-equipos-configurator";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Alquiler de equipos: la metáfora es el configurador de producto. La
 * cabecera pone los equipos en escena y deja elegir el plan; la sección
 * insignia explica el ciclo del alquiler y lo que trae cada plan.
 */

const copy = {
  es: {
    choose: "Elige tu plan",
    from: "Desde",
    month: "/mes",
    custom: "Cotización a la medida",
    photoAlt: "Equipos de cómputo empresariales listos para entregar",
    eyebrow: "Paso a paso",
    title: "Cómo funciona el alquiler",
    subtitle:
      "Cuatro pasos, una sola cuota mensual. Tú eliges; nosotros configuramos, entregamos y respondemos si algo falla.",
    steps: ["Elige", "Configuramos", "Entregamos", "Soporte y reemplazo"],
    catalog: "Qué trae cada plan",
  },
  en: {
    choose: "Choose your plan",
    from: "From",
    month: "/mo",
    custom: "Custom quote",
    photoAlt: "Business computers ready for delivery",
    eyebrow: "Step by step",
    title: "How rental works",
    subtitle:
      "Four steps, one monthly fee. You choose; we configure, deliver and respond if anything fails.",
    steps: ["Choose", "We configure", "We deliver", "Support and replacement"],
    catalog: "What each plan includes",
  },
};

function priceLabel(plan: Plan, locale: Locale) {
  const t = copy[locale];
  if (plan.price === null) return t.custom;
  return `${t.from} ${formatCOP(plan.price)}${plan.billing === "monthly" ? t.month : ""}`;
}

function Hero({ service, locale, backLabel, backHref, primary, secondary }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];
  const plans = servicePlans[service.slug] ?? [];

  return (
    <section className="bg-deep-900 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} dark />
        <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="lg:pt-6">
            <p className="text-sm font-medium text-white/75">{c.tagline}</p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{c.intro}</p>
            <HeroActions primary={primary} secondary={secondary} dark className="mt-8" />
          </div>

          <div>
            {/* Escena: monitor con la fotografía del servicio en pantalla. */}
            <div className="relative mx-auto max-w-xl px-2 sm:px-6">
              <div className="rounded-[1.25rem] bg-deep-950 p-2.5 ring-1 ring-white/15 sm:p-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image
                    src={service.image}
                    alt={t.photoAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div aria-hidden className="mx-auto h-8 w-16 bg-gradient-to-b from-deep-700 to-deep-800" />
              <div aria-hidden className="mx-auto h-2 w-44 rounded-full bg-deep-700" />
            </div>

            <div className="mt-8">
              <AlquilerConfigurator
                label={t.choose}
                plans={plans.map((p) => ({
                  key: p.key,
                  name: p[locale].name,
                  price: priceLabel(p, locale),
                  note: p[locale].note,
                  features: p[locale].features,
                }))}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];
  const steps = getServiceProcess(service.slug)?.[locale].steps ?? [];
  const plans = servicePlans[service.slug] ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Descripciones reales: levantamiento, alistamiento, entrega y soporte.
  const flow = [
    { icon: ListChecks, title: t.steps[0], text: steps[0]?.description, meta: steps[0]?.meta },
    { icon: Settings2, title: t.steps[1], text: steps[2]?.description, meta: steps[2]?.meta },
    { icon: Truck, title: t.steps[2], text: steps[3]?.description, meta: steps[3]?.meta },
    { icon: LifeBuoy, title: t.steps[3], text: c.faqs[1]?.a ?? steps[4]?.description, meta: steps[4]?.meta },
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map(({ icon: Icon, title, text, meta }, i) => (
            <li key={title} className={cn("relative flex flex-col rounded-3xl p-6", card)}>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-deep-700 text-brand-green">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-bold text-muted" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-bold text-heading">{title}</h3>
              {text && <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>}
              {meta && <p className="mt-auto pt-5 text-xs font-semibold text-accent">{meta}</p>}
            </li>
          ))}
        </ol>

        {plans.length > 0 && (
          <>
            <h3 className="mt-16 text-2xl font-bold text-heading">{t.catalog}</h3>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.key}
                  className={cn(
                    "flex flex-col rounded-3xl p-7",
                    plan.highlight ? "bg-deep-700 text-white dark:bg-card-soft" : card,
                  )}
                >
                  <h4 className={cn("text-xl font-bold", !plan.highlight && "text-heading")}>
                    {plan[locale].name}
                  </h4>
                  <p className={cn("mt-2 text-sm", plan.highlight ? "text-white/75" : "text-muted")}>
                    {plan[locale].description}
                  </p>
                  <p
                    className={cn(
                      "mt-5 text-lg font-bold",
                      plan.highlight ? "text-brand-green" : "text-heading",
                    )}
                  >
                    {priceLabel(plan, locale)}
                  </p>
                  <ul
                    className={cn(
                      "mt-5 space-y-3 border-t pt-5",
                      plan.highlight ? "border-white/15" : "border-line",
                    )}
                  >
                    {plan[locale].features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm">
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            plan.highlight ? "text-brand-green" : "text-accent",
                          )}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <span className={plan.highlight ? "text-white/85" : "text-body"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
