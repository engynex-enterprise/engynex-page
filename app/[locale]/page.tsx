import Image from "next/image";
import {
  Users,
  Cpu,
  Target,
  LifeBuoy,
  Quote,
  Star,
  ArrowRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { Counter } from "@/components/Counter";
import { Decor } from "@/components/Decor";
import { HomeHero } from "@/components/sections/HomeHero";
import { TechMarquee } from "@/components/sections/TechMarquee";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { Industries } from "@/components/sections/Industries";
import { PortfolioPreview } from "@/components/sections/PortfolioPreview";
import { CtaBand } from "@/components/sections/CtaBand";
import { services } from "@/content/services";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const whyUsIcons = [Users, Cpu, Target, LifeBuoy];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <HomeHero locale={locale} dict={dict} />

      <TechMarquee title={dict.techStrip.title} />

      {/* Barra de confianza (conversión) */}
      <section className="border-b border-navy-900/10 bg-white py-10 dark:border-white/10 dark:bg-navy-950">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dict.trust.map((item, i) => {
              const Icon = [Clock, ShieldCheck, TrendingUp, HeartHandshake][i];
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/12 text-brand-green-dark dark:bg-brand-green/15 dark:text-brand-green">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-extrabold text-navy-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-ink-300">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Logos de clientes */}
      <ClientLogos clients={dict.clients} />

      {/* Servicios */}
      <Section tone="mesh" id="servicios" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow={dict.servicesSection.eyebrow}
            title={dict.servicesSection.title}
            subtitle={dict.servicesSection.subtitle}
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 80}>
                <ServiceCard
                  service={service}
                  locale={locale}
                  ctaLabel={dict.common.learnMore}
                />
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Button
              href={localizedHref(locale, "servicios")}
              variant="secondary"
              size="lg"
            >
              {dict.common.exploreServices}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Section>

      {/* Por qué Engynex — con imagen real */}
      <Section tone="dark">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
              <Image
                src="/images/about-team.jpg"
                alt="Equipo Engynex"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/70 via-navy-950/10 to-transparent" />
            </div>
            {/* Tarjeta glass flotante */}
            <div className="glass-dark absolute -bottom-6 -right-4 hidden rounded-2xl px-6 py-4 sm:block">
              <p className="text-3xl font-extrabold text-white">
                <Counter value="+120" />
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                {dict.hero.stats[0].label}
              </p>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow={dict.whyUs.eyebrow}
              title={dict.whyUs.title}
              subtitle={dict.whyUs.subtitle}
              tone="dark"
              align="left"
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {dict.whyUs.items.map((item, i) => {
                const Icon = whyUsIcons[i];
                return (
                  <Reveal
                    key={item.title}
                    delay={(i % 2) * 90}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-green/40 hover:bg-white/[0.06]"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-extrabold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-300">
                      {item.description}
                    </p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Industrias */}
      <Industries industries={dict.industries} />

      {/* Portafolio destacado */}
      <PortfolioPreview
        locale={locale}
        featured={dict.featured}
        resultLabel={dict.portfolioPage.resultLabel}
      />

      {/* Proceso */}
      <Section tone="mesh">
        <SectionHeading
          eyebrow={dict.process.eyebrow}
          title={dict.process.title}
          subtitle={dict.process.subtitle}
        />
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {dict.process.steps.map((step, i) => (
            <Reveal key={step.title} delay={(i % 4) * 80} className="relative">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-lg font-extrabold text-navy-950 shadow-lg shadow-brand-blue/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < dict.process.steps.length - 1 && (
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-navy-900/20 to-transparent lg:block" />
                )}
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-navy-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Cifras con contadores animados */}
      <section className="relative overflow-hidden bg-navy-950 py-20 text-ink-100">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/images/cta-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-navy-950/70" />
          <div className="absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-green/20 blur-[120px]" />
          <div className="absolute -right-10 top-0 h-72 w-72 rounded-full bg-brand-blue/25 blur-[120px]" />
        </div>
        <Container className="relative">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {dict.hero.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-extrabold text-gradient sm:text-5xl">
                  <Counter value={stat.value} />
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink-300">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonios */}
      <Section tone="mesh">
        <SectionHeading
          eyebrow={dict.testimonials.eyebrow}
          title={dict.testimonials.title}
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {dict.testimonials.items.map((item, i) => (
            <Reveal
              key={item.name}
              delay={(i % 3) * 80}
              className="flex h-full flex-col rounded-3xl border border-navy-900/10 bg-white p-8 shadow-lg shadow-navy-900/5 dark:border-white/10 dark:bg-navy-800"
            >
              <div className="flex items-center justify-between">
                <Quote className="h-9 w-9 text-brand-green" />
                <div className="flex gap-0.5 text-brand-green">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="mt-5 flex-1 text-base leading-relaxed text-navy-800 dark:text-ink-200">
                “{item.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-navy-900/10 dark:border-white/10 pt-5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-blue font-extrabold text-navy-950">
                  {item.name.charAt(0)}
                </span>
                <div>
                  <p className="font-extrabold text-navy-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-slate-500 dark:text-ink-400">{item.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        secondaryLabel={dict.ctaBand.secondary}
        secondaryHref={localizedHref(locale, "portafolio")}
      />
    </>
  );
}
