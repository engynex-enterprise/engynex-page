import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { StatsBand } from "@/components/sections/StatsBand";
import { Testimonials } from "@/components/sections/Testimonials";
import { PortfolioGrid } from "@/components/PortfolioGrid";
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
    title: dict.nav.portfolio,
    description: dict.portfolioPage.hero.subtitle,
    alternates: { canonical: `/${safe}/portafolio` },
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.portfolioPage;

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
      />

      <StatsBand stats={dict.aboutPage.stats} image="/images/about-meeting.jpg" />

      <Section tone="mesh">
        <PortfolioGrid
          locale={locale}
          allLabel={t.all}
          resultLabel={t.resultLabel}
        />
      </Section>

      <Testimonials testimonials={dict.testimonials} tone="light" />

      <CtaBand
        locale={locale}
        title={t.ctaTitle}
        subtitle={t.ctaSubtitle}
        primaryLabel={dict.ctaBand.primary}
        secondaryLabel={dict.common.viewServices}
        secondaryHref={localizedHref(locale, "servicios")}
      />
    </>
  );
}
