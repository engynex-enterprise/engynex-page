import { Quote, Star } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

export function Testimonials({
  testimonials,
  tone = "mesh",
}: {
  testimonials: Dictionary["testimonials"];
  tone?: "mesh" | "light";
}) {
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow={testimonials.eyebrow}
        title={testimonials.title}
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {testimonials.items.map((item, i) => (
          <Reveal
            key={item.name}
            delay={(i % 3) * 80}
            className="flex h-full flex-col rounded-3xl border border-navy-900/10 bg-white p-8 shadow-lg shadow-navy-900/5 dark:border-white/10 dark:bg-navy-800"
          >
            <div className="flex items-center justify-between">
              <Quote className="h-9 w-9 text-brand-green" />
              <div className="flex gap-0.5 text-brand-green">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="mt-5 flex-1 text-base leading-relaxed text-navy-800 dark:text-ink-200">
              “{item.quote}”
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-navy-900/10 pt-5 dark:border-white/10">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-green to-brand-blue font-extrabold text-navy-950">
                {item.name.charAt(0)}
              </span>
              <div>
                <p className="font-extrabold text-navy-900 dark:text-white">
                  {item.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-ink-400">
                  {item.role}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
