import {
  ArrowDown,
  ArrowRight,
  Database,
  LayoutDashboard,
  Network,
  Target,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getUseCases } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Data & Analytics — cabecera clara y centrada con un tablero de analítica
 * dibujado en SVG (sin cifras inventadas). La sección insignia recorre el
 * camino de los datos a la decisión y aterriza en los casos de uso reales.
 */

const SLUG = "data-analytics";

const copy = {
  es: {
    board: "Tablero",
    filters: ["Mes", "Área", "Canal"],
    trend: "Tendencia",
    forecast: "Proyección",
    showcase: {
      eyebrow: "Cómo fluye la información",
      title: "De los datos a la decisión",
      subtitle:
        "Cuatro tramos, una sola fuente de verdad: conectamos lo que ya tienes, lo ordenamos y lo llevamos a la reunión donde se decide.",
      stages: [
        {
          title: "Fuentes",
          description:
            "Conectamos lo que ya usas, sin cambiar de sistemas.",
          chips: ["Bases de datos", "Hojas de cálculo", "ERP", "CRM", "APIs"],
        },
        {
          title: "Modelo",
          description:
            "Integración, limpieza y un modelo validado, con una sola definición de cada indicador.",
          chips: ["Diccionario de KPI", "Datos unificados"],
        },
        {
          title: "Tablero",
          description:
            "Tableros por área con permisos por rol y actualización automática programada.",
          chips: ["Power BI", "Looker Studio", "Metabase"],
        },
        {
          title: "Decisión",
          description:
            "El tablero entra a la reunión semanal de cada área, no una vez al año.",
          chips: ["Equipo capacitado"],
        },
      ],
      cases: "Qué decides con ellos",
    },
  },
  en: {
    board: "Dashboard",
    filters: ["Month", "Area", "Channel"],
    trend: "Trend",
    forecast: "Forecast",
    showcase: {
      eyebrow: "How information flows",
      title: "From data to decision",
      subtitle:
        "Four legs, one source of truth: we connect what you already have, put it in order and bring it to the meeting where decisions are made.",
      stages: [
        {
          title: "Sources",
          description: "We connect what you already use, no system changes.",
          chips: ["Databases", "Spreadsheets", "ERP", "CRM", "APIs"],
        },
        {
          title: "Model",
          description:
            "Integration, cleanup and a validated model, with one definition per indicator.",
          chips: ["KPI dictionary", "Unified data"],
        },
        {
          title: "Dashboard",
          description:
            "Dashboards per area with role-based permissions and scheduled automatic refresh.",
          chips: ["Power BI", "Looker Studio", "Metabase"],
        },
        {
          title: "Decision",
          description:
            "The dashboard goes into each area's weekly meeting, not once a year.",
          chips: ["Team trained"],
        },
      ],
      cases: "What you decide with them",
    },
  },
};

/* Formas ilustrativas: no representan datos reales. */
const linePoints = [62, 58, 64, 52, 55, 44, 47, 38, 41, 32];
const forecastPoints = [32, 28, 25, 22];
const bars = [46, 70, 38, 82, 58, 64];
const sparks = [
  "M0 18 L10 14 L20 16 L30 9 L40 11 L50 5 L60 7",
  "M0 12 L10 15 L20 10 L30 12 L40 7 L50 9 L60 4",
  "M0 16 L10 10 L20 13 L30 8 L40 10 L50 6 L60 8",
  "M0 14 L10 16 L20 11 L30 13 L40 8 L50 10 L60 6",
];

function toPath(points: number[], step: number, offset = 0) {
  return points
    .map((y, i) => `${i === 0 ? "M" : "L"}${(i + offset) * step} ${y}`)
    .join(" ");
}

