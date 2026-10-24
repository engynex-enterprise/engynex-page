import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Historia como lista limpia: el año en grande a la izquierda y el hito a la
 * derecha, separados por líneas finas. Sin conectores ni medallones.
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
      <ol className="mx-auto mt-14 max-w-4xl border-b border-line-strong">
        {items.map((m, i) => (
          <Reveal
            as="li"
            key={m.year}
            delay={(i % 4) * 90}
            className="grid gap-2 border-t border-line-strong py-8 sm:grid-cols-[11rem_1fr] sm:gap-10"
          >
            <p className="text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-[-0.02em] text-heading">
              {m.year}
            </p>
            <div>
              <h3 className="text-xl font-medium text-heading">{m.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-body">
                {m.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
