import Image from "next/image";
import { Users, Cpu, Target, LifeBuoy, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { Counter } from "@/components/Counter";
import { Decor } from "@/components/Decor";
import { HeroSlider } from "@/components/sections/HeroSlider";
import { TechMarquee } from "@/components/sections/TechMarquee";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { Industries } from "@/components/sections/Industries";
import { PortfolioPreview } from "@/components/sections/PortfolioPreview";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { StatsBand } from "@/components/sections/StatsBand";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";
import { services } from "@/content/services";
import { servicePlans, formatCOP } from "@/content/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { buildHeroSlides } from "@/lib/heroSlides";

const whyUsIcons = [Users, Cpu, Target, LifeBuoy];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // Precio de arranque del plan web por suscripción (se lee de content/pricing).
  const webSubscription = servicePlans["desarrollo-web"]?.[0];

  return (
    <>
      <HeroSlider
        slides={buildHeroSlides(locale)}
        controls={dict.heroSlides.controls}
      />

      <TechMarquee title={dict.techStrip.title} />

      {/* Barra de confianza (conversión) */}
      <TrustStrip items={dict.trust} />

      {/* Logos de clientes */}
      <ClientLogos clients={dict.clients} locale={locale} />

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
              <Reveal key={service.slug} delay={(i % 3) * 80} className="h-full">
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

      {/* Productos listos para implementar */}
      <ProductsPreview
        locale={locale}
        copy={dict.productsSection}
        badges={dict.badges}
      />

      {/* Web por suscripción — plan destacado */}
      {webSubscription?.price != null && (
        <section className="bg-mesh-soft pb-20 sm:pb-24">
          <Container>
            <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-10 sm:px-10 sm:py-12">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="bg-grid absolute inset-0 opacity-25" />
                <div className="absolute -left-10 top-0 h-64 w-64 rounded-full bg-brand-green/25 blur-[100px]" />
                <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-brand-blue/25 blur-[100px]" />
              </div>
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/15 px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-brand-green-light ring-1 ring-brand-green/25">
                    {dict.subscriptionBand.eyebrow}
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {dict.subscriptionBand.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-ink-300">
                    {dict.subscriptionBand.desc}
                  </p>
                </div>
                <div className="shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-400">
                    {dict.subscriptionBand.priceLabel}
                  </p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">
                    {formatCOP(webSubscription.price)}
                  </p>
                  <p className="text-xs font-semibold text-ink-400">
                    {dict.subscriptionBand.priceNote}
                  </p>
                  <Button
                    href={
                      localizedHref(locale, "servicios/desarrollo-web") +
                      "#planes"
                    }
                    variant="primary"
                    className="mt-5 w-full"
                  >
                    {dict.subscriptionBand.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

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

      {/* Cómo trabajamos — ruta del proceso */}
      <ProcessSection process={dict.process} tone="muted" />

      {/* Cifras con contadores animados */}
      <StatsBand
        eyebrow={dict.statsBand.eyebrow}
        title={dict.statsBand.title}
        subtitle={dict.statsBand.subtitle}
        stats={dict.statsBand.items}
      />

      {/* Testimonios */}
      <Testimonials testimonials={dict.testimonials} tone="light" />

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
