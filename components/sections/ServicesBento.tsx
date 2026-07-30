import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Backdrop } from "@/components/ui/Backdrop";
import { ServiceIcon } from "@/components/ServiceIcon";
import { services, getService } from "@/content/services";
import { serviceGroups } from "@/content/navigation";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { hue, hueForService } from "@/lib/accents";
import { cn } from "@/lib/utils";

/**
 * Qué hacemos.
 *
 * Dos piezas destacadas con fotografía llevan el peso visual, y debajo va el
 * índice completo de los dieciséis servicios agrupados por su función:
 * construir, crecer y operar.
 *
 * Enseñar solo seis de dieciséis con tarjetas genéricas dejaba corta la oferta
 * y no explicaba cómo se relacionan entre sí; el índice por columnas es la
 * misma estructura del mega menú, que es la que la gente ya reconoce.
 */
export function ServicesBento({
  locale,
  copy,
  ctaLabel,
  moreLabel,
  countLabel,
}: {
  locale: Locale;
  copy: Dictionary["servicesSection"];
  ctaLabel: string;
  moreLabel: string;
  /** Sufijo del contador por grupo ("servicios"). */
  countLabel: string;
}) {
  const [featureA, featureB] = services;

  return (
    <Section tone="light" id="servicios" className="relative">
      <Backdrop variant="soft" />

      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        align="left"
        size="lg"
        action={
          <Link
            href={localizedHref(locale, "servicios")}
            className="group inline-flex items-center gap-2 text-base font-semibold text-heading underline-offset-8 transition-colors hover:text-accent hover:underline"
          >
            {moreLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />

      {/* Dos piezas destacadas con imagen */}
      <div className="mt-14 grid gap-4">
        {[featureA, featureB].map((service, i) => {
          const c = service[locale];
          const tone = hue[hueForService(service.slug, i)];
          return (
            <Reveal key={service.slug} delay={i * 90}>
              <Link
                href={localizedHref(locale, `servicios/${service.slug}`)}
                className={cn(
                  "group relative grid overflow-hidden rounded-3xl border border-line bg-card transition-all duration-300 hover:shadow-card-hover md:grid-cols-2",
                  tone.border,
                )}
              >
                <div
                  className={cn(
                    "relative aspect-[16/10] md:aspect-auto md:min-h-68",
                    i === 1 && "md:order-2",
                  )}
                >
                  <Image
                    src={service.image}
                    alt={c.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                  <span
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                      tone.tile,
                      tone.tileHover,
                    )}
                  >
                    <ServiceIcon name={service.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="text-2xl font-extrabold text-heading sm:text-3xl">
                    {c.title}
                  </h3>
                  <p className="max-w-md leading-relaxed text-body">
                    {c.description}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-2 text-sm font-semibold",
                      tone.text,
                    )}
                  >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* Índice completo, por función */}
      <div className="mt-4 grid gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-3">
        {serviceGroups.map((group, g) => (
          <div key={group.key} className="flex flex-col bg-card p-7 sm:p-8">
            <p className="flex items-baseline justify-between gap-3 border-b border-line pb-5">
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted">
                {group[locale].title}
              </span>
              <span className="shrink-0 text-[0.66rem] font-semibold tabular-nums text-heading/35">
                {group.slugs.length} {countLabel}
              </span>
            </p>

            <ul className="flex-1 divide-y divide-line">
              {group.slugs.map((slug, i) => {
                const service = getService(slug);
                if (!service) return null;
                const c = service[locale];
                const tone = hue[hueForService(slug, g + i)];
                return (
                  <Reveal
                    key={slug}
                    as="li"
                    delay={Math.min(i, 4) * 50}
                  >
                    <Link
                      href={localizedHref(locale, `servicios/${slug}`)}
                      className="group flex items-center gap-3.5 py-3.5"
                    >
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                          tone.tile,
                          tone.tileHover,
                        )}
                      >
                        <ServiceIcon name={service.icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold text-heading">
                          {c.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {c.tagline}
                        </span>
                      </span>
                      <ArrowUpRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100",
                          tone.textHover,
                        )}
                      />
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
