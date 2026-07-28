import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { projects, categoryLabels } from "@/content/portfolio";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Portafolio: la imagen manda. Sin bordes, sin sombras y sin tarjeta: solo la
 * fotografía en grande y el texto debajo, como una ficha de catálogo.
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
  const items = projects.slice(0, 3);

  return (
    <Section tone="light">
      <SectionHeading
        eyebrow={featured.eyebrow}
        title={featured.title}
        subtitle={featured.subtitle}
        align="left"
        font="sans"
        size="lg"
        action={
          <Link
            href={localizedHref(locale, "portafolio")}
            className="group inline-flex items-center gap-2 text-base font-semibold text-heading underline-offset-8 transition-colors hover:text-accent hover:underline"
          >
            {featured.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />

      <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((project, i) => {
          const copy = project[locale];
          return (
            <Reveal key={project.slug} delay={(i % 3) * 90} className="h-full">
              <Link
                href={localizedHref(locale, "portafolio")}
                className="group flex h-full flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-soft">
                  <Image
                    src={project.image}
                    alt={copy.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>

                <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                  {categoryLabels[project.category][locale]}
                </p>
                <h3 className="mt-3 flex items-start gap-2 font-sans text-xl font-extrabold tracking-[-0.02em] text-heading">
                  {copy.title}
                  <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                  {copy.summary}
                </p>
                <p className="mt-5 border-t border-line pt-4 text-sm">
                  <span className="text-muted">{resultLabel}: </span>
                  <span className="font-extrabold text-heading">
                    {copy.result}
                  </span>
                </p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
