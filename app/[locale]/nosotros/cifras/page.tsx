import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Layers,
  Boxes,
  Building2,
  UsersRound,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpecRow } from "@/components/ui/SpecRow";
import { CtaBand } from "@/components/sections/CtaBand";
import { Testimonials } from "@/components/sections/Testimonials";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanySubnav } from "@/components/company/CompanySubnav";
import {
  ExploreCompany,
  companyImages,
} from "@/components/company/ExploreCompany";
import { companyA } from "@/content/company-a";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { projects, categoryLabels } from "@/content/portfolio";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const SLUG = "nosotros/cifras";

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
  const t = companyA[safe].numbers;
  return {
    title: t.metaTitle,
    description: t.hero.metaDescription,
    alternates: { canonical: `/${safe}/${SLUG}` },
  };
}

export default async function NumbersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyA[locale].numbers;
  const about = dict.aboutPage;

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

      {/* Cifras principales en grande */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={about.statsEyebrow}
          title={about.statsTitle}
          subtitle={about.statsSubtitle}
          size="lg"
        />
        <dl className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2">
          {about.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col rounded-3xl bg-surface p-8 sm:p-12"
            >
              <dt className="order-2 mt-4 text-xl font-bold text-heading">
                {stat.label}
              </dt>
              <dd className="order-1 text-[clamp(4rem,9vw,7rem)] font-bold leading-none tracking-[-0.04em] text-heading">
                {stat.value}
              </dd>
              <dd className="order-3 mt-2 max-w-sm text-base leading-relaxed text-muted">
                {stat.detail}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Detrás de las cifras: casos reales */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow={t.behindKicker}
            title={t.behindTitle}
            subtitle={t.behindSubtitle}
            size="lg"
          />
          <ul className="mt-12 grid gap-x-4 gap-y-10 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const copy = project[locale];
              return (
                <li key={project.slug}>
                  <article>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-soft">
                      <Image
                        src={project.image}
                        alt={copy.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-4 text-sm text-muted">
                      {categoryLabels[project.category][locale]}
                    </p>
                    <h3 className="mt-1 text-xl leading-snug text-heading">
                      {copy.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-muted">
                      {copy.summary}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-soft px-4 py-1.5 text-sm text-heading">
                      <span className="text-muted">{t.resultLabel}:</span>
                      <span className="font-bold">{copy.result}</span>
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className="mt-12 text-center">
            <Link
              href={localizedHref(locale, "portafolio")}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-heading hover:underline"
            >
              <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
              {t.portfolioLink}
            </Link>
          </div>

          {/* Conteos derivados del contenido */}
          <div className="mt-20 rounded-3xl bg-surface-soft px-6 py-14 sm:mt-24 sm:px-12 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-[clamp(1.75rem,2.8vw,2.25rem)] leading-tight text-heading">
                {t.countsTitle}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                {t.countsSubtitle}
              </p>
            </div>
            <SpecRow
              className="mt-12"
              items={[
                {
                  icon: Layers,
                  value: String(services.length),
                  label: t.countServices,
                },
                {
                  icon: Boxes,
                  value: String(products.length),
                  label: t.countProducts,
                },
                {
                  icon: Building2,
                  value: String(dict.industries.items.length),
                  label: t.countIndustries,
                },
                {
                  icon: UsersRound,
                  value: String(about.team.length),
                  label: t.countTeams,
                },
              ]}
            />
          </div>
        </Container>
      </section>

      <Testimonials testimonials={dict.testimonials} tone="muted" />

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
