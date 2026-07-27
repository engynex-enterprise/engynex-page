import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ServiceCard } from "@/components/ServiceCard";
import { Decor } from "@/components/Decor";
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

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
      />

      <TrustStrip items={dict.trust} />

      <Section tone="mesh" containerClassName="relative">
        <Decor />
        <div className="relative">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 60} className="h-full">
                <ServiceCard
                  service={service}
                  locale={locale}
                  ctaLabel={t.viewDetail}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

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
