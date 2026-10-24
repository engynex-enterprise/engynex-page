import { ClipboardList, Headset, Laptop, Monitor, Printer, Server, Wrench, FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Soporte TI — "Tu servicio, por escrito". Tres papeles: los entregables, la
 * ficha del servicio con los compromisos reales (`serviceSla`) y una hoja de
 * inventario ilustrativa con filas genéricas.
 */

const copy = {
  es: {
    eyebrow: "Tu servicio, por escrito",
    subtitle:
      "Sabes qué te prometemos, qué atendimos y en qué estado está cada equipo. Sin letra pequeña.",
    sheet: "Ficha del servicio",
    inventory: "Inventario de equipos",
    cols: ["Equipo", "Usuario", "Estado"],
    devices: ["Portátil", "Escritorio", "Impresora", "Servidor"],
    states: ["Al día", "Al día", "Programado", "Al día"],
  },
  en: {
    eyebrow: "Your service, in writing",
    subtitle:
      "You know what we promise, what we handled and the state of every device. No fine print.",
    sheet: "Service sheet",
    inventory: "Device inventory",
    cols: ["Device", "User", "Status"],
    devices: ["Laptop", "Desktop", "Printer", "Server"],
    states: ["Up to date", "Up to date", "Scheduled", "Up to date"],
  },
};

const deliverableIcons = [FileText, Headset, ClipboardList, Wrench];
const deviceIcons = [Laptop, Monitor, Printer, Server];

export const deliverables: DeliverablesDesign = ({ service, locale, tone, title }) => {
  const c = service[locale];
  const t = copy[locale];
  const sla = getSla(service.slug, locale);
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        {/* Entregables reales. */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.deliverables.map((item, i) => {
            const Icon = deliverableIcons[i % deliverableIcons.length];
            return (
              <li key={item} className={cn("flex items-center gap-4 rounded-3xl p-5", card)}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-deep-700 text-brand-green">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-semibold leading-snug text-heading">{item}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-[1fr_1.3fr]">
          {/* Ficha del servicio: solo valores reales de serviceSla. */}
          {sla.length > 0 && (
            <article className="rounded-3xl bg-deep-700 p-7 text-white sm:p-9 dark:bg-card-soft">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold">{t.sheet}</h3>
                <span aria-hidden className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                  SLA
                </span>
              </div>
              <dl className="mt-6 divide-y divide-white/10 border-t border-white/10">
                {sla.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                    <dt className="text-sm text-white/70">{row.label}</dt>
                    <dd className="text-lg font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )}

          {/* Hoja de inventario ilustrativa. */}
          <article className={cn("rounded-3xl p-7 sm:p-9", card)}>
            <h3 className="text-xl font-bold text-heading">{t.inventory}</h3>
            <div aria-hidden className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-line dark:bg-deep-900">
              <div className="grid grid-cols-[1.3fr_1fr_auto] gap-4 bg-surface-soft px-4 py-3 text-xs font-semibold text-muted sm:px-5">
                {t.cols.map((col) => (
                  <span key={col}>{col}</span>
                ))}
              </div>
              {t.devices.map((device, i) => {
                const Icon = deviceIcons[i];
                const scheduled = i === 2;
                return (
                  <div
                    key={device}
                    className="grid grid-cols-[1.3fr_1fr_auto] items-center gap-4 border-t border-line px-4 py-3.5 text-sm sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                      <span className="truncate font-medium text-heading">{device}</span>
                      <span className="hidden font-mono text-xs text-muted sm:inline">
                        #{String(i + 1).padStart(3, "0")}
                      </span>
                    </span>
                    <span className="h-1.5 w-full max-w-24 rounded-full bg-deep-200 dark:bg-white/15" />
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        scheduled
                          ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                          : "bg-accent-soft text-heading",
                      )}
                    >
                      {t.states[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
};
