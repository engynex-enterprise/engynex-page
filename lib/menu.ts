import { services } from "@/content/services";
import { products, productCategories } from "@/content/products";
import { serviceGroups, aboutGroups } from "@/content/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "./site";

/**
 * Modelo plano del mega menú.
 *
 * Se construye en el servidor (layout) y se pasa al Navbar como props, de modo
 * que el bundle del cliente no arrastre todo el contenido de servicios y
 * productos (descripciones largas, FAQs, etc.).
 */
export interface MenuItem {
  href: string;
  title: string;
  desc: string;
  icon: string;
  accent: "green" | "blue";
  badge?: string;
}

export interface MenuColumn {
  key: string;
  title: string;
  items: MenuItem[];
}

export interface MenuPanel {
  key: "services" | "products" | "about";
  label: string;
  href: string;
  tagline: string;
  viewAllLabel: string;
  columns: MenuColumn[];
  featured: {
    eyebrow: string;
    title: string;
    desc: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export type MegaMenu = MenuPanel[];

export function buildMegaMenu(locale: Locale): MegaMenu {
  const dict = getDictionary(locale);
  const { mega } = dict.nav;
  const contactHref = localizedHref(locale, "contacto");

  const featured = {
    eyebrow: mega.featuredEyebrow,
    title: mega.featuredTitle,
    desc: mega.featuredDesc,
    ctaLabel: mega.featuredCta,
    ctaHref: contactHref,
  };

  const servicesPanel: MenuPanel = {
    key: "services",
    label: dict.nav.services,
    href: localizedHref(locale, "servicios"),
    tagline: mega.servicesTagline,
    viewAllLabel: mega.viewAllServices,
    columns: serviceGroups.map((group) => ({
      key: group.key,
      title: group[locale].title,
      items: group.slugs.flatMap((slug) => {
        const service = services.find((s) => s.slug === slug);
        if (!service) return [];
        return [
          {
            href: localizedHref(locale, `servicios/${service.slug}`),
            title: service[locale].title,
            desc: service[locale].tagline,
            icon: service.icon,
            accent: service.accent,
          },
        ];
      }),
    })),
    featured,
  };

  const productsPanel: MenuPanel = {
    key: "products",
    label: dict.nav.products,
    href: localizedHref(locale, "productos"),
    tagline: mega.productsTagline,
    viewAllLabel: mega.viewAllProducts,
    columns: productCategories.map((category) => ({
      key: category.key,
      title: category[locale].title,
      items: products
        .filter((product) => product.category === category.key)
        .map((product) => ({
          href: localizedHref(locale, `productos/${product.slug}`),
          title: product[locale].title,
          desc: product[locale].tagline,
          icon: product.icon,
          accent: product.accent,
          badge: product.badge ? dict.badges[product.badge] : undefined,
        })),
    })),
    featured,
  };

  const aboutPanel: MenuPanel = {
    key: "about",
    label: dict.nav.about,
    href: localizedHref(locale, "nosotros"),
    tagline: mega.aboutTagline,
    viewAllLabel: mega.viewAllAbout,
    columns: aboutGroups.map((group) => ({
      key: group.key,
      title: group[locale].title,
      items: group.items.map((item) => ({
        href: localizedHref(locale, item.path),
        title: item[locale].title,
        desc: item[locale].desc,
        icon: item.icon,
        accent: item.accent,
      })),
    })),
    featured: {
      eyebrow: mega.aboutFeaturedEyebrow,
      title: mega.aboutFeaturedTitle,
      desc: mega.aboutFeaturedDesc,
      ctaLabel: mega.aboutFeaturedCta,
      ctaHref: localizedHref(locale, "portafolio"),
    },
  };

  return [servicesPanel, productsPanel, aboutPanel];
}
