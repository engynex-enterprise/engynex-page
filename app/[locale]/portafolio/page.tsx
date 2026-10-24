import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { projects, categoryLabels } from "@/content/portfolio";
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
  const heroImage = "/images/portfolio-1.jpg";
  // Proyecto destacado: el primero cuya foto no repite la del hero.
  const featured =
    projects.find((project) => project.image !== heroImage) ?? projects[0];

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image={heroImage}
      />

      {/* Proyecto destacado: bloque dividido de meta.com */}
      {featured && (
        <section className="bg-surface pt-16 sm:pt-24">
          <Container>
            <SplitFeature
              image={featured.image}
              imageAlt={featured[locale].title}
              eyebrow={categoryLabels[featured.category][locale]}
              title={featured[locale].title}
              description={featured[locale].summary}
              primary={{
                label: dict.ctaBand.primary,
                href: localizedHref(locale, "contacto"),
              }}
              secondary={{
                label: dict.common.viewServices,
                href: localizedHref(locale, "servicios"),
              }}
            >
              <p className="mt-6 text-sm text-muted">{t.resultLabel}</p>
              <p className="mt-1 text-[clamp(1.75rem,2.8vw,2.25rem)] font-bold leading-tight text-heading">
                {featured[locale].result}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {featured.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </SplitFeature>
          </Container>
        </section>
      )}

      <Section tone="light">
        <h2 className="mb-8 text-center text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
          {t.hero.eyebrow}
        </h2>
        <PortfolioGrid
          locale={locale}
          allLabel={t.all}
          resultLabel={t.resultLabel}
        />
      </Section>

      <StatsBand
        eyebrow={dict.aboutPage.statsEyebrow}
        title={dict.aboutPage.statsTitle}
        subtitle={dict.aboutPage.statsSubtitle}
        stats={dict.aboutPage.stats}
        tone="muted"
      />

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
