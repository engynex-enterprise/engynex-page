import { services } from "@/content/services";
import { products } from "@/content/products";
import { extraServiceFaqs } from "@/content/faqs";
import type { HelpEntry } from "@/components/HelpSearch";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

/**
 * Índice del buscador de ayuda: todas las preguntas frecuentes del sitio
 * (servicios, productos y generales), cada una con el enlace a su respuesta.
 * Con `serviceSlugs` se limita a esos servicios y se omiten los productos.
 */
export function buildHelpIndex(
  locale: Locale,
  { serviceSlugs }: { serviceSlugs?: string[] } = {},
): HelpEntry[] {
  const dict = getDictionary(locale);
  const t = dict.help;
  const href = (path: string) => localizedHref(locale, path);
  const scoped = serviceSlugs
    ? services.filter((service) => serviceSlugs.includes(service.slug))
    : services;

  return [
    ...scoped.flatMap((service) =>
      [
        ...service[locale].faqs,
        ...(extraServiceFaqs[service.slug]?.[locale] ?? []),
      ].map((faq) => ({
        ...faq,
        href: href(`servicios/${service.slug}#faq`),
        source: `${t.groupService} · ${service[locale].title}`,
      })),
    ),
    ...(serviceSlugs
      ? []
      : products.flatMap((product) =>
          product[locale].faqs.map((faq) => ({
            ...faq,
            href: href(`productos/${product.slug}#faq`),
            source: `${t.groupProduct} · ${product[locale].title}`,
          })),
        )),
    ...dict.servicesPage.commonFaqs.map((faq) => ({
      ...faq,
      href: href("ayuda#pagos"),
      source: `${t.groupGeneral} · ${t.paymentsTitle}`,
    })),
    ...dict.contactPage.faqs.map((faq) => ({
      ...faq,
      href: href("ayuda#antes-de-empezar"),
      source: `${t.groupGeneral} · ${t.projectsTitle}`,
    })),
    ...(serviceSlugs
      ? []
      : dict.productsPage.faqs.map((faq) => ({
          ...faq,
          href: href("ayuda#productos"),
          source: `${t.groupGeneral} · ${t.productsFaqTitle}`,
        }))),
  ];
}
