import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 pt-36 pb-20 text-ink-100 sm:pt-40 sm:pb-24">
      {/* Fondo decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -top-24 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-blue/25 blur-[120px]" />
        <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-brand-green/20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy-950" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="dark" className="justify-center">
            {eyebrow}
          </Eyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
            {subtitle}
          </p>
        </div>
      </Container>
    </section>
  );
}
