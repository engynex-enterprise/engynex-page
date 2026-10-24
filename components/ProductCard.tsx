import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductIcon } from "./ProductIcon";
import type { Product } from "@/content/products";
import type { Locale } from "@/i18n/config";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de producto al estilo de la tienda de meta.com: fotografía arriba
 * con la etiqueta encima, superficie gris o blanca con radio de 24 px, sin
 * bordes ni sombras; nombre en negrita, una línea de apoyo, lista breve y un
 * botón píldora.
 */
export function ProductCard({
  product,
  locale,
  ctaLabel,
  ctaHref,
  badgeLabel,
  tone = "soft",
  secondary,
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
  /** Segunda acción opcional (p. ej. "Solicitar demo"). */
  secondary?: { label: string; href: string };
}) {
  const copy = product[locale];

  return (
    <article
      id={product.slug}
      className={cn(
        "group flex h-full scroll-mt-32 flex-col overflow-hidden rounded-3xl",
        tone === "soft" ? "bg-card-soft" : "bg-card",
      )}
    >
      <Link
        href={ctaHref}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/3] overflow-hidden bg-deep-800"
      >
        <Image
          src={product.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {badgeLabel && (
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-deep-700">
            {badgeLabel}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <ProductIcon
            name={product.icon}
            className="h-5 w-5 shrink-0 text-accent"
          />
          <h3 className="text-xl font-bold leading-snug text-heading">
            {copy.title}
          </h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:min-h-[2lh]">
          {copy.tagline}
        </p>

        <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5">
          {copy.features.slice(0, 3).map((feature) => (
            <li key={feature} className="text-sm leading-snug text-body">
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-2">
          <Link
            href={ctaHref}
            aria-label={`${ctaLabel}: ${copy.title}`}
            className={buttonClasses("primary", "md", "h-10 px-5")}
          >
            {ctaLabel}
            <ChevronRight className="-mr-1 h-4 w-4" aria-hidden />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              aria-label={`${secondary.label}: ${copy.title}`}
              className={buttonClasses("outline", "md", "h-10 px-5")}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
