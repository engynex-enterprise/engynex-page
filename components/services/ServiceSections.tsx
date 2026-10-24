import Image from "next/image";
import { Check, Sparkles, TrendingUp } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { CatalogGroup, SlaRow, UseCase } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";

export type Tone = "light" | "muted";

interface Copy {
  title: string;
  subtitle: string;
  eyebrow: string;
}

/** Tarjeta gris sobre blanco, blanca sobre gris (como meta.com). */
const cardSurface = (tone: Tone) =>
  tone === "muted" ? "bg-card" : "bg-surface-soft";

function Heading({ copy }: { copy: Copy }) {
  return (
    <SectionHeading
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      size="lg"
    />
  );
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
    <Section tone={tone}>
      <Heading copy={copy} />
      <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
        {items.map((tech) => (
          <li
            key={tech}
            className={cn(
              "rounded-full px-6 py-3 text-base font-medium text-heading",
              cardSurface(tone),
            )}
          >
            {tech}
          </li>
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
    <Section tone={tone}>
      <Heading copy={copy} />
      <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-4">
        {images.slice(0, 4).map((src, i) => (
          <Reveal
            key={src}
            delay={(i % 4) * 80}
            className={cn(
              "group relative overflow-hidden rounded-3xl bg-deep-800",
              spans[i] ?? "aspect-[4/3]",
            )}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
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
  tone = "muted",
}: {
  rows: SlaRow[];
  copy: Copy;
  tone?: Tone;
}) {
  if (rows.length === 0) return null;

  return (
    <Section tone={tone}>
      <Heading copy={copy} />
      <dl className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row, i) => (
          <Reveal
            key={row.label}
            delay={(i % 4) * 80}
            className={cn(
              "flex h-full flex-col-reverse justify-end rounded-3xl p-8 sm:p-10",
              cardSurface(tone),
            )}
          >
            <dt className="mt-3 text-sm leading-relaxed text-muted">
              {row.label}
            </dt>
            <dd className="text-[2.5rem] font-light leading-tight tracking-[-0.02em] text-heading">
              {row.value}
            </dd>
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
    <Section tone={tone}>
      <Heading copy={copy} />
      <div className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 2) * 80} className="h-full">
            <article
              className={cn(
                "flex h-full flex-col rounded-3xl p-8 sm:p-10",
                cardSurface(tone),
              )}
            >
              <Sparkles
                className="h-7 w-7 text-action"
                strokeWidth={1.75}
                aria-hidden
              />
              <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                {item.title}
              </h3>
              <p className="mt-4 flex-1 text-base leading-relaxed text-body">
                {item.description}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <TrendingUp className="h-4 w-4" strokeWidth={2} aria-hidden />
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
    <Section tone={tone}>
      <Heading copy={copy} />
      <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, i) => (
          <Reveal key={group.title} delay={(i % 4) * 80} className="h-full">
            <article
              className={cn(
                "flex h-full flex-col rounded-3xl p-8",
                cardSurface(tone),
              )}
            >
              <h3 className="text-xl font-medium text-heading">
                {group.title}
              </h3>
              <ul className="mt-6 flex-1 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-action"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="text-sm leading-snug text-body">
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
