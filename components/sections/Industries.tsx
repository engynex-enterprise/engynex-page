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
    <Section tone="light" containerClassName="relative">
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
            return (
              <Reveal
                key={item.name}
                delay={(i % 4) * 70}
                className="group flex flex-col items-center rounded-2xl border border-navy-900/10 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-navy-800"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green/15 to-brand-blue/15 text-brand-green-dark transition-colors duration-300 group-hover:from-brand-green group-hover:to-brand-blue group-hover:text-navy-950 dark:text-brand-green">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-bold text-navy-900 dark:text-white">
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
