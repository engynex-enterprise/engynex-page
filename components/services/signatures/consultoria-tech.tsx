import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Consultoría: la metáfora es el documento estratégico. Cabecera editorial
 * (titular grande, filete fino, cinta de la hoja de ruta) y, como sección
 * insignia, una matriz de madurez "hoy vs. objetivo".
 */

const copy = {
  es: {
    ribbon: "Así se ve el acompañamiento",
    photoAlt: "Equipo de Engynex en una sesión de trabajo con un cliente",
    eyebrow: "Diagnóstico y rumbo",
    title: "Dónde estás y a dónde vas",
    subtitle:
      "Ordenamos la conversación en dos ejes: el negocio y la tecnología, hoy y en el objetivo. Cada cuadrante termina en un entregable concreto.",
    today: "Hoy",
    target: "Objetivo",
    business: "Negocio",
    technology: "Tecnología",
    path: "Tres formas de avanzar",
  },
  en: {
    ribbon: "What the engagement looks like",
    photoAlt: "Engynex team in a working session with a client",
    eyebrow: "Assessment and direction",
    title: "Where you are and where you're going",
    subtitle:
      "We frame the conversation on two axes: business and technology, today and at the target. Every quadrant ends in a concrete deliverable.",
    today: "Today",
    target: "Target",
    business: "Business",
    technology: "Technology",
    path: "Three ways to move forward",
  },
};

function Hero({ service, locale, backLabel, backHref, primary, secondary }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];
  // Diagnóstico → horizonte de la hoja de ruta → comité de seguimiento.
  const ribbon = getSla(service.slug, locale).slice(0, 3);

  return (
    <section className="bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <p className="mt-10 text-sm font-medium text-muted">{c.tagline}</p>
        <h1 className="mt-3 max-w-6xl text-balance text-[clamp(2.5rem,6.4vw,5.5rem)] font-bold leading-[1] tracking-[-0.035em] text-heading">
          {c.title}
        </h1>
        <hr className="mt-10 border-t border-heading/80" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div className="flex flex-col">
            <p className="max-w-2xl text-xl leading-relaxed text-body">{c.intro}</p>

            {ribbon.length > 0 && (
              <div className="mt-10">
                <p className="text-sm font-semibold text-heading">{t.ribbon}</p>
                <ol className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-0">
                  {ribbon.map((row, i) => (
                    <li
                      key={row.label}
                      className={cn(
                        "relative flex items-center gap-4 rounded-2xl bg-surface-soft p-4 sm:block sm:rounded-none sm:p-5",
                        i === 0 && "sm:rounded-l-2xl",
                        i === ribbon.length - 1 && "sm:rounded-r-2xl sm:bg-deep-700 sm:text-white sm:dark:bg-card-soft",
                        i === 1 && "sm:border-x sm:border-line",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                          i === ribbon.length - 1 ? "bg-action text-deep-700" : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                        )}
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div className="sm:mt-6">
                        <p
                          className={cn(
                            "text-sm text-muted",
                            i === ribbon.length - 1 && "sm:text-white/75",
                          )}
                        >
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-lg font-bold tracking-tight">{row.value}</p>
                      </div>
                      {i < ribbon.length - 1 && (
                        <ArrowRight
                          className="absolute right-3 top-5 hidden h-4 w-4 text-muted sm:block"
                          aria-hidden
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <HeroActions primary={primary} secondary={secondary} className="mt-10" />
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-soft lg:aspect-auto lg:min-h-[34rem]">
            <Image
              src="/images/about-meeting.jpg"
              alt={t.photoAlt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];
  const plans = servicePlans[service.slug] ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Cuadrantes con entregables y funciones reales del servicio.
  const quadrants = [
    { row: t.business, col: t.today, label: c.deliverables[0], detail: plans[0]?.[locale].features[0] },
    { row: t.business, col: t.target, label: c.deliverables[1], detail: plans[1]?.[locale].features[1], strong: true },
    { row: t.technology, col: t.today, label: plans[0]?.[locale].features[1], detail: plans[0]?.[locale].features[2] },
    { row: t.technology, col: t.target, label: c.deliverables[2], detail: plans[1]?.[locale].features[0], strong: true },
  ].filter((q) => q.label);

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
            <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
              {t.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
          </div>

          {/* Matriz 2×2: filas negocio/tecnología, columnas hoy/objetivo. */}
          <div>
            <div className="hidden grid-cols-[6rem_1fr_1fr] gap-3 sm:grid">
              <span />
              <p className="text-sm font-semibold text-muted">{t.today}</p>
              <p className="flex items-center gap-2 text-sm font-semibold text-heading">
                <ArrowRight className="h-4 w-4 text-accent" aria-hidden />
                {t.target}
              </p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[6rem_1fr_1fr]">
              {[t.business, t.technology].map((row) => (
                <div key={row} className="contents">
                  <p className="hidden self-center text-sm font-semibold text-heading sm:block">{row}</p>
                  {quadrants
                    .filter((q) => q.row === row)
                    .map((q) => (
                      <div
                        key={q.label}
                        className={cn(
                          "flex min-h-44 flex-col justify-between rounded-3xl p-6",
                          q.strong ? "bg-deep-700 text-white dark:bg-card-soft" : card,
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wider",
                            q.strong ? "text-brand-green" : "text-muted",
                          )}
                        >
                          {q.col} · {q.row}
                        </p>
                        <div className="mt-6">
                          <p className={cn("text-lg font-bold leading-snug", !q.strong && "text-heading")}>
                            {q.label}
                          </p>
                          {q.detail && (
                            <p className={cn("mt-1.5 text-sm", q.strong ? "text-white/70" : "text-muted")}>
                              {q.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {plans.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold text-heading">{t.path}</h3>
            <ol className="mt-5 grid gap-px overflow-hidden rounded-3xl bg-line md:grid-cols-3">
              {plans.map((plan, i) => (
                <li key={plan.key} className={cn("p-6", card)}>
                  <span className="text-sm font-bold text-accent" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 font-semibold leading-snug text-heading">{plan[locale].name}</p>
                  <p className="mt-1 text-sm text-muted">{plan[locale].description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
