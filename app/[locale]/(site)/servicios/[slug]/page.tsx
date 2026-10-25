import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, Check, ShieldCheck, TrendingUp } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { StickyBar } from "@/components/ui/StickyBar";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { SpecRow } from "@/components/ui/SpecRow";
import { CardRail } from "@/components/ui/CardRail";
import { Accordion } from "@/components/Accordion";
import { PricingTable } from "@/components/PricingTable";
import { CtaBand } from "@/components/sections/CtaBand";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceProcess } from "@/components/services/ServiceProcess";
import { ShowcasePage } from "@/components/services/showcase/ShowcasePage";
import { showcasePages } from "@/content/servicePages";
import {
  TechStack,
  WorkGallery,
  SlaGrid,
  UseCases,
  EquipmentCatalog,
} from "@/components/services/ServiceSections";
import { services, getService } from "@/content/services";
import { servicePlans, formatCOP } from "@/content/pricing";
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
import { signatures } from "@/components/services/signatures";
import { deliverablesDesigns } from "@/components/services/deliverables";
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

/** Iconos de la fila de beneficios (decorativos, en orden). */
const benefitIcons = [Award, TrendingUp, ShieldCheck];

/**
 * Titular de sección de meta.com: centrado, grande y en negrita, una línea
 * gris debajo y, opcionalmente, un botón píldora con contorno.
 */
function CenteredTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {subtitle}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className={buttonClasses("outline", "md", "mt-8")}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

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
  // Servicios con página insignia propia (Desarrollo Web, Plataformas Web…).
  const flagship = showcasePages[slug];
  if (flagship) return <ShowcasePage service={service} locale={locale} dict={dict} copy={flagship[locale]} />;
  const t = dict.servicesPage;
  const copy = service[locale];
  const family = serviceFamily(slug);

  const related = services.filter((s) => s.slug !== slug);
  const plans = servicePlans[slug] ?? [];

  // Precio de arranque para la barra fija: el plan más económico con precio.
  const cheapest = plans
    .filter((p): p is typeof p & { price: number } => p.price !== null)
    .sort((a, b) => a.price - b.price)[0];
  const startingPrice = cheapest
    ? `${formatCOP(cheapest.price)}${
        cheapest.billing === "monthly" ? ` ${t.plans.monthly}` : ""
      }`
    : undefined;
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
      <SplitFeature
        image={service.image}
        imageAlt={copy.title}
        eyebrow={t.detail.overviewTitle}
        title={copy.title}
        description={copy.description}
        primary={{ label: t.ctaService, href: contactHref }}
      >
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {copy.features.map((feature) => (
            <li key={feature} className="flex items-start gap-4 py-4">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="text-base font-bold leading-snug text-heading">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </SplitFeature>
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
              <SlaGrid key="extra" rows={sla} copy={t.extras.sla} tone={tone} />
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
      <CenteredTitle
        title={t.detail.benefitsTitle}
        action={{ label: dict.ui.quote, href: contactHref }}
      />
      <Reveal className="mt-12 sm:mt-16">
        <SpecRow
          className={cn(
            "max-w-5xl!",
            copy.benefits.length === 3 && "grid-cols-1! sm:grid-cols-3!",
          )}
          items={copy.benefits.map((benefit, i) => ({
            icon: benefitIcons[i % benefitIcons.length],
            value: benefit.title,
            label: benefit.description,
          }))}
        />
      </Reveal>
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

  const DeliverablesDesign = deliverablesDesigns[slug];
  const deliverables: Builder = DeliverablesDesign
    ? (tone) => (
        <DeliverablesDesign
          key="deliverables"
          service={service}
          locale={locale}
          dict={dict}
          tone={tone}
          title={t.detail.deliverablesTitle}
        />
      )
    : (tone) => (
        <Section key="deliverables" tone={tone}>
          <CenteredTitle title={t.detail.deliverablesTitle} />
          <ul className="mx-auto mt-12 grid max-w-5xl gap-3 sm:mt-16 sm:grid-cols-2">
            {copy.deliverables.map((item, i) => (
              <Reveal
                key={item}
                as="li"
                delay={(i % 4) * 60}
                className={cn(
                  "flex items-start gap-4 rounded-3xl p-6",
                  cardSurface(tone),
                )}
              >
                <Check
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-base font-bold leading-snug text-heading">
                  {item}
                </span>
              </Reveal>
            ))}
          </ul>
        </Section>
      );

  const plansSection: Builder =
    plans.length > 0
      ? (tone) => (
          <Section key="plans" tone={tone} id="planes">
            <CenteredTitle
              title={t.plans.title}
              subtitle={t.plans.subtitle}
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
    <Section key="faq" tone={tone} id="faq" className="scroll-mt-32">
      <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
        {dict.ui.faqTitle}
      </h2>
      <Accordion items={faqs} className="mt-10 sm:mt-12" />
      <h3 className="mt-16 text-2xl font-bold text-heading sm:mt-20 sm:text-[1.75rem]">
        {t.commonFaqsTitle}
      </h3>
      <Accordion
        items={t.commonFaqs}
        defaultOpen={null}
        className="mt-6 sm:mt-8"
      />
    </Section>
  );

  /** Carril fotográfico con el resto del catálogo (a sangre, sin Container). */
  const relatedSection: Builder =
    related.length > 0
      ? (tone) => (
          <section
            key="related"
            className={cn(
              "py-16 text-body sm:py-24",
              // Sobre gris, las flechas del carril pasan a blanco para verse.
              tone === "muted"
                ? "bg-surface-soft [&_button]:bg-card"
                : "bg-surface",
            )}
          >
            <Container className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
              <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
                {t.detail.relatedTitle}
              </h2>
              <Link
                href={localizedHref(locale, "servicios")}
                className={buttonClasses("outline", "md")}
              >
                {dict.ui.viewAll}
              </Link>
            </Container>
            <CardRail
              label={t.detail.relatedTitle}
              prevLabel={dict.ui.prev}
              nextLabel={dict.ui.next}
              cards={related.map((s) => ({
                key: s.slug,
                title: s[locale].title,
                caption: s[locale].tagline,
                image: s.image,
                href: localizedHref(locale, `servicios/${s.slug}`),
              }))}
            />
          </section>
        )
      : null;

  // Diseño propio del servicio: cabecera y sección insignia.
  const signature = signatures[slug];
  const Showcase = signature?.Showcase;
  const showcase: Builder = Showcase
    ? (tone) => (
        <Showcase
          key="signature"
          service={service}
          locale={locale}
          dict={dict}
          tone={tone}
        />
      )
    : null;

  const byKey: Record<string, Builder> = {
    overview,
    signature: showcase,
    extra,
    benefits,
    process: processSection,
    deliverables,
    plans: plansSection,
    faq: faqSection,
    related: relatedSection,
  };

  // Solo las secciones con contenido cuentan para alternar el fondo.
  // La sección insignia va siempre justo después de la visión general.
  const order = sectionOrder[family].flatMap((key) =>
    key === "overview" ? ["overview", "signature"] : [key],
  );
  const replaced = new Set<string>(signature?.replaces ?? []);
  const sections = order
    .filter((key) => !replaced.has(key))
    .map((key) => byKey[key])
    .filter((build): build is NonNullable<Builder> => build !== null);

  return (
    <>
      {(() => {
        const heroProps = {
          service,
          locale,
          dict,
          backLabel: t.detail.back,
          backHref: localizedHref(locale, "servicios"),
          primary: { label: t.ctaService, href: contactHref },
          secondary: {
            label: dict.common.talkToUs,
            href: `https://wa.me/${siteConfig.whatsapp}`,
            external: true,
          },
        };
        return signature ? (
          <signature.Hero {...heroProps} />
        ) : (
          <ServiceHero {...heroProps} />
        );
      })()}

      <StickyBar
        title={copy.title}
        priceLabel={startingPrice ? dict.ui.from : undefined}
        price={startingPrice}
        action={{ label: dict.ui.quote, href: contactHref }}
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
