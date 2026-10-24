import {
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Landmark,
  Building2,
  Truck,
  Plane,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { hueAt, hue } from "@/lib/accents";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Landmark,
  Building2,
  Truck,
  Plane,
  UtensilsCrossed,
};

/**
 * Sectores atendidos.
 *
 * Tarjetas blancas planas sobre fondo gris claro, sin bordes ni sombras: la
 * separación la hace el propio contraste de superficies.
 *
 * Cada sector dice además qué construimos ahí: el nombre solo ("Salud") no
 * informa de nada.
 */
export function Industries({
  industries,
}: {
  industries: Dictionary["industries"];
}) {
  return (
    <Section tone="muted" className="relative">

      <SectionHeading
        eyebrow={industries.eyebrow}
        title={industries.title}
        subtitle={industries.subtitle}
        align="left"
        size="lg"
      />

      <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {industries.items.map((item, i) => {
          const Icon = iconMap[item.icon] ?? ShoppingBag;
          const tone = hue[hueAt(i)];
          return (
            <Reveal
              key={item.name}
              as="li"
              delay={(i % 4) * 70}
              className="flex h-full flex-col gap-5 rounded-[1.5rem] bg-card p-6 sm:p-7"
            >
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full",
                  tone.tile,
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
              </span>

              <div>
                <p className="text-lg font-medium text-heading">{item.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
