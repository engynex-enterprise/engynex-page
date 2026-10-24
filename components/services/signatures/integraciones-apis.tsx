import {
  Boxes,
  CreditCard,
  MessageCircle,
  Receipt,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Integraciones & APIs — la cabecera es un grafo: Engynex en el centro
 * conectado con las categorías de sistemas que integramos (sin marcas). La
 * sección insignia muestra una petición y respuesta de ejemplo junto a lo que
 * integramos.
 */
const copy = {
  es: {
    hubSub: "API · webhooks",
    nodes: [
      ["ERP", "Inventario y pedidos"],
      ["CRM", "Clientes y leads"],
      ["E-commerce", "Tienda en línea"],
      ["Pagos", "Pasarelas de pago"],
      ["Facturación", "Factura electrónica"],
      ["WhatsApp", "Mensajes y alertas"],
    ],
    eyebrow: "Cómo se ve por dentro",
    title: "Un pedido entra una vez y llega a todos tus sistemas",
    subtitle:
      "Cuando algo pasa en una herramienta, las demás se enteran solas. Sin exportar archivos ni copiar y pegar.",
    codeCaption: "Ejemplo ilustrativo",
    request: [
      "POST /api/v1/pedidos",
      "{",
      '  "pedido": "PED-1024",',
      '  "cliente": "CLI-0087",',
      '  "items": [{ "sku": "SKU-001", "cantidad": 2 }],',
      '  "estado": "pagado"',
      "}",
    ],
    response: [
      "201 Created",
      "{",
      '  "evento": "pedido.creado",',
      '  "sincronizado": ["erp", "facturacion", "crm"],',
      '  "webhook": "entregado"',
      "}",
    ],
    featureNotes: [
      "APIs claras, seguras y documentadas para que otros sistemas y socios se conecten contigo.",
      "Conectamos tu ERP, CRM, tienda y facturación para que compartan la misma información.",
      "Un webhook avisa en el instante en que algo ocurre y dispara el siguiente paso del flujo.",
      "Los datos se actualizan en todas tus herramientas en cuanto cambian, sin esperar al cierre.",
    ],
    reliability:
      "Cada integración incluye registro de eventos, reintentos automáticos y alertas por correo o WhatsApp cuando algo no se procesa.",
  },
  en: {
    hubSub: "API · webhooks",
    nodes: [
      ["ERP", "Inventory and orders"],
      ["CRM", "Customers and leads"],
      ["E-commerce", "Online store"],
      ["Payments", "Payment gateways"],
      ["Invoicing", "E-invoicing"],
      ["WhatsApp", "Messages and alerts"],
    ],
    eyebrow: "What it looks like inside",
    title: "An order comes in once and reaches all your systems",
    subtitle:
      "When something happens in one tool, the others find out on their own. No file exports, no copy-paste.",
    codeCaption: "Illustrative example",
    request: [
      "POST /api/v1/orders",
      "{",
      '  "order": "ORD-1024",',
      '  "customer": "CUS-0087",',
      '  "items": [{ "sku": "SKU-001", "qty": 2 }],',
      '  "status": "paid"',
      "}",
    ],
    response: [
      "201 Created",
      "{",
      '  "event": "order.created",',
      '  "synced": ["erp", "invoicing", "crm"],',
      '  "webhook": "delivered"',
      "}",
    ],
    featureNotes: [
      "Clear, secure, documented APIs so other systems and partners can connect with you.",
      "We connect your ERP, CRM, store and invoicing so they share the same information.",
      "A webhook fires the moment something happens and triggers the next step of the flow.",
      "Data updates across all your tools as soon as it changes, without waiting for the close.",
    ],
    reliability:
      "Every integration includes event logging, automatic retries and email or WhatsApp alerts when something doesn't go through.",
  },
};

const nodeIcons: LucideIcon[] = [
  Boxes,
  Users,
  ShoppingCart,
  CreditCard,
  Receipt,
  MessageCircle,
];

/** Animación de las conexiones (solo si el usuario acepta movimiento). */
const flowCss = `
@keyframes sigApiFlow { to { stroke-dashoffset: -26; } }
@media (prefers-reduced-motion: no-preference) {
  .sig-api-flow { animation: sigApiFlow 1.6s linear infinite; }
}`;

type Rect = { x: number; y: number; w: number; h: number };

function Graph({
  locale,
  layout,
}: {
  locale: SignatureProps["locale"];
  layout: "wide" | "tall";
}) {
  const t = copy[locale];
  const wide = layout === "wide";

  const hub: Rect = wide
    ? { x: 440, y: 172, w: 220, h: 96 }
    : { x: 100, y: 222, w: 160, h: 76 };

  const nodes: Rect[] = wide
    ? [0, 1, 2]
        .map((i) => ({ x: 20, y: 20 + i * 140, w: 230, h: 90 }))
        .concat(
          [0, 1, 2].map((i) => ({ x: 850, y: 20 + i * 140, w: 230, h: 90 })),
        )
    : [0, 1, 2]
        .map((i) => ({ x: 6 + i * 118, y: 6, w: 112, h: 70 }))
        .concat(
          [0, 1, 2].map((i) => ({ x: 6 + i * 118, y: 444, w: 112, h: 70 })),
        );

  const edge = (n: Rect, i: number) => {
    if (wide) {
      const left = i < 3;
      const sx = left ? n.x + n.w : n.x;
      const sy = n.y + n.h / 2;
      const ex = left ? hub.x : hub.x + hub.w;
      const ey = hub.y + hub.h / 2;
      const mx = (sx + ex) / 2;
      return `M${sx} ${sy} C${mx} ${sy} ${mx} ${ey} ${ex} ${ey}`;
    }
    const top = i < 3;
    const sx = n.x + n.w / 2;
    const sy = top ? n.y + n.h : n.y;
    const ex = hub.x + hub.w / 2 + ((i % 3) - 1) * 40;
    const ey = top ? hub.y : hub.y + hub.h;
    const my = (sy + ey) / 2;
    return `M${sx} ${sy} C${sx} ${my} ${ex} ${my} ${ex} ${ey}`;
  };

  return (
    <svg
      viewBox={wide ? "0 0 1100 440" : "0 0 360 520"}
      className={cn(
        "h-auto w-full",
        wide ? "hidden md:block" : "mx-auto max-w-sm md:hidden",
      )}
      aria-hidden
    >
      {nodes.map((n, i) => (
        <path
          key={`e${i}`}
          d={edge(n, i)}
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 8"
          strokeLinecap="round"
          className="sig-api-flow stroke-accent"
        />
      ))}

      {nodes.map((n, i) => {
        const Icon = nodeIcons[i];
        const [label, sub] = t.nodes[i];
        return (
          <g key={label}>
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              rx={wide ? 22 : 18}
              className="fill-card stroke-line-strong"
            />
            {wide ? (
              <>
                <circle
                  cx={n.x + 40}
                  cy={n.y + n.h / 2}
                  r={22}
                  className="fill-accent-soft"
                />
                <Icon
                  x={n.x + 29}
                  y={n.y + n.h / 2 - 11}
                  width={22}
                  height={22}
                  className="text-accent"
                />
                <text
                  x={n.x + 76}
                  y={n.y + 41}
                  className="fill-heading text-[18px] font-bold"
                >
                  {label}
                </text>
                <text
                  x={n.x + 76}
                  y={n.y + 63}
                  className="fill-muted text-[13px]"
                >
                  {sub}
                </text>
              </>
            ) : (
              <>
                <Icon
                  x={n.x + n.w / 2 - 10}
                  y={n.y + 12}
                  width={20}
                  height={20}
                  className="text-accent"
                />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 54}
                  textAnchor="middle"
                  className="fill-heading text-[13px] font-bold"
                >
                  {label}
                </text>
              </>
            )}
          </g>
        );
      })}

      <rect
        x={hub.x}
        y={hub.y}
        width={hub.w}
        height={hub.h}
        rx={hub.h / 2}
        className="fill-deep-700 stroke-brand-green"
        strokeWidth={2}
      />
      <text
        x={hub.x + hub.w / 2}
        y={hub.y + hub.h / 2 - (wide ? 2 : 1)}
        textAnchor="middle"
        className={cn("fill-white font-bold", wide ? "text-[24px]" : "text-[19px]")}
      >
        Engynex
      </text>
      <text
        x={hub.x + hub.w / 2}
        y={hub.y + hub.h / 2 + (wide ? 22 : 19)}
        textAnchor="middle"
        className={cn("fill-brand-green", wide ? "text-[14px]" : "text-[12px]")}
      >
        {t.hubSub}
      </text>
    </svg>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <style>{flowCss}</style>
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <p className="text-sm font-semibold text-accent">{c.tagline}</p>
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-body">
            {c.intro}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            className="mt-8 justify-center"
          />
        </div>
        <div className="mt-14 rounded-3xl bg-surface-soft p-4 sm:p-10">
          <Graph locale={locale} layout="wide" />
          <Graph locale={locale} layout="tall" />
        </div>
      </Container>
    </section>
  );
}

