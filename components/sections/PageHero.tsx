import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { DotGrid, OrbitRings, PlusMark } from "@/components/ui/Backdrop";

/**
 * Cabecera de las páginas interiores: clara y centrada, con la misma escala
 * tipográfica que el hero del home y figuras de marca en los márgenes.
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
    <section className="relative isolate overflow-hidden border-b border-line bg-surface pt-40 pb-16 sm:pt-44 sm:pb-20">
      <div
        aria-hidden
        className="bg-grid-ink pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <OrbitRings
        spin
        className="-right-20 top-20 -z-10 h-72 w-72 text-brand-blue/15"
      />
      <DotGrid className="left-[6%] bottom-12 -z-10 hidden h-20 w-20 text-brand-green/40 sm:block" />
      <PlusMark className="left-[18%] top-44 -z-10 hidden h-4 w-4 text-brand-green sm:block" />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center">{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-balance text-[clamp(2.2rem,4.6vw,3.5rem)] font-extrabold text-heading">
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
