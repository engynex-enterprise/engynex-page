import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

export function ProcessSection({
  process,
  tone = "mesh",
}: {
  process: Dictionary["process"];
  tone?: "mesh" | "light";
}) {
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        subtitle={process.subtitle}
      />
      <div className="relative mt-16">
        <div className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-green/40 to-transparent lg:block" />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, i) => (
            <Reveal key={step.title} delay={(i % 4) * 90} className="relative">
              <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue text-lg font-extrabold text-navy-950 shadow-lg shadow-brand-blue/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-navy-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
