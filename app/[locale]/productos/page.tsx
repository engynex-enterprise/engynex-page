import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Rocket, SlidersHorizontal, ServerCog, Headset, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ProductCard } from "@/components/ProductCard";
import { ProductIcon } from "@/components/ProductIcon";
import { Accordion } from "@/components/Accordion";
import { Decor } from "@/components/Decor";
import { products, productCategories } from "@/content/products";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const whyIcons = [Rocket, SlidersHorizontal, ServerCog, Headset];

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
    title: dict.nav.products,
    description: dict.productsPage.hero.subtitle,
    alternates: {
      canonical: `/${safe}/productos`,
      languages: { es: "/es/productos", en: "/en/productos" },
    },
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.productsPage;
  const contactHref = localizedHref(locale, "contacto");

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
      />

      <TrustStrip items={dict.trust} />

      {/* Catálogo por categorías */}
      <Section tone="mesh" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow={t.intro.eyebrow}
            title={t.intro.title}
            subtitle={t.intro.subtitle}
          />

          <div className="mt-16 space-y-16">
            {productCategories.map((category) => {
              const items = products.filter(
                (product) => product.category === category.key,
              );
              return (
                <div key={category.key}>
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-navy-950 shadow-lg shadow-brand-blue/20">
                      <ProductIcon name={category.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-xl font-extrabold text-heading sm:text-2xl">
                        {category[locale].title}
                      </h3>
                      <p className="mt-1 text-sm text-body">
                        {category[locale].description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {items.map((product, i) => (
                      <Reveal
                        key={product.slug}
                        delay={(i % 4) * 70}
                        className="h-full"
                      >
                        <ProductCard
                          product={product}
                          locale={locale}
                          ctaLabel={t.detail.viewProduct}
                          ctaHref={localizedHref(
                            locale,
                            `productos/${product.slug}`,
                          )}
                          audienceLabel={t.audienceLabel}
                          badgeLabel={
                            product.badge ? dict.badges[product.badge] : undefined
                          }
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Cómo lo entregamos */}
      <Section tone="light" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow={t.whyEyebrow}
            title={t.whyTitle}
            subtitle={t.whySubtitle}
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.why.map((item, i) => {
              const Icon = whyIcons[i % whyIcons.length];
              return (
                <Reveal
                  key={item.title}
                  delay={(i % 4) * 80}
                  className="h-full rounded-3xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/12 text-accent">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-base font-extrabold text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">
                    {item.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Y mucho más: desarrollo a la medida */}
      <section className="bg-mesh-soft py-20 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-14 shadow-card sm:px-12">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-green/15 blur-[90px]" />
              <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-brand-blue/15 blur-[90px]" />
            </div>
            <div className="relative mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
                {t.customEyebrow}
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
                {t.customTitle}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {t.customSubtitle}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={contactHref} variant="primary" size="lg">
                  {t.customPrimary}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  href={localizedHref(locale, "servicios")}
                  variant="outline"
                  size="lg"
                >
                  {t.customSecondary}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Preguntas frecuentes */}
      <Section tone="light" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow="FAQ"
            title={t.faqsTitle}
            subtitle={t.faqsSubtitle}
            className="mb-12"
          />
          <div className="mx-auto max-w-3xl">
            <Accordion items={t.faqs} />
          </div>
        </div>
      </Section>

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={t.ctaAll}
        secondaryLabel={dict.ctaBand.secondary}
        secondaryHref={localizedHref(locale, "portafolio")}
      />
    </>
  );
}
