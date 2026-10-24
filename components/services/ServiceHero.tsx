import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import type { Service } from "@/content/services";
import type { Locale } from "@/i18n/config";

/**
 * Cabecera de la página de servicio al estilo meta.com: la fotografía del
 * servicio a sangre justo bajo la barra de navegación, con el titular grande
 * en blanco abajo a la izquierda sobre un velo negro inferior, el subtítulo y
 * dos botones píldora (azul + gris translúcido).
 */
export function ServiceHero({
  service,
  locale,
  image,
  backLabel,
  backHref,
  primary,
  secondary,
}: {
  service: Service;
  locale: Locale;
  /** Fotografía alternativa; por defecto la del servicio. */
  image?: string;
  backLabel: string;
  backHref: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string; external?: boolean };
}) {
  const copy = service[locale];

  return (
    <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden bg-deep-800 pt-16 text-white lg:min-h-[42rem]">
      <Image
        src={image ?? service.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/15"
      />

      <Container className="pb-12 pt-24 sm:pb-16">
        <nav aria-label="breadcrumb">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-full text-sm font-medium text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </nav>

        <p className="mt-8 text-sm font-medium text-white/85">{copy.tagline}</p>
        <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
          {copy.intro}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={primary.href} className={buttonClasses("primary", "lg")}>
            {primary.label}
          </Link>
          {secondary.external ? (
            <a
              href={secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("glass", "lg")}
            >
              {secondary.label}
            </a>
          ) : (
            <Link
              href={secondary.href}
              className={buttonClasses("glass", "lg")}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
