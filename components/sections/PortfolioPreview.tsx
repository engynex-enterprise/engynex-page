import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { projects, categoryLabels } from "@/content/portfolio";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

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
      />
      <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((project, i) => {
          const copy = project[locale];
          return (
            <Reveal key={project.slug} delay={(i % 3) * 80} className="h-full">
              <Link
                href={localizedHref(locale, "portafolio")}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={copy.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-50 mix-blend-multiply",
                      project.gradient,
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/65 via-navy-950/10 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-navy-950/70 px-3 py-1 text-xs font-bold text-ink-100 backdrop-blur">
                    {categoryLabels[project.category][locale]}
                  </span>
                  <span className="absolute right-4 top-4 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-navy-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-extrabold text-heading">
                    {copy.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                    {copy.summary}
                  </p>
                  <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                    <TrendingUp className="h-4 w-4 shrink-0 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {resultLabel}:
                    </span>
                    <span className="text-sm font-extrabold text-heading">
                      {copy.result}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-12 flex justify-center">
        <Button
          href={localizedHref(locale, "portafolio")}
          variant="outline"
          size="lg"
        >
          {featured.cta}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Section>
  );
}
