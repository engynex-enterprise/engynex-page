import { Database, GraduationCap } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Data & Analytics — "Tableros y diccionario". Dos piezas: la miniatura de un
 * tablero (sin cifras) y el diccionario de indicadores (Indicador / Definición
 * / Fuente) con filas de relleno etiquetadas con funciones reales.
 */

const copy = {
  es: {
    eyebrow: "Tableros y diccionario",
    subtitle:
      "No solo gráficas: cada indicador queda definido por escrito, con su fórmula y su origen, para que todos lean el mismo número de la misma forma.",
    cols: ["Indicador", "Definición", "Fuente"],
    source: "Fuente",
    also: "Y para que funcione",
  },
  en: {
    eyebrow: "Dashboards and dictionary",
    subtitle:
      "Not just charts: every indicator is defined in writing, with its formula and origin, so everyone reads the same number the same way.",
    cols: ["Indicator", "Definition", "Source"],
    source: "Source",
    also: "And to make it work",
  },
};

/** Miniatura ilustrativa de un tablero: barras y línea, sin números. */
function DashboardThumb() {
  const bars = [38, 56, 44, 70, 62, 84, 76];
  return (
    <div aria-hidden className="rounded-2xl bg-deep-700 p-4 dark:bg-deep-900">
      <div className="flex gap-3">
        <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
          <span className="h-2 w-10 rounded-full bg-brand-green" />
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="h-2 rounded-full bg-white/15" />
          ))}
        </div>
        <div className="grid min-w-0 flex-1 gap-3">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-white/5 p-3">
                <span className="block h-1.5 w-8 rounded-full bg-white/25" />
                <span className={cn("mt-3 block h-3 rounded-full", i === 0 ? "w-12 bg-brand-green" : "w-10 bg-white/50")} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <div className="flex h-28 items-end gap-1.5 rounded-xl bg-white/5 p-3">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={cn("flex-1 rounded-t", i === bars.length - 2 ? "bg-brand-green" : "bg-white/30")}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="none">
                <polyline
                  points="0,48 16,40 32,44 48,28 64,32 80,16 100,20"
                  fill="none"
                  stroke="var(--color-brand-green)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const deliverables: DeliverablesDesign = ({ service, locale, tone, title }) => {
  const c = service[locale];
  const t = copy[locale];
  const plans = servicePlans[service.slug] ?? [];
  const essential = plans.find((p) => p.key === "dashboard")?.[locale].features ?? [];
  const bi = plans.find((p) => p.key === "bi")?.[locale].features ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  // Filas del diccionario: tres funciones reales del servicio como categorías.
  const kpiRows = [c.features[2], c.features[0], c.features[3]].filter(Boolean);

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Tarjeta 1: el tablero. */}
          <article className={cn("flex flex-col rounded-3xl p-6 sm:p-8", card)}>
            <DashboardThumb />
            <h3 className="mt-8 text-2xl font-bold text-heading">{c.deliverables[1]}</h3>
            <p className="mt-2 text-muted">{[bi[2], essential[2]].filter(Boolean).join(" · ")}</p>
          </article>

          {/* Tarjeta 2: el diccionario de indicadores. */}
          <article className={cn("flex flex-col rounded-3xl p-6 sm:p-8", card)}>
            <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-line dark:bg-deep-900">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-deep-700 text-white dark:bg-card-soft">
                  <tr>
                    {t.cols.map((col, i) => (
                      <th
                        key={col}
                        scope="col"
                        className={cn("px-4 py-3 font-semibold", i === 0 ? "w-[38%]" : i === 1 ? "w-[37%]" : "w-[25%]")}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpiRows.map((row, i) => (
                    <tr key={row} className="border-t border-line align-top">
                      <th scope="row" className="px-4 py-4 text-sm font-semibold leading-snug text-heading">
                        {row}
                      </th>
                      <td className="px-4 py-4">
                        <span aria-hidden className="block space-y-1.5">
                          <span className="block h-1.5 rounded-full bg-deep-200 dark:bg-white/15" />
                          <span className="block h-1.5 w-3/4 rounded-full bg-deep-200 dark:bg-white/15" />
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-heading">
                          {t.source} {i + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-8 text-2xl font-bold text-heading">{c.deliverables[2]}</h3>
            <p className="mt-2 text-muted">{bi[3]}</p>
          </article>
        </div>

        {/* Los otros dos entregables, como base de las dos piezas. */}
        <h3 className="sr-only">{t.also}</h3>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            { icon: Database, label: c.deliverables[0], text: bi[0] ?? bi[1] },
            { icon: GraduationCap, label: c.deliverables[3], text: essential[4] },
          ].map(({ icon: Icon, label, text }) =>
            label ? (
              <li
                key={label}
                className="flex items-center gap-5 rounded-3xl bg-deep-700 p-6 text-white dark:bg-card-soft"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-green">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-bold">{label}</span>
                  {text && <span className="mt-0.5 block text-sm text-white/70">{text}</span>}
                </span>
              </li>
            ) : null,
          )}
        </ul>
      </Container>
    </section>
  );
};
