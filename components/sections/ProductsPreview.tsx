import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductIcon } from "@/components/ProductIcon";
import { products } from "@/content/products";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Vista previa de productos para la página de inicio. */
export function ProductsPreview({
  locale,
  copy,
  badges,
  limit = 6,
}: {
  locale: Locale;
  copy: Dictionary["productsSection"];
  badges: Dictionary["badges"];
  limit?: number;
}) {
  const productsHref = localizedHref(locale, "productos");

  return (
    <Section tone="light">
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, limit).map((product, i) => {
          const productCopy = product[locale];
          const isGreen = product.accent === "green";
          return (
            <Reveal key={product.slug} delay={(i % 3) * 70} className="h-full">
              <Link
                href={localizedHref(locale, `productos/${product.slug}`)}
                className="group flex h-full items-start gap-4 rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                <span
                  className={cn(
                    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300",
                    isGreen
                      ? "bg-brand-green/12 text-accent group-hover:bg-brand-green group-hover:text-navy-950"
                      : "bg-brand-blue/12 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                  )}
                >
                  <ProductIcon name={product.icon} className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-extrabold text-heading">
                      {productCopy.title}
                    </span>
                    {product.badge && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wide text-accent">
                        {badges[product.badge]}
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block text-sm leading-snug text-body">
                    {productCopy.tagline}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Button href={productsHref} variant="primary" size="lg">
          {copy.cta}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Section>
  );
}
