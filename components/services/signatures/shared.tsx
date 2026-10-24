import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { SignatureHeroProps } from "./types";

/**
 * Piezas comunes de las cabeceras propias: el enlace de regreso y los dos
 * botones. Cambian de color según el fondo (`dark` sobre fondos oscuros o
 * fotografía), pero son los mismos en todas las fichas.
 */
export function HeroBreadcrumb({
  backLabel,
  backHref,
  dark = false,
}: Pick<SignatureHeroProps, "backLabel" | "backHref"> & { dark?: boolean }) {
  return (
    <nav aria-label="breadcrumb">
      <Link
        href={backHref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full text-sm font-medium transition-colors",
          dark
            ? "text-white/85 hover:text-white"
            : "text-muted hover:text-heading",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
    </nav>
  );
}

export function HeroActions({
  primary,
  secondary,
  dark = false,
  className,
}: Pick<SignatureHeroProps, "primary" | "secondary"> & {
  dark?: boolean;
  className?: string;
}) {
  // En claro va con contorno: un botón gris se pierde sobre fondos grises.
  const secondaryClass = buttonClasses(dark ? "glass" : "outline", "lg");
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Link href={primary.href} className={buttonClasses("primary", "lg")}>
        {primary.label}
      </Link>
      {secondary.external ? (
        <a
          href={secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryClass}
        >
          {secondary.label}
        </a>
      ) : (
        <Link href={secondary.href} className={secondaryClass}>
          {secondary.label}
        </Link>
      )}
    </div>
  );
}

/** Clases de fondo de la sección según el tono que le toque. */
export const toneClass = (tone: "light" | "muted") =>
  tone === "muted" ? "bg-surface-soft" : "bg-surface";
