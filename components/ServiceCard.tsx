import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { localizedHref } from "@/lib/site";
import type { Service } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de servicio al estilo de las fichas de producto de meta.com:
 * superficie lisa con radio de 24 px, fotografía arriba y texto sobrio debajo.
 * Sin bordes ni sombras; `tone` elige la superficie según el fondo de la
 * sección (gris sobre blanco o blanco sobre gris).
 */
export function ServiceCard({
  service,
  locale,
  ctaLabel,
  tone = "soft",
}: {
  service: Service;
  locale: Locale;
  ctaLabel: string;
  /** `soft` = gris (para secciones blancas); `white` = blanco (para secciones grises). */
  tone?: "soft" | "white";
}) {
  const copy = service[locale];

  return (
    <Link
      href={localizedHref(locale, `servicios/${service.slug}`)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        tone === "soft" ? "bg-surface-soft" : "bg-card",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={service.image}
          alt={copy.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-sm font-semibold text-accent">{copy.tagline}</p>
        <h3 className="mt-2 text-xl font-medium leading-snug text-heading">
          {copy.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
          {copy.description}
        </p>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-action">
          {ctaLabel}
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
