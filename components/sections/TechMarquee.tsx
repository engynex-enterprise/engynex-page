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
    <section className="border-y border-line bg-surface-soft py-12">
      <Container>
        <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-muted">
          {title}
        </p>
      </Container>
      <div className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]">
          {[...techs, ...techs].map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              // `bg-card` sobre `bg-surface-soft` mantiene el contraste de la
              // píldora en los dos temas (antes ambos eran navy-800 en oscuro).
              className="whitespace-nowrap rounded-full border border-line bg-card px-6 py-2.5 text-sm font-bold text-heading shadow-card"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
