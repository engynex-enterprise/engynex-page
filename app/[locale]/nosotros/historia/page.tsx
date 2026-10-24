import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
import { AHistoryTimeline } from "@/components/company/AHistoryTimeline";
import { companyA } from "@/content/company-a";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const SLUG = "nosotros/historia";

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
  const t = companyA[safe].history;
  return {
    title: t.metaTitle,
    description: t.hero.metaDescription,
    alternates: { canonical: `/${safe}/${SLUG}` },
  };
}

/** Foto ilustrativa de cada hito (mismo orden que `aboutPage.timeline`). */
const milestoneImages = [
  "/images/about-team.jpg",
  "/images/about-meeting.jpg",
  "/images/svc-consultoria-tech.jpg",
  "/images/about-office.jpg",
];

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyA[locale].history;

  const today = [
    {
      value: services.length,
      label: t.servicesLabel,
      desc: t.servicesDesc,
      link: t.servicesLink,
      path: "servicios",
    },
    {
      value: products.length,
      label: t.productsLabel,
      desc: t.productsDesc,
      link: t.productsLink,
      path: "productos",
    },
  ];

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

      {/* Línea de tiempo y carrusel de hitos */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading title={t.title} subtitle={t.intro} size="lg" />
          <div className="mx-auto mt-12 max-w-6xl sm:mt-16">
            <AHistoryTimeline
              milestones={dict.aboutPage.timeline.map((m, i) => ({
                ...m,
                image: milestoneImages[i % milestoneImages.length],
                imageAlt: t.milestoneAlts[i] ?? "",
              }))}
              axisLabel={t.axisLabel}
              carouselLabel={t.carouselLabel}
              prevLabel={t.prev}
              nextLabel={t.next}
              counterTemplate={t.milestoneOf}
            />
          </div>
        </Container>
      </section>

      {/* Hoy: la oferta actual */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={t.todayKicker}
          title={t.todayTitle}
          subtitle={t.todaySubtitle}
          size="lg"
        />
        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-16 md:grid-cols-2">
          {today.map((item) => (
            <li key={item.path}>
              <Link
                href={localizedHref(locale, item.path)}
                className="group flex h-full flex-col rounded-3xl bg-surface p-8 sm:p-10"
              >
                <p className="flex items-baseline gap-3 text-heading">
                  <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-none tracking-[-0.03em]">
                    {item.value}
                  </span>
                  <span className="text-2xl font-bold">{item.label}</span>
                </p>
                <p className="mt-5 flex-1 text-lg leading-relaxed text-muted">
                  {item.desc}
                </p>
                <span className="mt-8 inline-flex items-center gap-1.5 text-base font-semibold text-heading group-hover:underline">
                  <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                  {item.link}
                </span>
              </Link>
            </li>
          ))}
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
