import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/Counter";
import { BrandSwoosh, DotGrid } from "@/components/ui/Backdrop";
import { cn } from "@/lib/utils";

export interface StatItem {
  value: string;
  label: string;
  /** Línea corta de contexto bajo la etiqueta. */
  detail?: string;
}

/**
 * Cifras en grande, sin tarjetas, iconos ni fondo decorativo.
 *
 * El número es la sección: tipografía grande en peso medio, una línea fina
 * encima de cada cifra y el contexto debajo. Nada más.
 */
export function StatsBand({
  eyebrow,
  title,
  subtitle,
  stats,
  id,
  className,
  tone = "light",
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  stats: readonly StatItem[];
  id?: string;
  className?: string;
  tone?: "light" | "muted";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden py-20 sm:py-28 lg:py-32",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
        className,
      )}
    >
      <BrandSwoosh className="-right-32 top-6 -z-10 h-64 w-[44rem]" />
      <DotGrid className="left-[3%] bottom-10 -z-10 hidden h-20 w-20 text-brand-green/30 lg:block" />
      <Container className="relative">
        {title && (
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            align="left"
                size="lg"
          />
        )}

        <dl
          className={cn(
            "grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4",
            title ? "mt-16" : "mt-0",
          )}
        >
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={(i % 4) * 90}
              className="flex h-full flex-col border-t border-line-strong pt-6"
            >
              <dd className="font-display text-[clamp(2.5rem,4.2vw,3.4rem)] font-extrabold leading-none text-heading">
                <Counter value={stat.value} />
              </dd>
              <dt className="mt-4 text-base font-bold text-heading">
                {stat.label}
              </dt>
              {stat.detail && (
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {stat.detail}
                </p>
              )}
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
