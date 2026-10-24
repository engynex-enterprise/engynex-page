import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Consultoría — "El documento de hoja de ruta". Un documento encuadernado
 * (lomo, portada e índice con los entregables reales) junto a una cinta de
 * 12 meses tomada del horizonte de la hoja de ruta en `serviceSla`.
 */

const copy = {
  es: {
    eyebrow: "El documento de hoja de ruta",
    subtitle:
      "Te llevas un documento que la dirección puede leer en una sentada: dónde estás, qué hacer primero y cómo lo vamos a acompañar.",
    spine: "Hoja de ruta · Engynex",
    coverKicker: "Documento estratégico",
    coverTitle: "Hoja de ruta tecnológica",
    coverFor: "Preparado para tu empresa",
    toc: "Índice",
    horizon: "Horizonte",
    quarter: "T",
    month: "M",
    plan: "Incluye el plan",
  },
  en: {
    eyebrow: "The roadmap document",
    subtitle:
      "You walk away with a document leadership can read in one sitting: where you are, what to do first and how we'll support it.",
    spine: "Roadmap · Engynex",
    coverKicker: "Strategy document",
    coverTitle: "Technology roadmap",
    coverFor: "Prepared for your company",
    toc: "Contents",
    horizon: "Horizon",
    quarter: "Q",
    month: "M",
    plan: "Included in the plan",
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
  const sla = getSla(service.slug, locale);
  const horizon = sla[1];
  // "12 meses" / "12 months": la cinta solo se dibuja si el dato lo dice.
  const months = Number.parseInt(horizon?.value ?? "", 10) || 0;
  const roadmap = servicePlans[service.slug]?.find(
    (p) => p.key === "hoja-ruta",
  )?.[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Documento encuadernado: lomo + portada + índice. */}
          <div className="flex overflow-hidden rounded-3xl shadow-card ring-1 ring-line">
            <div className="relative w-10 shrink-0 bg-deep-900 sm:w-14 dark:bg-deep-950">
              <span
                aria-hidden
                className="absolute left-1/2 top-8 origin-center -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60 [writing-mode:vertical-rl]"
              >
                {t.spine}
              </span>
              {/* Costura del lomo. */}
              <span
                aria-hidden
                className="absolute inset-y-0 right-0 w-px bg-white/15"
              />
            </div>
            <div className="min-w-0 flex-1 bg-card">
              <div className="bg-deep-700 px-6 pb-8 pt-7 text-white sm:px-10 sm:pb-10 dark:bg-card-soft">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                  {t.coverKicker}
                </p>
                <p className="mt-8 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {t.coverTitle}
                </p>
                <p className="mt-3 text-sm text-white/60">{t.coverFor}</p>
              </div>
              <div className="px-6 py-7 sm:px-10">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t.toc}
                </h3>
                <ol className="mt-4">
                  {c.deliverables.map((item, i) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-4 border-b border-line py-4 last:border-0"
                    >
                      <span className="w-7 shrink-0 text-sm font-bold text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-semibold leading-snug text-heading">
                        {item}
                      </span>
                      <span
                        aria-hidden
                        className="mb-1 hidden flex-1 border-b border-dotted border-line-strong sm:block"
                      />
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Cinta de 12 meses agrupada por trimestres. */}
          <div className="flex flex-col gap-6">
            {months > 0 && horizon && (
              <div className={cn("rounded-3xl p-7", card)}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-muted">{horizon.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-heading">
                    {horizon.value}
                  </p>
                </div>
                <div aria-hidden className="mt-6 grid grid-cols-4 gap-2">
                  {Array.from({ length: Math.ceil(months / 3) }, (_, q) => (
                    <div key={q}>
                      <p className="text-xs font-semibold text-heading">
                        {t.quarter}
                        {q + 1}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        {Array.from({ length: 3 }, (_, m) => (
                          <span
                            key={m}
                            className={cn(
                              "h-10 rounded-md",
                              q === 0
                                ? "bg-deep-700 dark:bg-white/80"
                                : q === 1
                                  ? "bg-deep-500"
                                  : "bg-deep-200 dark:bg-white/15",
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted">
                        {t.month}
                        {q * 3 + 1}–{t.month}
                        {q * 3 + 3}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roadmap && (
              <div className="rounded-3xl bg-deep-700 p-7 text-white dark:bg-card-soft">
                <p className="text-sm text-white/60">
                  {t.plan}{" "}
                  <span className="font-semibold text-white">
                    {roadmap.name}
                  </span>
                </p>
                <ul className="mt-5 space-y-3">
                  {roadmap.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-white/85">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sla[2] && (
              <p className="text-sm text-muted">
                {sla[2].label}:{" "}
                <span className="font-semibold text-heading">
                  {sla[2].value}
                </span>
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
