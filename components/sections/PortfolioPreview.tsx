import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxLayer } from "@/components/ui/Parallax";
import { projects, categoryLabels } from "@/content/portfolio";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Portafolio con jerarquía.
 *
 * Antes eran tres fichas iguales y el resultado —lo único que de verdad
 * convence— quedaba al final en letra pequeña. Ahora el primer proyecto ocupa
 * una pieza grande con la fotografía a sangre y el resultado en primer plano;
 * los otros dos van en fichas compactas al lado.
 */
export function PortfolioPreview({
  locale,
  featured,
  resultLabel,
}: {
  locale: Locale;
  featured: Dictionary["featured"];
  resultLabel: string;
}) {
  const [lead, ...rest] = projects.slice(0, 3);
  const leadCopy = lead[locale];
  const portfolioHref = localizedHref(locale, "portafolio");

  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow={featured.eyebrow}
        title={featured.title}
        subtitle={featured.subtitle}
        align="left"
        size="lg"
        action={
          <Link
            href={portfolioHref}
            className="group inline-flex items-center gap-2 text-base font-bold text-accent underline-offset-8 hover:underline"
          >
            {featured.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />

      <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        {/* -------- Proyecto destacado -------- */}
        <Reveal className="lg:col-span-2 lg:row-span-2">
          <Link
            href={portfolioHref}
            className="group relative flex h-full min-h-96 flex-col justify-end overflow-hidden rounded-[1.75rem] lg:min-h-[32rem]"
          >
            <ParallaxLayer distance={30}>
              <Image
                src={lead.image}
                alt={leadCopy.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </ParallaxLayer>
            {/* Velo: el texto va sobre la foto, tiene que leerse sí o sí */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent" />

            <span className="absolute left-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-bold text-heading sm:left-8 sm:top-8">
              {categoryLabels[lead.category][locale]}
            </span>
            <span className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-navy-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:right-8 sm:top-8">
              <ArrowUpRight className="h-5 w-5" />
            </span>

            <div className="relative p-6 sm:p-10">
              <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
                {leadCopy.title}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed text-white/80">
                {leadCopy.summary}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-heading">
                <TrendingUp className="h-4 w-4 text-brand-green-dark" strokeWidth={2.5} aria-hidden />
                {leadCopy.result}
              </p>
            </div>
          </Link>
        </Reveal>

        {/* -------- Los otros dos -------- */}
        {rest.map((project, i) => {
          const copy = project[locale];
          return (
            <Reveal key={project.slug} delay={(i + 1) * 90}>
              <Link
                href={portfolioHref}
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card transition-shadow duration-300 hover:shadow-card-hover sm:flex-row"
              >
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden sm:aspect-auto sm:w-44 lg:w-40">
                  <Image
                    src={project.image}
                    alt={copy.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-center gap-2 p-6">
                  <span className="text-xs text-muted">
                    {categoryLabels[project.category][locale]}
                  </span>
                  <h3 className="flex items-start gap-2 text-lg font-extrabold text-heading">
                    {copy.title}
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </h3>
                  <p className="text-sm">
                    <span className="text-muted">{resultLabel}: </span>
                    <span className="font-bold text-heading">
                      {copy.result}
                    </span>
                  </p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
