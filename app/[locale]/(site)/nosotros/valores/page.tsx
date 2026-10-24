import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Gem,
  ShieldCheck,
  Lightbulb,
  HeartHandshake,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaBand } from "@/components/sections/CtaBand";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanySubnav } from "@/components/company/CompanySubnav";
import {
  ExploreCompany,
  companyImages,
} from "@/components/company/ExploreCompany";
import { AValuesAccordion } from "@/components/company/AValuesAccordion";
import { companyA } from "@/content/company-a";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const SLUG = "nosotros/valores";

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
  const t = companyA[safe].values;
  return {
    title: t.metaTitle,
    description: t.hero.metaDescription,
    alternates: { canonical: `/${safe}/${SLUG}` },
  };
}

/** Mismo orden que `aboutPage.values`. */
const valueIcons = [Gem, ShieldCheck, Lightbulb, HeartHandshake];

export default async function ValuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyA[locale].values;
  const values = dict.aboutPage.values;

  return (
    <>
      <CompanyHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image={companyImages[SLUG]}
        imageAlt={t.hero.imageAlt}
      />
      <CompanySubnav locale={locale} label={dict.company.subnavLabel} />

      {/* Nuestros principios: lista desplegable + foto alta */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
            <div>
              <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
                {t.principlesTitle}
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                {t.principlesIntro}
              </p>
              <div className="mt-10">
                <AValuesAccordion
                  items={values.map((value, i) => ({
                    title: value.title,
                    description: value.description,
                    practice: t.practice[i] ?? [],
                  }))}
                  practiceLabel={t.inPracticeLabel}
                  expandLabel={t.expandLabel}
                  collapseLabel={t.collapseLabel}
                />
              </div>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-soft lg:sticky lg:top-36 lg:aspect-auto lg:h-[min(44rem,calc(100vh-11rem))]">
              <Image
                src="/images/about-team.jpg"
                alt={t.photoAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Cada valor en la práctica */}
      <Section tone="muted">
        <SectionHeading title={t.rowTitle} subtitle={t.rowSubtitle} size="lg" />
        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {t.rowItems.map((item, i) => {
            const Icon = valueIcons[i % valueIcons.length];
            return (
              <li
                key={item.title}
                className="flex flex-col rounded-3xl bg-surface p-8"
              >
                <Icon
                  className="h-8 w-8 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="mt-6 text-sm font-semibold text-muted">
                  {values[i]?.title}
                </p>
                <h3 className="mt-1 text-xl leading-snug text-heading">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
                <Link
                  href={localizedHref(locale, item.link.path)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
                >
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  {item.link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <ExploreCompany
        locale={locale}
        current={SLUG}
        title={dict.company.exploreTitle}
      />

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        secondaryLabel={dict.ctaBand.secondary}
      />
    </>
  );
}
