import { notFound } from "next/navigation";
import { HeroSlider } from "@/components/sections/HeroSlider";
import {
  LatestWork,
  ProductShelf,
  ServiceShowcase,
} from "@/components/sections/HomeShowcase";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { CtaBand } from "@/components/sections/CtaBand";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { buildHeroSlides } from "@/lib/heroSlides";

/**
 * Home, con la estructura de meta.com: hero fotográfico a sangre, un titular
 * centrado con la vitrina de tarjetas (servicios y la oferta de suscripción),
 * la repisa de productos, las garantías sobre gris, lo último del portafolio
 * y una tarjeta fotográfica de cierre.
 */
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
      <HeroSlider
        slides={buildHeroSlides(locale)}
        controls={dict.heroSlides.controls}
      />

      <ServiceShowcase locale={locale} dict={dict} />

      <ProductShelf locale={locale} dict={dict} />

      <TrustStrip items={dict.trust} title={dict.homePage.whyTitle} />

      <LatestWork locale={locale} dict={dict} />

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
