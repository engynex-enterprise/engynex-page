import { services } from "@/content/services";
import { servicePlans, formatCOP } from "@/content/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "./site";

export interface HeroSlide {
  key: string;
  accent: "green" | "blue";
  image: string;
  /** Etiqueta corta de la pestaña de navegación. */
  navLabel: string;
  /** Kicker sobre el titular. */
  eyebrow: string;
  /** Distintivo corto opcional ("Nuevo", "Más solicitado"). */
  badge?: string;
  titleLead: string;
  titleHighlight: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Solo el primer slide: cifras en una línea. */
  stats?: { value: string; label: string }[];
  /** Precio de arranque, cuando el slide es una oferta concreta. */
  price?: { label: string; value: string; note: string };
}

/**
 * Construye los slides del hero en el servidor.
 *
 * Cada slide lleva un solo mensaje: kicker, titular, una línea de apoyo y una
 * acción. Todo lo que se devuelve es serializable, así que el bundle del
 * navegador no arrastra el contenido completo de servicios ni productos.
 */
export function buildHeroSlides(locale: Locale): HeroSlide[] {
  const dict = getDictionary(locale);
  const t = dict.heroSlides;
  const contactHref = localizedHref(locale, "contacto");
  const webPlan = servicePlans["desarrollo-web"]?.[0];
  const rental = services.find((s) => s.slug === "alquiler-equipos");

  const slides: HeroSlide[] = [
    {
      key: "intro",
      accent: "green",
      image: "/images/hero-abstract.jpg",
      navLabel: t.intro.navLabel,
      eyebrow: dict.hero.badge,
      titleLead: dict.hero.titleLead,
      titleHighlight: dict.hero.titleHighlight,
      subtitle: dict.hero.subtitle,
      primary: { label: dict.hero.ctaPrimary, href: contactHref },
      secondary: {
        label: dict.hero.ctaSecondary,
        href: localizedHref(locale, "servicios"),
      },
      stats: dict.hero.stats.map((stat) => ({ ...stat })),
    },
    {
      key: "services",
      accent: "blue",
      image: "/images/svc-plataformas-web.jpg",
      navLabel: t.services.navLabel,
      eyebrow: t.services.eyebrow,
      titleLead: t.services.titleLead,
      titleHighlight: t.services.titleHighlight,
      subtitle: t.services.subtitle,
      primary: {
        label: t.services.cta,
        href: localizedHref(locale, "servicios"),
      },
      secondary: { label: t.common.quote, href: contactHref },
    },
    {
      key: "products",
      accent: "green",
      image: "/images/svc-data-analytics.jpg",
      navLabel: t.products.navLabel,
      eyebrow: t.products.eyebrow,
      badge: dict.badges.top,
      titleLead: t.products.titleLead,
      titleHighlight: t.products.titleHighlight,
      subtitle: t.products.subtitle,
      primary: {
        label: t.products.cta,
        href: localizedHref(locale, "productos"),
      },
      secondary: { label: t.common.demo, href: contactHref },
    },
  ];

  // Promoción de la web por suscripción (solo si el plan tiene precio).
  if (webPlan?.price != null) {
    slides.push({
      key: "promo",
      accent: "green",
      image: "/images/svc-desarrollo-web.jpg",
      navLabel: t.promo.navLabel,
      eyebrow: t.promo.eyebrow,
      badge: dict.badges.new,
      titleLead: t.promo.titleLead,
      titleHighlight: t.promo.titleHighlight,
      subtitle: t.promo.subtitle,
      primary: {
        label: t.promo.cta,
        href: `${localizedHref(locale, "servicios/desarrollo-web")}#planes`,
      },
      secondary: { label: t.common.quote, href: contactHref },
      price: {
        label: dict.subscriptionBand.priceLabel,
        value: formatCOP(webPlan.price),
        note: dict.subscriptionBand.priceNote,
      },
    });
  }

  // Nuevo servicio: alquiler de equipos y servidores.
  if (rental) {
    const rentalPlan = servicePlans["alquiler-equipos"]?.[0];
    slides.push({
      key: "rental",
      accent: "blue",
      image: rental.image,
      navLabel: t.rental.navLabel,
      eyebrow: t.rental.eyebrow,
      badge: dict.badges.new,
      titleLead: t.rental.titleLead,
      titleHighlight: t.rental.titleHighlight,
      subtitle: rental[locale].description,
      primary: {
        label: t.rental.cta,
        href: localizedHref(locale, "servicios/alquiler-equipos"),
      },
      secondary: { label: t.common.quote, href: contactHref },
      price:
        rentalPlan?.price != null
          ? {
              label: dict.servicesPage.plans.from,
              value: formatCOP(rentalPlan.price),
              note: t.rental.priceNote,
            }
          : undefined,
    });
  }

  return slides;
}
