import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ParallaxLayer } from "@/components/ui/Parallax";
import { formatCOP, type Plan } from "@/content/pricing";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Oferta de la web por suscripción.
 *
 * Es el elemento de mayor conversión de la página, así que va en una tarjeta
 * oscura sobre una sección clara: el contraste la separa del resto y la hace
 * leerse como una oferta y no como una sección más. A la derecha, una maqueta
 * de navegador enseña el producto; a la izquierda, precio y condiciones.
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
  const note = plan[locale].note;

  return (
    <section className="isolate bg-surface-soft py-20 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy-950 text-ink-100">
          {/* Fondo de la tarjeta */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="bg-grid absolute inset-0 opacity-30" />
            <div className="absolute -left-24 -top-20 h-80 w-80 rounded-full bg-brand-green/20 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/3 h-80 w-80 rounded-full bg-brand-blue/20 blur-[120px]" />
          </div>

          <div className="relative grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:p-16">
            {/* Oferta */}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-green/15 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-green ring-1 ring-brand-green/25">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                {copy.eyebrow}
              </span>

              <h2 className="mt-6 text-balance text-[clamp(1.8rem,3.2vw,2.7rem)] font-extrabold text-white">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-ink-300">
                {copy.desc}
              </p>

              {/* Precio */}
              <p className="mt-9 flex flex-wrap items-baseline gap-x-3 border-t border-white/12 pt-8">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
                  {fromLabel}
                </span>
                <span className="font-display text-[clamp(2.2rem,4.2vw,3.4rem)] font-extrabold leading-none text-white">
                  {formatCOP(plan.price)}
                </span>
                <span className="text-sm font-semibold text-brand-green">
                  {copy.priceNote}
                </span>
              </p>

              <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-green/20 text-brand-green">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-[0.82rem] leading-snug text-ink-200">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Button
                  href={`${localizedHref(locale, "servicios/desarrollo-web")}#planes`}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {copy.cta}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                {note && (
                  <p className="text-xs leading-snug text-ink-400 sm:max-w-44">
                    {note}
                  </p>
                )}
              </div>
            </div>

            {/* Maqueta del producto */}
            <div className="relative hidden lg:block">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-green/20 to-brand-blue/20 blur-3xl"
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-navy-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/10 bg-navy-800/80 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-3 h-5 flex-1 rounded-md bg-white/[0.06]" />
                </div>
                <div className="relative aspect-[16/11]">
                  <ParallaxLayer distance={24}>
                    <Image
                      src="/images/svc-desarrollo-web.jpg"
                      alt=""
                      fill
                      sizes="45vw"
                      className="object-cover"
                    />
                  </ParallaxLayer>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
