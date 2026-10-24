"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ShoppingBag, Truck } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Step = { label: string; text: string; points: string[]; tech: string[] };

type Mock = {
  filters: string[];
  methods: string[];
  tracking: string[];
  invoice: string;
  carrier: string;
  products: string[];
  images: string[];
};

type Labels = {
  steps: string;
  prev: string;
  next: string;
  tech: string;
  pay: string;
  total: string;
  price: string;
};

/**
 * Paso a paso del flujo de compra (Catálogo → Carrito → Pago → Envío).
 * Las etapas son pestañas WAI-ARIA: flechas, Inicio y Fin las recorren.
 */
export function CheckoutStepper({
  steps,
  labels,
  mock,
  tone,
  className,
}: {
  steps: Step[];
  labels: Labels;
  mock: Mock;
  tone: "light" | "muted";
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const last = steps.length - 1;

  const go = (index: number, focus = false) => {
    const next = Math.min(Math.max(index, 0), last);
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (event.key in keys) {
      event.preventDefault();
      go(keys[event.key], true);
    }
  };

  const step = steps[active];
  const panelSurface = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <div className={className}>
      {/* Pasos */}
      <div
        role="tablist"
        aria-label={labels.steps}
        onKeyDown={onKeyDown}
        className="mx-auto grid max-w-4xl grid-cols-4"
      >
        {steps.map((s, i) => {
          const selected = i === active;
          const done = i < active;
          return (
            <button
              key={s.label}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => go(i)}
              className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center"
            >
              <span className="flex w-full items-center">
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0 ? "bg-transparent" : i <= active ? "bg-accent" : "bg-line-strong",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10",
                    selected
                      ? "bg-action text-deep-700"
                      : done
                        ? "bg-deep-700 text-white dark:bg-white/15"
                        : "bg-line text-heading group-hover:bg-line-strong dark:bg-white/10",
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1",
                    i === last ? "bg-transparent" : i < active ? "bg-accent" : "bg-line-strong",
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-xs font-semibold sm:text-sm",
                  selected ? "text-heading" : "text-muted",
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel del paso activo */}
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className={cn(
          "mt-8 grid gap-8 rounded-3xl p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12",
          panelSurface,
        )}
      >
        <div>
          <h3 className="text-2xl font-bold text-heading sm:text-3xl">{step.label}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{step.text}</p>
          <ul className="mt-6 space-y-3">
            {step.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  strokeWidth={2.5}
                />
                <span className="text-base font-bold leading-snug text-heading">{point}</span>
              </li>
            ))}
          </ul>
          {step.tech.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-muted">{labels.tech}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {step.tech.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-heading ring-1 ring-line"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              className={buttonClasses("outline", "md")}
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
              {labels.prev}
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              disabled={active === last}
              className={buttonClasses("dark", "md")}
            >
              {labels.next}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          aria-hidden
          key={active}
          className="min-h-[19rem] rounded-2xl bg-deep-900 p-4 motion-safe:animate-slide-up sm:p-6"
        >
          {active === 0 && <CatalogMock mock={mock} price={labels.price} />}
          {active === 1 && <CartMock mock={mock} labels={labels} />}
          {active === 2 && <PaymentMock mock={mock} gateways={step.tech} labels={labels} />}
          {active === 3 && <ShippingMock mock={mock} />}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Maquetas ilustrativas (sobre marino en ambos temas)                        */
/* -------------------------------------------------------------------------- */

function CatalogMock({ mock, price }: { mock: Mock; price: string }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {mock.filters.map((filter, i) => (
          <span
            key={filter}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              i === 0 ? "bg-action text-deep-700" : "bg-white/10 text-white/80",
            )}
          >
            {filter}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {mock.products.map((name, i) => (
          <div key={name} className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <div className="relative aspect-[16/10]">
              <Image src={mock.images[i]} alt="" fill sizes="240px" className="object-cover" />
            </div>
            <div className="flex items-center justify-between p-2.5">
              <span className="text-xs font-semibold text-white">{name}</span>
              <span className="text-xs text-white/60">{price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartMock({ mock, labels }: { mock: Mock; labels: Labels }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 text-white">
        <ShoppingBag className="h-4 w-4 text-brand-green" />
        <span className="h-2 w-20 rounded-full bg-white/60" />
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image src={mock.images[i]} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {mock.products[i]}
              </span>
              <span className="block text-xs text-white/60">{labels.price}</span>
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
              − <span className="h-1.5 w-1.5 rounded-full bg-white" /> +
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
        <span className="text-white/60">{labels.total}</span>
        <span className="font-bold text-white">{labels.price}</span>
      </div>
      <span className="mt-3 flex h-10 items-center justify-center rounded-full bg-action text-sm font-bold text-deep-700">
        {labels.pay}
      </span>
    </div>
  );
}

function PaymentMock({
  mock,
  gateways,
  labels,
}: {
  mock: Mock;
  gateways: string[];
  labels: Labels;
}) {
  return (
    <div>
      <div className="space-y-2">
        {mock.methods.map((method, i) => (
          <div
            key={method}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 ring-1",
              i === 0 ? "bg-white/10 ring-brand-green" : "bg-white/5 ring-white/10",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full ring-2",
                i === 0 ? "ring-brand-green" : "ring-white/30",
              )}
            >
              {i === 0 && <span className="h-2 w-2 rounded-full bg-brand-green" />}
            </span>
            <span className="text-sm font-semibold text-white">{method}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-[2fr_1fr] gap-2">
        <span className="h-9 rounded-lg bg-white/5 ring-1 ring-white/10" />
        <span className="h-9 rounded-lg bg-white/5 ring-1 ring-white/10" />
      </div>
      {gateways.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {gateways.map((g) => (
            <span key={g} className="rounded-md bg-white/10 px-2 py-1 text-[0.7rem] font-semibold text-white/80">
              {g}
            </span>
          ))}
        </div>
      )}
      <span className="mt-4 flex h-10 items-center justify-center rounded-full bg-action text-sm font-bold text-deep-700">
        {labels.pay} · {labels.price}
      </span>
    </div>
  );
}

function ShippingMock({ mock }: { mock: Mock }) {
  const current = 2;
  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-action">
          <Truck className="h-5 w-5 text-deep-700" />
        </span>
        <span className="flex-1 space-y-1.5">
          <span className="block text-xs font-semibold text-white/60">{mock.carrier}</span>
          <span className="block h-2 w-2/3 rounded-full bg-white/50" />
        </span>
      </div>
      <ol className="mt-5 space-y-0">
        {mock.tracking.map((stage, i) => (
          <li key={stage} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded-full",
                  i < current
                    ? "bg-brand-green"
                    : i === current
                      ? "bg-brand-green ring-4 ring-brand-green/25"
                      : "bg-white/20",
                )}
              />
              {i < mock.tracking.length - 1 && (
                <span className={cn("w-0.5 flex-1", i < current ? "bg-brand-green" : "bg-white/15")} />
              )}
            </span>
            <span
              className={cn(
                "pb-5 text-sm font-semibold",
                i <= current ? "text-white" : "text-white/50",
              )}
            >
              {stage}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
        <span className="text-xs font-semibold text-white/70">{mock.invoice}</span>
        <span className="h-2 w-1/3 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
