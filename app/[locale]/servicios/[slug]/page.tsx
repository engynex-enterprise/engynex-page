import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, PackageCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading, Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/Accordion";
import { ServiceIcon } from "@/components/ServiceIcon";
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

/** Tono de cada sección por familia, para que no se repita el fondo. */
const sectionTones: Record<ServiceFamily, Record<string, "light" | "mesh" | "muted">> =
  {
    build: {
      overview: "mesh",
      extra: "light",
      process: "mesh",
      deliverables: "light",
      plans: "mesh",
      faq: "light",
      related: "mesh",
    },
    creative: {
      extra: "light",
      overview: "mesh",
      process: "light",
      deliverables: "mesh",
      plans: "light",
      faq: "mesh",
      related: "light",
    },
    ops: {
      extra: "mesh",
      overview: "light",
      process: "mesh",
      deliverables: "light",
      plans: "mesh",
      faq: "light",
      related: "mesh",
    },
    data: {
      overview: "mesh",
      extra: "light",
      process: "mesh",
      deliverables: "light",
      plans: "mesh",
      faq: "light",
      related: "mesh",
    },
    hardware: {
      extra: "mesh",
      overview: "light",
      process: "mesh",
      deliverables: "light",
      plans: "mesh",
      faq: "light",
      related: "mesh",
    },
  };

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
  const isGreen = service.accent === "green";
  const family = serviceFamily(slug);
  const tones = sectionTones[family];

  const related = services.filter((s) => s.slug !== slug).slice(0, 3);
  const plans = servicePlans[slug] ?? [];
  const faqs = [...copy.faqs, ...(extraServiceFaqs[slug]?.[locale] ?? [])];
  const process = getServiceProcess(slug)?.[locale];

  const stack = serviceStack[slug] ?? [];
  const gallery = serviceGallery[slug] ?? [];
  const sla = getSla(slug, locale);
  const useCases = getUseCases(slug, locale);
  const catalog = getCatalog(slug, locale);

  const contactHref = localizedHref(locale, "contacto");

  /* ---------------------------------------------------------------------- */
  /*  Secciones                                                              */
  /* ---------------------------------------------------------------------- */

  const overview = (
    <Section key="overview" tone={tones.overview}>
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal className="lg:sticky lg:top-28">
          <Eyebrow>{t.detail.overviewTitle}</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-body">{copy.intro}</p>
          <p className="mt-4 text-lg leading-relaxed text-body">
            {copy.description}
          </p>
          <div className="mt-8">
            <Button
              href={contactHref}
              variant={isGreen ? "primary" : "secondary"}
            >
              {t.ctaService}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {copy.features.map((feature, i) => (
            <Reveal
              key={feature}
              delay={(i % 2) * 90}
              className="group h-full rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
            >
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                  isGreen
                    ? "bg-brand-green/15 text-accent group-hover:bg-brand-green group-hover:text-deep-950"
                    : "bg-brand-blue/15 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                )}
              >
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <p className="mt-4 font-bold text-heading">{feature}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );

  /** Sección exclusiva de la familia. */
  const extra = (() => {
    switch (family) {
      case "build":
        return stack.length > 0 ? (
          <TechStack
            key="extra"
            items={stack}
            copy={t.extras.stack}
            tone={tones.extra}
          />
        ) : null;
      case "creative":
        return (
          <WorkGallery
            key="extra"
            images={gallery}
            copy={t.extras.gallery}
            alt={copy.title}
            tone={tones.extra}
          />
        );
      case "ops":
        return (
          <SlaGrid
            key="extra"
            rows={sla}
            copy={t.extras.sla}
            tone={tones.extra}
          />
        );
      case "data":
        return (
          <UseCases
            key="extra"
            items={useCases}
            copy={t.extras.useCases}
            tone={tones.extra}
          />
        );
      case "hardware":
        return (
          <EquipmentCatalog
            key="extra"
            groups={catalog}
            copy={t.extras.catalog}
            tone={tones.extra}
          />
        );
    }
  })();

  const benefits = (
    <Section key="benefits" tone="dark">
      <SectionHeading
        eyebrow={t.hero.eyebrow}
        title={t.detail.benefitsTitle}
        tone="dark"
      />
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {copy.benefits.map((benefit, i) => (
          <Reveal
            key={benefit.title}
            delay={(i % 3) * 90}
            className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all hover:-translate-y-1.5 hover:border-brand-green/40 hover:bg-white/[0.06]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-8 text-8xl font-extrabold text-white/5 transition-colors group-hover:text-brand-green/10"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-lg font-extrabold text-deep-950">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="relative mt-6 text-xl font-extrabold text-white">
              {benefit.title}
            </h3>
            <p className="relative mt-3 leading-relaxed text-ink-300">
              {benefit.description}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );

  const processSection = process ? (
    <ServiceProcess
      key="process"
      process={process}
      family={family}
      accent={service.accent}
      tone={tones.process}
      loopLabel={family === "ops" ? t.opsLoop : undefined}
    />
  ) : null;

  /** En las familias con fotografía el entregable va acompañado de imagen. */
  const withPhoto = family === "build" || family === "creative";
  const deliverables = (
    <Section key="deliverables" tone={tones.deliverables}>
      <div
        className={cn(
          "grid gap-14",
          withPhoto ? "lg:grid-cols-2 lg:items-center" : "lg:grid-cols-[0.8fr_1.2fr]",
        )}
      >
        {withPhoto && (
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-line shadow-xl">
              <Image
                src={service.image}
                alt={copy.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div
                className={cn(
                  "absolute inset-0 opacity-30 mix-blend-multiply",
                  isGreen
                    ? "bg-gradient-to-tr from-brand-green/60 to-transparent"
                    : "bg-gradient-to-tr from-brand-blue/60 to-transparent",
                )}
              />
            </div>
          </Reveal>
        )}

        <div className={withPhoto ? "order-1 lg:order-2" : ""}>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/15 text-accent">
            <PackageCheck className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
            {t.detail.deliverablesTitle}
          </h2>
          <ul
            className={cn(
              "mt-8 space-y-3",
              !withPhoto && "sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0",
            )}
          >
            {copy.deliverables.map((item, i) => (
              <Reveal
                key={item}
                as="li"
                delay={(i % 4) * 70}
                className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-card"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isGreen
                      ? "bg-brand-green/15 text-accent"
                      : "bg-brand-blue/15 text-brand-blue dark:text-brand-blue-light",
                  )}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
                <span className="font-semibold text-heading">{item}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );

  const plansSection =
    plans.length > 0 ? (
      <Section key="plans" tone={tones.plans} id="planes">
        <SectionHeading
          eyebrow={t.plans.eyebrow}
          title={t.plans.title}
          subtitle={t.plans.subtitle}
          className="mb-14"
        />
        <PricingTable
          plans={plans}
          locale={locale}
          t={t.plans}
          badges={dict.badges}
          ctaHref={contactHref}
          accent={service.accent}
        />
      </Section>
    ) : null;

  const faqSection = (
    <Section key="faq" tone={tones.faq}>
      <SectionHeading eyebrow="FAQ" title={t.detail.faqsTitle} className="mb-12" />
      <div className="mx-auto max-w-3xl space-y-10">
        <Accordion items={faqs} />
        <div>
          <h3 className="mb-4 text-lg font-extrabold text-heading">
            {t.commonFaqsTitle}
          </h3>
          <Accordion items={t.commonFaqs} />
        </div>
      </div>
    </Section>
  );

  const relatedSection = (
    <Section key="related" tone={tones.related}>
      <SectionHeading eyebrow={t.hero.eyebrow} title={t.detail.relatedTitle} />
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {related.map((s, i) => {
          const rc = s[locale];
          return (
            <Reveal key={s.slug} delay={(i % 3) * 90} className="h-full">
              <Link
                href={localizedHref(locale, `servicios/${s.slug}`)}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-all hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={s.image}
                    alt={rc.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-950/80 to-transparent" />
                  <span
                    className={cn(
                      "absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ring-1 ring-white/25 backdrop-blur",
                      s.accent === "green"
                        ? "bg-brand-green/80"
                        : "bg-brand-blue/80",
                    )}
                  >
                    <ServiceIcon name={s.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="absolute bottom-3 left-4 right-4 font-extrabold text-white">
                    {rc.title}
                  </h3>
                </div>
                <div className="flex flex-1 items-center justify-between gap-3 p-5">
                  <span className="text-sm font-semibold text-body">
                    {rc.tagline}
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );

  const byKey: Record<string, React.ReactNode> = {
    overview,
    extra,
    benefits,
    process: processSection,
    deliverables,
    plans: plansSection,
    faq: faqSection,
    related: relatedSection,
  };

  return (
    <>
      <ServiceHero
        service={service}
        locale={locale}
        family={family}
        backLabel={t.detail.back}
        backHref={localizedHref(locale, "servicios")}
        primary={{ label: t.ctaService, href: contactHref }}
        secondary={{
          label: dict.common.talkToUs,
          href: `https://wa.me/${siteConfig.whatsapp}`,
          external: true,
        }}
        stack={stack}
        gallery={gallery}
        sla={sla}
        statusLabels={t.status}
      />

      {/* Franja de lo que incluye, montada sobre el hero */}
      <div className="relative z-10 -mt-16">
        <Container>
          <div className="grid gap-4 rounded-3xl border border-line bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
            {copy.features.slice(0, 4).map((feature, i) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-accent-soft/40"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold",
                    isGreen
                      ? "bg-brand-green/15 text-accent"
                      : "bg-brand-blue/15 text-brand-blue dark:text-brand-blue-light",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-heading">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {sectionOrder[family].map((key) => byKey[key])}

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
