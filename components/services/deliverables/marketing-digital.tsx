import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { serviceGallery } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Marketing digital — "Cada mes en tu bandeja": la portada de un informe
 * mensual (ilustrativa) junto a su índice, donde cada capítulo es un
 * entregable real del servicio.
 */
const copy = {
  es: {
    lead: "Cada mes en tu bandeja",
    subtitle:
      "El servicio no termina en una entrega: cada ciclo recibes el trabajo hecho y un informe claro de lo que pasó y lo que viene.",
    cover: "Informe mensual",
    coverBrand: "Tu marca",
    toc: "Contenido",
    chapter: "Capítulo",
    fronts: "Frentes del servicio",
    cycle: "Cierre de cada ciclo",
  },
  en: {
    lead: "Every month in your inbox",
    subtitle:
      "The service doesn't end with one delivery: every cycle you get the work done and a clear report on what happened and what comes next.",
    cover: "Monthly report",
    coverBrand: "Your brand",
    toc: "Contents",
    chapter: "Chapter",
    fronts: "Service areas",
    cycle: "End of every cycle",
  },
};

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const image = serviceGallery[service.slug]?.[0] ?? service.image;
  const lastStep = getServiceProcess(service.slug)?.[locale].steps.at(-1);
  const sheet =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 sm:mt-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          {/* Portada del informe (ilustrativa). */}
          <div
            aria-hidden
            className="relative mx-auto w-full max-w-[20rem] sm:max-w-md"
          >
            <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-deep-200 dark:bg-deep-800" />
            <div className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-3xl bg-deep-700 text-white shadow-card-hover">
              <div className="relative h-[55%]">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 35vw, 90vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-700 to-deep-700/10" />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <span className="h-1.5 w-12 rounded-full bg-action" />
                <p className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                  {t.cover}
                </p>
                <p className="mt-2 text-sm text-white/60">{t.coverBrand}</p>
                <div className="mt-auto flex items-end gap-1.5">
                  {[40, 55, 48, 70, 62, 85].map((h, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-full rounded-t-md",
                        i === 5 ? "bg-action" : "bg-white/20",
                      )}
                      style={{ height: `${h * 0.6}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Índice: cada capítulo es un entregable. */}
          <div className={cn("flex flex-col rounded-3xl p-6 sm:p-10", sheet)}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              {t.toc}
            </h3>
            <ol className="mt-6 flex-1">
              {c.deliverables.map((item, i) => {
                const n = String(i + 1).padStart(2, "0");
                return (
                  <li
                    key={item}
                    className="border-b border-line py-5 first:pt-0"
                  >
                    <p className="text-xs font-semibold text-muted">
                      {t.chapter} {n}
                    </p>
                    <p className="mt-1 flex items-baseline gap-3">
                      <span className="text-lg font-bold leading-snug text-heading sm:text-xl">
                        {item}
                      </span>
                      <span
                        aria-hidden
                        className="hidden min-w-8 flex-1 translate-y-[-0.2em] border-b-2 border-dotted border-line-strong sm:block"
                      />
                      <span
                        aria-hidden
                        className="ml-auto font-mono text-lg font-bold text-accent sm:ml-0"
                      >
                        {n}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8">
              <p className="text-xs font-semibold text-muted">{t.fronts}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {lastStep && (
              <p className="mt-6 text-sm text-muted">
                <span className="font-semibold text-heading">{t.cycle}:</span>{" "}
                {lastStep.title} · {lastStep.meta}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