/** Colorea las cadenas de una línea JSON: claves en blanco, valores en verde. */
function CodeLine({ line }: { line: string }) {
  const parts = line.split(/("[^"]*")/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith('"')) {
          return (
            <span key={i} className="text-white/50">
              {part}
            </span>
          );
        }
        const isKey = parts[i + 1]?.trimStart().startsWith(":");
        return (
          <span
            key={i}
            className={isKey ? "text-white" : "text-brand-green"}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Bloque de código ilustrativo */}
          <div
            aria-hidden
            className="min-w-0 overflow-hidden rounded-3xl bg-deep-900 ring-1 ring-white/10 dark:bg-deep-800"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-auto text-xs text-white/50">
                {t.codeCaption}
              </span>
            </div>
            <div className="overflow-x-auto p-5 font-mono text-[12.5px] leading-6 sm:p-7 sm:text-sm sm:leading-7">
              <p className="font-bold text-brand-green">→ {t.request[0]}</p>
              <pre className="mt-1">
                {t.request.slice(1).map((line, i) => (
                  <div key={i}>
                    <CodeLine line={line} />
                  </div>
                ))}
              </pre>
              <p className="mt-5 font-bold text-white">
                <span className="text-brand-green">←</span> {t.response[0]}
              </p>
              <pre className="mt-1">
                {t.response.slice(1).map((line, i) => (
                  <div key={i}>
                    <CodeLine line={line} />
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* Lo que integramos */}
          <div className="min-w-0">
            <ol className="divide-y divide-line border-y border-line">
              {c.features.map((feature, i) => (
                <li key={feature} className="flex gap-5 py-5">
                  <span className="mt-0.5 text-sm font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-heading">
                      {feature}
                    </h3>
                    {t.featureNotes[i] && (
                      <p className="mt-1 text-base leading-relaxed text-muted">
                        {t.featureNotes[i]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-3xl bg-accent-soft px-5 py-4 text-sm leading-relaxed text-heading">
              {t.reliability}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
