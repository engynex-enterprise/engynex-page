import { notFound } from "next/navigation";
import { HeroSlider } from "@/components/sections/HeroSlider";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { Industries } from "@/components/sections/Industries";
import { ServicesBento } from "@/components/sections/ServicesBento";
import { SubscriptionBand } from "@/components/sections/SubscriptionBand";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
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
 * Lenguaje corporativo con la identidad de Engynex: secciones claras que
 * alternan `surface` y `surface-soft`, dos bloques de color (la oferta en
 * verde claro y el cierre en navy) y figuras vectoriales de marca —anillos del
 * isotipo, swoosh, retículas y cruces— siempre en los márgenes, nunca detrás
 * del texto.
 *
 * Orden: qué hacemos → prueba (clientes, cifras, casos) → cómo trabajamos →
 * qué dicen → acción.
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

      <ClientLogos clients={dict.clients} />

      <ServicesBento
        locale={locale}
        copy={dict.servicesSection}
        ctaLabel={dict.common.learnMore}
        moreLabel={dict.common.exploreServices}
        countLabel={dict.common.servicesCount}
      />

      <ProductsPreview
        locale={locale}
        copy={dict.productsSection}
        badges={dict.badges}
      />

      {webSubscription && (
        <SubscriptionBand
          locale={locale}
          copy={dict.subscriptionBand}
          plan={webSubscription}
          fromLabel={dict.subscriptionBand.priceLabel}
        />
      )}

      <PortfolioPreview
        locale={locale}
        featured={dict.featured}
        resultLabel={dict.portfolioPage.resultLabel}
      />

      <StatsBand
        eyebrow={dict.statsBand.eyebrow}
        title={dict.statsBand.title}
        subtitle={dict.statsBand.subtitle}
        stats={dict.statsBand.items}
      />

      <Industries industries={dict.industries} />

      <ProcessShowcase process={dict.process} />

      <Testimonials testimonials={dict.testimonials} tone="muted" />

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
