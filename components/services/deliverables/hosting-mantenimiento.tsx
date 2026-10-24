import {
  Activity,
  AlertCircle,
  Check,
  DatabaseBackup,
  RefreshCw,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Hosting & Mantenimiento — "Tu reporte mensual de salud". Una tarjeta de
 * reporte con cuatro apartados (disponibilidad, copias, actualizaciones,
 * incidentes). Las únicas cifras son los compromisos reales de `serviceSla`.
 */

const copy = {
  es: {
    eyebrow: "Tu reporte mensual de salud",
    subtitle:
      "Cada mes sabes cómo estuvo tu sitio sin tener que preguntar. Y detrás del reporte, todo lo que dejamos funcionando.",
    report: "Reporte de salud",
    period: "Mensual",
    site: "tusitio.com",
    sections: [
      "Disponibilidad",
      "Copias de seguridad",
      "Actualizaciones",
      "Incidentes",
    ],
    includes: "Lo que recibes",
  },
  en: {
    eyebrow: "Your monthly health report",
    subtitle:
      "Every month you know how your site did without having to ask. And behind the report, everything we keep running.",
    report: "Health report",
    period: "Monthly",
    site: "yoursite.com",
    sections: ["Availability", "Backups", "Updates", "Incidents"],
    includes: "What you receive",
  },
};

const icons = [Activity, DatabaseBackup, RefreshCw, AlertCircle];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const sla = getSla(service.slug, locale);
  const proPlan = servicePlans[service.slug]?.find((p) => p.key === "pro")?.[
    locale
  ];
  const pro = proPlan?.features ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Cada apartado: compromiso real (si existe) y la función que lo respalda.
  const rows = [
    { value: sla[0]?.value, label: sla[0]?.label, text: c.features[3] },
    { value: sla[1]?.value, label: sla[1]?.label, text: c.features[2] },
    { value: undefined, label: undefined, text: c.features[1] },
    {
      value: sla[2]?.value,
      label: sla[2]?.label,
      text: sla[3] ? `${sla[3].label}: ${sla[3].value}` : undefined,
    },
  ];

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

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* El reporte: cabecera tipo correo y cuatro apartados. */}
          <article className={cn("overflow-hidden rounded-3xl", card)}>
            <header className="flex flex-wrap items-center justify-between gap-3 bg-deep-700 px-7 py-5 text-white dark:bg-card-soft">
              <div>
                <p className="text-lg font-bold">{t.report}</p>
                <p className="text-sm text-white/60">{t.site}</p>
              </div>
              <span className="rounded-full bg-action px-3 py-1 text-xs font-semibold text-deep-700">
                {t.period}
              </span>
            </header>
            <ul className="grid sm:grid-cols-2">
              {rows.map((row, i) => {
                const Icon = icons[i];
                return (
                  <li
                    key={t.sections[i]}
                    className={cn(
                      "flex flex-col gap-4 border-line p-7",
                      i > 0 && "border-t",
                      i === 1 && "sm:border-t-0 sm:border-l",
                      i === 3 && "sm:border-l",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-deep-700 text-brand-green">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="font-bold text-heading">
                        {t.sections[i]}
                      </h3>
                    </div>
                    {row.value ? (
                      <div>
                        <p className="text-3xl font-bold tracking-tight text-heading">
                          {row.value}
                        </p>
                        {row.label &&
                          row.label.toLowerCase() !==
                            t.sections[i].toLowerCase() && (
                            <p className="text-xs text-muted">{row.label}</p>
                          )}
                      </div>
                    ) : (
                      // Sin cifra: lista ilustrativa de tareas aplicadas.
                      <ul aria-hidden className="space-y-2">
                        {[72, 56, 64].map((w) => (
                          <li key={w} className="flex items-center gap-2.5">
                            <Check
                              className="h-4 w-4 shrink-0 text-accent"
                              strokeWidth={3}
                            />
                            <span
                              className="h-1.5 rounded-full bg-deep-200 dark:bg-white/15"
                              style={{ width: `${w}%` }}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    {row.text && (
                      <p className="text-sm text-body">{row.text}</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {pro[3] && (
              <footer className="border-t border-line px-7 py-4 text-sm text-muted">
                {proPlan?.name}: {pro[3]}
              </footer>
            )}
          </article>

          {/* Los entregables reales. */}
          <div className={cn("flex flex-col rounded-3xl p-7 sm:p-9", card)}>
            <h3 className="text-sm font-semibold text-muted">{t.includes}</h3>
            <ol className="mt-4 flex flex-1 flex-col divide-y divide-line">
              {c.deliverables.map((item, i) => (
                <li key={item} className="flex flex-1 items-center gap-4 py-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-action text-sm font-bold text-deep-700">
                    {i + 1}
                  </span>
                  <p className="text-lg font-semibold leading-snug text-heading">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
};
