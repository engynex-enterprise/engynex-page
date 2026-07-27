import {
  Rocket,
  Smile,
  Layers,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/Counter";
import { Decor } from "@/components/Decor";
import { cn } from "@/lib/utils";

const defaultIcons: LucideIcon[] = [Rocket, Smile, Layers, CalendarCheck];

export interface StatItem {
  value: string;
  label: string;
  /** Línea corta de contexto bajo la etiqueta. */
  detail?: string;
}

/**
 * Banda de cifras. Antes era una franja navy que rompía el ritmo del resto de
 * la página: ahora usa la malla suave de marca y tarjetas claras, con el número
 * como protagonista.
 */
export function StatsBand({
  eyebrow,
  title,
  subtitle,
  stats,
  icons = defaultIcons,
  id,
  className,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  stats: readonly StatItem[];
  icons?: LucideIcon[];
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "bg-mesh relative overflow-hidden py-20 sm:py-24",
        className,
      )}
    >
      <Decor className="opacity-70" />

      <Container className="relative">
        {title && (
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        )}

        <dl
          className={cn(
            "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
            title ? "mt-14" : "mt-0",
          )}
        >
          {stats.map((stat, i) => {
            const Icon = icons[i % icons.length];
            const isGreen = i % 2 === 0;
            return (
              <Reveal
                key={stat.label}
                delay={(i % 4) * 90}
                className="group relative h-full overflow-hidden rounded-3xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                {/* Filete superior de acento */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
                    isGreen
                      ? "bg-gradient-to-r from-brand-green to-brand-green-light"
                      : "bg-gradient-to-r from-brand-blue to-brand-blue-light",
                  )}
                />

                <span
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                    isGreen
                      ? "bg-brand-green/12 text-accent group-hover:bg-brand-green group-hover:text-navy-950"
                      : "bg-brand-blue/12 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                </span>

                <dd className="text-gradient-ink mt-6 text-5xl font-extrabold leading-none tracking-tight sm:text-[3.25rem]">
                  <Counter value={stat.value} />
                </dd>
                <dt className="mt-3 text-sm font-extrabold uppercase tracking-[0.1em] text-heading">
                  {stat.label}
                </dt>
                {stat.detail && (
                  <p className="mt-2 text-sm leading-snug text-body">
                    {stat.detail}
                  </p>
                )}
              </Reveal>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
