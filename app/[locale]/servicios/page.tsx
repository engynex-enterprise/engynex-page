import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { MediaTile } from "@/components/ui/MediaTile";
import { CardRail } from "@/components/ui/CardRail";
import { buttonClasses } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { services, getService } from "@/content/services";
import { serviceGroups } from "@/content/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { cn } from "@/lib/utils";

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
  // grandes; después, el catálogo completo se recorre en un carril por grupo
  // (los mismos grupos del mega menú), como las filas de producto de meta.com.
  const featured = services.slice(0, 4);
  const contactHref = localizedHref(locale, "contacto");

  const rails = serviceGroups.map((group) => ({
    key: group.key,
    title: group[locale].title,
    cards: group.slugs
      .map((slug) => getService(slug))
      .filter((s) => s !== undefined)
      .map((s) => ({
        key: s.slug,
        title: s[locale].title,
        caption: s[locale].tagline,
        image: s.image,
        href: localizedHref(locale, `servicios/${s.slug}`),
      })),
  }));

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image="/images/svc-consultoria-tech.jpg"
      />

      <Section tone="muted" className="pt-4 sm:pt-4">
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
      </Section>

      {/* Catálogo completo: titular centrado + un carril por grupo */}
      <section className="bg-surface py-16 text-body sm:py-24">
        <Container className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {dict.servicesSection.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {dict.servicesSection.subtitle}
          </p>
          <Link
            href={contactHref}
            className={buttonClasses("outline", "md", "mt-8")}
          >
            {dict.ui.quote}
          </Link>
        </Container>

        {rails.map((rail, i) => (
          <div
            key={rail.key}
            className={cn(i === 0 ? "mt-14 sm:mt-20" : "mt-14 sm:mt-16")}
          >
            <Container>
              <h3 className="mb-6 text-2xl font-bold text-heading sm:text-[1.75rem]">
                {rail.title}
              </h3>
            </Container>
            <CardRail
              cards={rail.cards}
              label={rail.title}
              prevLabel={dict.ui.prev}
              nextLabel={dict.ui.next}
            />
          </div>
        ))}
      </section>

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
