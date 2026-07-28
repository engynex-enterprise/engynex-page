import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Backdrop } from "@/components/ui/Backdrop";
import { formatCOP, type Plan } from "@/content/pricing";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Oferta de la web por suscripción.
 *
 * El precio es el argumento, así que va en el tamaño de un titular. Sin caja
 * navy ni degradados: solo dos columnas separadas por una línea.
 */
export function SubscriptionBand({
  locale,
  copy,
  plan,
  fromLabel,
}: {
  locale: Locale;
  copy: Dictionary["subscriptionBand"];
  plan: Plan;
  fromLabel: string;
}) {
  if (plan.price == null) return null;
  const features = plan[locale].features.slice(0, 4);

  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-surface-soft py-24 sm:py-28">
      <Backdrop
        variant="soft"
      />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-24">
          <div>
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-balance text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-[-0.028em] text-heading">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-body">
              {copy.desc}
            </p>

            <p className="mt-10 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                {fromLabel}
              </span>
              <span className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-none tracking-[-0.04em] text-heading">
                {formatCOP(plan.price)}
              </span>
              <span className="text-sm font-semibold text-muted">
                {copy.priceNote}
              </span>
            </p>

            <div className="mt-9">
              <Button
                href={`${localizedHref(locale, "servicios/desarrollo-web")}#planes`}
                variant="primary"
                size="lg"
              >
                {copy.cta}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl bg-line">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3.5 bg-card px-6 py-5"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-accent">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-sm leading-snug text-heading">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
