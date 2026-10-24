import { CalendarRange, Link2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import {
  HeroActions,
  HeroBreadcrumb,
  toneClass,
} from "@/components/services/signatures/shared";
import { ProjectViews } from "./parts/gestion-proyectos-views";
import type {
  ProductHeroProps,
  ProductSignature,
  ProductSignatureProps,
  Tone,
} from "./types";

/**
 * Gestión de Proyectos: la metáfora es el cronograma. La cabecera es una
 * banda marino a todo lo ancho con un diagrama de Gantt (barras, hitos y
 * dependencias por semana); la sección insignia permite cambiar entre las
 * vistas Kanban, Cronograma y Horas.
 */

const copy = {
  es: {
    project: "Proyecto · Implementación",
    week: "S",
    today: "Hoy",
    tasks: ["Levantamiento", "Diseño", "Desarrollo", "Pruebas", "Capacitación", "Entrega"],
    eyebrow: "Una sola herramienta, tres vistas",
    title: "Planea, ejecuta y mide en el mismo lugar",
    subtitle:
      "El equipo trabaja en el tablero, la dirección mira el cronograma y finanzas revisa las horas. Todos sobre los mismos datos.",
    tabsLabel: "Vistas del proyecto",
    views: [
      {
        tab: "Kanban",
        title: "Tablero del equipo",
        text: "Cada tarea con su responsable y su estado. Ves de un vistazo qué está en curso y quién tiene demasiado.",
      },
      {
        tab: "Cronograma",
        title: "Cronograma con hitos",
        text: "Las fechas, las dependencias y los hitos del proyecto, y lo que tu cliente puede consultar sin pedir informes.",
      },
      {
        tab: "Horas",
        title: "Horas y costos reales",
        text: "Las horas registradas por tarea se aprueban y se cruzan con el presupuesto para saber si el proyecto deja plata.",
      },
    ],
    columns: ["Por hacer", "En curso", "En revisión", "Hecho"],
    days: ["Lu", "Ma", "Mi", "Ju", "Vi"],
    approved: "Aprobado",
    pending: "Pendiente",
    budget: "Presupuesto",
    actual: "Real",
    milestone: "Hito",
    portal: "Portal de cliente",
  },
  en: {
    project: "Project · Rollout",
    week: "W",
    today: "Today",
    tasks: ["Discovery", "Design", "Build", "Testing", "Training", "Delivery"],
    eyebrow: "One tool, three views",
    title: "Plan, execute and measure in one place",
    subtitle:
      "The team works on the board, management watches the timeline and finance reviews the hours. Everyone on the same data.",
    tabsLabel: "Project views",
    views: [
      {
        tab: "Kanban",
        title: "Team board",
        text: "Every task with its owner and status. You see at a glance what's in progress and who has too much.",
      },
      {
        tab: "Timeline",
        title: "Timeline with milestones",
        text: "Dates, dependencies and milestones, plus what your client can check without asking for reports.",
      },
      {
        tab: "Time",
        title: "Real hours and costs",
        text: "Hours logged per task get approved and compared against budget, so you know whether the project makes money.",
      },
    ],
    columns: ["To do", "In progress", "In review", "Done"],
    days: ["Mo", "Tu", "We", "Th", "Fr"],
    approved: "Approved",
    pending: "Pending",
    budget: "Budget",
    actual: "Actual",
    milestone: "Milestone",
    portal: "Client portal",
  },
};

const WEEKS = 8;
const ROW = 44;
/** [inicio, duración] en semanas; duración 0 = solo hito. */
const plan: [number, number][] = [
  [0, 2],
  [1.5, 2],
  [3.5, 2.5],
  [6, 1.25],
  [6.25, 1.25],
  [7.5, 0],
];
/** Avance ilustrativo de cada barra (0–1). */
const done = [1, 1, 0.35, 0, 0, 0];
/** Dependencias fin→inicio entre filas. */
const links: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 5],
];
/** Hitos: fin de Diseño y Entrega. */
const milestones: [number, number][] = [
  [1, 3.5],
  [5, 7.5],
];
const TODAY = 4.4;
const owners = ["A", "B", "C", "B", "D", "A"];

const pct = (weeks: number) => `${(weeks / WEEKS) * 100}%`;

