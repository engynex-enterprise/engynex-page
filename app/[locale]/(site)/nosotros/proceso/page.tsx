import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, UserRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { CtaBand } from "@/components/sections/CtaBand";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanySubnav } from "@/components/company/CompanySubnav";
import { ExploreCompany, companyImages } from "@/components/company/ExploreCompany";
import {
  BServiceProcessPicker,
  type BServiceProcessEntry,
} from "@/components/company/BServiceProcessPicker";
import { companyB } from "@/content/company-b";
import { services } from "@/content/services";
import { serviceProcess } from "@/content/serviceProcess";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

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
  const t = companyB[safe].process;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/nosotros/proceso` },
  };
}

/** Fotos de las filas "Cómo trabajamos contigo" (mismo orden que el texto). */
const withYouImages = [
  "/images/about-meeting.jpg",
  "/images/about-office.jpg",
  "/images/svc-hosting-mantenimiento.jpg",
];

/**
 * Nuestro proceso: titular centrado, indicador horizontal de etapas, las
 * cuatro etapas en filas grandes numeradas, cómo trabajamos con el cliente,
 * el proceso propio de cada servicio y las garantías.
 */
export default async function ProcessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyB[locale].process;
  const steps = dict.process.steps;
  const href = (path: string) => localizedHref(locale, path);

  const withYouLinks = [
    href("preguntas-frecuentes"),
    href("cotizar"),
    href("servicios/hosting-mantenimiento#planes"),
  ];

  const perService: BServiceProcessEntry[] = services.flatMap((service) => {
    const process = serviceProcess[service.slug]?.[locale];
    return process
      ? [
          {
            slug: service.slug,
            title: service[locale].title,
            href: href(`servicios/${service.slug}`),
            steps: process.steps,
          },
        ]
      : [];
  });

  return (
    <>
      <CompanyHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image={companyImages["nosotros/proceso"]}
        imageAlt={t.hero.imageAlt}
      />
      <CompanySubnav locale={locale} label={dict.company.subnavLabel} />

      {/* -------- Las cuatro etapas -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.intro.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.intro.subtitle}
            </p>
          </div>

          {/* Indicador horizontal de etapas */}
          <nav aria-label={t.indicatorLabel} className="mx-auto mt-12 max-w-4xl">
            <ol className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
              {steps.map((step, i) => (
                <li key={step.title} className="relative">
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-5 hidden h-px w-full bg-line-strong sm:block"
                    />
                  )}
                  <a
                    href={`#etapa-${i + 1}`}
                    className="group relative flex flex-col items-center gap-3 rounded-2xl px-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-deep-700 text-sm font-bold text-white transition-colors group-hover:bg-deep-600 dark:bg-white dark:text-deep-700">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold leading-snug text-heading group-hover:underline">
                      {step.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <ol className="mx-auto mt-14 grid max-w-6xl gap-4">
            {steps.map((step, i) => (
              <li
                key={step.title}
                id={`etapa-${i + 1}`}
                className="grid scroll-mt-36 gap-6 rounded-3xl bg-card p-8 sm:p-12 md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,20rem)] md:gap-10"
              >
                <p
                  aria-hidden
                  className="text-[clamp(3rem,6vw,4.5rem)] font-bold leading-none tracking-[-0.03em] text-heading"
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div>
                  <p className="text-sm font-semibold text-accent">
                    {dict.process.stepLabel} {i + 1}
                  </p>
                  <h3 className="mt-2 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight text-heading">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-body">
                    {step.description}
                  </p>
                </div>
                <dl className="grid content-start gap-5 border-t border-line pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <div>
                    <dt className="flex items-center gap-2 text-sm text-muted">
                      <Clock className="h-4 w-4 text-accent" aria-hidden />
                      {t.durationLabel}
                    </dt>
                    <dd className="mt-1 font-bold text-heading">{step.meta}</dd>
                  </div>
                  {t.yourPart[i] && (
                    <div>
                      <dt className="flex items-center gap-2 text-sm text-muted">
                        <UserRound className="h-4 w-4 text-accent" aria-hidden />
                        {t.yourPartLabel}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-body">
                        {t.yourPart[i]}
                      </dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm font-semibold text-muted">
            {dict.process.measureNote}
          </p>
        </Container>
      </section>

      {/* -------- Cómo trabajamos contigo -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.withYou.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.withYou.subtitle}
            </p>
          </div>
          <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
            {t.withYou.rows.map((row, i) => (
              <SplitFeature
                key={row.title}
                image={withYouImages[i] ?? "/images/about-team.jpg"}
                imageAlt={row.imageAlt}
                eyebrow={row.eyebrow}
                title={row.title}
                description={row.description}
                primary={{ label: row.cta, href: withYouLinks[i] ?? href("contacto") }}
                reverse={i % 2 === 1}
              />
            ))}
          </div>
        </Container>
      </section>

      <TrustStrip items={dict.trust} title={t.trustTitle} tone="muted" />

      {/* -------- Proceso por servicio -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.perService.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.perService.subtitle}
            </p>
          </div>
          <BServiceProcessPicker
            entries={perService}
            selectLabel={t.perService.selectLabel}
            viewService={t.perService.viewService}
          />
        </Container>
      </section>

      <ExploreCompany
        locale={locale}
        current="nosotros/proceso"
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
