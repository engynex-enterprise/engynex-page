import {
  Archive,
  Check,
  CheckCircle2,
  FileCode2,
  FilePen,
  Mail,
  RotateCcw,
  ShieldCheck,
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
 * Facturación Electrónica: la metáfora es el propio documento. La cabecera
 * centra una factura electrónica que asoma sobre una franja marino, con su
 * sello de «Enviada»; la sección insignia recorre el ciclo del documento:
 * emisión, validación, envío al cliente y archivo.
 */

const copy = {
  es: {
    docType: "Factura electrónica de venta",
    number: "N.º FE-—",
    customer: "Cliente",
    issued: "Emisión",
    due: "Vencimiento",
    cols: ["Descripción", "Cant.", "Valor"],
    items: ["Ítem 1", "Ítem 2", "Ítem 3"],
    subtotal: "Subtotal",
    taxes: "Impuestos",
    total: "Total",
    sent: "Enviada",
    chips: ["XML", "Representación gráfica", "Acuse de recibo"],
    eyebrow: "El ciclo de cada documento",
    title: "De la emisión al archivo, sin pasos manuales",
    subtitle:
      "Cada factura o nota recorre el mismo camino y deja rastro en cada paso. Tú solo revisas lo que necesita atención.",
    steps: [
      {
        name: "Emisión",
        text: "Generas la factura o la nota desde la plataforma, o se crea sola en la facturación recurrente.",
      },
      {
        name: "Validación",
        text: "El documento se reporta al proveedor tecnológico autorizado que elijas.",
      },
      {
        name: "Envío al cliente",
        text: "Llega al correo del cliente con su representación gráfica, con reintentos si el correo rebota.",
      },
      {
        name: "Archivo",
        text: "XML, acuse y representación gráfica quedan guardados y descargables por rango de fechas.",
      },
    ],
    rejected:
      "¿El proveedor rechaza un documento? Ves el motivo, corriges y reenvías, con el rastro completo de intentos.",
    note: "Engynex no es proveedor tecnológico autorizado: nos integramos con proveedores autorizados vigentes.",
  },
  en: {
    docType: "Electronic sales invoice",
    number: "No. FE-—",
    customer: "Customer",
    issued: "Issued",
    due: "Due",
    cols: ["Description", "Qty", "Amount"],
    items: ["Item 1", "Item 2", "Item 3"],
    subtotal: "Subtotal",
    taxes: "Taxes",
    total: "Total",
    sent: "Sent",
    chips: ["XML", "Visual representation", "Read receipt"],
    eyebrow: "The life of every document",
    title: "From issuing to archive, with no manual steps",
    subtitle:
      "Every invoice or note follows the same path and leaves a trail at each step. You only review what needs attention.",
    steps: [
      {
        name: "Issuing",
        text: "You create the invoice or note in the platform, or it's generated automatically by recurring invoicing.",
      },
      {
        name: "Validation",
        text: "The document is reported to the authorized provider you choose.",
      },
      {
        name: "Delivery to the client",
        text: "It reaches the customer's inbox with its visual representation, with retries if the email bounces.",
      },
      {
        name: "Archive",
        text: "XML, acknowledgement and visual representation are stored and downloadable by date range.",
      },
    ],
    rejected:
      "Provider rejected a document? You see the reason, correct and resend, with a full trail of attempts.",
    note: "Engynex is not an authorized e-invoicing provider: we integrate with currently authorized providers.",
  },
};

/** Patrón fijo para el recuadro del código QR (ilustrativo, 9×9). */
const qr = [
  "111101111",
  "100101001",
  "101100101",
  "111011111",
  "010110010",
  "111001011",
  "100110101",
  "101101001",
  "111101111",
];

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
    <section className="relative overflow-hidden bg-surface pt-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mx-auto mt-8 max-w-4xl text-center">
          {categoryLabel && (
            <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
          )}
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-xl leading-relaxed text-body sm:text-2xl">
            {c.tagline}
          </p>
          <HeroActions
            primary={primary}
            secondary={secondary}
            className="mt-8 justify-center"
          />
        </div>
      </Container>

      {/* Factura sobre la franja marino (ilustrativa). */}
      <div aria-hidden className="relative mt-14 sm:mt-16">
        <div className="absolute inset-x-0 bottom-0 top-28 bg-deep-700 sm:top-36" />
        <Container className="relative">
          {/* Archivos que acompañan el documento. */}
          <div className="pointer-events-none absolute inset-x-8 bottom-16 hidden justify-between lg:flex">
            <div className="space-y-3">
              {t.chips.slice(0, 2).map((chip) => (
                <span
                  key={chip}
                  className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15"
                >
                  <FileCode2 className="h-4 w-4 text-brand-green" />
                  {chip}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <span className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15">
                <Mail className="h-4 w-4 text-brand-green" />
                {t.chips[2]}
              </span>
              <span className="flex w-fit items-center gap-2 rounded-full bg-action px-4 py-2 text-sm font-semibold text-deep-700">
                <ShieldCheck className="h-4 w-4" />
                {c.features[1]}
              </span>
            </div>
          </div>

          <div className="relative mx-auto max-w-2xl rounded-t-3xl bg-white px-5 pb-10 pt-6 text-deep-700 shadow-card ring-1 ring-deep-200 sm:px-10 sm:pt-10">
            {/* Encabezado. */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-deep-700 sm:h-12 sm:w-12">
                  <span className="h-4 w-4 rounded-sm bg-brand-green" />
                </span>
                <div className="space-y-1.5">
                  <span className="block h-2.5 w-24 rounded-full bg-deep-200 sm:w-32" />
                  <span className="block h-2 w-16 rounded-full bg-deep-100 sm:w-24" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider sm:text-sm">
                  {t.docType}
                </p>
                <p className="mt-1 font-mono text-xs text-deep-500">{t.number}</p>
              </div>
            </div>

            {/* Datos del cliente. */}
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-deep-100 p-3 text-xs sm:p-4">
              <div>
                <p className="text-deep-500">{t.customer}</p>
                <span className="mt-2 block h-2 w-4/5 rounded-full bg-deep-200" />
              </div>
              <div>
                <p className="text-deep-500">{t.issued}</p>
                <p className="mt-1 font-mono">—</p>
              </div>
              <div>
                <p className="text-deep-500">{t.due}</p>
                <p className="mt-1 font-mono">—</p>
              </div>
            </div>

            {/* Ítems. */}
            <div className="mt-5 text-sm">
              <div className="grid grid-cols-[1fr_3rem_5rem] gap-3 border-b border-deep-200 pb-2 text-xs font-semibold uppercase tracking-wider text-deep-500">
                <span>{t.cols[0]}</span>
                <span className="text-right">{t.cols[1]}</span>
                <span className="text-right">{t.cols[2]}</span>
              </div>
              {t.items.map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-[1fr_3rem_5rem] items-center gap-3 border-b border-deep-100 py-2.5"
                >
                  <span className="font-medium">{item}</span>
                  <span className="text-right font-mono text-deep-500">—</span>
                  <span className="text-right font-mono">$ —</span>
                </div>
              ))}
            </div>

            {/* QR y totales. */}
            <div className="mt-5 flex items-end justify-between gap-6">
              <div className="grid grid-cols-9 gap-px rounded-lg bg-white p-1.5 ring-1 ring-deep-200">
                {qr.flatMap((row, r) =>
                  row.split("").map((bit, k) => (
                    <span
                      key={`${r}-${k}`}
                      className={cn(
                        "h-1.5 w-1.5 sm:h-2 sm:w-2",
                        bit === "1" ? "bg-deep-700" : "bg-transparent",
                      )}
                    />
                  )),
                )}
              </div>
              <dl className="w-48 space-y-1.5 text-sm sm:w-56">
                {[t.subtotal, t.taxes].map((label) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-deep-500">{label}</dt>
                    <dd className="font-mono">$ —</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-deep-200 pt-2 text-base font-bold">
                  <dt>{t.total}</dt>
                  <dd className="font-mono">$ —</dd>
                </div>
              </dl>
            </div>

            {/* Pie del documento (continúa fuera de cuadro). */}
            <div className="mt-8 space-y-2">
              <span className="block h-2 w-full rounded-full bg-deep-100" />
              <span className="block h-2 w-3/4 rounded-full bg-deep-100" />
            </div>

            {/* Sello de envío. */}
            <span className="absolute right-16 top-[15.5rem] flex rotate-[-10deg] items-center gap-2 rounded-xl border-[3px] border-deep-700 bg-white/90 px-3 py-1 text-lg font-bold uppercase tracking-[0.2em] sm:right-28 sm:top-[17.5rem] sm:text-xl">
              <CheckCircle2 className="h-5 w-5 rounded-full bg-brand-green" />
              {t.sent}
            </span>
          </div>
        </Container>
      </div>
    </section>
  );
}

const stepIcons = [FilePen, ShieldCheck, Mail, Archive];

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  // Funciones reales de la plataforma que resuelven cada paso.
  const stepFeatures = [
    [c.modules[0], c.modules[1]],
    [c.features[1]],
    [c.features[0], c.modules[2], c.modules[3]],
    [c.features[3], c.modules[4], c.modules[5]],
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-heading sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">{t.subtitle}</p>
        </div>

        <ol className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-4">
          {t.steps.map((step, i) => {
            const Icon = stepIcons[i];
            const last = i === t.steps.length - 1;
            return (
              <li
                key={step.name}
                className={cn(
                  "relative flex flex-col rounded-3xl p-6 sm:p-7",
                  last ? "bg-deep-700 text-white dark:bg-card-soft" : card,
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-full",
                      last ? "bg-action text-deep-700" : "bg-accent-soft text-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold",
                      last ? "text-white/60" : "text-muted",
                    )}
                  >
                    0{i + 1}
                  </span>
                </div>
                <h3 className={cn("mt-6 text-xl font-bold", last ? "text-white" : "text-heading")}>
                  {step.name}
                </h3>
                <p className={cn("mt-2 leading-relaxed", last ? "text-white/75" : "text-body")}>
                  {step.text}
                </p>
                <ul
                  className={cn(
                    "mt-6 space-y-2.5 border-t pt-5 text-sm",
                    last ? "border-white/15" : "border-line",
                  )}
                >
                  {stepFeatures[i].map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          last ? "text-brand-green" : "text-accent",
                        )}
                        aria-hidden
                      />
                      <span className={cn("font-medium", last ? "text-white" : "text-heading")}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Retorno del paso de validación. */}
                {i === 1 && (
                  <p className="mt-6 flex gap-2.5 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-body ring-1 ring-line dark:bg-surface-soft">
                    <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {t.rejected}
                  </p>
                )}
                {!last && (
                  <span
                    aria-hidden
                    className="absolute -right-3 top-12 z-10 hidden h-6 w-6 place-items-center rounded-full bg-action text-deep-700 xl:grid"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                      <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted">{t.note}</p>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
