import Image from "next/image";
import { Smartphone, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Apps móviles: cabecera gris con el titular centrado y tres teléfonos en
 * abanico debajo; la sección insignia combina una ficha de tienda de apps
 * con una tira desplazable de pantallas, una por característica real.
 */
const copy = {
  es: {
    push: "Notificaciones push",
    showcaseTitle: "iOS y Android",
    showcaseSubtitle:
      "Una app pensada para las dos tiendas: la diseñamos, la construimos y la publicamos por ti.",
    appName: "Tu app",
    get: "Obtener",
    platformsLabel: "Disponible en",
    platforms: ["App Store", "Google Play"],
    stripLabel: "Pantallas de ejemplo por característica",
    deliverablesTitle: "Del prototipo a la tienda",
  },
  en: {
    push: "Push notifications",
    showcaseTitle: "iOS and Android",
    showcaseSubtitle:
      "One app designed for both stores: we design it, build it and publish it for you.",
    appName: "Your app",
    get: "Get",
    platformsLabel: "Available on",
    platforms: ["App Store", "Google Play"],
    stripLabel: "Sample screens by feature",
    deliverablesTitle: "From prototype to store",
  },
};

/** Marco de teléfono: bisel marino, isla superior y pantalla redondeada. */
function Phone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[2.2rem] bg-deep-900 p-2 shadow-card-hover ring-1 ring-black/5",
        className,
      )}
    >
      <span className="absolute left-1/2 top-3.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-deep-900" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.75rem] bg-surface">
        {children}
      </div>
    </div>
  );
}

/** Barra de pestañas inferior de la app (la activa en verde). */
function TabBar({ active }: { active: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-line bg-card px-3 pb-4 pt-2.5">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "h-4 w-4 rounded-md",
              i === active ? "bg-action" : "bg-line-strong",
            )}
          />
          <span
            className={cn(
              "h-1 w-5 rounded-full",
              i === active ? "bg-accent" : "bg-line",
            )}
          />
        </span>
      ))}
    </div>
  );
}

/** Pantalla de inicio: fotografía del servicio, tarjetas y barra de pestañas. */
function HomeScreen({ image, sizes }: { image: string; sizes: string }) {
  return (
    <>
      <div className="relative h-[44%]">
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-950/80 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 space-y-1.5">
          <span className="block h-2.5 w-3/4 rounded-full bg-white" />
          <span className="block h-2 w-1/2 rounded-full bg-white/60" />
        </div>
      </div>
      <div className="space-y-2.5 p-3">
        <div className="flex gap-2">
          <span className="h-5 w-14 rounded-full bg-action" />
          <span className="h-5 w-12 rounded-full bg-surface-soft" />
          <span className="h-5 w-10 rounded-full bg-surface-soft" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-xl bg-surface-soft p-2.5">
            <span className="h-9 w-9 shrink-0 rounded-lg bg-accent-soft" />
            <span className="flex-1 space-y-1.5">
              <span className="block h-1.5 w-4/5 rounded-full bg-line-strong" />
              <span className="block h-1.5 w-1/2 rounded-full bg-line" />
            </span>
          </div>
        ))}
      </div>
      <TabBar active={0} />
    </>
  );
}

/** Pantalla de lista con tarjetas grandes. */
function ListScreen({ image, sizes }: { image: string; sizes: string }) {
  return (
    <>
      <div className="space-y-3 px-3 pt-10">
        <span className="block h-3 w-1/2 rounded-full bg-deep-700 dark:bg-deep-200" />
        <span className="block h-7 rounded-full bg-surface-soft" />
        <div className="relative h-24 overflow-hidden rounded-xl">
          <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-7 w-7 shrink-0 rounded-full bg-surface-soft" />
            <span className="h-1.5 flex-1 rounded-full bg-line-strong" />
          </div>
        ))}
      </div>
      <TabBar active={1} />
    </>
  );
}

/** Pantalla de perfil/ajustes con interruptores. */
function SettingsScreen() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 px-3 pt-12">
        <span className="h-14 w-14 rounded-full bg-accent-soft" />
        <span className="h-2.5 w-1/2 rounded-full bg-deep-700 dark:bg-deep-200" />
        <span className="h-1.5 w-1/3 rounded-full bg-line-strong" />
      </div>
      <div className="mt-5 space-y-2 px-3">
        {[true, false, true].map((on, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-surface-soft p-2.5">
            <span className="h-1.5 w-1/2 rounded-full bg-line-strong" />
            <span
              className={cn(
                "flex h-4 w-7 items-center rounded-full p-0.5",
                on ? "justify-end bg-action" : "bg-line-strong",
              )}
            >
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          </div>
        ))}
      </div>
      <TabBar active={3} />
    </>
  );
}

