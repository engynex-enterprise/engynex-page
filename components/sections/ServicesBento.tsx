import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Backdrop } from "@/components/ui/Backdrop";
import { ServiceIcon } from "@/components/ServiceIcon";
import { services } from "@/content/services";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { hue, hueForService } from "@/lib/accents";
import { cn } from "@/lib/utils";

/**
 * Servicios en dos bloques.
 *
 * Arriba, dos piezas destacadas con fotografía a media página. Abajo, los seis
 * restantes en un muro con retícula —celdas separadas por una línea de un
 * píxel dentro de un contenedor con borde—, el mismo lenguaje que los muros de
 * clientes y de tecnologías. Así el conjunto se lee como un bloque y no como
 * seis tarjetas sueltas flotando.
 */
export function ServicesBento({
  locale,
  copy,
  ctaLabel,
  moreLabel,
}: {
  locale: Locale;
  copy: Dictionary["servicesSection"];
  ctaLabel: string;
  moreLabel: string;
}) {
  const [featureA, featureB, ...rest] = services.slice(0, 8);

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
                    "relative aspect-[16/10] md:aspect-auto md:min-h-72",
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

      {/* Los seis restantes, como un solo muro */}
      <ul className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((service, i) => {
          const c = service[locale];
          const tone = hue[hueForService(service.slug, i + 2)];
          return (
            <Reveal key={service.slug} as="li" delay={(i % 3) * 70}>
              <Link
                href={localizedHref(locale, `servicios/${service.slug}`)}
                className="group relative flex h-full flex-col gap-3 bg-card p-7 transition-colors duration-300 hover:bg-accent-soft/30"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
                    tone.tile,
                    tone.tileHover,
                  )}
                >
                  <ServiceIcon name={service.icon} className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-heading">
                  {c.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-body">
                  {c.tagline}
                </p>
                <ArrowUpRight
                  className={cn(
                    "h-5 w-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    tone.textHover,
                  )}
                />
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
