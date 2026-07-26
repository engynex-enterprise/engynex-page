import { Container } from "@/components/ui/Container";

const techs = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "React Native",
  "Flutter",
  "PostgreSQL",
  "AWS",
  "Figma",
  "OpenAI",
  "Shopify",
  "WordPress",
  "Docker",
];

export function TechMarquee({ title }: { title: string }) {
  return (
    <section className="border-y border-navy-900/10 dark:border-white/10 bg-slate-50 dark:bg-navy-800 py-12">
      <Container>
        <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-ink-400">
          {title}
        </p>
      </Container>
      <div className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]">
          {[...techs, ...techs].map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              className="whitespace-nowrap rounded-full border border-navy-900/10 dark:border-white/10 bg-white dark:bg-navy-800 px-6 py-2.5 text-sm font-bold text-navy-700 dark:text-ink-200 shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
