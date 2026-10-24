import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Desarrollo web: la cabecera muestra un navegador que "arma" el sitio por
 * bloques (cabecera, hero, secciones) y la sección insignia pone la misma
 * página en escritorio, tableta y móvil con llamadas numeradas que remiten a
 * las características reales del servicio.
 */
const copy = {
  es: {
    url: "tumarca.com",
    blocks: { header: "Cabecera", hero: "Hero", sections: "Secciones" },
    showcaseTitle: "Un sitio, todas las pantallas",
    showcaseSubtitle:
      "Diseñamos una sola experiencia que se adapta a cada dispositivo: la misma marca, el mismo contenido y la misma velocidad en escritorio, tableta y celular.",
    devices: { desktop: "Escritorio", tablet: "Tableta", phone: "Móvil" },
    stackLabel: "Con qué lo construimos",
  },
  en: {
    url: "yourbrand.com",
    blocks: { header: "Header", hero: "Hero", sections: "Sections" },
    showcaseTitle: "One site, every screen",
    showcaseSubtitle:
      "We design a single experience that adapts to every device: the same brand, the same content and the same speed on desktop, tablet and phone.",
    devices: { desktop: "Desktop", tablet: "Tablet", phone: "Mobile" },
    stackLabel: "What we build it with",
  },
};

/** Retraso escalonado para la aparición de los bloques del navegador. */
const stagger = (step: number) => ({ animationDelay: `${150 + step * 180}ms` });

/** Etiqueta de bloque del armado (estilo de herramienta de diseño). */
function BlockTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -top-2.5 left-3 z-10 rounded-full bg-deep-700 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white dark:bg-action dark:text-deep-700">
      {children}
    </span>
  );
}

