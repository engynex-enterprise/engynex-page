import { notFound } from "next/navigation";
import { HeroSlider } from "@/components/sections/HeroSlider";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { TechStrip } from "@/components/sections/TechStrip";
import { Industries } from "@/components/sections/Industries";
import { ServicesBento } from "@/components/sections/ServicesBento";
import { SubscriptionBand } from "@/components/sections/SubscriptionBand";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { WhyEngynex } from "@/components/sections/WhyEngynex";
import { StatsBand } from "@/components/sections/StatsBand";
import { PortfolioPreview } from "@/components/sections/PortfolioPreview";
import { ProcessShowcase } from "@/components/sections/ProcessShowcase";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";
import { servicePlans } from "@/content/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { buildHeroSlides } from "@/lib/heroSlides";

/**
 * Home.
 *
 * El ritmo alterna dos momentos oscuros a sangre completa (hero y cierre, más
 * el bloque de posicionamiento en el medio) con bloques claros que solo
 * cambian entre `surface` y `surface-soft`. Nada de mallas de degradado ni
 * figuras decorativas: la jerarquía la marcan la tipografía y el espacio.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // Plan de arranque de la web por suscripción (se lee de content/pricing).
  const webSubscription = servicePlans["desarrollo-web"]?.[0];

  return (
    <>
      <HeroSlider
        slides={buildHeroSlides(locale)}
        controls={dict.heroSlides.controls}
      />

      <TrustStrip items={dict.trust} />

      <ClientLogos clients={dict.clients} />

      <ServicesBento
        locale={locale}
        copy={dict.servicesSection}
        ctaLabel={dict.common.learnMore}
        moreLabel={dict.common.exploreServices}
      />

      <TechStrip title={dict.techStrip.title} />

      <Industries industries={dict.industries} />

      {webSubscription && (
        <SubscriptionBand
          locale={locale}
          copy={dict.subscriptionBand}
          plan={webSubscription}
          fromLabel={dict.subscriptionBand.priceLabel}
        />
      )}

      <ProductsPreview
        locale={locale}
        copy={dict.productsSection}
        badges={dict.badges}
      />

      <WhyEngynex whyUs={dict.whyUs} />

      <StatsBand
        eyebrow={dict.statsBand.eyebrow}
        title={dict.statsBand.title}
        subtitle={dict.statsBand.subtitle}
        stats={dict.statsBand.items}
        tone="muted"
      />

      <PortfolioPreview
        locale={locale}
        featured={dict.featured}
        resultLabel={dict.portfolioPage.resultLabel}
      />

      <ProcessShowcase process={dict.process} />

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
