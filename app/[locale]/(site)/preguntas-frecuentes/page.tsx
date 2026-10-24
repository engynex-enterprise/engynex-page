import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { CtaBand } from "@/components/sections/CtaBand";
import { HelpSearch, type HelpEntry } from "@/components/HelpSearch";
import { CompanyHero } from "@/components/company/CompanyHero";
import { ExploreCompany, companyImages } from "@/components/company/ExploreCompany";
import {
  BFaqExplorer,
  type BFaqCategory,
  type BFaqGroup,
} from "@/components/company/BFaqExplorer";
import { companyB } from "@/content/company-b";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { extraServiceFaqs } from "@/content/faqs";
import { serviceGroups } from "@/content/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";

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
  const t = companyB[safe].faq;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/preguntas-frecuentes` },
  };
}

/**
 * Preguntas frecuentes, al estilo de meta.com/help: buscador sobre todas las
 * preguntas del sitio, temas en píldoras y listas desplegables agrupadas por
 * tema, servicio y producto, cada una enlazada a su página.
 */
export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyB[locale].faq;
  const help = dict.help;
  const href = (path: string) => localizedHref(locale, path);
  const page = (anchor: string) => href(`preguntas-frecuentes#${anchor}`);
  const contactHref = href("contacto");

  const serviceFaqs = (slug: string) => {
    const service = services.find((s) => s.slug === slug);
    if (!service) return [];
    return [
      ...service[locale].faqs,
      ...(extraServiceFaqs[slug]?.[locale] ?? []),
    ];
  };

  // -------- Grupos y temas --------
  const categories: BFaqCategory[] = [
    { id: "general", label: t.categories.general },
    { id: "pagos-contratos", label: t.categories.payments },
    ...serviceGroups.map((group) => ({ id: group.key, label: group[locale].title })),
    { id: "productos", label: t.categories.products },
  ];

  const groups: BFaqGroup[] = [
    {
      id: "antes-de-empezar",
      category: "general",
      title: t.generalGroup,
      items: dict.contactPage.faqs,
    },
    {
      id: "pagos",
      category: "pagos-contratos",
      title: t.paymentsGroup,
      items: dict.servicesPage.commonFaqs,
    },
    ...serviceGroups.flatMap((group) =>
      group.slugs.flatMap((slug) => {
        const service = services.find((s) => s.slug === slug);
        if (!service) return [];
        return [
          {
            id: slug,
            category: group.key,
            title: service[locale].title,
            href: href(`servicios/${slug}`),
            items: serviceFaqs(slug),
          },
        ];
      }),
    ),
    {
      id: "implementacion",
      category: "productos",
      title: t.productsGroup,
      href: href("productos"),
      items: dict.productsPage.faqs,
    },
    ...products.map((product) => ({
      id: product.slug,
      category: "productos",
      title: product[locale].title,
      href: href(`productos/${product.slug}`),
      items: product[locale].faqs,
    })),
  ];

  // -------- Índice del buscador (mismo criterio que /ayuda) --------
  const entries: HelpEntry[] = [
    ...services.flatMap((service) =>
      serviceFaqs(service.slug).map((faq) => ({
        ...faq,
        href: page(service.slug),
        source: `${help.groupService} · ${service[locale].title}`,
      })),
    ),
    ...products.flatMap((product) =>
      product[locale].faqs.map((faq) => ({
        ...faq,
        href: page(product.slug),
        source: `${help.groupProduct} · ${product[locale].title}`,
      })),
    ),
    ...dict.servicesPage.commonFaqs.map((faq) => ({
      ...faq,
      href: page("pagos"),
      source: `${help.groupGeneral} · ${t.paymentsGroup}`,
    })),
    ...dict.contactPage.faqs.map((faq) => ({
      ...faq,
      href: page("antes-de-empezar"),
      source: `${help.groupGeneral} · ${t.generalGroup}`,
    })),
    ...dict.productsPage.faqs.map((faq) => ({
      ...faq,
      href: page("implementacion"),
      source: `${help.groupGeneral} · ${t.productsGroup}`,
    })),
  ];

  return (
    <>
      <CompanyHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image={companyImages["preguntas-frecuentes"]}
        imageAlt={t.hero.imageAlt}
      />

      {/* -------- Buscador -------- */}
      <section className="bg-surface-soft px-4 py-16 sm:py-24">
        <h2 className="text-center text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
          {t.searchTitle}
        </h2>
        <HelpSearch entries={entries} copy={help} contactHref={contactHref} />
      </section>

      {/* -------- Temas y preguntas -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container className="max-w-5xl">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.browseTitle}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.browseSubtitle}
            </p>
          </div>
          <BFaqExplorer
            categories={categories}
            groups={groups}
            filterLabel={t.filterLabel}
            viewPage={t.viewPage}
            countLabel={t.countLabel}
          />
        </Container>
      </section>

      {/* -------- Más ayuda -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="text-balance text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
              {t.helpTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
              {t.helpSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={href("ayuda")} className={buttonClasses("dark", "lg")}>
                {t.helpCta}
              </Link>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "lg")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t.contactCta}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <ExploreCompany
        locale={locale}
        current="preguntas-frecuentes"
        title={dict.company.exploreTitle}
      />

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        primaryHref={href("cotizar")}
        secondaryLabel={dict.ctaBand.secondary}
      />
    </>
  );
}
