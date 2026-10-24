import { Container } from "@/components/ui/Container";
import {
  BrandSwoosh,
  DotGrid,
  OrbitRings,
  PlusMark,
} from "@/components/ui/Backdrop";

/**
 * Cabecera de las páginas interiores, con el mismo lenguaje que el hero del
 * home y que la ficha de cada servicio: fondo pizarra, retícula, luces de
 * marca y figuras vectoriales en los márgenes.
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
    <section className="relative isolate overflow-hidden bg-deep-900 pt-40 pb-20 text-white sm:pt-44 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -left-32 -top-20 h-[26rem] w-[26rem] rounded-full bg-brand-green/20 blur-[130px]" />
        <div className="absolute -right-24 top-10 h-[24rem] w-[24rem] rounded-full bg-brand-blue/25 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-deep-950/60" />
      </div>
      <BrandSwoosh className="-right-32 top-16 -z-10 h-64 w-[44rem]" />
      <OrbitRings
        spin
        className="-left-20 bottom-[-6rem] -z-10 h-72 w-72 text-white/10"
      />
      <DotGrid className="right-[8%] bottom-10 -z-10 hidden h-20 w-20 text-brand-green/40 sm:block" />
      <PlusMark className="left-[16%] top-44 -z-10 hidden h-4 w-4 text-brand-green sm:block" />
      <PlusMark className="right-[22%] top-40 -z-10 hidden h-3 w-3 text-brand-blue-light sm:block" />

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/80 ring-1 ring-white/15 backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            {eyebrow}
          </span>
          <h1 className="mt-6 text-balance text-[clamp(2.2rem,4.6vw,3.5rem)] font-extrabold text-white">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
            {subtitle}
          </p>
        </div>
      </Container>
    </section>
  );
}