/** Pantalla offline/sincronización: lista con estado de sincronización. */
function SyncScreen() {
  return (
    <>
      <div className="space-y-2.5 px-3 pt-10">
        <div className="flex items-center gap-2 rounded-xl bg-deep-700 p-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-brand-green" strokeWidth="2.5">
            <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
          </svg>
          <span className="h-1.5 flex-1 rounded-full bg-white/60" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-xl bg-surface-soft p-2.5">
            <span className="h-7 w-7 shrink-0 rounded-lg bg-card" />
            <span className="flex-1 space-y-1.5">
              <span className="block h-1.5 w-3/4 rounded-full bg-line-strong" />
              <span className="block h-1.5 w-1/3 rounded-full bg-line" />
            </span>
            <span className={cn("h-2 w-2 rounded-full", i < 3 ? "bg-action" : "bg-line-strong")} />
          </div>
        ))}
      </div>
      <TabBar active={2} />
    </>
  );
}

/** Pantalla de tienda: ícono grande y botón de descarga. */
function StoreScreen({ name }: { name: string }) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 px-3 pt-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-deep-700">
          <Smartphone className="h-8 w-8 text-brand-green" />
        </span>
        <span className="text-sm font-bold text-heading">{name}</span>
        <span className="h-6 w-20 rounded-full bg-action" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-1.5 px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="aspect-[9/16] rounded-lg bg-surface-soft" />
        ))}
      </div>
    </>
  );
}

function Hero({ service, locale, ...props }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-surface-soft pt-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{c.tagline}</p>
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {c.intro}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            className="mt-9 justify-center"
          />
        </div>

        {/* Tres teléfonos en abanico, cortados por el borde inferior. */}
        <div
          aria-hidden
          className="relative mx-auto mt-14 flex h-[22rem] max-w-3xl items-start justify-center sm:mt-16 sm:h-[30rem] lg:h-[34rem]"
        >
          <Phone className="absolute top-12 w-[38%] max-w-[13rem] -translate-x-[62%] -rotate-[8deg] motion-safe:animate-slide-up sm:w-[30%]">
            <ListScreen image={service.image} sizes="200px" />
          </Phone>
          <Phone className="absolute top-12 w-[38%] max-w-[13rem] translate-x-[62%] rotate-[8deg] motion-safe:animate-slide-up sm:w-[30%]">
            <SettingsScreen />
          </Phone>
          <div className="relative z-10 w-[46%] max-w-[16rem] motion-safe:animate-slide-up sm:w-[36%]">
            <Phone>
              <HomeScreen image={service.image} sizes="260px" />
            </Phone>
            {/* Notificación push sobre el teléfono central */}
            <div className="absolute -left-6 right-6 top-14 flex items-center gap-2.5 rounded-2xl bg-card/95 p-3 shadow-card-hover ring-1 ring-line backdrop-blur sm:-left-16 sm:right-10">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-deep-700">
                <Smartphone className="h-4 w-4 text-brand-green" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-heading">{t.push}</span>
                <span className="mt-1 block h-1.5 w-4/5 rounded-full bg-line-strong" />
              </span>
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
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  /** Una pantalla por característica real, en el mismo orden. */
  const screens = [
    <HomeScreen key="home" image={service.image} sizes="220px" />,
    <SettingsScreen key="settings" />,
    <StoreScreen key="store" name={t.appName} />,
    <SyncScreen key="sync" />,
  ];

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.showcaseTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.showcaseSubtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12">
          {/* Ficha estilo tienda de apps */}
          <div className={cn("flex flex-col rounded-3xl p-6 sm:p-8", card)}>
            <div aria-hidden className="flex items-center gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.4rem] bg-deep-700">
                <Smartphone className="h-9 w-9 text-brand-green" />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-bold text-heading">{t.appName}</span>
                <span className="mt-1 block text-sm text-muted">{c.tagline}</span>
                <span className="mt-2 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-accent" />
                  ))}
                </span>
              </span>
            </div>
            <span
              aria-hidden
              className="mt-6 flex h-11 items-center justify-center rounded-full bg-deep-700 text-sm font-semibold text-white dark:bg-action dark:text-deep-700"
            >
              {t.get}
            </span>

            <p className="mt-6 text-sm font-semibold text-muted">{t.platformsLabel}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.platforms.map((platform) => (
                <li
                  key={platform}
                  className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-heading ring-1 ring-line"
                >
                  {platform}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 border-t border-line pt-6 text-lg font-bold text-heading">
              {t.deliverablesTitle}
            </h3>
            <ol className="mt-4 space-y-3">
              {c.deliverables.map((item, i) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-body">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-heading"
                  >
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          {/* Tira desplazable de pantallas */}
          <div
            role="region"
            aria-label={t.stripLabel}
            tabIndex={0}
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
          >
            {c.features.map((feature, i) => (
              <figure
                key={feature}
                className="w-[13.5rem] shrink-0 snap-start sm:w-[15rem]"
              >
                <div aria-hidden>
                  <Phone>{screens[i % screens.length]}</Phone>
                </div>
                <figcaption className="mt-4 flex items-start gap-2 text-base font-bold leading-snug text-heading">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-action" aria-hidden />
                  {feature}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
