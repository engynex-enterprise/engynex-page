import {
  Check,
  ChartLine,
  CreditCard,
  Package,
  Store,
  Truck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * E-commerce — "Tu tienda, lista para vender": cada entregable es una caja
 * cuadrada sobre una repisa, como un estante de tienda, y abajo un banner
 * marino con las características y las plataformas reales del servicio.
 */
const copy = {
  es: {
    lead: "Tu tienda, lista para vender",
    subtitle:
      "Todo lo que hace falta para empezar a vender en línea, montado, conectado y probado antes del lanzamiento.",
    included: "Incluido",
    bannerTitle: "Lista para recibir pedidos",
    bannerText:
      "Catálogo, pagos, envíos y medición trabajando juntos desde el primer día.",
    platforms: "Plataformas y aliados con los que trabajamos",
  },
  en: {
    lead: "Your store, ready to sell",
    subtitle:
      "Everything you need to start selling online, set up, connected and tested before launch.",
    included: "Included",
    bannerTitle: "Ready to take orders",
    bannerText:
      "Catalog, payments, shipping and measurement working together from day one.",
    platforms: "Platforms and partners we work with",
  },
};

/** Ícono de cada caja, en el orden de los entregables. */
const icons = [Store, CreditCard, Truck, ChartLine];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];
  const tile =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

  // Las cajas se agrupan de a dos: cada pareja tiene su propia repisa.
  const shelves: string[][] = [];
  for (let i = 0; i < c.deliverables.length; i += 2) {
    shelves.push(c.deliverables.slice(i, i + 2));
  }

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
            {t.subtitle}
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-6xl gap-x-3 gap-y-10 sm:mt-16 lg:grid-cols-2">
          {shelves.map((pair, s) => (
            <li key={pair.join()} className="flex flex-col">
              <ul className="grid grid-cols-2 gap-3 px-2 sm:gap-4 sm:px-4">
                {pair.map((item, j) => {
                  const i = s * 2 + j;
                  const Icon = icons[i] ?? Package;
                  return (
                    <li
                      key={item}
                      className={cn(
                        "flex aspect-square flex-col justify-between rounded-3xl p-4 sm:p-6",
                        tile,
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          aria-hidden
                          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent sm:h-14 sm:w-14"
                        >
                          <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                        </span>
                        <span className="hidden rounded-full bg-deep-700 px-2.5 py-1 text-[0.7rem] font-semibold text-white dark:bg-action dark:text-deep-700 sm:inline">
                          {t.included}
                        </span>
                      </div>
                      <span className="text-[0.95rem] font-bold leading-snug text-heading sm:text-xl">
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {/* Repisa */}
              <span
                aria-hidden
                className="mt-0 block h-3 rounded-full bg-deep-700 dark:bg-deep-600"
              />
              <span
                aria-hidden
                className="mx-6 block h-2 rounded-b-xl bg-deep-200 dark:bg-deep-800"
              />
            </li>
          ))}
        </ul>

        {/* Banner resumen */}
        <div className="mx-auto mt-12 grid max-w-6xl gap-8 rounded-3xl bg-deep-700 p-6 text-white sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <h3 className="text-2xl font-bold sm:text-3xl">{t.bannerTitle}</h3>
            <p className="mt-3 text-base leading-relaxed text-white/75">
              {t.bannerText}
            </p>
          </div>
          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm font-semibold"
                >
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"
                    strokeWidth={3}
                  />
                  {f}
                </li>
              ))}
            </ul>
            {stack.length > 0 && (
              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="text-xs font-semibold text-white/60">
                  {t.platforms}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {stack.map((p) => (
                    <li
                      key={p}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
