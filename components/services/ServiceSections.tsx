import Image from "next/image";
import {
  Activity,
  CalendarCheck,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TechMark } from "@/components/TechMark";
import { TechCloud, type CloudItem } from "@/components/services/TechCloud";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SpecRow } from "@/components/ui/SpecRow";
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

const slaIcons = [ShieldCheck, Activity, Clock, CalendarCheck];

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

/**
 * Huecos para la nube de logos (x/y en % del área con margen, tamaño en px).
 * Rodean el centro, donde va el texto; los marcados con `m` también se ven en
 * móvil (arriba y abajo del texto).
 */
const cloudSlots: { x: number; y: number; size: number; m?: boolean }[] = [
  { x: 6, y: 10, size: 96, m: true },
  { x: 24, y: 4, size: 58 },
  { x: 40, y: 12, size: 50, m: true },
  { x: 62, y: 5, size: 70 },
  { x: 80, y: 12, size: 104, m: true },
  { x: 95, y: 30, size: 56 },
  { x: 4, y: 44, size: 66 },
  { x: 15, y: 66, size: 52 },
  { x: 90, y: 54, size: 72 },
  { x: 96, y: 78, size: 50 },
  { x: 8, y: 90, size: 64, m: true },
  { x: 27, y: 95, size: 90 },
  { x: 48, y: 90, size: 52, m: true },
  { x: 68, y: 96, size: 82 },
  { x: 86, y: 90, size: 60, m: true },
];

const MAX_SLOT = Math.max(...cloudSlots.map((slot) => slot.size));
const MIN_SLOT = Math.min(...cloudSlots.map((slot) => slot.size));

/** Generador pseudoaleatorio con semilla: mismo servicio, misma nube. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * "Con qué lo construimos", al estilo de las composiciones de iconos de
 * meta.com: logos de las tecnologías en burbujas blancas de distintos tamaños
 * y profundidades alrededor del titular (ver TechCloud), y al frente la lista
 * real con nombre y logo pequeño. La nube es solo decorativa.
 */
export function TechStack({
  items,
  copy,
  tone = "light",
}: {
  items: string[];
  copy: Copy;
  tone?: Tone;
}) {
  const random = seeded(items.join("|"));
  // Reparte los logos por los huecos en orden aleatorio (repitiendo si hay
  // menos tecnologías que huecos), con un leve desplazamiento y giro.
  const slots = [...cloudSlots].sort(() => random() - 0.5);
  const cloud: CloudItem[] = slots.map((slot, i) => ({
    name: items[i % items.length],
    x: Math.min(97, Math.max(3, slot.x + (random() - 0.5) * 3)),
    y: Math.min(97, Math.max(3, slot.y + (random() - 0.5) * 4)),
    size: slot.size,
    rotate: (random() - 0.5) * 14,
    depth: (slot.size - MIN_SLOT) / (MAX_SLOT - MIN_SLOT),
    mobile: !!slot.m,
    delay: random() * 4,
  }));

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
      )}
    >
      <TechCloud items={cloud} className="py-24 sm:py-32">
        <Container>
          <div className="mx-auto max-w-2xl py-20 text-center sm:py-24">
            <Heading copy={copy} />
            <ul className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-2.5">
              {items.map((tech) => (
                <li
                  key={tech}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full py-2 pl-2.5 pr-4 text-sm font-semibold text-heading shadow-sm ring-1 ring-line",
                    tone === "muted" ? "bg-card" : "bg-surface",
                  )}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                    <TechMark name={tech} className="h-4 w-4" />
                  </span>
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </TechCloud>
    </section>
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

  // Fila de especificaciones de meta.com: icono, cifra en negrita y etiqueta.
  const items = rows.map((row, i) => ({
    icon: slaIcons[i % slaIcons.length],
    value: row.value,
    label: row.label,
  }));

  return (
    <Section tone={tone}>
      <Heading copy={copy} />
      <Reveal className="mt-12 sm:mt-16">
        <SpecRow
          items={items}
          className={cn(rows.length === 3 && "sm:grid-cols-3!")}
        />
      </Reveal>
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
                className="h-7 w-7 text-accent"
                strokeWidth={1.75}
                aria-hidden
              />
              <h3 className="mt-8 text-[1.75rem] font-bold leading-tight text-heading">
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
              <h3 className="text-xl font-bold text-heading">
                {group.title}
              </h3>
              <ul className="mt-6 flex-1 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
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
