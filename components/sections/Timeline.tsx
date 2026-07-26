import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

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
  tone?: "light" | "mesh";
}) {
  return (
    <Section tone={tone}>
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="relative mx-auto mt-14 max-w-2xl">
        <div className="absolute bottom-3 left-[17px] top-3 w-0.5 bg-gradient-to-b from-brand-green via-brand-blue to-transparent" />
        <div className="space-y-6">
          {items.map((m, i) => (
            <Reveal key={m.year} delay={(i % 4) * 90} className="relative pl-14">
              <span className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-blue text-xs font-extrabold text-navy-950 ring-4 ring-white dark:ring-navy-950">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-navy-800">
                <span className="text-sm font-extrabold text-brand-green-dark dark:text-brand-green">
                  {m.year}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-navy-900 dark:text-white">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                  {m.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
