import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { aboutGroups } from "@/content/navigation";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/** Foto de cada página de empresa (ruta relativa al idioma → imagen). */
export const companyImages: Record<string, string> = {
  nosotros: "/images/about-team.jpg",
  "nosotros/mision-vision": "/images/about-office.jpg",
  "nosotros/valores": "/images/about-meeting.jpg",
  "nosotros/historia": "/images/hero-abstract.jpg",
  "nosotros/proceso": "/images/svc-consultoria-tech.jpg",
  "nosotros/equipo": "/images/svc-ux-ui-branding.jpg",
  "nosotros/cifras": "/images/svc-data-analytics.jpg",
  portafolio: "/images/portfolio-2.jpg",
  "preguntas-frecuentes": "/images/svc-soporte-ti.jpg",
  contacto: "/images/svc-marketing-digital.jpg",
};

/**
 * "Sigue conociendo Engynex": tarjetas con foto, título y una línea hacia el
 * resto de páginas de empresa (sin la actual), con la flecha ↗ de
 * about.meta.com.
 */
export function ExploreCompany({
  locale,
  current,
  title,
}: {
  locale: Locale;
  /** Ruta relativa de la página actual, para no enlazarla. */
  current: string;
  title: string;
}) {
  const items = aboutGroups
    .flatMap((group) => group.items)
    .filter((item) => item.path !== current)
    .slice(0, 6);

  return (
    <section className="bg-surface py-16 sm:py-24">
      <Container>
        <h2 className="text-center text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
          {title}
        </h2>
        <ul className="mt-10 grid gap-x-4 gap-y-10 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.path}>
              <Link
                href={localizedHref(locale, item.path)}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-soft">
                  <Image
                    src={companyImages[item.path] ?? "/images/about-team.jpg"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 text-lg font-bold text-heading">
                  {item[locale].title}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted group-hover:text-heading group-hover:underline">
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  {item[locale].desc}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