function Dashboard({
  locale,
  features,
  charts,
}: {
  locale: "es" | "en";
  features: string[];
  charts: string[];
}) {
  const t = copy[locale];
  const step = 400 / (linePoints.length + forecastPoints.length - 2);
  const line = toPath(linePoints, step);
  const area = `${line} L${(linePoints.length - 1) * step} 80 L0 80 Z`;
  const forecast = toPath(
    [linePoints[linePoints.length - 1], ...forecastPoints],
    step,
    linePoints.length - 1,
  );

  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl border border-line bg-card text-left shadow-card-hover"
    >
      <div className="flex items-center gap-4 border-b border-line px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-deep-200 dark:bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-deep-200 dark:bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-deep-200 dark:bg-white/20" />
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-heading">
          <LayoutDashboard className="h-4 w-4 text-accent" />
          {t.board}
        </span>
        <span className="ml-auto hidden gap-2 sm:flex">
          {t.filters.map((f, i) => (
            <span
              key={f}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                i === 0
                  ? "bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  : "bg-card-soft text-muted",
              )}
            >
              {f}
            </span>
          ))}
        </span>
      </div>

      <div className="grid gap-3 p-3 sm:gap-4 sm:p-5">
        {/* KPI: nombres reales, sin valores */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={f} className="rounded-2xl bg-card-soft p-4">
              <p className="line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-tight text-muted">
                {f}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <span className="text-3xl font-bold leading-none text-heading">
                  —
                </span>
                <svg
                  viewBox="0 0 60 22"
                  className="h-6 w-16 text-accent"
                  fill="none"
                >
                  <path
                    d={sparks[i % sparks.length]}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          {/* Línea con proyección punteada (análisis predictivo) */}
          <div className="rounded-2xl bg-card-soft p-4 sm:p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-heading">{charts[0]}</p>
              <span className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded bg-heading" />
                  {t.trend}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-accent" />
                  {t.forecast}
                </span>
              </span>
            </div>
            <svg
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
              className="mt-4 h-36 w-full text-heading sm:h-44"
            >
              {[20, 40, 60].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="400"
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path d={area} fill="var(--accent-soft)" />
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={forecast}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Barras */}
          <div className="rounded-2xl bg-card-soft p-4 sm:p-5">
            <p className="text-sm font-bold text-heading">{charts[1]}</p>
            <div className="mt-4 flex h-36 items-end gap-2 sm:h-44">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-t-lg",
                    i === 3 ? "bg-action" : "bg-deep-700 dark:bg-deep-400",
                  )}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {bars.map((_, i) => (
                <span key={i} className="h-1.5 flex-1 rounded-full bg-line" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  const cases = getUseCases(SLUG, locale);

  return (
    <section className="bg-surface pb-16 pt-28 text-body sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />
        <div className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm font-semibold text-accent">{c.tagline}</p>
          <h1 className="mt-4 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body sm:text-xl">
            {c.intro}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            className="mt-8 justify-center"
          />
        </div>

        <div className="mx-auto mt-14 max-w-6xl sm:mt-16">
          <Dashboard
            locale={locale}
            features={c.features}
            charts={[
              cases[0]?.title ?? c.deliverables[1],
              cases[1]?.title ?? c.deliverables[2],
            ]}
          />
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sección insignia: de los datos a la decisión                               */
/* -------------------------------------------------------------------------- */

const stageIcons = [Database, Network, LayoutDashboard, Target];

function Showcase({ locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale].showcase;
  const cases = getUseCases(SLUG, locale);
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const chip = tone === "muted" ? "bg-surface-soft" : "bg-card";

  return (
    <section className={cn("py-16 text-body sm:py-24", toneClass(tone))}>
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

        <ol className="mt-12 grid gap-3 sm:mt-16 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-8">
          {t.stages.map((stage, i) => {
            const Icon = stageIcons[i];
            const last = i === t.stages.length - 1;
            return (
              <li key={stage.title} className="relative flex flex-col">
                <div
                  className={cn(
                    "flex flex-1 flex-col rounded-3xl p-6",
                    last ? "bg-deep-700 text-white dark:bg-card-soft" : card,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-full",
                        last ? "bg-action text-deep-700" : "bg-accent-soft text-accent",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        last ? "text-white/60" : "text-muted",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "mt-5 text-2xl font-bold",
                      last ? "text-white" : "text-heading",
                    )}
                  >
                    {stage.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      last ? "text-white/80" : "text-muted",
                    )}
                  >
                    {stage.description}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {stage.chips.map((ch) => (
                      <li
                        key={ch}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          last ? "bg-white/10 text-white" : cn(chip, "text-heading"),
                        )}
                      >
                        {ch}
                      </li>
                    ))}
                  </ul>
                </div>

                {!last && (
                  <>
                    <span
                      aria-hidden
                      className="mx-auto grid h-8 place-items-center text-muted lg:hidden"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute -right-8 top-1/2 hidden w-8 -translate-y-1/2 place-items-center text-muted lg:grid"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        {cases.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h3 className="text-xl font-bold text-heading sm:text-2xl">
              {t.cases}
            </h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {cases.map((uc) => (
                <li
                  key={uc.title}
                  className={cn("flex flex-col rounded-3xl p-6", card)}
                >
                  <p className="flex-1 text-lg font-bold leading-snug text-heading">
                    {uc.title}
                  </p>
                  <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-sm font-semibold text-heading">
                    <Target
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      aria-hidden
                    />
                    {uc.result}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = {
  Hero,
  Showcase,
  // Los casos de uso ya están en la sección insignia.
  replaces: ["extra"],
};
