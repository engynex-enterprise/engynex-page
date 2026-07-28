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
        "relative isolate overflow-hidden py-24 sm:py-32",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
        className,
      )}
    >
      <Backdrop
        variant="soft"
        image="/images/about-office.jpg"
        imageDistance={65}
      />
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

        {/* Mismo muro con retícula que el resto de la página: el número manda
            y el filete de color identifica cada cifra. */}
        <dl
          className={cn(
            "grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4",
            title ? "mt-16" : "mt-0",
          )}
        >
          {stats.map((stat, i) => {
            const Icon = defaultIcons[i % defaultIcons.length];
            const c = hue[hueAt(i)];
            return (
              <Reveal
                key={stat.label}
                delay={(i % 4) * 90}
                className="group relative flex h-full flex-col bg-card p-8 transition-colors duration-300 hover:bg-accent-soft/30"
              >
                {/* Filete superior del tono, ocupa el ancho al pasar el cursor */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] transition-transform duration-500 group-hover:scale-x-100",
                    c.dot,
                  )}
                />

                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300",
                    c.tile,
                    c.tileHover,
                  )}
                >
                  <Icon className="h-5.5 w-5.5" strokeWidth={1.9} aria-hidden />
                </span>

                <dd className="mt-7 font-display text-[clamp(2.4rem,4vw,3.2rem)] font-extrabold leading-none text-heading">
                  <Counter value={stat.value} />
                </dd>
                <dt className="mt-4 text-sm font-extrabold text-heading">
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
