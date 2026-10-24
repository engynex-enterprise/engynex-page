import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
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
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonExternal, buttonClasses } from "@/components/ui/Button";
import { StickyBar } from "@/components/ui/StickyBar";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { SpecRow } from "@/components/ui/SpecRow";
import { CardRail } from "@/components/ui/CardRail";
import { Accordion } from "@/components/Accordion";
import { ProductIcon } from "@/components/ProductIcon";
import { PageHero } from "@/components/sections/PageHero";
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
  return [...sameCategory, ...others];
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
      <PageHero
        eyebrow={category ? category[locale].title : t.hero.eyebrow}
        title={copy.title}
        subtitle={copy.tagline}
        image={product.image}
      />

      {/* Barra de producto pegada bajo la navegación, como en meta.com */}
      <StickyBar
        title={copy.title}
        action={{ label: dict.ui.demo, href: contactHref }}
      />

      {/* ============= EN QUÉ CONSISTE ============= */}
      <section className="bg-surface pb-16 pt-8 sm:pb-24 sm:pt-10">
        <Container>
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <li>
                <Link
                  href={productsHref}
                  className="inline-flex items-center gap-1 rounded-full font-semibold text-heading transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
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
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-heading">
                {copy.title}
              </li>
            </ol>
          </nav>

          <div className="mt-10 sm:mt-14">
            <SplitFeature
              image={product.image}
              eyebrow={t.detail.overviewTitle}
              title={copy.title}
              description={copy.intro}
            >
              <p className="mt-4 text-base leading-relaxed text-body">
                {copy.description}
              </p>
              <p className="mt-6 text-sm text-muted">
                {product.badge && (
                  <span className="mr-2 inline-flex rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-heading">
                    {dict.badges[product.badge]}
                  </span>
                )}
                <span className="font-bold text-heading">
                  {t.audienceLabel}:
                </span>{" "}
                {copy.audience}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={contactHref}
                  className={buttonClasses("primary", "lg")}
                >
                  {t.cta}
                </Link>
                <ButtonExternal
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="lg"
                >
                  {dict.common.talkToUs}
                </ButtonExternal>
              </div>
            </SplitFeature>
          </div>
        </Container>
      </section>

      {/* ============= QUÉ INCLUYE: maqueta + cifras ============= */}
      <Section tone="muted">
        <SectionHeading title={t.featuresTitle} size="lg" />

        {/* Maqueta del producto: una "pantalla" neutra con sus funciones reales */}
        <Reveal className="mx-auto mt-12 max-w-5xl sm:mt-14">
          <div className="rounded-3xl bg-card p-2.5 sm:p-3">
            <div className="overflow-hidden rounded-[1.125rem] bg-surface ring-1 ring-line">
              {/* Barra superior */}
              <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <ProductIcon name={product.icon} className="h-5 w-5" />
                  </span>
                  <span className="truncate text-sm font-bold text-heading">
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
                    {copy.features.map((feature) => (
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
                    <span className="text-left text-sm font-semibold text-heading">
                      {t.detail.demoNote}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Ficha técnica: solo cifras que salen del contenido */}
        <div className="mx-auto mt-14 max-w-2xl sm:mt-16 sm:[&>dl]:grid-cols-2">
          <SpecRow
            items={[
              {
                icon: Boxes,
                value: String(copy.modules.length),
                label: t.detail.modulesTitle,
              },
              {
                icon: PlayCircle,
                value: "24 h",
                label: t.detail.demoNote,
              },
            ]}
          />
        </div>
      </Section>

      {/* ============= BENEFICIOS ============= */}
      <Section tone="light">
        <ul className="grid gap-4 md:grid-cols-3">
          {copy.benefits.map((benefit, i) => (
            <li
              key={benefit.title}
              className="rounded-3xl bg-surface-soft p-8 sm:p-10"
            >
              <span className="text-sm font-bold tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-[1.75rem] font-bold leading-tight text-heading">
                {benefit.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-body">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
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
              <p className="mt-6 text-lg font-bold leading-snug text-heading">
                {module}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ============= CÓMO LO ENTREGAMOS ============= */}
      <Section tone="light">
        <SplitFeature
          reverse
          image="/images/about-team.jpg"
          eyebrow={t.whyEyebrow}
          title={t.whyTitle}
          description={t.whySubtitle}
          primary={{ label: t.cta, href: contactHref }}
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
            <h3 className="mb-5 text-xl font-bold text-heading">
              {t.faqsTitle}
            </h3>
            <Accordion items={t.faqs} />
          </div>
        </div>
      </Section>

      {/* ============= RELACIONADOS: carril de meta.com ============= */}
      <section className="overflow-hidden bg-surface py-16 sm:py-24">
        <Container className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
            {t.detail.relatedTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
            {t.intro.subtitle}
          </p>
          <Link
            href={productsHref}
            className={buttonClasses("outline", "md", "mt-6")}
          >
            {t.detail.allProducts}
          </Link>
        </Container>
        <div className="mt-10 sm:mt-12">
          <CardRail
            label={t.detail.relatedTitle}
            prevLabel={dict.ui.prev}
            nextLabel={dict.ui.next}
            cards={related.map((item) => ({
              key: item.slug,
              title: item[locale].title,
              caption: item[locale].tagline,
              image: item.image,
              href: localizedHref(locale, `productos/${item.slug}`),
            }))}
          />
        </div>
      </section>

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
