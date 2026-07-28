import Image from "next/image";
import { Users, Cpu, Target, LifeBuoy, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { BrandSwoosh, DotGrid } from "@/components/ui/Backdrop";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const items: { icon: LucideIcon; dot: string; tile: string }[] = [
  { icon: Users, dot: "bg-brand-green", tile: "bg-brand-green/15 text-brand-green" },
  { icon: Cpu, dot: "bg-brand-blue-light", tile: "bg-brand-blue/20 text-brand-blue-light" },
  { icon: Target, dot: "bg-hue-violet", tile: "bg-hue-violet/20 text-hue-violet" },
  { icon: LifeBuoy, dot: "bg-hue-amber", tile: "bg-hue-amber/20 text-hue-amber" },
];

/**
 * Bloque de posicionamiento sobre fondo oscuro: afirmación grande, cuatro
 * pilares con icono a color y el trazo del logotipo como firma visual.
 */
export function WhyEngynex({ whyUs }: { whyUs: Dictionary["whyUs"] }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-ink-100 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/images/about-team.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/88 to-navy-950" />
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-brand-green/12 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-hue-violet/15 blur-[140px]" />
      </div>

      {/* Trazo de marca */}
      <BrandSwoosh className="-right-20 top-0 h-72 w-[45rem]" />
      <DotGrid className="right-[6%] top-[18%] hidden h-24 w-24 text-brand-green/25 lg:block" />

      <Container className="relative">
        <SectionHeading
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
          subtitle={whyUs.subtitle}
          tone="dark"
          align="left"
          font="sans"
          size="lg"
        />

        <div className="mt-20 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {whyUs.items.map((item, i) => {
            const { icon: Icon, dot, tile } = items[i % items.length];
            return (
              <Reveal key={item.title} delay={(i % 4) * 90} className="group">
                <span
                  aria-hidden
                  className={cn(
                    "block h-0.5 w-10 rounded-full transition-all duration-300 group-hover:w-20",
                    dot,
                  )}
                />
                <span
                  className={cn(
                    "mt-7 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-white/10",
                    tile,
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                </span>
                <h3 className="mt-5 font-sans text-lg font-extrabold tracking-[-0.015em] text-white">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-300">
                  {item.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
