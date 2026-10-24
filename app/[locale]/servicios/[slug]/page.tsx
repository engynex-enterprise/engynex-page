import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading, Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/Accordion";
import { MediaTile } from "@/components/ui/MediaTile";
import { PricingTable } from "@/components/PricingTable";
import { CtaBand } from "@/components/sections/CtaBand";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceProcess } from "@/components/services/ServiceProcess";
import {
  TechStack,
  WorkGallery,
  SlaGrid,
  UseCases,
  EquipmentCatalog,
} from "@/components/services/ServiceSections";
import { services, getService } from "@/content/services";
import { servicePlans } from "@/content/pricing";
import { extraServiceFaqs } from "@/content/faqs";
import { getServiceProcess } from "@/content/serviceProcess";
import {
  serviceFamily,
  serviceStack,
  serviceGallery,
  getSla,
  getUseCases,
  getCatalog,
  type ServiceFamily,
} from "@/content/serviceExtras";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const service = getService(slug);
  if (!service) return {};
  const copy = service[safe];
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/${safe}/servicios/${slug}` },
    openGraph: {
      title: `${copy.title} | Engynex`,
      description: copy.description,
      images: [service.image],
    },
  };
}

/**
 * Orden de secciones por familia.
 *
 * Cada tipo de servicio cuenta su historia en un orden distinto: en lo que
 * construimos el stack va antes de los beneficios, en lo creativo la galería
 * abre la página, y en operación lo primero que quiere ver el cliente son los
 * compromisos de servicio.
 */
const sectionOrder: Record<ServiceFamily, string[]> = {
  build: [
    "overview",
    "extra",
    "benefits",
    "process",
    "deliverables",
    "plans",
    "faq",
    "related",
  ],
  creative: [
    "extra",
    "overview",
    "process",
    "benefits",
    "deliverables",
    "plans",
    "faq",
    "related",
  ],
  ops: [
    "extra",
    "overview",
    "process",
    "benefits",
    "deliverables",
    "plans",
    "faq",
    "related",
  ],
  data: [
    "overview",
    "extra",
    "process",
    "benefits",
    "deliverables",
    "plans",
    "faq",
    "related",
  ],
  hardware: [
    "extra",
    "overview",
    "process",
    "benefits",
    "deliverables",
    "plans",
    "faq",
    "related",
  ],
};

type Tone = "light" | "muted";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const service = getService(slug);
  if (!service) notFound();

  const dict = getDictionary(locale);
  const t = dict.servicesPage;
  const copy = service[locale];
  const family = serviceFamily(slug);

  const related = services.filter((s) => s.slug !== slug).slice(0, 2);
  const plans = servicePlans[slug] ?? [];
  const faqs = [...copy.faqs, ...(extraServiceFaqs[slug]?.[locale] ?? [])];
  const process = getServiceProcess(slug)?.[locale];

  const stack = serviceStack[slug] ?? [];
  const gallery = serviceGallery[slug] ?? [];
  const sla = getSla(slug, locale);
  const useCases = getUseCases(slug, locale);
  const catalog = getCatalog(slug, locale);

  const contactHref = localizedHref(locale, "contacto");

  /** Tarjeta gris sobre blanco, blanca sobre gris (como meta.com). */
  const cardSurface = (tone: Tone) =>
    tone === "muted" ? "bg-card" : "bg-surface-soft";

  /* ---------------------------------------------------------------------- */
  /*  Secciones: cada una recibe su fondo según la posición en la página,    */
  /*  alternando blanco y gris sin repetir.                                   */
  /* ---------------------------------------------------------------------- */

  type Builder = ((tone: Tone) => React.ReactNode) | null;

  const overview: Builder = (tone) => (
    <Section key="overview" tone={tone}>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <Eyebrow>{t.detail.overviewTitle}</Eyebrow>
          <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.15] text-heading">
            {copy.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-body">{copy.intro}</p>
          <p className="mt-4 text-lg leading-relaxed text-body">
            {copy.description}
          </p>
          <div className="mt-8">
            <Button href={contactHref} variant="primary">
              {t.ctaService}
            </Button>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {copy.features.map((feature, i) => (
            <Reveal
              key={feature}
              as="li"
              delay={(i % 2) * 80}
              className={cn("h-full rounded-3xl p-8", cardSurface(tone))}
            >
              <Check
                className="h-6 w-6 text-action"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-6 text-xl font-medium leading-snug text-heading">
                {feature}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );

  /** Sección exclusiva de la familia. */
  const extra: Builder = (() => {
    switch (family) {
      case "build":
        return stack.length > 0
          ? (tone: Tone) => (
              <TechStack
                key="extra"
                items={stack}
                copy={t.extras.stack}
                tone={tone}
              />
            )
          : null;
      case "creative":
        return gallery.length > 0
          ? (tone: Tone) => (
              <WorkGallery
                key="extra"
                images={gallery}
                copy={t.extras.gallery}
                alt={copy.title}
                tone={tone}
              />
            )
          : null;
      case "ops":
        return sla.length > 0
          ? (tone: Tone) => (
              <SlaGrid
                key="extra"
                rows={sla}
                copy={t.extras.sla}
                tone={tone}
              />
            )
          : null;
      case "data":
        return useCases.length > 0
          ? (tone: Tone) => (
              <UseCases
                key="extra"
                items={useCases}
                copy={t.extras.useCases}
                tone={tone}
              />
            )
          : null;
      case "hardware":
        return catalog.length > 0
          ? (tone: Tone) => (
              <EquipmentCatalog
                key="extra"
                groups={catalog}
                copy={t.extras.catalog}
                tone={tone}
              />
            )
          : null;
    }
  })();

  const benefits: Builder = (tone) => (
    <Section key="benefits" tone={tone}>
      <SectionHeading
        eyebrow={t.hero.eyebrow}
        title={t.detail.benefitsTitle}
        size="lg"
      />
      <ul className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
        {copy.benefits.map((benefit, i) => (
          <Reveal
            key={benefit.title}
            as="li"
            delay={(i % 3) * 80}
            className={cn("h-full rounded-3xl p-8 sm:p-10", cardSurface(tone))}
          >
            <p className="text-sm font-semibold text-accent">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-6 text-[1.75rem] font-light leading-tight text-heading">
              {benefit.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-body">
              {benefit.description}
            </p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );

  const processSection: Builder = process
    ? (tone) => (
        <ServiceProcess
          key="process"
          process={process}
          family={family}
          tone={tone}
          loopLabel={family === "ops" ? t.opsLoop : undefined}
        />
      )
    : null;

  /** En las familias con fotografía el entregable va acompañado de imagen. */
  const withPhoto = family === "build" || family === "creative";
  const deliverables: Builder = (tone) => (
    <Section key="deliverables" tone={tone}>
      <div
        className={cn(
          "grid lg:gap-16",
          withPhoto
            ? "gap-12 lg:grid-cols-2 lg:items-center"
            : "gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start",
        )}
      >
        {withPhoto && (
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-3xl bg-deep-800 lg:order-1">
            <Image
              src={service.image}
              alt={copy.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}

        <div
          className={cn(
            withPhoto ? "order-1 lg:order-2" : "contents",
          )}
        >
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.15] text-heading">
            {t.detail.deliverablesTitle}
          </h2>
          <ul
            className={cn(
              "space-y-3",
              withPhoto
                ? "mt-8"
                : "sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0",
            )}
          >
            {copy.deliverables.map((item, i) => (
              <Reveal
                key={item}
                as="li"
                delay={(i % 4) * 60}
                className={cn(
                  "flex items-start gap-4 rounded-2xl p-5",
                  cardSurface(tone),
                )}
              >
                <Check
                  className="mt-0.5 h-5 w-5 shrink-0 text-action"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-base font-medium text-heading">
                  {item}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );

  const plansSection: Builder =
    plans.length > 0
      ? (tone) => (
          <Section key="plans" tone={tone} id="planes">
            <SectionHeading
              eyebrow={t.plans.eyebrow}
              title={t.plans.title}
              subtitle={t.plans.subtitle}
              size="lg"
              className="mb-12 sm:mb-16"
            />
            <PricingTable
              plans={plans}
              locale={locale}
              t={t.plans}
              badges={dict.badges}
              ctaHref={contactHref}
              surface={tone === "muted" ? "white" : "soft"}
            />
          </Section>
        )
      : null;

  const faqSection: Builder = (tone) => (
    <Section key="faq" tone={tone}>
      <SectionHeading
        title={t.detail.faqsTitle}
        size="lg"
        className="mb-10 sm:mb-12"
      />
      <div className="mx-auto max-w-4xl space-y-14">
        <Accordion items={faqs} />
        <div>
          <h3 className="mb-4 text-xl font-medium text-heading">
            {t.commonFaqsTitle}
          </h3>
          <Accordion items={t.commonFaqs} />
        </div>
      </div>
    </Section>
  );

  const relatedSection: Builder =
    related.length > 0
      ? (tone) => (
          <Section key="related" tone={tone}>
            <SectionHeading
              eyebrow={t.hero.eyebrow}
              title={t.detail.relatedTitle}
              size="lg"
              className="mb-12 sm:mb-16"
            />
            <div className="grid gap-4 md:grid-cols-2">
              {related.map((s) => {
                const rc = s[locale];
                return (
                  <MediaTile
                    key={s.slug}
                    image={s.image}
                    imageAlt={rc.title}
                    kicker={rc.tagline}
                    title={rc.title}
                    primary={{
                      label: t.viewDetail,
                      href: localizedHref(locale, `servicios/${s.slug}`),
                    }}
                  />
                );
              })}
            </div>
          </Section>
        )
      : null;

  const byKey: Record<string, Builder> = {
    overview,
    extra,
    benefits,
    process: processSection,
    deliverables,
    plans: plansSection,
    faq: faqSection,
    related: relatedSection,
  };

  // Solo las secciones con contenido cuentan para alternar el fondo.
  const sections = sectionOrder[family]
    .map((key) => byKey[key])
    .filter((build): build is NonNullable<Builder> => build !== null);

  return (
    <>
      <ServiceHero
        service={service}
        locale={locale}
        backLabel={t.detail.back}
        backHref={localizedHref(locale, "servicios")}
        primary={{ label: t.ctaService, href: contactHref }}
        secondary={{
          label: dict.common.talkToUs,
          href: `https://wa.me/${siteConfig.whatsapp}`,
          external: true,
        }}
      />

      {sections.map((build, i) => build(i % 2 === 0 ? "light" : "muted"))}

      <CtaBand
        locale={locale}
        title={t.detail.ctaTitle}
        subtitle={t.detail.ctaSubtitle}
        primaryLabel={t.ctaService}
        secondaryLabel={dict.common.viewServices}
        secondaryHref={localizedHref(locale, "servicios")}
      />
    </>
  );
}
