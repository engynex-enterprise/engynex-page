import Image from "next/image";
import { Check, Sparkles, TrendingUp } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { CatalogGroup, SlaRow, UseCase } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";

type Tone = "light" | "mesh" | "muted" | "dark";

interface Copy {
  title: string;
  subtitle: string;
  eyebrow: string;
}

/* ========================================================================== */
/*  build — stack tecnológico                                                  */
/* ========================================================================== */

export function TechStack({
  items,
  copy,
  tone = "light",
}: {
  items: string[];
  copy: Copy;
  tone?: Tone;
}) {
  return (
    <Section tone={tone === "dark" ? "dark" : tone}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />
      <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
        {items.map((tech, i) => (
          <Reveal
            key={tech}
            as="li"
            delay={(i % 8) * 45}
            className="rounded-2xl border border-line bg-card px-5 py-3 text-sm font-extrabold text-heading shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:text-accent hover:shadow-card-hover"
          >
            {tech}
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ========================================================================== */
/*  creative — mosaico de trabajo                                              */
/* ========================================================================== */

export function WorkGallery({
  images,
  copy,
  alt,
  tone = "light",
}: {
  images: string[];
  copy: Copy;
  alt: string;
  tone?: Tone;
}) {
  if (images.length === 0) return null;
  // Mosaico: la primera pieza manda y ocupa dos filas.
  const spans = [
    "sm:col-span-2 sm:row-span-2 aspect-[4/3]",
    "aspect-[4/3]",
    "aspect-[4/3]",
    "sm:col-span-2 aspect-[16/7]",
  ];

  return (
    <Section tone={tone === "dark" ? "dark" : tone}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {images.slice(0, 4).map((src, i) => (
          <Reveal
            key={src}
            delay={(i % 4) * 90}
            className={cn(
              "group relative overflow-hidden rounded-3xl border border-line shadow-card",
              spans[i] ?? "aspect-[4/3]",
            )}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ========================================================================== */
/*  ops — compromisos de servicio                                              */
/* ========================================================================== */

export function SlaGrid({
  rows,
  copy,
  tone = "dark",
}: {
  rows: SlaRow[];
  copy: Copy;
  tone?: Tone;
}) {
  if (rows.length === 0) return null;
  const dark = tone === "dark";

  return (
    <Section tone={dark ? "dark" : tone}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        tone={dark ? "dark" : "light"}
      />
      <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row, i) => (
          <Reveal
            key={row.label}
            delay={(i % 4) * 90}
            className={cn(
              "group h-full rounded-3xl border p-7 text-center transition-all duration-300 hover:-translate-y-1",
              dark
                ? "border-white/10 bg-white/[0.03] hover:border-brand-green/40 hover:bg-white/[0.06]"
                : "border-line bg-card shadow-card hover:border-brand-green/40 hover:shadow-card-hover",
            )}
          >
            <dd
              className={cn(
                "text-3xl font-extrabold tracking-tight",
                dark ? "text-white" : "text-heading",
              )}
            >
              {row.value}
            </dd>
            <dt
              className={cn(
                "mt-3 text-xs font-bold uppercase tracking-[0.12em]",
                dark ? "text-ink-400" : "text-muted",
              )}
            >
              {row.label}
            </dt>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

/* ========================================================================== */
/*  data — casos de uso                                                        */
/* ========================================================================== */

export function UseCases({
  items,
  copy,
  tone = "light",
}: {
  items: UseCase[];
  copy: Copy;
  tone?: Tone;
}) {
  if (items.length === 0) return null;

  return (
    <Section tone={tone === "dark" ? "dark" : tone}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 2) * 100} className="h-full">
            <article className="group flex h-full flex-col rounded-3xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-card-hover">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light">
                <Sparkles className="h-5 w-5" strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-heading">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                {item.description}
              </p>
              <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-extrabold text-accent">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                {item.result}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ========================================================================== */
/*  hardware — catálogo de equipos                                             */
/* ========================================================================== */

export function EquipmentCatalog({
  groups,
  copy,
  tone = "light",
}: {
  groups: CatalogGroup[];
  copy: Copy;
  tone?: Tone;
}) {
  if (groups.length === 0) return null;

  return (
    <Section tone={tone === "dark" ? "dark" : tone}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, i) => (
          <Reveal key={group.title} delay={(i % 4) * 90} className="h-full">
            <article className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover">
              <h3 className="text-base font-extrabold text-heading">
                {group.title}
              </h3>
              <span
                aria-hidden
                className="mt-3 block h-0.5 w-10 rounded-full bg-gradient-to-r from-brand-green to-brand-blue transition-all duration-300 group-hover:w-16"
              />
              <ul className="mt-5 flex-1 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-accent">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-[0.82rem] leading-snug text-body">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
