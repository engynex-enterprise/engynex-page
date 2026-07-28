import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import {
  Rocket,
  Smile,
  Layers,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { Counter } from "@/components/Counter";
import { Backdrop } from "@/components/ui/Backdrop";
import { hue, hueAt } from "@/lib/accents";
import { cn } from "@/lib/utils";

const defaultIcons: LucideIcon[] = [Rocket, Smile, Layers, CalendarCheck];

export interface StatItem {
  value: string;
  label: string;
  /** Línea corta de contexto bajo la etiqueta. */
  detail?: string;
}

/**
 * Cifras en grande, sin tarjetas ni fondo de color.
 *
 * Antes eran cuatro tarjetas sobre una malla de degradados; el número se
 * perdía entre el cromo. Ahora el número es la sección: tipografía enorme,
 * separadores de un píxel y nada más.
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
        "relative py-24 sm:py-32",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
        className,
      )}
    >
      <Backdrop variant="soft" />
      <Container className="relative">
        {title && (
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            align="left"
            font="sans"
            size="lg"
          />
        )}

        <dl
          className={cn(
            "grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4",
            title ? "mt-20" : "mt-0",
          )}
        >
          {stats.map((stat, i) => {
            const Icon = defaultIcons[i % defaultIcons.length];
            const c = hue[hueAt(i)];
            return (
            <Reveal
              key={stat.label}
              delay={(i % 4) * 90}
              className={cn(
                "group border-t-2 pt-7 transition-colors",
                c.borderTop,
                // Separador vertical entre columnas solo en pantallas anchas.
                i > 0 && "lg:border-l lg:border-l-line lg:pl-8",
              )}
            >
              <span
                className={cn(
                  "mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300",
                  c.tile,
                  c.tileHover,
                )}
              >
                <Icon className="h-5.5 w-5.5" strokeWidth={1.9} aria-hidden />
              </span>
              <dd className="font-sans text-[clamp(2.75rem,5vw,4rem)] font-extrabold leading-none tracking-[-0.04em] text-heading">
                <Counter value={stat.value} />
              </dd>
              <dt className="mt-5 text-sm font-extrabold text-heading">
                {stat.label}
              </dt>
              {stat.detail && (
                <p className="mt-2 max-w-56 text-sm leading-snug text-body">
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
