import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/**
 * Cierre a sangre completa: una afirmación grande y una acción.
 *
 * Antes era una caja navy redondeada dentro de una sección blanca; ahora la
 * banda ocupa todo el ancho, que es lo que la hace leerse como un final.
 */
export function CtaBand({
  locale,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-ink-100 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-brand-green/12 blur-[150px]" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={primaryHref ?? localizedHref(locale, "contacto")}
              className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
            >
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
            {secondaryLabel && (
              <Link
                href={secondaryHref ?? localizedHref(locale, "portafolio")}
                className="group inline-flex items-center gap-2 text-base font-semibold text-white/85 underline-offset-8 transition-colors hover:text-white hover:underline"
              >
                {secondaryLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
