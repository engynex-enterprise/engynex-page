import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Rocket, SlidersHorizontal, ServerCog, Headset } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import Image from "next/image";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MediaTile } from "@/components/ui/MediaTile";
import { SplitFeature } from "@/components/ui/SplitFeature";
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

      {/* Selector de categorías, como el de meta.com/ai-glasses */}
      <section className="bg-surface pb-4 pt-16 sm:pt-24">
        <Container className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
            {t.intro.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted sm:text-lg">
            {t.intro.subtitle}
          </p>

          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:mt-12 sm:gap-6">
            {productCategories.map((category) => {
              const cover = products.find(
                (product) => product.category === category.key,
              );
              return (
                <li key={category.key}>
                  <a
                    href={`#cat-${category.key}`}
                    className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-2xl bg-surface-soft sm:aspect-[4/3] sm:rounded-3xl">
                      {cover && (
                        <Image
                          src={cover.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 33vw, 15rem"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
                      )}
                    </span>
                    <span className="mt-3 block text-balance text-sm font-bold leading-snug text-heading sm:text-base">
                      {category[locale].title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href="#catalogo"
            className={buttonClasses("outline", "md", "mt-10")}
          >
            {dict.ui.viewAll}
          </a>
        </Container>
      </section>

      {/* Catálogo por categorías */}
      <Section tone="light" id="catalogo" className="scroll-mt-24">
        <div className="space-y-20 sm:space-y-24">
          {productCategories.map((category) => {
            const items = products.filter(
              (product) => product.category === category.key,
            );
            const headingId = `cat-${category.key}`;
            return (
              <section
                key={category.key}
                id={headingId}
                aria-labelledby={`${headingId}-title`}
                className="scroll-mt-36"
              >
                <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <h3
                    id={`${headingId}-title`}
                    className="text-[clamp(1.75rem,2.8vw,2.25rem)] font-bold leading-tight text-heading"
                  >
                    {category[locale].title}
                  </h3>
                  <p className="max-w-md text-base text-muted sm:text-right">
                    {category[locale].description}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <TrustStrip items={dict.trust} />

      {/* Cómo lo entregamos */}
      <Section tone="light">
        <SplitFeature
          image="/images/about-team.jpg"
          eyebrow={t.whyEyebrow}
          title={t.whyTitle}
          description={t.whySubtitle}
          primary={{ label: t.ctaAll, href: contactHref }}
        >
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {t.why.map((item, i) => {
              const Icon = whyIcons[i % whyIcons.length];
              return (
                <li key={item.title}>
                  <Icon
                    className="h-6 w-6 text-accent"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p className="mt-3 font-bold text-heading">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </SplitFeature>
      </Section>

      {/* Y mucho más: desarrollo a la medida */}
      <section className="bg-surface pb-16 sm:pb-24">
        <Container>
          <MediaTile
            size="wide"
            image="/images/svc-desarrollo-web.jpg"
            kicker={t.customEyebrow}
            title={t.customTitle}
            description={t.customSubtitle}
            primary={{ label: t.customPrimary, href: contactHref }}
            secondary={{
              label: t.customSecondary,
              href: localizedHref(locale, "servicios"),
            }}
          />
        </Container>
      </section>

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
