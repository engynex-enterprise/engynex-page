import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";

/**
 * Cabecera de las páginas interiores: clara, centrada y sin decoración, con la
 * misma escala tipográfica que el hero del home.
 */
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
    <section className="border-b border-line bg-surface pt-40 pb-16 sm:pt-44 sm:pb-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center">{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-balance text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-heading">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body sm:text-xl">
            {subtitle}
          </p>
        </div>
      </Container>
    </section>
  );
}
