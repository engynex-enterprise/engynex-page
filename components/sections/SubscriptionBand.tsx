import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { formatCOP, type Plan } from "@/content/pricing";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Oferta de la web por suscripción.
 *
 * Es el elemento de mayor conversión de la página, así que va en una tarjeta
 * de color (azul muy claro) sobre una sección blanca: el cambio de superficie
 * basta para separarla del resto sin recurrir a fondos oscuros ni halos. A la
 * derecha, una maqueta de navegador enseña el producto; a la izquierda, precio
 * y condiciones.
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
    <section className="isolate bg-surface py-20 sm:py-28">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-accent-soft">
          <div className="grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:p-16">
            {/* Oferta */}
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-xs font-medium text-accent">
                {copy.eyebrow}
              </span>

              <h2 className="mt-5 text-balance text-[clamp(1.9rem,3.2vw,2.75rem)] font-medium tracking-[-0.025em] text-heading">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-body">
                {copy.desc}
              </p>

              {/* Precio */}
              <p className="mt-8 flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm text-muted">{fromLabel}</span>
                <span className="text-[clamp(2.2rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.03em] text-heading">
                  {formatCOP(plan.price)}
                </span>
                <span className="text-sm text-muted">{copy.priceNote}</span>
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
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
                  <p className="text-xs leading-snug text-muted sm:max-w-44">
                    {note}
                  </p>
                )}
              </div>
            </div>

            {/* Maqueta del producto */}
            <div className="relative hidden lg:block">
              <div className="overflow-hidden rounded-2xl bg-card shadow-card-hover">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                  <span className="ml-3 h-5 flex-1 rounded-full bg-card-soft" />
                </div>
                <div className="relative aspect-[16/11]">
                  <Image
                    src="/images/svc-desarrollo-web.jpg"
                    alt=""
                    fill
                    sizes="45vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
