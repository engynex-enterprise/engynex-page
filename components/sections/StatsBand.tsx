import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/Counter";
import { cn } from "@/lib/utils";

export function StatsBand({
  title,
  stats,
  image,
}: {
  title?: string;
  stats: readonly { value: string; label: string }[];
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-ink-100">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-10"
          />
        )}
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-green/20 blur-[120px]" />
        <div className="absolute -right-10 top-0 h-72 w-72 rounded-full bg-brand-blue/25 blur-[120px]" />
      </div>
      <Container className="relative">
        {title && <SectionHeading title={title} tone="dark" />}
        <div
          className={cn(
            "grid grid-cols-2 gap-6 lg:grid-cols-4",
            title && "mt-14",
          )}
        >
          {stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={(i % 4) * 80}
              className="glass-dark rounded-3xl p-8 text-center"
            >
              <p className="text-4xl font-extrabold text-gradient sm:text-5xl">
                <Counter value={s.value} />
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink-300">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
