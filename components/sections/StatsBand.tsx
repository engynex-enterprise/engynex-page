import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/Counter";
import { cn } from "@/lib/utils";

export interface StatItem {
  value: string;
  label: string;
  /** Línea corta de contexto bajo la etiqueta. */
  detail?: string;
}

/**
 * Cifras en grande, sin tarjetas, iconos ni fondo decorativo, como las fichas
 * técnicas de meta.com: titular centrado, cifra en negrita, la etiqueta debajo
 * y una línea de contexto. Nada más.
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
        "py-16 sm:py-24",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
        className,
      )}
    >
      <Container>
        {title && (
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            size="lg"
          />
        )}

        <dl
          className={cn(
            "grid grid-cols-1 gap-x-10 gap-y-12 text-center sm:grid-cols-2 lg:grid-cols-4",
            title ? "mt-16" : "mt-0",
          )}
        >
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={(i % 4) * 90}
              className="flex h-full flex-col items-center"
            >
              {/* dt antes que dd en el DOM; la cifra se muestra primero con order */}
              <dt className="order-2 mt-3 text-base font-bold text-heading">
                {stat.label}
              </dt>
              <dd className="order-1 text-[clamp(2.75rem,4.6vw,3.75rem)] font-bold leading-none tracking-[-0.02em] text-heading">
                <Counter value={stat.value} />
              </dd>
              {stat.detail && (
                <dd className="order-3 mt-1.5 max-w-[16rem] text-sm leading-relaxed text-muted">
                  {stat.detail}
                </dd>
              )}
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
