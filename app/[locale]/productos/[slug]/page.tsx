import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Users,
  PlayCircle,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading, Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button, ButtonExternal } from "@/components/ui/Button";
import { Accordion } from "@/components/Accordion";
import { ProductIcon } from "@/components/ProductIcon";
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
import { cn } from "@/lib/utils";

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
  const isGreen = product.accent === "green";
  const index = products.findIndex((p) => p.slug === slug);
  const related = relatedProducts(product);
  const contactHref = localizedHref(locale, "contacto");

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-deep-950 pt-32 pb-24 text-ink-100 sm:pt-40 sm:pb-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={product.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-950 via-deep-950/90 to-deep-950/60" />
          <div className="bg-grid absolute inset-0 opacity-35" />
          <div
            className={cn(
              "absolute -top-20 left-1/4 h-[30rem] w-[30rem] rounded-full blur-[150px]",
              isGreen ? "bg-brand-green/25" : "bg-brand-blue/30",
            )}
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-deep-950" />
        </div>

        <Container className="relative">
          <nav
            aria-label="breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink-400"
          >
            <Link
              href={localizedHref(locale, "productos")}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.detail.back}
            </Link>
            {category && (
              <>
                <span aria-hidden className="opacity-40">
                  /
                </span>
                <span className="text-ink-300">{category[locale].title}</span>
              </>
            )}
          </nav>

          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ring-1",
                    isGreen
                      ? "bg-brand-green/10 text-brand-green ring-brand-green/25"
                      : "bg-brand-blue/10 text-brand-blue-light ring-brand-blue/25",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.tagline}
                </span>
                {product.badge && (
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-deep-950">
                    {dict.badges[product.badge]}
                  </span>
                )}
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                {copy.intro}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href={contactHref} variant="primary" size="lg">
                  {t.cta}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <ButtonExternal
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="lg"
                >
                  {dict.common.talkToUs}
                </ButtonExternal>
              </div>

              <p className="mt-7 inline-flex items-center gap-2 text-sm text-ink-400">
                <Users className="h-4 w-4 shrink-0 text-brand-green" />
                <span>
                  <span className="font-extrabold uppercase tracking-wide">
                    {t.audienceLabel}:
                  </span>{" "}
                  {copy.audience}
                </span>
              </p>
            </div>

            {/* Maqueta del producto */}
            <Reveal className="relative">
              <div
                aria-hidden
                className={cn(
                  "absolute -inset-5 rounded-[3rem] blur-3xl",
                  isGreen
                    ? "bg-gradient-to-br from-brand-green/25 to-brand-blue/20"
                    : "bg-gradient-to-br from-brand-blue/25 to-brand-green/20",
                )}
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-deep-900/85 p-6 shadow-2xl backdrop-blur">
                <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white ring-1 ring-white/20",
                        isGreen ? "bg-brand-green/80" : "bg-brand-blue/80",
                      )}
                    >
                      <ProductIcon name={product.icon} className="h-7 w-7" />
                    </span>
                    <span className="text-xs font-extrabold tabular-nums text-ink-400">
                      {String(index + 1).padStart(2, "0")}
                      <span className="opacity-50">
                        /{String(products.length).padStart(2, "0")}
                      </span>
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="h-2.5 w-2/3 rounded-full bg-gradient-to-r from-brand-green to-brand-blue" />
                    <div className="h-2.5 w-1/3 rounded-full bg-white/12" />
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {copy.features.slice(0, 4).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 rounded-xl bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/[0.07]"
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                            isGreen
                              ? "bg-brand-green/25 text-brand-green"
                              : "bg-brand-blue/25 text-brand-blue-light",
                          )}
                        >
                          <Check
                            className="h-3 w-3"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                        <span className="text-[0.82rem] leading-snug text-ink-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-green/10 px-4 py-3 ring-1 ring-brand-green/25">
                    <PlayCircle className="h-5 w-5 shrink-0 text-brand-green" />
                    <span className="text-sm font-bold text-white">
                      {t.detail.demoNote}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============= BENEFICIOS (overlap) ============= */}
      <div className="relative z-10 -mt-16">
        <Container>
          <div className="grid gap-4 rounded-3xl border border-line bg-card p-4 shadow-card md:grid-cols-3">
            {copy.benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className="rounded-2xl p-5 transition-colors hover:bg-accent-soft/40"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold",
                    isGreen
                      ? "bg-brand-green/15 text-accent"
                      : "bg-brand-blue/15 text-brand-blue dark:text-brand-blue-light",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-4 text-base font-extrabold text-heading">
                  {benefit.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ============= QUÉ INCLUYE ============= */}
      <Section tone="mesh">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <Eyebrow>{t.detail.overviewTitle}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-body">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href={contactHref}
                variant={isGreen ? "primary" : "secondary"}
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                href={localizedHref(locale, "productos")}
                variant="outline"
              >
                {t.detail.allProducts}
              </Button>
            </div>
          </Reveal>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-muted">
              <Layers className="h-4 w-4" aria-hidden />
              {t.detail.modulesTitle}
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {copy.modules.map((module, i) => (
                <Reveal
                  key={module}
                  delay={(i % 2) * 80}
                  className="group flex items-start gap-3 rounded-2xl border border-line bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isGreen
                        ? "bg-brand-green/15 text-accent group-hover:bg-brand-green group-hover:text-deep-950"
                        : "bg-brand-blue/15 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  </span>
                  <p className="text-sm font-bold leading-snug text-heading">
                    {module}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ============= CÓMO LO ENTREGAMOS ============= */}
      <Section tone="dark">
        <SectionHeading
          eyebrow={t.whyEyebrow}
          title={t.whyTitle}
          subtitle={t.whySubtitle}
          tone="dark"
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.map((item, i) => (
            <Reveal
              key={item.title}
              delay={(i % 4) * 90}
              className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:bg-white/[0.06]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-6 text-7xl font-extrabold text-white/[0.05] transition-colors group-hover:text-brand-green/10"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-sm font-extrabold text-deep-950">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="relative mt-5 text-base font-extrabold text-white">
                {item.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink-300">
                {item.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ============= FAQ ============= */}
      <Section tone="light">
        <SectionHeading
          eyebrow="FAQ"
          title={t.detail.faqsTitle}
          className="mb-12"
        />
        <div className="mx-auto max-w-3xl space-y-10">
          <Accordion items={copy.faqs} />
          <div>
            <h3 className="mb-4 text-lg font-extrabold text-heading">
              {t.faqsTitle}
            </h3>
            <Accordion items={t.faqs} />
          </div>
        </div>
      </Section>

      {/* ============= RELACIONADOS ============= */}
      <Section tone="mesh">
        <SectionHeading
          eyebrow={t.intro.eyebrow}
          title={t.detail.relatedTitle}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {related.map((item, i) => {
            const relatedCopy = item[locale];
            const relatedGreen = item.accent === "green";
            return (
              <Reveal key={item.slug} delay={(i % 3) * 90} className="h-full">
                <Link
                  href={localizedHref(locale, `productos/${item.slug}`)}
                  className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
                >
                  <span
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                      relatedGreen
                        ? "bg-brand-green/12 text-accent group-hover:bg-brand-green group-hover:text-deep-950"
                        : "bg-brand-blue/12 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                    )}
                  >
                    <ProductIcon name={item.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-heading">
                    {relatedCopy.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                    {relatedCopy.tagline}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-heading transition-colors group-hover:text-accent">
                    {t.detail.viewProduct}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <CtaBand
        locale={locale}
        title={t.detail.ctaTitle}
        subtitle={t.detail.ctaSubtitle}
        primaryLabel={t.cta}
        secondaryLabel={t.detail.allProducts}
        secondaryHref={localizedHref(locale, "productos")}
      />
    </>
  );
}
