import {
  Archive,
  BatteryCharging,
  ClipboardList,
  Cpu,
  HardDrive,
  Headphones,
  Keyboard,
  KeyRound,
  Laptop,
  LifeBuoy,
  Monitor,
  Mouse,
  Network,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  Truck,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Alquiler de equipos — "Qué llega a tu oficina". Como el "qué hay en la
 * caja" de una ficha de producto: cada equipo de los planes reales es una
 * pieza con su icono, agrupada por plan, y debajo los entregables del servicio.
 * Los nombres de cada pieza salen de las características de `servicePlans`;
 * la línea pequeña es la característica completa de la que se tomó.
 */

type Item = { icon: LucideIcon; es: string; en: string; feature: number };

/** Piezas por plan; `feature` es el índice de la característica de origen. */
const box: Record<string, Item[]> = {
  "puesto-trabajo": [
    { icon: Laptop, es: "Portátil o torre", en: "Laptop or tower", feature: 0 },
    { icon: Monitor, es: 'Monitor 24"', en: '24" monitor', feature: 1 },
    { icon: Keyboard, es: "Teclado", en: "Keyboard", feature: 1 },
    { icon: Mouse, es: "Mouse", en: "Mouse", feature: 1 },
    { icon: Headphones, es: "Diadema", en: "Headset", feature: 1 },
    {
      icon: KeyRound,
      es: "Windows con licencia",
      en: "Licensed Windows",
      feature: 2,
    },
    {
      icon: RefreshCw,
      es: "Equipo de reemplazo",
      en: "Replacement unit",
      feature: 4,
    },
  ],
  "alto-rendimiento": [
    {
      icon: Cpu,
      es: "Estación de alto rendimiento",
      en: "High-performance workstation",
      feature: 0,
    },
    {
      icon: Monitor,
      es: "Monitor profesional",
      en: "Professional monitor",
      feature: 1,
    },
    { icon: Laptop, es: "MacBook Pro", en: "MacBook Pro", feature: 2 },
    {
      icon: RefreshCw,
      es: "Renovación tecnológica",
      en: "Technology refresh",
      feature: 4,
    },
  ],
  infraestructura: [
    {
      icon: Server,
      es: "Servidores rack y torre",
      en: "Rack and tower servers",
      feature: 0,
    },
    {
      icon: HardDrive,
      es: "NAS y almacenamiento",
      en: "NAS and storage",
      feature: 0,
    },
    { icon: Network, es: "Switches", en: "Switches", feature: 1 },
    { icon: ShieldCheck, es: "Firewall", en: "Firewall", feature: 1 },
    { icon: Wifi, es: "Access points", en: "Access points", feature: 1 },
    { icon: BatteryCharging, es: "UPS", en: "UPS", feature: 1 },
    { icon: Archive, es: "Gabinete", en: "Cabinet", feature: 1 },
  ],
};

const deliverableIcons = [
  ClipboardList,
  PackageCheck,
  Truck,
  LifeBuoy,
  RefreshCw,
];

const copy = {
  es: {
    eyebrow: "Qué llega a tu oficina",
    subtitle:
      "Llega completo, configurado y listo para trabajar. Esto es lo que trae cada plan, pieza por pieza.",
    also: "Y además, con cada entrega",
  },
  en: {
    eyebrow: "What arrives at your office",
    subtitle:
      "It arrives complete, configured and ready to work. This is what each plan includes, piece by piece.",
    also: "And with every delivery",
  },
};

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const plans = (servicePlans[service.slug] ?? []).filter((p) => box[p.key]);
  const tile = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {plans.map((plan) => {
            const copyPlan = plan[locale];
            // La característica de origen se muestra solo en la primera pieza que la usa.
            return (
              <div key={plan.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-4">
                  <h3 className="text-2xl font-bold text-heading">
                    {copyPlan.name}
                  </h3>
                  {copyPlan.note && (
                    <p className="text-sm text-muted">{copyPlan.note}</p>
                  )}
                </div>
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                  {box[plan.key].map(
                    ({ icon: Icon, feature, ...names }, i, all) => (
                      <li key={names[locale]} className="flex flex-col">
                        {/* "Foto" del producto: el icono sobre una base neutra. */}
                        <div
                          className={cn(
                            "grid aspect-[4/3] place-items-center rounded-3xl sm:aspect-square",
                            tile,
                          )}
                        >
                          <Icon
                            className="h-12 w-12 text-heading sm:h-14 sm:w-14"
                            strokeWidth={1.25}
                            aria-hidden
                          />
                        </div>
                        <p className="mt-3 font-semibold leading-snug text-heading">
                          {names[locale]}
                        </p>
                        {all.findIndex((x) => x.feature === feature) === i &&
                          copyPlan.features[feature] && (
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                              {copyPlan.features[feature]}
                            </p>
                          )}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Entregables reales del servicio. */}
        <div className="mt-16 rounded-3xl bg-deep-700 p-7 text-white sm:p-10 dark:bg-card-soft">
          <h3 className="text-xl font-bold">{t.also}</h3>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {c.deliverables.map((item, i) => {
              const Icon = deliverableIcons[i % deliverableIcons.length];
              return (
                <li key={item} className="flex gap-4 lg:flex-col">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-green">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-white/85">
                    {item}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
};
