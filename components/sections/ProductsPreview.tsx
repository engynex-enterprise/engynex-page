import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProductIcon } from "@/components/ProductIcon";
import { products } from "@/content/products";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { hue, hueAt } from "@/lib/accents";
import { cn } from "@/lib/utils";

/**
 * Productos como índice de tarjetas blancas sobre fondo gris claro: una fila
 * por producto, que se lee de un vistazo y deja respirar la sección.
 */
export function ProductsPreview({
  locale,
  copy,
  badges,
  limit = 8,
}: {
  locale: Locale;
  copy: Dictionary["productsSection"];
  badges: Dictionary["badges"];
  limit?: number;
}) {
  const productsHref = localizedHref(locale, "productos");

  return (
    <Section tone="muted" className="relative">
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        align="left"
        size="lg"
        action={
          <Link
            href={productsHref}
            className="group inline-flex items-center gap-2 text-base font-bold text-accent underline-offset-8 hover:underline"
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />

      <ul className="mt-14 grid gap-4 sm:grid-cols-2">
        {products.slice(0, limit).map((product, i) => {
          const productCopy = product[locale];
          const tone = hue[hueAt(i)];
          return (
            <Reveal
              key={product.slug}
              as="li"
              delay={(i % 2) * 70}
              className="h-full"
            >
              <Link
                href={localizedHref(locale, `productos/${product.slug}`)}
                className="group flex h-full items-center gap-5 rounded-[1.5rem] bg-card p-5 transition-shadow duration-300 hover:shadow-card-hover sm:p-6"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    tone.tile,
                  )}
                >
                  <ProductIcon name={product.icon} className="h-5.5 w-5.5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-base font-bold text-heading">
                      {productCopy.title}
                    </span>
                    {product.badge && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.7rem] font-bold text-accent">
                        {badges[product.badge]}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-body">
                    {productCopy.tagline}
                  </span>
                </span>

                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