function Gantt({ t }: { t: (typeof copy)["es"] }) {
  const height = plan.length * ROW;
  return (
    <div className="rounded-3xl bg-white/[0.04] p-3 ring-1 ring-white/10 sm:p-6">
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
          <CalendarRange className="h-4 w-4 shrink-0 text-brand-green" />
          <span className="truncate">{t.project}</span>
        </span>
        <span className="flex shrink-0 -space-x-2">
          {["A", "B", "C", "D"].map((o) => (
            <span
              key={o}
              className="grid h-7 w-7 place-items-center rounded-full bg-deep-600 text-[0.65rem] font-bold text-white ring-2 ring-deep-900"
            >
              {o}
            </span>
          ))}
        </span>
      </div>

      <div className="flex">
        {/* Columna de tareas. */}
        <div className="w-24 shrink-0 sm:w-44">
          <div className="h-8" />
          {t.tasks.map((task, i) => (
            <div
              key={task}
              className="flex items-center gap-2 border-t border-white/[0.07] pr-2"
              style={{ height: ROW }}
            >
              <span className="hidden h-6 w-6 shrink-0 place-items-center rounded-full bg-deep-600 text-[0.6rem] font-bold text-white sm:grid">
                {owners[i]}
              </span>
              <span className="truncate text-xs font-semibold text-white/85 sm:text-sm">{task}</span>
            </div>
          ))}
        </div>

        {/* Línea de tiempo. */}
        <div className="relative min-w-0 flex-1">
          <div className="grid h-8 text-[0.65rem] font-semibold text-white/45 sm:text-xs" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: WEEKS }, (_, w) => (
              <span key={w} className="border-l border-white/[0.07] pl-1.5">
                {t.week}
                {w + 1}
              </span>
            ))}
          </div>
          <div className="relative" style={{ height }}>
            {/* Cuadrícula semanal. */}
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
              {Array.from({ length: WEEKS }, (_, w) => (
                <span key={w} className="border-l border-white/[0.07]" />
              ))}
            </div>
            {plan.map((_, i) => (
              <span
                key={i}
                className="absolute inset-x-0 border-t border-white/[0.07]"
                style={{ top: i * ROW }}
              />
            ))}

            {/* Dependencias. */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${WEEKS * 100} ${height}`}
              preserveAspectRatio="none"
            >
              {links.map(([a, b]) => {
                const x1 = (plan[a][0] + plan[a][1]) * 100;
                const y1 = a * ROW + ROW / 2;
                const x2 = plan[b][0] * 100;
                const y2 = b * ROW + ROW / 2;
                const mid = Math.max(x1 + 10, x2 - 10);
                return (
                  <path
                    key={`${a}-${b}`}
                    d={`M${x1} ${y1} H${mid} V${y2} H${x2}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {/* Barras. */}
            {plan.map(([start, span], i) =>
              span > 0 ? (
                <div
                  key={i}
                  className={cn(
                    "absolute h-6 overflow-hidden rounded-md sm:h-7",
                    done[i] === 1 ? "bg-brand-green" : "bg-white/15 ring-1 ring-white/20",
                  )}
                  style={{ left: pct(start), width: pct(span), top: i * ROW + (ROW - 26) / 2 }}
                >
                  {done[i] > 0 && done[i] < 1 && (
                    <span
                      className="absolute inset-y-0 left-0 bg-brand-green"
                      style={{ width: `${done[i] * 100}%` }}
                    />
                  )}
                </div>
              ) : null,
            )}

            {/* Hitos. */}
            {milestones.map(([row, at]) => (
              <span
                key={row}
                className="absolute h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-white ring-2 ring-deep-900 sm:h-4 sm:w-4"
                style={{ left: pct(at), top: row * ROW + ROW / 2 - 8 }}
              />
            ))}

            {/* Hoy. */}
            <div className="absolute -top-8 bottom-0 w-px bg-brand-green" style={{ left: pct(TODAY) }}>
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-action px-2 py-0.5 text-[0.6rem] font-bold text-deep-700">
                {t.today}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <section className="bg-deep-900 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} dark />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <div>
            {categoryLabel && (
              <p className="text-sm font-semibold text-brand-green">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-white/85 sm:text-2xl">{c.tagline}</p>
          </div>
          <div>
            <p className="max-w-xl text-lg leading-relaxed text-white/75">{c.description}</p>
            <HeroActions primary={primary} secondary={secondary} dark className="mt-7" />
          </div>
        </div>

        <div aria-hidden className="mt-12 sm:mt-16">
          <Gantt t={t} />
          <div className="mt-4 flex flex-wrap gap-2">
            {[c.features[0], c.features[1]].map((f, i) => (
              <span
                key={f}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/85"
              >
                {i === 0 ? (
                  <CalendarRange className="h-4 w-4 text-brand-green" />
                ) : (
                  <Link2 className="h-4 w-4 text-brand-green" />
                )}
                {f}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  // Funciones reales asociadas a cada vista.
  const viewFeatures = [
    [c.modules[0], c.features[1], c.modules[4]],
    [c.modules[1], c.modules[5]],
    [c.modules[2], c.features[2], c.modules[3], c.features[3]],
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
        <ProjectViews
          label={t.tabsLabel}
          tone={tone}
          views={t.views.map((v, i) => ({ ...v, features: viewFeatures[i] }))}
          mock={{
            columns: t.columns,
            tasks: t.tasks,
            days: t.days,
            approved: t.approved,
            pending: t.pending,
            budget: t.budget,
            actual: t.actual,
            milestone: t.milestone,
            portal: t.portal,
            weeks: Array.from({ length: 6 }, (_, w) => `${t.week}${w + 1}`),
          }}
        />
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
