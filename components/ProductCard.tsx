import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ProductIcon } from "./ProductIcon";
import type { Product } from "@/content/products";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  locale,
  ctaLabel,
  ctaHref,
  audienceLabel,
  badgeLabel,
}: {
  product: Product;
  locale: Locale;
  ctaLabel: string;
  /** Enlace a la ficha del producto. */
  ctaHref: string;
  audienceLabel: string;
  badgeLabel?: string;
}) {
  const copy = product[locale];
  const isGreen = product.accent === "green";

  return (
    <article
      id={product.slug}
      className="group flex h-full scroll-mt-32 flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300",
            isGreen
              ? "bg-brand-green/12 text-accent group-hover:bg-brand-green group-hover:text-deep-950"
              : "bg-brand-blue/12 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
          )}
        >
          <ProductIcon name={product.icon} className="h-7 w-7" />
        </span>
        {badgeLabel && (
          <span className="rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-deep-950">
            {badgeLabel}
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-heading">{copy.title}</h3>
      <p
        className={cn(
          "mt-1.5 text-sm font-bold",
          isGreen ? "text-accent" : "text-brand-blue dark:text-brand-blue-light",
        )}
      >
        {copy.tagline}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-body">
        {copy.description}
      </p>

      <ul className="mt-5 flex-1 space-y-2">
        {copy.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                isGreen
                  ? "bg-brand-green/15 text-accent"
                  : "bg-brand-blue/15 text-brand-blue dark:text-brand-blue-light",
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            <span className="text-[0.82rem] leading-snug text-body">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs text-muted">
          <span className="font-extrabold uppercase tracking-wide">
            {audienceLabel}:
          </span>{" "}
          {copy.audience}
        </p>
        <Link
          href={ctaHref}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-heading transition-colors hover:text-accent"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
