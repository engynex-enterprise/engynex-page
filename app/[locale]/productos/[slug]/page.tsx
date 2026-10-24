import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  PlayCircle,
  Rocket,
  SlidersHorizontal,
  ServerCog,
  Headset,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading, Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button, ButtonExternal } from "@/components/ui/Button";
import { MediaTile } from "@/components/ui/MediaTile";
import { Accordion } from "@/components/Accordion";
import { ProductIcon } from "@/components/ProductIcon";
import { ProductCard } from "@/components/ProductCard";
import { CtaBand } from "@/components/sections/CtaBand";
import {
  products,
  getProduct,
  productCategoryOf,
  type Product,
} from "@/content/products";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";

const whyIcons = [Rocket, SlidersHorizontal, ServerCog, Headset];
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((product) => ({ locale, slug: product.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const product = getProduct(slug);
  if (!product) return {};
  const copy = product[safe];
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${safe}/productos/${slug}`,
      languages: {
        es: `/es/productos/${slug}`,
        en: `/en/productos/${slug}`,
      },
    },
    openGraph: {
      title: `${copy.title} | Engynex`,
      description: copy.description,
      images: [product.image],
    },
  };
}

/** Elige productos relacionados: primero los de la misma categoría. */
function relatedProducts(product: Product): Product[] {
  const sameCategory = products.filter(
    (p) => p.slug !== product.slug && p.category === product.category,
  );
  const others = products.filter(
    (p) => p.slug !== product.slug && p.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, 3);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = getProduct(slug);
  if (!product) notFound();

  const dict = getDictionary(locale);
  const t = dict.productsPage;
  const copy = product[locale];
  const category = productCategoryOf(product);
  const related = relatedProducts(product);
  const contactHref = localizedHref(locale, "contacto");
  const productsHref = localizedHref(locale, "productos");

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="bg-surface-soft pt-16">
        <Container className="pb-16 pt-8 sm:pb-24 sm:pt-10">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <li>
                <Link
                  href={productsHref}
                  className="inline-flex items-center gap-1 rounded-full font-medium text-heading transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  {t.detail.back}
                </Link>
              </li>
              {category && (
                <>
                  <li aria-hidden>/</li>
                  <li>{category[locale].title}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="mx-auto mt-12 max-w-4xl text-center sm:mt-16">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {category && <Eyebrow>{category[locale].title}</Eyebrow>}
              {product.badge && (
                <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-heading">
                  {dict.badges[product.badge]}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-balance text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-heading">
              {copy.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-muted sm:text-xl">
              {copy.tagline}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={contactHref} variant="primary" size="lg">
                {t.cta}
              </Button>
              <ButtonExternal
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
              >
                {dict.common.talkToUs}
              </ButtonExternal>
            </div>

            <p className="mt-6 text-sm text-muted">
              <span className="font-semibold text-heading">
                {t.audienceLabel}:
              </span>{" "}
              {copy.audience}
            </p>
          </div>

          {/* Maqueta del producto: una "pantalla" neutra con sus funciones reales */}
          <Reveal className="mx-auto mt-14 max-w-5xl sm:mt-16">
            <div className="rounded-3xl bg-card p-2.5 sm:p-3">
              <div className="overflow-hidden rounded-[1.125rem] bg-surface ring-1 ring-line">
                {/* Barra superior */}
                <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <ProductIcon name={product.icon} className="h-5 w-5" />
                    </span>
                    <span className="truncate text-sm font-medium text-heading">
                      {copy.title}
                    </span>
                  </div>
                  <div aria-hidden className="flex items-center gap-2">
                    <span className="hidden h-7 w-40 rounded-full bg-card-soft sm:block" />
                    <span className="h-7 w-7 rounded-full bg-card-soft" />
                  </div>
                </div>

                <div className="grid md:grid-cols-[13rem_1fr]">
                  {/* Menú lateral */}
                  <div
                    aria-hidden
                    className="hidden space-y-2 border-r border-line p-4 md:block"
                  >
                    <div className="h-8 rounded-lg bg-accent-soft" />
                    {[70, 85, 60, 75, 55].map((w) => (
                      <div key={w} className="flex h-8 items-center px-2">
                        <span
                          className="h-2 rounded-full bg-card-soft"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Contenido */}
                  <div className="p-4 sm:p-6">
                    <div aria-hidden className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((k) => (
                        <div
                          key={k}
                          className="rounded-2xl bg-card-soft p-3 sm:p-4"
                        >
                          <span className="block h-2 w-1/2 rounded-full bg-line" />
                          <span className="mt-3 block h-4 w-3/4 rounded-full bg-line sm:h-5" />
                        </div>
                      ))}
                    </div>

                    <ul className="mt-4 divide-y divide-line rounded-2xl ring-1 ring-line">
                      {copy.features.slice(0, 4).map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 px-4 py-3.5 text-left"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                            <Check
                              className="h-3 w-3"
                              strokeWidth={3}
                              aria-hidden
                            />
                          </span>
                          <span className="text-sm leading-snug text-body">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-card-soft px-4 py-3">
                      <PlayCircle
                        className="h-5 w-5 shrink-0 text-accent"
                        aria-hidden
                      />
                      <span className="text-left text-sm font-medium text-heading">
                        {t.detail.demoNote}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ============= EN QUÉ CONSISTE + BENEFICIOS ============= */}
      <Section tone="light">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>{t.detail.overviewTitle}</Eyebrow>
            <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.15] text-heading">
              {copy.title}
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-body">
            <p>{copy.intro}</p>
            <p className="text-muted">{copy.description}</p>
          </div>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {copy.benefits.map((benefit, i) => (
            <li
              key={benefit.title}
              className="rounded-3xl bg-surface-soft p-8 sm:p-10"
            >
              <span className="text-sm font-semibold tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                {benefit.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-body">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>

        <MediaTile
          size="wide"
          className="mt-4"
          image={product.image}
          kicker={copy.title}
          title={copy.tagline}
          description={t.detail.demoNote}
          primary={{ label: t.cta, href: contactHref }}
          secondary={{ label: t.detail.allProducts, href: productsHref }}
        />
      </Section>

      {/* ============= MÓDULOS ============= */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={t.featuresTitle}
          title={t.detail.modulesTitle}
          size="lg"
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.modules.map((module) => (
            <li key={module} className="rounded-3xl bg-card p-8">
              <Check
                className="h-6 w-6 text-accent"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-6 text-lg font-medium leading-snug text-heading">
                {module}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ============= CÓMO LO ENTREGAMOS ============= */}
      <Section tone="light">
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
              <li
                key={item.title}
                className="rounded-3xl bg-surface-soft p-8 sm:p-10"
              >
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

      {/* ============= FAQ ============= */}
      <Section tone="muted">
        <SectionHeading
          title={t.detail.faqsTitle}
          size="lg"
          className="mb-12"
        />
        <div className="mx-auto max-w-3xl space-y-12">
          <Accordion items={copy.faqs} />
          <div>
            <h3 className="mb-5 text-xl font-medium text-heading">
              {t.faqsTitle}
            </h3>
            <Accordion items={t.faqs} />
          </div>
        </div>
      </Section>

      {/* ============= RELACIONADOS ============= */}
      <Section tone="light">
        <SectionHeading
          eyebrow={t.intro.eyebrow}
          title={t.detail.relatedTitle}
          size="lg"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item, i) => (
            <Reveal key={item.slug} delay={(i % 3) * 90} className="h-full">
              <ProductCard
                product={item}
                locale={locale}
                ctaLabel={t.detail.viewProduct}
                ctaHref={localizedHref(locale, `productos/${item.slug}`)}
                badgeLabel={item.badge ? dict.badges[item.badge] : undefined}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand
        locale={locale}
        title={t.detail.ctaTitle}
        subtitle={t.detail.ctaSubtitle}
        primaryLabel={t.cta}
        secondaryLabel={t.detail.allProducts}
        secondaryHref={productsHref}
      />
    </>
  );
}
