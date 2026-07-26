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
            <Reveal key={project.slug} delay={(i % 3) * 80}>
              <Link
                href={localizedHref(locale, "portafolio")}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-navy-900/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-navy-800"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={copy.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-50 mix-blend-multiply",
                      project.gradient,
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-navy-950/70 px-3 py-1 text-xs font-bold text-ink-100 backdrop-blur">
                    {categoryLabels[project.category][locale]}
                  </span>
                  <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-extrabold text-navy-900 dark:text-white">
                    {copy.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                    {copy.summary}
                  </p>
                  <div className="mt-5 flex items-center gap-2 border-t border-navy-900/10 pt-4 dark:border-white/10">
                    <TrendingUp className="h-4 w-4 text-brand-green-dark dark:text-brand-green" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-400">
                      {resultLabel}:
                    </span>
                    <span className="text-sm font-extrabold text-navy-900 dark:text-white">
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
          variant="outline-light"
          size="lg"
          className="dark:text-white dark:ring-white/20"
        >
          {featured.cta}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Section>
  );
}
