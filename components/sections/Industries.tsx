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
 * Sectores atendidos.
 *
 * Retícula de líneas finas, sin caja alrededor: las celdas comparten el fondo
 * de la sección y solo las separa el `gap-px`, así que se lee como una tabla de
 * especificaciones y no como ocho tarjetas más. Es la variante ligera del muro
 * que usan clientes, tecnologías y servicios.
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

      <ul className="mt-14 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {industries.items.map((item, i) => {
          const Icon = iconMap[item.icon] ?? ShoppingBag;
          const tone = hue[hueAt(i)];
          return (
            <Reveal
              key={item.name}
              as="li"
              delay={(i % 4) * 70}
              className="group flex h-full flex-col gap-4 bg-surface p-7 transition-colors duration-300 hover:bg-card"
            >
              <span
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                  tone.tile,
                  tone.tileHover,
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
              </span>

              <div>
                <p className="font-extrabold text-heading">{item.name}</p>
                <p className="mt-2 text-sm leading-snug text-body">
                  {item.desc}
                </p>
              </div>

              {/* Filete del tono, crece al pasar el cursor */}
              <span
                aria-hidden
                className={cn(
                  "mt-auto block h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16",
                  tone.dot,
                )}
              />
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
