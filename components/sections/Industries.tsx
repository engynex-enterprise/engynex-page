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
import { Decor } from "@/components/Decor";
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

export function Industries({
  industries,
}: {
  industries: Dictionary["industries"];
}) {
  return (
    <Section tone="muted" containerClassName="relative">
      <Decor />
      <div className="relative">
        <SectionHeading
          eyebrow={industries.eyebrow}
          title={industries.title}
          subtitle={industries.subtitle}
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {industries.items.map((item, i) => {
            const Icon = iconMap[item.icon] ?? ShoppingBag;
            const isGreen = i % 2 === 0;
            return (
              <Reveal
                key={item.name}
                delay={(i % 4) * 70}
                className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-line bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                {/* Halo de acento al pasar el mouse (funciona en ambos temas) */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    isGreen ? "bg-brand-green/35" : "bg-brand-blue/35",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                    isGreen
                      ? "bg-brand-green/12 text-accent group-hover:bg-brand-green group-hover:text-navy-950"
                      : "bg-brand-blue/12 text-brand-blue group-hover:bg-brand-blue group-hover:text-white dark:text-brand-blue-light",
                  )}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="relative mt-4 font-bold text-heading">
                  {item.name}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
