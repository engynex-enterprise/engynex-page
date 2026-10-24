import { Check, Package, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Apps móviles — "Listo para las tiendas": una tarjeta de build (con la forma
 * de un teléfono) que lista cada entregable real y, al lado, las dos fichas
 * de envío a las tiendas con su recorrido de publicación.
 */
const copy = {
  es: {
    lead: "Listo para las tiendas",
    subtitle:
      "Te entregamos la app terminada y la acompañamos hasta que esté disponible para tus usuarios en iOS y Android.",
    build: "Build de entrega",
    includes: "Incluye",
    stores: [
      { store: "App Store", platform: "iOS" },
      { store: "Google Play", platform: "Android" },
    ],
    track: ["Build", "Revisión", "Publicación"],
    after: "Después del lanzamiento",
    tools: "Herramientas de publicación",
  },
  en: {
    lead: "Ready for the stores",
    subtitle:
      "We hand over the finished app and see it through until it is available to your users on iOS and Android.",
    build: "Delivery build",
    includes: "Includes",
    stores: [
      { store: "App Store", platform: "iOS" },
      { store: "Google Play", platform: "Android" },
    ],
    track: ["Build", "Review", "Release"],
    after: "After launch",
    tools: "Publishing tools",
  },
};

/** Herramientas del stack que tienen que ver con la publicación. */
const publishing = ["TestFlight", "App Store", "Google Play", "Firebase"];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const steps = getServiceProcess(service.slug)?.[locale].steps ?? [];
  const publishStep = steps.at(-2);
  const afterStep = steps.at(-1);
  const tools = (serviceStack[service.slug] ?? []).filter((s) =>
    publishing.includes(s),
  );
  const panel =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

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

        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-4 sm:mt-16 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6">
          {/* Tarjeta de build con proporción de teléfono. */}
          <div className="mx-auto flex w-full max-w-[22rem] flex-col rounded-[2.5rem] bg-deep-700 p-3 text-white shadow-card-hover">
            <div className="flex flex-1 flex-col rounded-[2rem] bg-deep-900 px-6 pb-7 pt-5">
              <span
                aria-hidden
                className="mx-auto h-1.5 w-16 rounded-full bg-white/20"
              />
              <div className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-action text-deep-700"
                >
                  <Package className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{t.build}</h3>
                  <p className="text-sm text-white/60">
                    {service[locale].title}
                  </p>
                </div>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-white/50">
                {t.includes}
              </p>
              <ul className="mt-3 flex-1 space-y-3">
                {c.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
                  >
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"
                      strokeWidth={3}
                    />
                    <span className="text-base font-bold leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <span
                aria-hidden
                className="mx-auto mt-6 h-1 w-24 rounded-full bg-white/30"
              />
            </div>
          </div>

          {/* Fichas de envío a las tiendas. */}
          <div className="flex flex-col gap-4 lg:gap-6">
            {t.stores.map(({ store, platform }) => (
              <div key={store} className={cn("rounded-3xl p-6 sm:p-8", panel)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted">
                      {platform}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-heading sm:text-3xl">
                      {store}
                    </h3>
                  </div>
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  >
                    <Send className="h-5 w-5" />
                  </span>
                </div>
                <ol className="mt-8 grid grid-cols-3 gap-2">
                  {t.track.map((step) => (
                    <li key={step}>
                      <span
                        aria-hidden
                        className="block h-1.5 rounded-full bg-deep-700 dark:bg-action"
                      />
                      <span className="mt-2 block text-xs font-semibold text-heading sm:text-sm">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
                {publishStep && (
                  <p className="mt-6 text-sm text-muted">
                    {publishStep.title} · {publishStep.meta}
                  </p>
                )}
              </div>
            ))}

            {(afterStep || tools.length > 0) && (
              <div className="flex flex-col gap-4 rounded-3xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                {afterStep && (
                  <p className="text-sm text-muted">
                    <span className="block font-semibold text-heading">
                      {t.after}
                    </span>
                    {afterStep.title} · {afterStep.meta}
                  </p>
                )}
                {tools.length > 0 && (
                  <ul aria-label={t.tools} className="flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <li
                        key={tool}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold text-heading",
                          panel,
                        )}
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
