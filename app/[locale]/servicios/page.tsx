import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaTile } from "@/components/ui/MediaTile";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ServiceCard } from "@/components/ServiceCard";
import { services } from "@/content/services";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const dict = getDictionary(safe);
  return {
    title: dict.nav.services,
    description: dict.servicesPage.hero.subtitle,
    alternates: { canonical: `/${safe}/servicios` },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.servicesPage;

  // Los cuatro primeros servicios abren el catálogo como piezas fotográficas
  // grandes (dos filas de dos); los doce restantes llenan la rejilla de fichas.
  const [featured, rest] = [services.slice(0, 4), services.slice(4)];
  const contactHref = localizedHref(locale, "contacto");

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image="/images/svc-consultoria-tech.jpg"
      />

      <Section tone="light" className="pt-4 sm:pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((service, i) => {
            const copy = service[locale];
            return (
              <MediaTile
                key={service.slug}
                image={service.image}
                imageAlt={copy.title}
                kicker={copy.tagline}
                title={copy.title}
                priority={i < 2}
                primary={{
                  label: t.viewDetail,
                  href: localizedHref(locale, `servicios/${service.slug}`),
                }}
                secondary={{ label: t.ctaService, href: contactHref }}
              />
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rest.map((service, i) => (
            <Reveal key={service.slug} delay={(i % 4) * 60} className="h-full">
              <ServiceCard
                service={service}
                locale={locale}
                ctaLabel={t.viewDetail}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <TrustStrip items={dict.trust} title={t.detail.benefitsTitle} />

      <ProcessSection process={dict.process} tone="light" />

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        secondaryLabel={dict.ctaBand.secondary}
        secondaryHref={localizedHref(locale, "portafolio")}
      />
    </>
  );
}
