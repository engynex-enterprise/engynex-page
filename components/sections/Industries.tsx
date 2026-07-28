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
import { Backdrop } from "@/components/ui/Backdrop";
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
 * Sectores atendidos. Cada uno con su icono y su tono, así la retícula se lee
 * de un golpe en vez de ser ocho cajas iguales.
 */
export function Industries({
  industries,
}: {
  industries: Dictionary["industries"];
}) {
  return (
    <Section tone="light" className="relative">
      <Backdrop
        variant="warm"
        image="/images/svc-ecommerce.jpg"
        imageDistance={70}
      />
      <SectionHeading
        eyebrow={industries.eyebrow}
        title={industries.title}
        subtitle={industries.subtitle}
        align="left"
        size="lg"
      />

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {industries.items.map((item, i) => {
          const Icon = iconMap[item.icon] ?? ShoppingBag;
          const tone = hue[hueAt(i)];
          return (
            <Reveal
              key={item.name}
              delay={(i % 4) * 70}
              className={cn(
                "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
                tone.border,
              )}
            >
              {/* Halo del tono, solo al pasar el cursor */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                  tone.glow,
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                  tone.tile,
                  tone.tileHover,
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
              </span>
              <p className="relative font-extrabold tracking-[-0.01em] text-heading">
                {item.name}
              </p>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
