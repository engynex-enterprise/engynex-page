import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { navRoutes, siteConfig } from "@/lib/site";
import { services } from "@/content/services";
import { products } from "@/content/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of navRoutes) {
      const path = route.path ? `/${locale}/${route.path}` : `/${locale}`;
      entries.push({
        url: `${siteConfig.url}${path}`,
        changeFrequency: route.path ? "monthly" : "weekly",
        priority: route.path ? 0.7 : 1,
        alternates: {
          languages: {
            es: `${siteConfig.url}/es${route.path ? `/${route.path}` : ""}`,
            en: `${siteConfig.url}/en${route.path ? `/${route.path}` : ""}`,
          },
        },
      });
    }

    // Páginas dedicadas de cada servicio
    for (const service of services) {
      entries.push({
        url: `${siteConfig.url}/${locale}/servicios/${service.slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: {
            es: `${siteConfig.url}/es/servicios/${service.slug}`,
            en: `${siteConfig.url}/en/servicios/${service.slug}`,
          },
        },
      });
    }

    // Páginas dedicadas de cada producto
    for (const product of products) {
      entries.push({
        url: `${siteConfig.url}/${locale}/productos/${product.slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: {
            es: `${siteConfig.url}/es/productos/${product.slug}`,
            en: `${siteConfig.url}/en/productos/${product.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
