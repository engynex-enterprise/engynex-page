import { services } from "@/content/services";
import { products } from "@/content/products";
import { servicePlans, formatCOP } from "@/content/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "./site";

/** Tipo de composición visual que dibuja el slide. */
export type SlideKind =
  | "intro"
  | "services"
  | "products"
  | "promo"
  | "rental";

export interface SlideChip {
  icon: string;
  title: string;
  desc?: string;
  accent: "green" | "blue";
  href?: string;
}

export interface HeroSlide {
  key: string;
  kind: SlideKind;
  accent: "green" | "blue";
  image: string;
  /** Etiqueta corta de la pestaña de navegación. */
  navLabel: string;
  eyebrow: string;
  badge?: string;
  titleLead: string;
  titleHighlight: string;
  titleTail?: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  stats?: { value: string; label: string }[];
  chips?: SlideChip[];
  bullets?: string[];
  price?: { label: string; value: string; note: string };
}

/**
 * Construye los slides del hero en el servidor.
 *
 * Todo lo que se devuelve es serializable (los iconos viajan como nombre y se
 * resuelven en el cliente con `iconRegistry`), de modo que el bundle del
 * navegador no arrastra el contenido completo de servicios y productos.
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
      kind: "intro",
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
      chips: services.slice(0, 6).map((service) => ({
        icon: service.icon,
        title: service[locale].title,
        accent: service.accent,
      })),
    },
    {
      key: "services",
      kind: "services",
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
      chips: services.slice(0, 8).map((service) => ({
        icon: service.icon,
        title: service[locale].title,
        desc: service[locale].tagline,
        accent: service.accent,
        href: localizedHref(locale, `servicios/${service.slug}`),
      })),
    },
    {
      key: "products",
      kind: "products",
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
      chips: products.slice(0, 4).map((product) => ({
        icon: product.icon,
        title: product[locale].title,
        desc: product[locale].tagline,
        accent: product.accent,
        href: localizedHref(locale, `productos/${product.slug}`),
      })),
      bullets: t.products.bullets,
    },
  ];

  // Promoción de la web por suscripción (solo si el plan tiene precio).
  if (webPlan?.price != null) {
    slides.push({
      key: "promo",
      kind: "promo",
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
      bullets: webPlan[locale].features.slice(0, 4),
    });
  }

  // Nuevo servicio: alquiler de equipos y servidores.
  if (rental) {
    slides.push({
      key: "rental",
      kind: "rental",
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
      bullets: rental[locale].features.slice(0, 4),
      price: (() => {
        const plan = servicePlans["alquiler-equipos"]?.[0];
        return plan?.price != null
          ? {
              label: dict.servicesPage.plans.from,
              value: formatCOP(plan.price),
              note: t.rental.priceNote,
            }
          : undefined;
      })(),
    });
  }

  return slides;
}
