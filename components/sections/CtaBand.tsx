import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import {
  BrandSwoosh,
  OrbitRings,
  PlusMark,
} from "@/components/ui/Backdrop";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/**
 * Cierre: tarjeta navy de marca con una afirmación y una acción.
 *
 * Es el único bloque oscuro de la página, así que se lee como final. Las
 * figuras (retícula, anillos del isotipo y swoosh) le dan el aire de
 * plataforma sin competir con el titular.
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
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-deep-950 px-6 py-16 text-center sm:px-12 sm:py-24">
          {/* Figuras de marca */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-green/20 blur-[110px]" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-blue/25 blur-[110px]" />
          </div>
          <OrbitRings
            spin
            className="-left-16 -bottom-20 -z-10 h-64 w-64 text-white/10"
          />
          <BrandSwoosh className="-right-24 -top-6 -z-10 h-56 w-[36rem]" />
          <PlusMark className="right-[12%] bottom-[18%] -z-10 h-5 w-5 text-brand-green/60" />
          <PlusMark className="left-[14%] top-[20%] -z-10 h-3.5 w-3.5 text-brand-blue-light/60" />

          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold text-white">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                className={buttonClasses("ghost", "lg", "w-full sm:w-auto")}
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
