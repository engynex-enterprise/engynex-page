import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading, Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button, ButtonExternal } from "@/components/ui/Button";
import { Accordion } from "@/components/Accordion";
import { ServiceIcon } from "@/components/ServiceIcon";
import { PricingTable } from "@/components/PricingTable";
import { CtaBand } from "@/components/sections/CtaBand";
import { services, getService } from "@/content/services";
import { servicePlans } from "@/content/pricing";
import { extraServiceFaqs } from "@/content/faqs";
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
  const index = services.findIndex((s) => s.slug === slug);
  const related = services.filter((s) => s.slug !== slug).slice(0, 3);
  const plans = servicePlans[slug] ?? [];
  // FAQs del servicio + las específicas adicionales; las comunes van aparte.
  const faqs = [...copy.faqs, ...(extraServiceFaqs[slug]?.[locale] ?? [])];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-navy-950 pt-32 pb-24 text-ink-100 sm:pt-40 sm:pb-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div
            className={cn(
              "absolute -top-20 left-1/4 h-[30rem] w-[30rem] rounded-full blur-[150px]",
              isGreen ? "bg-brand-green/25" : "bg-brand-blue/30",
            )}
          />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-blue/15 blur-[130px]" />
        </div>

        <Container className="relative">
          <nav className="mb-10 flex items-center gap-2 text-sm font-semibold text-ink-400">
            <Link
              href={localizedHref(locale, "servicios")}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.detail.back}
            </Link>
          </nav>

          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
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
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                {copy.intro}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  href={localizedHref(locale, "contacto")}
                  variant="primary"
                  size="lg"
                >
                  {t.ctaService}
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
            </div>

            <Reveal className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
                <Image
                  src={service.image}
                  alt={copy.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/60 via-transparent to-transparent" />
                <span
                  className={cn(
                    "absolute left-6 top-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-1 ring-white/20 backdrop-blur",
                    isGreen ? "bg-brand-green/80" : "bg-brand-blue/80",
                  )}
                >
                  <ServiceIcon name={service.icon} className="h-7 w-7" />
                </span>
              </div>
              {/* Tarjeta glass flotante */}
              <div className="glass-dark absolute -bottom-6 -left-4 hidden rounded-2xl px-5 py-4 sm:block">
                <p className="text-2xl font-extrabold text-white">
                  {String(index + 1).padStart(2, "0")}
                  <span className="text-ink-400">
                    /{String(services.length).padStart(2, "0")}
                  </span>
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                  {t.hero.eyebrow}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============= HIGHLIGHTS (overlap) ============= */}
      <div className="relative z-10 -mt-16">
        <Container>
          <div className="grid gap-4 rounded-3xl border border-navy-900/10 bg-white p-4 shadow-xl shadow-navy-900/10 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10 dark:bg-navy-800">
            {copy.features.slice(0, 4).map((feature, i) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-navy-900/[0.03] dark:hover:bg-white/5"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold",
                    isGreen
                      ? "bg-brand-green/15 text-brand-green-dark dark:text-brand-green"
                      : "bg-brand-blue/15 text-brand-blue",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-navy-800 dark:text-ink-200">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ============= OVERVIEW + FEATURES ============= */}
      <Section tone="mesh">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <Eyebrow>{t.detail.overviewTitle}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl dark:text-white">
              {copy.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-ink-300">
              {copy.intro}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-ink-300">
              {copy.description}
            </p>
            <div className="mt-8">
              <Button
                href={localizedHref(locale, "contacto")}
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
                className="group rounded-3xl border border-navy-900/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-navy-800"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                    isGreen
                      ? "bg-brand-green/15 text-brand-green-dark group-hover:bg-brand-green group-hover:text-navy-950 dark:text-brand-green"
                      : "bg-brand-blue/15 text-brand-blue group-hover:bg-brand-blue group-hover:text-white",
                  )}
                >
                  <Check className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <p className="mt-4 font-bold text-navy-900 dark:text-white">
                  {feature}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ============= BENEFITS ============= */}
      <Section tone="dark">
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
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all hover:-translate-y-1.5 hover:border-brand-green/40 hover:bg-white/[0.06]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 text-8xl font-extrabold text-white/5 transition-colors group-hover:text-brand-green/10"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-lg font-extrabold text-navy-950">
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

      {/* ============= PROCESS (timeline) ============= */}
      <Section tone="mesh">
        <SectionHeading
          eyebrow={dict.process.eyebrow}
          title={dict.process.title}
          subtitle={dict.process.subtitle}
        />
        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-green/40 to-transparent lg:block" />
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {dict.process.steps.map((step, i) => (
              <Reveal key={step.title} delay={(i % 4) * 90} className="relative">
                <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-lg font-extrabold text-navy-950 shadow-lg shadow-brand-blue/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-navy-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ============= DELIVERABLES + image ============= */}
      <Section tone="light">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-navy-900/10 shadow-xl dark:border-white/10">
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

          <div className="order-1 lg:order-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-green-dark dark:text-brand-green">
              <PackageCheck className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl dark:text-white">
              {t.detail.deliverablesTitle}
            </h2>
            <ul className="mt-8 space-y-3">
              {copy.deliverables.map((item, i) => (
                <Reveal
                  key={item}
                  delay={(i % 4) * 70}
                  className="flex items-center gap-4 rounded-2xl border border-navy-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-navy-800"
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isGreen
                        ? "bg-brand-green/15 text-brand-green-dark dark:text-brand-green"
                        : "bg-brand-blue/15 text-brand-blue",
                    )}
                  >
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                  <span className="font-semibold text-navy-800 dark:text-ink-200">
                    {item}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ============= PLANES Y PRECIOS ============= */}
      {plans.length > 0 && (
        <Section tone="mesh" id="planes">
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
            ctaHref={localizedHref(locale, "contacto")}
            accent={service.accent}
          />
        </Section>
      )}

      {/* ============= FAQ ============= */}
      <Section tone="light">
        <SectionHeading eyebrow="FAQ" title={t.detail.faqsTitle} className="mb-12" />
        <div className="mx-auto max-w-3xl space-y-10">
          <Accordion items={faqs} />
          <div>
            <h3 className="mb-4 text-lg font-extrabold text-navy-900 dark:text-white">
              {t.commonFaqsTitle}
            </h3>
            <Accordion items={t.commonFaqs} />
          </div>
        </div>
      </Section>

      {/* ============= RELATED ============= */}
      <Section tone="mesh">
        <SectionHeading eyebrow={t.hero.eyebrow} title={t.detail.relatedTitle} />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {related.map((s, i) => {
            const rc = s[locale];
            return (
              <Reveal key={s.slug} delay={(i % 3) * 90}>
                <Link
                  href={localizedHref(locale, `servicios/${s.slug}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-navy-900/10 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-navy-800"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={s.image}
                      alt={rc.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
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
                  <div className="flex items-center justify-between p-5">
                    <span className="text-sm font-semibold text-slate-600 dark:text-ink-300">
                      {rc.tagline}
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue" />
                  </div>
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
        primaryLabel={t.ctaService}
        secondaryLabel={dict.common.viewServices}
        secondaryHref={localizedHref(locale, "servicios")}
      />
    </>
  );
}
