import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductIcon } from "./ProductIcon";
import type { Product } from "@/content/products";
import type { Locale } from "@/i18n/config";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de producto al estilo de la tienda de meta.com: superficie gris o
 * blanca con radio de 24 px, sin bordes ni sombras; icono azul, título en peso
 * medio, una línea de apoyo, lista breve y un botón píldora.
 */
export function ProductCard({
  product,
  locale,
  ctaLabel,
  ctaHref,
  badgeLabel,
  tone = "soft",
}: {
  product: Product;
  locale: Locale;
  ctaLabel: string;
  /** Enlace a la ficha del producto. */
  ctaHref: string;
  /** Se conserva por compatibilidad; la audiencia ya no se muestra en la tarjeta. */
  audienceLabel?: string;
  badgeLabel?: string;
  /** `soft` = gris sobre blanco; `card` = blanco sobre gris. */
  tone?: "soft" | "card";
}) {
  const copy = product[locale];

  return (
    <article
      id={product.slug}
      className={cn(
        "flex h-full scroll-mt-32 flex-col rounded-3xl p-7 sm:p-8",
        tone === "soft" ? "bg-card-soft" : "bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ProductIcon name={product.icon} className="h-8 w-8 text-accent" />
        {badgeLabel && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold text-heading",
              tone === "soft" ? "bg-card" : "bg-card-soft",
            )}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      <h3 className="mt-8 text-xl font-medium leading-snug text-heading">
        {copy.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:min-h-[2lh]">
        {copy.tagline}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-6">
        {copy.features.slice(0, 3).map((feature) => (
          <li key={feature} className="text-sm leading-snug text-body">
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={ctaHref}
          aria-label={`${ctaLabel}: ${copy.title}`}
          className={buttonClasses(
            "primary",
            "md",
            "h-10 px-5",
          )}
        >
          {ctaLabel}
          <ChevronRight className="-mr-1 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
