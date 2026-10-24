import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Historia en columnas, como los hitos de meta.com: una línea fina arriba, el
 * año en negrita, el hito y una línea de contexto. En móvil se apila.
 */
export function Timeline({
  eyebrow,
  title,
  subtitle,
  items,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: readonly { year: string; title: string; desc: string }[];
  /** "mesh" se conserva por compatibilidad y se pinta como gris liso. */
  tone?: "light" | "mesh" | "muted";
}) {
  return (
    <Section tone={tone === "light" ? "light" : "muted"}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        size="lg"
      />
      <ol className="mt-14 grid gap-x-8 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m, i) => (
          <Reveal
            as="li"
            key={m.year}
            delay={(i % 4) * 90}
            className="border-t border-line-strong pb-10 pt-6 lg:pb-0"
          >
            <p className="text-[clamp(2.5rem,4vw,3.25rem)] font-bold leading-none tracking-[-0.02em] text-heading">
              {m.year}
            </p>
            <h3 className="mt-5 text-xl font-bold text-heading">{m.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-muted">
              {m.desc}
            </p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