function Hero({ service, locale, ...props }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-accent">{c.tagline}</p>
            <h1 className="mt-3 text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.035em] text-heading">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {c.intro}
            </p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              className="mt-9"
            />
          </div>

          {/* Navegador que arma el sitio por bloques (ilustrativo). */}
          <div aria-hidden className="relative">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface-soft shadow-card-hover">
              {/* Barra del navegador */}
              <div className="flex items-center gap-3 border-b border-line bg-card px-4 py-3">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-deep-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-deep-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-deep-200" />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 text-xs text-muted">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 fill-current">
                    <path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
                  </svg>
                  <span className="truncate">https://{t.url}</span>
                </span>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                {/* Cabecera */}
                <div
                  className="relative flex items-center justify-between rounded-2xl border border-dashed border-line-strong bg-card px-4 py-3 motion-safe:animate-slide-up"
                  style={stagger(0)}
                >
                  <BlockTag>{t.blocks.header}</BlockTag>
                  <span className="h-3 w-16 rounded-full bg-deep-700 dark:bg-deep-200" />
                  <span className="hidden gap-3 sm:flex">
                    <span className="h-2 w-10 rounded-full bg-line-strong" />
                    <span className="h-2 w-10 rounded-full bg-line-strong" />
                    <span className="h-2 w-10 rounded-full bg-line-strong" />
                  </span>
                  <span className="h-6 w-16 rounded-full bg-action" />
                </div>

                {/* Hero con la fotografía del servicio */}
                <div
                  className="relative motion-safe:animate-slide-up"
                  style={stagger(1)}
                >
                  <BlockTag>{t.blocks.hero}</BlockTag>
                  <div className="relative aspect-[16/8] overflow-hidden rounded-2xl">
                    <Image
                      src={service.image}
                      alt=""
                      fill
                      priority
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-950/80 via-deep-950/30 to-transparent" />
                    <div className="absolute inset-x-5 bottom-5 space-y-2">
                      <span className="block h-3.5 w-3/5 rounded-full bg-white" />
                      <span className="block h-3.5 w-2/5 rounded-full bg-white" />
                      <span className="block h-2 w-1/2 rounded-full bg-white/60" />
                      <span className="mt-3 inline-block h-6 w-20 rounded-full bg-action" />
                    </div>
                  </div>
                </div>

                {/* Secciones */}
                <div
                  className="relative grid grid-cols-3 gap-3 rounded-2xl border border-dashed border-line-strong p-3 pt-5 motion-safe:animate-slide-up"
                  style={stagger(2)}
                >
                  <BlockTag>{t.blocks.sections}</BlockTag>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2 rounded-xl bg-card p-3">
                      <span className="block h-6 w-6 rounded-lg bg-accent-soft" />
                      <span className="block h-2 w-4/5 rounded-full bg-line-strong" />
                      <span className="block h-2 w-3/5 rounded-full bg-line" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sección insignia                                                           */
/* -------------------------------------------------------------------------- */

/** La misma página en miniatura; `compact` apila las tarjetas para móvil. */
function MiniPage({
  image,
  compact = false,
  sizes,
}: {
  image: string;
  compact?: boolean;
  sizes: string;
}) {
  return (
    <div className="space-y-2 bg-surface p-2">
      <div className="flex items-center justify-between px-1">
        <span className="h-1.5 w-8 rounded-full bg-deep-700 dark:bg-deep-200" />
        {compact ? (
          <span className="flex flex-col gap-0.5">
            <span className="h-0.5 w-3 rounded-full bg-deep-400" />
            <span className="h-0.5 w-3 rounded-full bg-deep-400" />
          </span>
        ) : (
          <span className="flex gap-1.5">
            <span className="h-1 w-5 rounded-full bg-line-strong" />
            <span className="h-1 w-5 rounded-full bg-line-strong" />
            <span className="h-3 w-8 rounded-full bg-action" />
          </span>
        )}
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          compact ? "aspect-[4/5]" : "aspect-[16/7]",
        )}
      >
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950/70 to-transparent" />
        <div className="absolute inset-x-2 bottom-2 space-y-1">
          <span className="block h-1.5 w-3/5 rounded-full bg-white" />
          <span className="block h-1.5 w-2/5 rounded-full bg-white" />
          <span className="mt-1 inline-block h-2.5 w-8 rounded-full bg-action" />
        </div>
      </div>
      <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "grid-cols-3")}>
        {(compact ? [0, 1] : [0, 1, 2]).map((i) => (
          <div key={i} className="space-y-1 rounded-md bg-surface-soft p-1.5">
            <span className="block h-2.5 w-2.5 rounded bg-accent-soft" />
            <span className="block h-1 w-4/5 rounded-full bg-line-strong" />
            <span className="block h-1 w-3/5 rounded-full bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Marcador numerado sobre los dispositivos. */
function Callout({ n, className }: { n: number; className: string }) {
  return (
    <span
      className={cn(
        "absolute z-10 flex h-7 w-7 items-center justify-center rounded-full bg-deep-700 text-xs font-bold text-white ring-4 ring-surface dark:bg-action dark:text-deep-700 sm:h-8 sm:w-8 sm:text-sm",
        className,
      )}
    >
      {n}
    </span>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];
  const deviceFrame =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft ring-1 ring-line";

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

        {/* Escritorio + tableta + móvil (ilustrativo) */}
        <div
          aria-hidden
          className="mx-auto mt-14 flex max-w-6xl items-end justify-center gap-3 sm:gap-6"
        >
          {/* Escritorio */}
          <div className="relative min-w-0 flex-[3]">
            <Callout n={1} className="left-[8%] top-[34%]" />
            <Callout n={2} className="-top-3 left-[38%]" />
            <Callout n={4} className="bottom-[17%] left-[56%]" />
            <div className={cn("overflow-hidden rounded-2xl p-1.5 shadow-card", deviceFrame)}>
              <div className="mb-1.5 flex items-center gap-1 px-1.5 pt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-deep-200" />
                <span className="h-1.5 w-1.5 rounded-full bg-deep-200" />
                <span className="h-1.5 w-1.5 rounded-full bg-deep-200" />
                <span className="ml-2 h-2 flex-1 rounded-full bg-surface" />
              </div>
              <div className="overflow-hidden rounded-xl">
                <MiniPage image={service.image} sizes="(min-width: 1024px) 50vw, 60vw" />
              </div>
            </div>
            <div className="mx-auto h-3 w-1/5 rounded-b-lg bg-line-strong" />
            <p className="mt-3 text-center text-xs font-medium text-muted">
              {t.devices.desktop}
            </p>
          </div>

          {/* Tableta */}
          <div className="relative hidden min-w-0 flex-[1.3] md:block">
            <div className={cn("overflow-hidden rounded-2xl p-2 shadow-card", deviceFrame)}>
              <div className="overflow-hidden rounded-xl">
                <MiniPage image={service.image} sizes="20vw" />
              </div>
            </div>
            <p className="mt-6 text-center text-xs font-medium text-muted">
              {t.devices.tablet}
            </p>
          </div>

          {/* Móvil */}
          <div className="relative min-w-0 flex-[0.9] sm:flex-[0.75]">
            <Callout n={3} className="-right-2 top-[30%]" />
            <div className={cn("overflow-hidden rounded-[1.4rem] p-1.5 shadow-card", deviceFrame)}>
              <div className="mx-auto mb-1 h-1 w-6 rounded-full bg-line-strong" />
              <div className="overflow-hidden rounded-2xl">
                <MiniPage image={service.image} sizes="15vw" compact />
              </div>
            </div>
            <p className="mt-6 text-center text-xs font-medium text-muted">
              {t.devices.phone}
            </p>
          </div>
        </div>

        {/* Leyenda: cada número es una característica real del servicio. */}
        <ol className="mx-auto mt-14 grid max-w-6xl gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map((feature, i) => (
            <li key={feature} className="flex items-start gap-3 border-t border-line pt-5">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-deep-700 text-xs font-bold text-white dark:bg-action dark:text-deep-700"
              >
                {i + 1}
              </span>
              <span className="text-base font-bold leading-snug text-heading">
                {feature}
              </span>
            </li>
          ))}
        </ol>

        {stack.length > 0 && (
          <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center">
            <p className="shrink-0 text-sm font-semibold text-muted">{t.stackLabel}</p>
            <ul className="flex flex-wrap gap-2">
              {stack.map((tech) => (
                <li
                  key={tech}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold text-heading",
                    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft",
                  )}
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
