import {
  Check,
  CreditCard,
  Plus,
  Printer,
  ScanBarcode,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Sistema POS: la cabecera pone la pantalla de la caja (cuadrícula de
 * productos, carrito, total y el gran botón Cobrar) con la tira del recibo
 * saliendo de la impresora, sobre un escenario marino a la izquierda y el
 * titular a la derecha. La sección insignia es "Una venta en 4 toques" más
 * el panel multisede. Los precios son "$ —": no inventamos cifras.
 */
const PRICE = "$ —";

const copy = {
  es: {
    register: "Caja 1",
    shift: "Turno abierto",
    tabs: ["Todo", "Bebidas", "Snacks", "Hogar"],
    product: "Producto",
    cart: "Venta actual",
    total: "Total",
    charge: "Cobrar",
    receipt: "Recibo",
    invoice: "Factura electrónica",
    thanks: "¡Gracias por tu compra!",
    showcaseEyebrow: "En la caja",
    showcaseTitle: "Una venta en 4 toques",
    showcaseSubtitle:
      "El flujo de cobro está pensado para la fila: pocos pasos, todo a un toque y la factura sale sola.",
    steps: ["Escanear", "Agregar", "Cobrar", "Imprimir"],
    stepText: [
      "El lector identifica el producto al instante.",
      "El precio y la promoción de la sede se aplican solos.",
      "El cliente paga como prefiera, incluso dividido.",
      "Sale el recibo y la factura se envía al cliente.",
    ],
    payMethods: ["Efectivo", "Tarjeta", "Dividir"],
    multiSite: "Multisede",
    sedes: ["Sede 1", "Sede 2", "Sede 3"],
    online: "En línea",
    offline: "Sin conexión · sincroniza al volver",
  },
  en: {
    register: "Register 1",
    shift: "Shift open",
    tabs: ["All", "Drinks", "Snacks", "Home"],
    product: "Product",
    cart: "Current sale",
    total: "Total",
    charge: "Charge",
    receipt: "Receipt",
    invoice: "Electronic invoice",
    thanks: "Thank you for your purchase!",
    showcaseEyebrow: "At the register",
    showcaseTitle: "A sale in 4 taps",
    showcaseSubtitle:
      "The checkout flow is built for the line: few steps, everything one tap away and the invoice goes out on its own.",
    steps: ["Scan", "Add", "Charge", "Print"],
    stepText: [
      "The scanner identifies the product instantly.",
      "The location's price and promotion apply automatically.",
      "The customer pays however they like, even split.",
      "The receipt prints and the invoice is sent to the customer.",
    ],
    payMethods: ["Cash", "Card", "Split"],
    multiSite: "Multi-location",
    sedes: ["Location 1", "Location 2", "Location 3"],
    online: "Online",
    offline: "Offline · syncs when back",
  },
};

const stepIcons: LucideIcon[] = [ScanBarcode, Plus, CreditCard, Printer];

/** Funciones (`features`) y módulos (`modules`) reales de cada toque, por índice. */
const stepMap = [
  { features: [], modules: [0] },
  { features: [], modules: [3, 5] },
  { features: [], modules: [1] },
  { features: [], modules: [4] },
];

/** Borde dentado del recibo térmico. */
function Zigzag({ className }: { className?: string }) {
  const teeth = 14;
  const points = Array.from({ length: teeth * 2 + 1 }, (_, i) => {
    const x = (i / (teeth * 2)) * 100;
    const y = i % 2 === 0 ? 0 : 6;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 6" preserveAspectRatio="none" className={className}>
      <polygon points={`0,0 ${points} 100,0`} className="fill-white" />
    </svg>
  );
}

function Hero({ product, locale, categoryLabel, ...props }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          {/* Escenario: terminal + recibo (ilustrativo). */}
          <div
            aria-hidden
            className="relative order-2 overflow-hidden rounded-3xl bg-deep-950 px-4 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-10 lg:order-1"
          >
            <div className="relative mx-auto max-w-2xl">
              {/* Pantalla */}
              <div className="overflow-hidden rounded-2xl bg-deep-800 ring-1 ring-white/10 sm:mr-40">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                  <span className="text-xs font-bold text-white">{t.register}</span>
                  <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                    {t.shift}
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] sm:grid-cols-[minmax(0,1fr)_11rem]">
                  <div className="p-3 sm:p-4">
                    <div className="flex gap-1.5 overflow-hidden">
                      {t.tabs.map((tab, i) => (
                        <span
                          key={tab}
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold",
                            i === 0 ? "bg-white text-deep-700" : "bg-white/10 text-white/70",
                          )}
                        >
                          {tab}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-xl p-2.5",
                            i === 1 ? "bg-white/15 ring-1 ring-brand-green" : "bg-white/5",
                            i > 3 && "hidden md:block",
                          )}
                        >
                          <span className="block aspect-[4/3] rounded-lg bg-white/10" />
                          <span className="mt-2 block truncate text-[0.65rem] font-semibold text-white/80">
                            {t.product} {i + 1}
                          </span>
                          <span className="block text-[0.65rem] tabular-nums text-white/50">
                            {PRICE}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-white/10 p-3 sm:p-4">
                    <p className="text-[0.7rem] font-bold text-white">{t.cart}</p>
                    <ul className="mt-2 space-y-2">
                      {[2, 1, 4].map((n) => (
                        <li key={n} className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                            <span className="truncate text-[0.65rem] text-white/80">
                              {t.product} {n}
                            </span>
                          </span>
                          <span className="text-[0.65rem] tabular-nums text-white/50">{PRICE}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto border-t border-white/10 pt-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[0.7rem] text-white/70">{t.total}</span>
                        <span className="text-base font-bold tabular-nums text-white sm:text-lg">
                          {PRICE}
                        </span>
                      </div>
                      <span className="mt-2.5 flex h-10 items-center justify-center rounded-xl bg-action text-sm font-bold text-deep-700 sm:h-12 sm:text-base">
                        {t.charge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recibo saliendo de la impresora */}
              <div className="absolute -bottom-6 -right-2 hidden w-40 sm:block">
                <div className="h-3 rounded-t-xl bg-deep-600" />
                <div className="bg-white px-4 pb-3 pt-4 text-deep-700 motion-safe:animate-slide-up">
                  <p className="text-center text-[0.7rem] font-bold">{t.receipt}</p>
                  <div className="mt-3 space-y-1.5">
                    {[80, 60, 70].map((w) => (
                      <div key={w} className="flex justify-between gap-2">
                        <span className="h-1.5 rounded-full bg-deep-200" style={{ width: `${w}%` }} />
                        <span className="h-1.5 w-5 rounded-full bg-deep-200" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-dashed border-deep-200 pt-2 text-[0.7rem] font-bold">
                    <span>{t.total}</span>
                    <span className="tabular-nums">{PRICE}</span>
                  </div>
                  <p className="mt-2 text-[0.6rem] text-deep-500">{t.invoice}</p>
                  <div className="mt-2 flex h-6 items-stretch gap-[2px]">
                    {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2].map((w, i) => (
                      <span key={i} className="bg-deep-700" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <p className="mt-2 text-center text-[0.6rem] text-deep-500">{t.thanks}</p>
                </div>
                <Zigzag className="block h-2 w-full" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            {categoryLabel && (
              <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {c.tagline}
            </p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              className="mt-9"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function StepMock({ index, t }: { index: number; t: (typeof copy)["es"] }) {
  if (index === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="relative flex h-12 w-28 items-stretch justify-center gap-[3px] rounded-lg bg-white/5 px-3 py-2">
          {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2].map((w, i) => (
            <span key={i} className="bg-white/70" style={{ width: `${w}px` }} />
          ))}
          <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-brand-green motion-safe:animate-pulse" />
        </div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="space-y-1.5">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
            <span className="text-[0.65rem] text-white/80">
              {t.product} {n}
            </span>
            <span className="text-[0.65rem] tabular-nums text-white/50">{PRICE}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg bg-brand-green/15 px-2.5 py-1.5 ring-1 ring-brand-green/50">
          <span className="text-[0.65rem] font-semibold text-brand-green">+ {t.product} 3</span>
          <span className="text-[0.65rem] tabular-nums text-brand-green">{PRICE}</span>
        </div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="flex h-full flex-col justify-center gap-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {t.payMethods.map((m, i) => (
            <span
              key={m}
              className={cn(
                "truncate rounded-lg px-1 py-1.5 text-center text-[0.6rem] font-semibold",
                i === 1 ? "bg-white text-deep-700" : "bg-white/10 text-white/70",
              )}
            >
              {m}
            </span>
          ))}
        </div>
        <span className="flex h-8 items-center justify-center rounded-lg bg-action text-xs font-bold text-deep-700">
          {t.charge} {PRICE}
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full items-start justify-center">
      <div className="w-24">
        <div className="space-y-1 bg-white px-2.5 pb-2 pt-2.5">
          <span className="block h-1 w-3/4 rounded-full bg-deep-200" />
          <span className="block h-1 w-1/2 rounded-full bg-deep-200" />
          <span className="block h-1 w-2/3 rounded-full bg-deep-200" />
          <span className="mt-1.5 flex justify-end">
            <Check className="h-3 w-3 text-deep-700" strokeWidth={3} />
          </span>
        </div>
        <Zigzag className="block h-1.5 w-full" />
      </div>
    </div>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const multiSite = c.benefits[2];
  const multiSitePoints = [c.features[2], c.features[3], c.modules[2]].filter(Boolean);

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading
          eyebrow={t.showcaseEyebrow}
          title={t.showcaseTitle}
          subtitle={t.showcaseSubtitle}
          size="lg"
        />

        <ol className="relative mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((label, i) => {
            const Icon = stepIcons[i];
            const points = [
              ...stepMap[i].features.map((k) => c.features[k]),
              ...stepMap[i].modules.map((k) => c.modules[k]),
            ].filter(Boolean);
            return (
              <li key={label} className={cn("flex flex-col overflow-hidden rounded-3xl", card)}>
                <div aria-hidden className="h-32 bg-deep-950 p-4">
                  <StepMock index={i} t={t} />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        i === 2
                          ? "bg-action text-deep-700"
                          : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <h3 className="text-xl text-heading">
                      <span className="mr-1.5 tabular-nums text-muted">{i + 1}.</span>
                      {label}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-body">{t.stepText[i]}</p>
                  <ul className="mt-5 space-y-3 border-t border-line pt-5">
                    {points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        <span className="text-sm leading-snug text-body">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Panel multisede: funciones reales de inventario por sede y reportes. */}
        <div className="mt-4 grid gap-8 overflow-hidden rounded-3xl bg-deep-950 p-6 text-white sm:p-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-green">
              <Store className="h-4 w-4" aria-hidden />
              {t.multiSite}
            </p>
            <h3 className="mt-3 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight text-white">
              {multiSite.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-white/75">{multiSite.description}</p>
            <ul className="mt-6 space-y-3">
              {multiSitePoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-sm leading-snug text-white/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul aria-hidden className="space-y-3 self-center">
            {t.sedes.map((sede, i) => {
              const offline = i === 2;
              return (
                <li key={sede} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <Store className="h-4 w-4 text-white/60" />
                      {sede}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-[0.7rem] font-semibold",
                        offline ? "text-white/60" : "text-brand-green",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          offline ? "bg-white/40" : "bg-brand-green",
                        )}
                      />
                      {offline ? t.offline : t.online}
                    </span>
                  </div>
                  <div className="mt-3 flex h-8 items-end gap-1">
                    {[35, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((h, k) => (
                      <span
                        key={k}
                        className={cn("flex-1 rounded-sm", offline ? "bg-white/15" : "bg-white/25")}
                        style={{ height: `${Math.max(20, h - i * 12)}%` }}
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
