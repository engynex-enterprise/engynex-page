import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxLayer } from "@/components/ui/Parallax";
import { buttonClasses } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ServiceIcon";
import type { Service } from "@/content/services";
import type { ServiceFamily, SlaRow } from "@/content/serviceExtras";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Cabecera de la página de servicio.
 *
 * La columna de texto es igual en todas (para que la marca se lea consistente),
 * pero la pieza visual cambia según la familia: una maqueta de navegador para
 * lo que construimos, un collage editorial para lo creativo, un panel de estado
 * para operación, un tablero para datos y un rack para equipos.
 */
export function ServiceHero({
  service,
  locale,
  family,
  backLabel,
  backHref,
  primary,
  secondary,
  stack,
  gallery,
  sla,
  statusLabels,
}: {
  service: Service;
  locale: Locale;
  family: ServiceFamily;
  backLabel: string;
  backHref: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string; external?: boolean };
  stack?: string[];
  gallery?: string[];
  sla?: SlaRow[];
  statusLabels?: { operational: string; monitored: string };
}) {
  const copy = service[locale];
  const isGreen = service.accent === "green";

  return (
    <section className="relative overflow-hidden bg-navy-950 pt-32 pb-24 text-ink-100 sm:pt-40 sm:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* En las familias con foto, la imagen del servicio tiñe el fondo. */}
        {(family === "build" || family === "creative") && (
          <ParallaxLayer distance={60}>
            <Image
              src={service.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-15"
            />
          </ParallaxLayer>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/92 to-navy-950/70" />
        <div
          className={cn(
            "absolute -top-24 left-1/4 h-[28rem] w-[28rem] rounded-full blur-[150px]",
            isGreen ? "bg-brand-green/20" : "bg-brand-blue/25",
          )}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy-950" />
      </div>

      <Container className="relative">
        <nav aria-label="breadcrumb" className="mb-10">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </nav>

        <div
          className={cn(
            "grid grid-cols-1 items-center gap-14",
            "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]",
          )}
        >
          {/* ---------------- Texto ---------------- */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ring-1",
                  isGreen
                    ? "bg-brand-green/20 ring-brand-green/30"
                    : "bg-brand-blue/20 ring-brand-blue/30",
                )}
              >
                <ServiceIcon name={service.icon} className="h-5.5 w-5.5" />
              </span>
              <span
                className={cn(
                  "text-[0.72rem] font-semibold uppercase tracking-[0.2em]",
                  isGreen ? "text-brand-green" : "text-brand-blue-light",
                )}
              >
                {copy.tagline}
              </span>
            </div>

            <h1 className="mt-7 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)] font-extrabold tracking-[-0.02em] text-white">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              {copy.intro}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primary.href}
                className={buttonClasses(
                  isGreen ? "primary" : "secondary",
                  "lg",
                )}
              >
                {primary.label}
                <ArrowRight className="h-5 w-5" />
              </Link>
              {secondary.external ? (
                <a
                  href={secondary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("ghost", "lg")}
                >
                  {secondary.label}
                </a>
              ) : (
                <Link
                  href={secondary.href}
                  className={buttonClasses("ghost", "lg")}
                >
                  {secondary.label}
                </Link>
              )}
            </div>

            {/* Chips de stack: solo tienen sentido en lo que construimos */}
            {family === "build" && stack && stack.length > 0 && (
              <ul className="mt-9 flex flex-wrap gap-2">
                {stack.slice(0, 6).map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ink-300"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---------------- Visual ---------------- */}
          <Reveal className="relative hidden min-w-0 lg:block">
            {family === "build" && (
              <BrowserFrame image={service.image} title={copy.title} />
            )}
            {family === "creative" && (
              <Collage
                images={gallery ?? [service.image]}
                title={copy.title}
              />
            )}
            {family === "ops" && (
              <StatusPanel rows={sla ?? []} labels={statusLabels} />
            )}
            {family === "data" && <DashboardPanel features={copy.features} />}
            {family === "hardware" && <RackPanel />}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ========================================================================== */
/*  build — maqueta de navegador con la imagen del servicio                    */
/* ========================================================================== */

function BrowserFrame({ image, title }: { image: string; title: string }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-green/20 to-brand-blue/20 blur-3xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-navy-900 shadow-2xl">
        {/* Barra del navegador */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-navy-800/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-white/[0.06]" />
        </div>
        <div className="relative aspect-[16/10]">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  creative — collage editorial de piezas                                     */
/* ========================================================================== */

function Collage({ images, title }: { images: string[]; title: string }) {
  const [first, second, third] = [
    images[0],
    images[1] ?? images[0],
    images[2] ?? images[0],
  ];
  return (
    <div className="relative aspect-[4/3.4]">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-green/20 to-brand-blue/20 blur-3xl"
      />
      <div className="absolute left-0 top-0 h-[62%] w-[64%] -rotate-3 overflow-hidden rounded-2xl border border-white/12 shadow-2xl">
        <Image
          src={first}
          alt={title}
          fill
          sizes="35vw"
          className="object-cover"
        />
      </div>
      <div className="absolute right-0 top-[14%] h-[46%] w-[46%] rotate-2 overflow-hidden rounded-2xl border border-white/12 shadow-2xl">
        <Image src={second} alt="" fill sizes="25vw" className="object-cover" />
      </div>
      <div className="absolute bottom-0 left-[16%] h-[44%] w-[58%] rotate-1 overflow-hidden rounded-2xl border border-white/12 shadow-2xl">
        <Image src={third} alt="" fill sizes="30vw" className="object-cover" />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  ops — panel de estado del servicio                                         */
/* ========================================================================== */

function StatusPanel({
  rows,
  labels,
}: {
  rows: SlaRow[];
  labels?: { operational: string; monitored: string };
}) {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-green/20 to-brand-blue/15 blur-3xl"
      />
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-navy-900/85 p-7 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-brand-green ring-1 ring-brand-green/25">
            <span className="animate-pulse-slow h-1.5 w-1.5 rounded-full bg-brand-green" />
            {labels?.operational ?? "Operativo"}
          </span>
          <ShieldCheck
            className="h-5 w-5 text-brand-green"
            strokeWidth={2}
            aria-hidden
          />
        </div>

        {/* Barras de actividad de los últimos días */}
        <div className="mt-7 flex h-14 items-end gap-1" aria-hidden>
          {[62, 78, 55, 88, 70, 94, 66, 82, 74, 90, 60, 86].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={cn(
                "flex-1 rounded-t-sm",
                i % 3 === 0 ? "bg-brand-blue/55" : "bg-brand-green/55",
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wider text-ink-400">
          {labels?.monitored ?? "Monitoreo 24/7"}
        </p>

        <dl className="mt-7 space-y-3 border-t border-white/10 pt-6">
          {rows.slice(0, 4).map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="text-sm text-ink-400">{row.label}</dt>
              <dd className="text-sm font-extrabold text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  data — tablero con indicadores                                             */
/* ========================================================================== */

function DashboardPanel({ features }: { features: string[] }) {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-blue/25 to-brand-green/15 blur-3xl"
      />
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-navy-900/85 p-7 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-green" />
          <span className="h-1.5 w-24 rounded-full bg-white/15" />
          <span className="ml-auto h-1.5 w-10 rounded-full bg-white/10" />
        </div>

        {/* Tarjetas de indicadores */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { v: "98%", w: "88%" },
            { v: "×3,4", w: "64%" },
          ].map((kpi) => (
            <div
              key={kpi.v}
              className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.07]"
            >
              <p className="text-2xl font-extrabold tracking-tight text-white">
                {kpi.v}
              </p>
              <span className="mt-3 block h-1 w-full rounded-full bg-white/10">
                <span
                  style={{ width: kpi.w }}
                  className="block h-full rounded-full bg-gradient-to-r from-brand-green to-brand-blue"
                />
              </span>
            </div>
          ))}
        </div>

        {/* Gráfico de líneas simplificado */}
        <div className="mt-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.07]">
          <svg viewBox="0 0 200 60" className="h-16 w-full" aria-hidden>
            <defs>
              <linearGradient id="svcSpark" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-brand-green)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-brand-green)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d="M0 48 L28 40 L56 44 L84 26 L112 32 L140 16 L168 22 L200 8 L200 60 L0 60 Z"
              fill="url(#svcSpark)"
            />
            <path
              d="M0 48 L28 40 L56 44 L84 26 L112 32 L140 16 L168 22 L200 8"
              fill="none"
              stroke="var(--color-brand-green)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
          {features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-blue/25 text-brand-blue-light">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-[0.82rem] leading-snug text-ink-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  hardware — rack de servidores y puesto de trabajo                          */
/* ========================================================================== */

function RackPanel() {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-blue/25 to-brand-green/20 blur-3xl"
      />
      <div className="relative flex items-end gap-4">
        <div className="w-40 shrink-0 rounded-2xl border border-white/12 bg-navy-900/85 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-400">
              RACK
            </span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green/50" />
            </span>
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1.5 ring-1 ring-white/[0.08]"
              >
                <span
                  style={{ animationDelay: `${i * 0.35}s` }}
                  className={cn(
                    "animate-pulse-slow h-1.5 w-1.5 rounded-full",
                    i % 3 === 0 ? "bg-brand-blue-light" : "bg-brand-green",
                  )}
                />
                <span className="h-1 flex-1 rounded-full bg-white/12" />
                <span className="h-1 w-3 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-t-xl border border-white/12 bg-gradient-to-br from-navy-800 to-navy-900 p-3">
            <div className="space-y-1.5">
              <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-brand-green to-brand-blue" />
              <div className="h-1.5 w-1/2 rounded-full bg-white/12" />
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-5 rounded bg-white/[0.07]" />
                ))}
              </div>
            </div>
          </div>
          <div className="h-1.5 rounded-b-xl bg-white/15" />
        </div>
      </div>
    </div>
  );
}
