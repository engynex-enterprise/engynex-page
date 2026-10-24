import { cn } from "@/lib/utils";

/**
 * Gráficas del tablero de analítica (sin librerías, solo HTML/CSS).
 *
 * Reglas de la guía de visualización: una serie por gráfica (nunca dos ejes),
 * un solo tono por magnitud, barras finas con puntas redondeadas ancladas a la
 * base, 2 px entre barras, cuadrícula tenue, valores en tinta de texto (no en
 * el color de la serie), tooltip al pasar o enfocar y una tabla equivalente.
 */

/** Tono de cada serie: legible sobre la superficie en claro y en oscuro. */
export const seriesTone = {
  visitors: "bg-deep-700 dark:bg-[#9fb0d8]",
  leads: "bg-brand-green-dark dark:bg-brand-green",
} as const;

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-surface p-5 shadow-meta sm:p-6 dark:bg-card">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-2 text-[2rem] font-bold leading-none tabular-nums text-heading">{value}</dd>
      {hint && <dd className="mt-2 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

/** Escala "bonita" para el eje: 0 → máximo redondeado. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= max) ?? 10;
  return step * pow * 4;
}

export function DailyBars({
  title,
  data,
  tone,
  formatDay,
  tableLabel,
  dayLabel,
}: {
  title: string;
  data: { day: string; value: number }[];
  tone: string;
  formatDay: (day: string) => string;
  tableLabel: string;
  dayLabel: string;
}) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <figure className="rounded-lg bg-surface p-5 shadow-meta sm:p-6 dark:bg-card">
      <figcaption className="text-sm font-bold text-heading">{title}</figcaption>
      <div className="mt-4 flex gap-3">
        {/* Eje Y */}
        <div aria-hidden className="flex h-40 flex-col justify-between text-right text-[0.7rem] tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* Cuadrícula */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className={cn("block h-px", t === 0 ? "bg-line-strong" : "bg-line/70")} />
            ))}
          </div>
          {/* Barras */}
          <ul className="relative flex h-40 items-end gap-0.5" aria-hidden>
            {data.map((d) => (
              <li key={d.day} className="group relative flex h-full flex-1 items-end">
                <span
                  className={cn("block w-full rounded-t-[4px] transition-opacity group-hover:opacity-80", tone, d.value === 0 && "opacity-0")}
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                />
                {/* Tooltip */}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-deep-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block dark:bg-white dark:text-deep-900">
                  <span className="block font-bold tabular-nums">{d.value}</span>
                  <span className="block opacity-80 first-letter:uppercase">{formatDay(d.day)}</span>
                </span>
              </li>
            ))}
          </ul>
          {/* Eje X */}
          <div aria-hidden className="mt-2 flex gap-0.5 text-[0.7rem] text-muted">
            {data.map((d, i) => (
              <span key={d.day} className="flex-1 truncate text-center">
                {i % labelEvery === 0 ? formatDay(d.day).replace(/\.$/, "") : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla equivalente (accesible y para quien prefiera números) */}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-heading">{tableLabel}</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 font-semibold">{dayLabel}</th>
              <th scope="col" className="py-1 text-right font-semibold">{title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.day}>
                <td className="py-1 text-body first-letter:uppercase">{formatDay(d.day)}</td>
                <td className="py-1 text-right tabular-nums text-heading">{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/**
 * Lista con barra horizontal de magnitud (páginas, fuentes, países…). La
 * etiqueta y el número van en tinta de texto; la barra solo acompaña.
 */
export function BarList({
  title,
  rows,
  tone = seriesTone.visitors,
  valueLabel,
  extra,
  empty,
}: {
  title: string;
  rows: { label: string; value: number; extra?: string; href?: string }[];
  tone?: string;
  valueLabel: string;
  /** Encabezado de la columna adicional (p. ej. leads de esa fuente). */
  extra?: string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-lg bg-surface p-5 shadow-meta sm:p-6 dark:bg-card">
      <h2 className="text-sm font-bold text-heading">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">{title}</th>
              <th scope="col">{valueLabel}</th>
              {extra && <th scope="col">{extra}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="group" title={`${r.label}: ${r.value}${r.extra ? ` · ${extra} ${r.extra}` : ""}`}>
                <td className="relative py-1.5 pr-3">
                  <span
                    aria-hidden
                    className={cn("absolute inset-y-1 left-0 rounded-r-[4px] opacity-15 transition-opacity group-hover:opacity-25", tone)}
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                  <span className="relative block truncate px-2 text-heading">{r.label}</span>
                </td>
                <td className="w-16 py-1.5 text-right font-bold tabular-nums text-heading">{r.value}</td>
                {extra && <td className="w-16 py-1.5 text-right tabular-nums text-muted">{r.extra ?? ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
