import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Users,
  Cpu,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { CtaBand } from "@/components/sections/CtaBand";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanySubnav } from "@/components/company/CompanySubnav";
import {
  ExploreCompany,
  companyImages,
} from "@/components/company/ExploreCompany";
import { companyA, fill } from "@/content/company-a";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const SLUG = "nosotros/mision-vision";

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
  const t = companyA[safe].missionVision;
  return {
    title: t.metaTitle,
    description: t.hero.metaDescription,
    alternates: { canonical: `/${safe}/${SLUG}` },
  };
}

/** Conteos para los enlaces de cada fila (mismo orden que `rows`). */
const rowCounts = [services.length, products.length, 0, 0];
const whyIcons = [Users, Cpu, TrendingUp, HeartHandshake];

export default async function MissionVisionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyA[locale].missionVision;
  const about = dict.aboutPage;

  const statements = [
    {
      id: "mision",
      kicker: t.missionKicker,
      text: about.mission.description,
      note: t.missionNote,
    },
    {
      id: "vision",
      kicker: t.visionKicker,
      text: about.vision.description,
      note: t.visionNote,
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

      {/* Misión y visión como afirmaciones grandes y centradas */}
      <section className="bg-surface-soft py-20 sm:py-32">
        <Container className="space-y-24 sm:space-y-36">
          {statements.map((s) => (
            <article
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-kicker`}
              className="mx-auto max-w-5xl scroll-mt-32 text-center"
            >
              <h2
                id={`${s.id}-kicker`}
                className="text-sm uppercase tracking-[0.14em] text-heading"
              >
                {s.kicker}
              </h2>
              <p className="mt-6 text-balance text-[clamp(1.875rem,4.4vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.015em] text-heading">
                {s.text}
              </p>
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted">
                {s.note}
              </p>
            </article>
          ))}
        </Container>
      </section>

      {/* Qué significa para tu empresa */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading
            title={t.meaningTitle}
            subtitle={t.meaningSubtitle}
            size="lg"
          />
          <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
            {t.rows.map((row, i) => (
              <SplitFeature
                key={row.title}
                reverse={i % 2 === 1}
                image={row.image}
                imageAlt={row.imageAlt}
                eyebrow={row.eyebrow}
                title={row.title}
                description={row.description}
              >
                <Link
                  href={localizedHref(locale, row.link.path)}
                  className="mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-heading hover:underline"
                >
                  <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                  {fill(row.link.label, { n: rowCounts[i] })}
                </Link>
              </SplitFeature>
            ))}
          </div>
        </Container>
      </section>

      {/* Por qué Engynex */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={dict.whyUs.eyebrow}
          title={dict.whyUs.title}
          subtitle={dict.whyUs.subtitle}
          size="lg"
        />
        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {dict.whyUs.items.map((item, i) => {
            const Icon = whyIcons[i % whyIcons.length];
            return (
              <li key={item.title} className="rounded-3xl bg-surface p-8">
                <Icon
                  className="h-8 w-8 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-6 text-xl leading-snug text-heading">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
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
