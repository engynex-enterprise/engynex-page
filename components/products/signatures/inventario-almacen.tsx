import {
  ArrowRight,
  BellRing,
  Boxes,
  CheckCircle2,
  PackageCheck,
  ScanBarcode,
  Truck,
  Warehouse,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import {
  HeroActions,
  HeroBreadcrumb,
  toneClass,
} from "@/components/services/signatures/shared";
import type {
  ProductHeroProps,
  ProductSignature,
  ProductSignatureProps,
  Tone,
} from "./types";

/**
 * Inventarios & Almacén: la metáfora es la estantería. La cabecera muestra
 * una bodega con ubicaciones, nivel de stock por ubicación, una alerta de
 * mínimo y el haz del lector de código de barras; la sección insignia, el
 * kardex de movimientos y un traslado entre dos bodegas.
 */

const copy = {
  es: {
    warehouse: "Bodega principal",
    racks: ["Estante A", "Estante B", "Estante C"],
    min: "Mínimo",
    scanning: "Leyendo código…",
    count: "Conteo cíclico",
    eyebrow: "Así se mueve tu stock",
    title: "Cada unidad con su movimiento",
    subtitle:
      "Entradas, salidas y traslados quedan en el kardex con su lote, su bodega y su usuario. Así se explica cualquier diferencia.",
    kardex: "Kardex",
    cols: ["Movimiento", "Producto", "Lote", "Bodega", "Cantidad", "Saldo"],
    types: ["Entrada", "Salida", "Traslado", "Traslado", "Ajuste"],
    items: ["Producto A", "Producto B", "Producto A", "Producto A", "Producto C"],
    from: "Bodega A",
    to: "Bodega B",
    transfer: "Traslado",
    transferSteps: ["Despacho", "En tránsito", "Recepción confirmada"],
  },
  en: {
    warehouse: "Main warehouse",
    racks: ["Rack A", "Rack B", "Rack C"],
    min: "Minimum",
    scanning: "Reading code…",
    count: "Cycle count",
    eyebrow: "How your stock moves",
    title: "Every unit with its movement",
    subtitle:
      "Receipts, issues and transfers land in the ledger with their batch, warehouse and user. That's how any discrepancy gets explained.",
    kardex: "Stock ledger",
    cols: ["Movement", "Product", "Batch", "Warehouse", "Quantity", "Balance"],
    types: ["Receipt", "Issue", "Transfer", "Transfer", "Adjustment"],
    items: ["Product A", "Product B", "Product A", "Product A", "Product C"],
    from: "Warehouse A",
    to: "Warehouse B",
    transfer: "Transfer",
    transferSteps: ["Dispatch", "In transit", "Receipt confirmed"],
  },
};

/** Nivel ilustrativo de cada ubicación (ancho de la barra, sin cifras). */
const levels = [
  [82, 64, 90, 48],
  [70, 18, 76, 58],
  [44, 88, 62, 72],
];
/** Ubicación en alerta de mínimo y ubicación que se está leyendo. */
const LOW = [1, 1];
const SCAN = [2, 1];

function Hero({
  product,
  locale,
  backLabel,
  backHref,
  categoryLabel,
  primary,
  secondary,
}: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="bg-surface-soft pb-20 pt-28 sm:pb-28 sm:pt-32">
      {/* Haz del lector: solo se mueve si el usuario no pidió menos movimiento. */}
      <style href="engx-inv-scan" precedence="default">
        {`@keyframes engx-inv-scan{0%,100%{top:12%}50%{top:82%}}`}
      </style>
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            {categoryLabel && (
              <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-heading sm:text-2xl">
              {c.tagline}
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
              {c.description}
            </p>
            <HeroActions primary={primary} secondary={secondary} className="mt-8" />
          </div>

          {/* Estantería de la bodega (ilustrativa). */}
          <div aria-hidden className="relative pb-20 sm:pb-12">
            <div className="rounded-3xl bg-deep-800 p-4 text-white shadow-card ring-1 ring-white/10 sm:p-6">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Warehouse className="h-5 w-5 shrink-0 text-brand-green" />
                  <span className="truncate text-sm font-semibold">{t.warehouse}</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  <ScanBarcode className="h-3.5 w-3.5" />
                  {t.count}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {levels.map((row, r) => (
                  <div key={t.racks[r]}>
                    <p className="mb-2 px-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white/50">
                      {t.racks[r]}
                    </p>
                    <div className="grid grid-cols-4 gap-2 border-b-4 border-white/15 pb-2 sm:gap-3">
                      {row.map((level, b) => {
                        const low = r === LOW[0] && b === LOW[1];
                        const scan = r === SCAN[0] && b === SCAN[1];
                        return (
                          <div
                            key={b}
                            className={cn(
                              "relative overflow-hidden rounded-xl p-2 sm:p-3",
                              low
                                ? "bg-white/[0.1] ring-1 ring-white/60"
                                : "bg-white/[0.05]",
                              scan && "ring-1 ring-brand-green/70",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[0.65rem] text-white/55">
                                {String.fromCharCode(65 + r)}-0{b + 1}
                              </span>
                              <Boxes
                                className={cn(
                                  "h-3.5 w-3.5",
                                  low ? "text-white" : "text-white/40",
                                )}
                              />
                            </div>
                            {/* Cajas apiladas según el nivel. */}
                            <div className="mt-2 flex h-8 items-end gap-0.5 sm:h-10">
                              {[0, 1, 2, 3].map((k) => (
                                <span
                                  key={k}
                                  className="flex-1 rounded-sm bg-white/15"
                                  style={{
                                    height: `${Math.max(12, Math.min(100, level + (k % 2 ? -14 : 6)))}%`,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
                              <span
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  low ? "bg-white" : "bg-brand-green",
                                )}
                                style={{ width: `${level}%` }}
                              />
                              {low && (
                                <span className="absolute -inset-y-1 left-[30%] w-0.5 rounded-full bg-white/70" />
                              )}
                            </div>
                            {low && (
                              <span className="mt-2 inline-flex rounded-full bg-white px-1.5 py-0.5 text-[0.6rem] font-bold text-deep-700 sm:px-2">
                                {t.min}
                              </span>
                            )}
                            {scan && (
                              <span className="absolute inset-x-1 top-1/2 h-0.5 rounded-full bg-brand-green shadow-[0_0_10px_2px_rgba(159,219,79,0.6)] motion-safe:[animation:engx-inv-scan_2.4s_ease-in-out_infinite]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta de alerta de mínimo. */}
            <div className="absolute bottom-0 left-4 right-4 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card-hover ring-1 ring-line sm:left-auto sm:right-8 sm:w-80">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-action text-deep-700">
                <BellRing className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted">B-02 · {t.min}</p>
                <p className="font-semibold leading-snug text-heading">{c.features[3]}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  // Bodega de cada fila del kardex.
  const rowWarehouse = [t.from, t.from, t.from, t.to, t.to];
  const typeIcon = [PackageCheck, ArrowRight, Truck, Truck, CheckCircle2];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-heading sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          {/* Kardex de movimientos. */}
          <figure className="flex flex-col">
            <div aria-hidden className="flex-1 rounded-3xl bg-deep-800 p-4 text-white ring-1 ring-white/10 sm:p-6">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{t.kardex}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  <Warehouse className="h-3.5 w-3.5" />
                  {t.from} · {t.to}
                </span>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] gap-3 bg-white/[0.06] px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/55 sm:grid-cols-[1.3fr_1fr_0.8fr_1fr_0.8fr_0.8fr]">
                  <span>{t.cols[0]}</span>
                  <span>{t.cols[1]}</span>
                  <span className="hidden sm:block">{t.cols[2]}</span>
                  <span className="hidden sm:block">{t.cols[3]}</span>
                  <span className="text-right">{t.cols[4]}</span>
                  <span className="text-right">{t.cols[5]}</span>
                </div>
                {t.types.map((type, i) => {
                  const Icon = typeIcon[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] items-center gap-3 border-t border-white/[0.08] px-4 py-3 text-sm sm:grid-cols-[1.3fr_1fr_0.8fr_1fr_0.8fr_0.8fr]",
                        i === 2 && "bg-white/[0.05]",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2 font-semibold">
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                            i < 2 ? "bg-brand-green text-deep-700" : "bg-white/15 text-white",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{type}</span>
                      </span>
                      <span className="truncate text-white/80">{t.items[i]}</span>
                      <span className="hidden font-mono text-xs text-white/60 sm:block">
                        L-0{(i % 3) + 1}
                      </span>
                      <span className="hidden truncate text-white/70 sm:block">
                        {rowWarehouse[i]}
                      </span>
                      <span className="text-right font-mono text-white/70">—</span>
                      <span className="text-right font-mono text-white/70">—</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <figcaption className="mt-5 px-1">
              <p className="font-bold text-heading">{c.features[0]}</p>
              <p className="mt-1 text-body">{c.modules[1]}</p>
            </figcaption>
          </figure>

          {/* Traslado entre bodegas. */}
          <figure className="flex flex-col">
            <div aria-hidden className={cn("flex flex-1 flex-col rounded-3xl p-5 sm:p-7", card)}>
              <span className="self-start rounded-full bg-deep-700 px-3 py-1 text-xs font-semibold text-white dark:bg-white/10">
                {t.transfer} · TR-—
              </span>
              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {[t.from, t.to].map((name, i) => (
                  <div
                    key={name}
                    className={cn(
                      "rounded-2xl p-4 text-center ring-1 ring-line",
                      i === 0 ? "order-1" : "order-3",
                      tone === "muted" ? "bg-surface-soft" : "bg-card",
                    )}
                  >
                    <Warehouse className="mx-auto h-7 w-7 text-heading" />
                    <p className="mt-2 text-sm font-bold text-heading">{name}</p>
                  </div>
                ))}
                <div className="order-2 flex flex-col items-center gap-1 text-accent">
                  <Truck className="h-6 w-6" />
                  <span className="h-0.5 w-10 rounded-full bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_10px)] sm:w-14" />
                </div>
              </div>
              <ol className="mt-7 space-y-3">
                {t.transferSteps.map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                        i === 2
                          ? "bg-action text-deep-700"
                          : "bg-deep-700 text-white dark:bg-white/10",
                      )}
                    >
                      {i === 2 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="text-sm font-semibold text-heading">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <figcaption className="mt-5 px-1">
              <p className="font-bold text-heading">{c.features[1]}</p>
              <p className="mt-1 text-body">{c.modules[2]}</p>
            </figcaption>
          </figure>
        </div>

        {/* Lectura y alertas: las otras dos funciones clave. */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { icon: ScanBarcode, title: c.features[2], text: c.modules[3] },
            { icon: BellRing, title: c.features[3], text: c.modules[4] },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className={cn("flex gap-4 rounded-3xl p-5 sm:p-6", card)}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-heading">{title}</p>
                <p className="mt-1 text-body">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
