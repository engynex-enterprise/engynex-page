import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import { CheckoutStepper } from "./parts/ecommerce-checkout";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * E-commerce: la cabecera es una vitrina (cuadrícula de productos con el
 * carrito deslizándose desde la derecha) y la sección insignia recorre el
 * flujo de compra paso a paso con las características reales de cada etapa.
 * Los precios se muestran como "$ —": no inventamos cifras.
 */
const copy = {
  es: {
    products: ["Destacado", "Novedad", "Colección", "Accesorio", "Edición especial", "Básico"],
    cart: "Carrito",
    total: "Total",
    pay: "Pagar",
    showcaseTitle: "Del catálogo a la puerta del cliente",
    showcaseSubtitle:
      "Recorre el flujo de compra que construimos: cada paso está pensado para que tu cliente compre sin fricción y tú administres menos.",
    stepsLabel: "Pasos del flujo de compra",
    prev: "Anterior",
    next: "Siguiente",
    techLabel: "Herramientas de este paso",
    steps: [
      {
        label: "Catálogo",
        text: "Tu catálogo organizado por categorías y filtros, con fichas de producto claras y rápidas de cargar.",
      },
      {
        label: "Carrito",
        text: "Un carrito sin pasos de más, pensado para que el cliente no abandone la compra.",
      },
      {
        label: "Pago",
        text: "Pagos con las pasarelas que tus clientes ya usan, locales e internacionales.",
      },
      {
        label: "Envío",
        text: "Pedidos, inventario y despachos sincronizados para que cada venta llegue a su destino.",
      },
    ],
    mock: {
      filters: ["Todo", "Nuevos", "Ofertas"],
      methods: ["Tarjeta", "PSE", "Billetera"],
      tracking: ["Pedido recibido", "Preparando", "En camino", "Entregado"],
      invoice: "Factura",
      carrier: "Transportadora",
    },
  },
  en: {
    products: ["Featured", "New in", "Collection", "Accessory", "Special edition", "Essential"],
    cart: "Cart",
    total: "Total",
    pay: "Pay",
    showcaseTitle: "From catalog to your customer's door",
    showcaseSubtitle:
      "Walk through the purchase flow we build: every step is designed so your customer buys without friction and you manage less.",
    stepsLabel: "Purchase flow steps",
    prev: "Previous",
    next: "Next",
    techLabel: "Tools in this step",
    steps: [
      {
        label: "Catalog",
        text: "Your catalog organized by categories and filters, with clear product pages that load fast.",
      },
      {
        label: "Cart",
        text: "A cart with no extra steps, designed so customers don't abandon their purchase.",
      },
      {
        label: "Payment",
        text: "Payments through the gateways your customers already use, local and international.",
      },
      {
        label: "Shipping",
        text: "Orders, inventory and dispatch in sync so every sale reaches its destination.",
      },
    ],
    mock: {
      filters: ["All", "New", "Deals"],
      methods: ["Card", "Bank transfer", "Wallet"],
      tracking: ["Order received", "Preparing", "On the way", "Delivered"],
      invoice: "Invoice",
      carrier: "Carrier",
    },
  },
};

/** Fotografías de /public/images usadas como productos de muestra. */
const productImages = [
  "/images/svc-ecommerce.jpg",
  "/images/portfolio-3.jpg",
  "/images/portfolio-2.jpg",
  "/images/portfolio-4.jpg",
  "/images/portfolio-1.jpg",
  "/images/svc-apps-moviles.jpg",
];

/**
 * Qué características (índice en `features`), entregables (índice en
 * `deliverables`) y tecnologías del stack corresponden a cada paso.
 */
const stepMap = [
  { features: [0], deliverables: [0], tech: ["Shopify", "WooCommerce", "Next.js"] },
  { features: [3], deliverables: [3], tech: [] },
  { features: [1], deliverables: [1], tech: ["Wompi", "PayU", "Mercado Pago"] },
  { features: [2], deliverables: [2], tech: ["Coordinadora", "Siigo"] },
];

const PRICE = "$ —";

function Hero({ service, locale, ...props }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-accent">{c.tagline}</p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{c.intro}</p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              className="mt-9"
            />
          </div>

          {/* Vitrina con el carrito abierto (ilustrativa). */}
          <div
            aria-hidden
            className="relative overflow-hidden rounded-3xl bg-surface-soft p-3 ring-1 ring-line sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between px-1 sm:mb-4">
              <span className="h-3 w-20 rounded-full bg-deep-700 dark:bg-deep-200" />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card">
                <ShoppingBag className="h-4 w-4 text-heading" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-action ring-2 ring-surface-soft" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {t.products.map((name, i) => (
                <div
                  key={name}
                  className={cn("overflow-hidden rounded-2xl bg-card", i >= 4 && "max-sm:hidden")}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={productImages[i]}
                      alt=""
                      fill
                      priority={i < 2}
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-heading sm:text-sm">
                        {name}
                      </span>
                      <span className="block text-xs text-muted">{PRICE}</span>
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-deep-700 text-sm font-bold text-white dark:bg-action dark:text-deep-700">
                      +
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Velo + carrito deslizable */}
            <div className="absolute inset-0 bg-deep-950/25 motion-safe:transition-opacity motion-safe:delay-300 motion-safe:duration-500 motion-safe:starting:opacity-0" />
            <div className="absolute inset-y-0 right-0 flex w-[62%] flex-col bg-card p-4 shadow-[-24px_0_48px_-24px_rgba(11,16,32,0.45)] motion-safe:transition-transform motion-safe:delay-300 motion-safe:duration-700 motion-safe:ease-out motion-safe:starting:translate-x-full sm:w-[38%] sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-heading">{t.cart}</span>
                <span className="text-lg leading-none text-muted">×</span>
              </div>
              <div className="mt-4 space-y-3">
                {[0, 1, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <Image src={productImages[i]} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-heading">
                        {t.products[i]}
                      </span>
                      <span className="block text-xs text-muted">{PRICE}</span>
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-full bg-surface-soft px-2 py-1 text-xs font-semibold text-heading sm:flex">
                      − <span className="h-1.5 w-1.5 rounded-full bg-heading" /> +
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto border-t border-line pt-4">
                <div className="mb-2 space-y-2">
                  {[0, 1].map((i) => (
                    <span key={i} className="flex items-center justify-between">
                      <span className="h-1.5 w-1/3 rounded-full bg-line-strong" />
                      <span className="text-xs text-muted">{PRICE}</span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-muted">{t.total}</span>
                  <span className="font-bold text-heading">{PRICE}</span>
                </div>
                <span className="mt-3 flex h-10 items-center justify-center rounded-full bg-action text-sm font-bold text-deep-700">
                  {t.pay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];

  const steps = t.steps.map((step, i) => {
    const map = stepMap[i];
    return {
      ...step,
      points: [
        ...map.features.map((f) => c.features[f]),
        ...map.deliverables.map((d) => c.deliverables[d]),
      ].filter(Boolean),
      tech: map.tech.filter((tech) => stack.includes(tech)),
    };
  });

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.showcaseTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.showcaseSubtitle}
          </p>
        </div>

        <CheckoutStepper
          className="mt-12"
          tone={tone}
          steps={steps}
          labels={{
            steps: t.stepsLabel,
            prev: t.prev,
            next: t.next,
            tech: t.techLabel,
            pay: t.pay,
            total: t.total,
            price: PRICE,
          }}
          mock={{ ...t.mock, products: t.products.slice(0, 4), images: productImages }}
        />
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
