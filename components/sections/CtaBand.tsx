import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/**
 * Cierre: una tarjeta azul de marca con una afirmación y una acción.
 *
 * Es el único bloque de color sólido de la página, así que se lee como final
 * sin necesidad de fondos oscuros ni halos.
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
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <div className="rounded-[2rem] bg-brand-blue px-6 py-16 text-center sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref ?? localizedHref(locale, "contacto")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-medium text-brand-blue-dark transition-colors hover:bg-[#e8f0fe] sm:w-auto"
            >
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
            {secondaryLabel && (
              <Link
                href={secondaryHref ?? localizedHref(locale, "portafolio")}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-base font-medium text-white ring-1 ring-white/50 transition-colors hover:bg-white/10 sm:w-auto"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
