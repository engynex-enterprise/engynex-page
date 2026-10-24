import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Rocket, SlidersHorizontal, ServerCog, Headset } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ProductCard } from "@/components/ProductCard";
import { Accordion } from "@/components/Accordion";
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
        image="/images/svc-plataformas-web.jpg"
      />

      <TrustStrip items={dict.trust} />

      {/* Catálogo por categorías */}
      <Section tone="light">
        <SectionHeading
          eyebrow={t.intro.eyebrow}
          title={t.intro.title}
          subtitle={t.intro.subtitle}
          size="lg"
        />

        <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-24">
          {productCategories.map((category) => {
            const items = products.filter(
              (product) => product.category === category.key,
            );
            const headingId = `cat-${category.key}`;
            return (
              <section key={category.key} aria-labelledby={headingId}>
                <div className="mx-auto max-w-2xl text-center">
                  <h3
                    id={headingId}
                    className="text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium leading-tight text-heading"
                  >
                    {category[locale].title}
                  </h3>
                  <p className="mt-3 text-base text-muted">
                    {category[locale].description}
                  </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                        badgeLabel={
                          product.badge ? dict.badges[product.badge] : undefined
                        }
                      />
                    </Reveal>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Section>

      {/* Cómo lo entregamos */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={t.whyEyebrow}
          title={t.whyTitle}
          subtitle={t.whySubtitle}
          size="lg"
        />
        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.map((item, i) => {
            const Icon = whyIcons[i % whyIcons.length];
            return (
              <li key={item.title} className="rounded-3xl bg-card p-8 sm:p-10">
                <Icon
                  className="h-7 w-7 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-body">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Y mucho más: desarrollo a la medida */}
      <Section tone="light">
        <div className="rounded-3xl bg-surface-soft px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold text-accent">
              {t.customEyebrow}
            </p>
            <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.15] text-heading">
              {t.customTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t.customSubtitle}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={contactHref} variant="primary" size="lg">
                {t.customPrimary}
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
      </Section>

      {/* Preguntas frecuentes */}
      <Section tone="muted">
        <SectionHeading
          title={t.faqsTitle}
          subtitle={t.faqsSubtitle}
          size="lg"
          className="mb-12"
        />
        <div className="mx-auto max-w-3xl">
          <Accordion items={t.faqs} />
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
