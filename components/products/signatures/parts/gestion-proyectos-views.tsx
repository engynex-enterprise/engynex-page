"use client";

import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type View = { tab: string; title: string; text: string; features: string[] };

export type ProjectViewsMock = {
  columns: string[];
  tasks: string[];
  days: string[];
  approved: string;
  pending: string;
  budget: string;
  actual: string;
  milestone: string;
  portal: string;
  weeks: string[];
};

/**
 * Selector de vistas de Gestión de Proyectos (Kanban, Cronograma, Horas).
 * Patrón WAI-ARIA de pestañas: flechas, Inicio y Fin mueven el foco.
 */
export function ProjectViews({
  views,
  mock,
  label,
  tone,
}: {
  views: View[];
  mock: ProjectViewsMock;
  label: string;
  tone: "light" | "muted";
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const select = (index: number) => {
    const next = (index + views.length) % views.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: views.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key]);
    }
  };

  const current = views[active];

  return (
    <div className="mt-10 sm:mt-12">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "mx-auto flex w-fit max-w-full gap-1 rounded-full p-1.5",
          tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft",
        )}
      >
        {views.map((view, i) => {
          const selected = i === active;
          return (
            <button
              key={view.tab}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action sm:px-6",
                selected
                  ? "bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  : "text-heading hover:bg-card-soft",
              )}
            >
              {view.tab}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className="mt-8 grid gap-6 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-12"
      >
        <div
          aria-hidden
          className="min-h-[19rem] overflow-hidden rounded-3xl bg-deep-800 p-4 text-white ring-1 ring-white/10 sm:p-6"
        >
          {active === 0 && <KanbanMock mock={mock} />}
          {active === 1 && <TimelineMock mock={mock} />}
          {active === 2 && <HoursMock mock={mock} />}
        </div>
        <div className="px-1">
          <h3 className="text-2xl font-bold text-heading sm:text-3xl">{current.title}</h3>
          <p className="mt-3 text-lg leading-relaxed text-body">{current.text}</p>
          <ul className="mt-6 space-y-3">
            {current.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="font-medium text-heading">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Iniciales genéricas para los responsables. */
const owners = ["A", "B", "C", "D"];

function KanbanMock({ mock }: { mock: ProjectViewsMock }) {
  // Tareas por columna (índices de mock.tasks).
  const board = [[3, 4], [2], [1], [0]];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {mock.columns.map((column, col) => (
        <div key={column} className="rounded-2xl bg-white/[0.05] p-2.5">
          <p className="flex items-center justify-between px-1 text-xs font-semibold text-white/70">
            <span className="truncate">{column}</span>
            <span className="text-white/40">{board[col].length}</span>
          </p>
          <div className="mt-2.5 space-y-2">
            {board[col].map((task) => (
              <div
                key={task}
                className={cn(
                  "rounded-xl p-2.5",
                  col === 1 && task === 2 ? "bg-white/[0.12] ring-1 ring-brand-green/60" : "bg-white/[0.08]",
                )}
              >
                <p className="truncate text-xs font-semibold">{mock.tasks[task]}</p>
                <span className="mt-2 block h-1.5 w-4/5 rounded-full bg-white/15" />
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "h-1.5 w-8 rounded-full",
                      col === 3 ? "bg-brand-green" : "bg-white/20",
                    )}
                  />
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-deep-600 text-[0.6rem] font-bold">
                    {owners[task % owners.length]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineMock({ mock }: { mock: ProjectViewsMock }) {
  // [inicio, duración] en semanas sobre 6 semanas.
  const bars: [number, number][] = [
    [0, 1.5],
    [1, 2],
    [2.5, 2.5],
    [4.5, 1],
  ];
  return (
    <div>
      <div className="grid grid-cols-6 border-b border-white/10 pb-2 text-[0.7rem] font-semibold text-white/50">
        {mock.weeks.slice(0, 6).map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="relative mt-3 space-y-3">
        {bars.map(([start, span], i) => (
          <div key={i} className="relative h-9">
            <div
              className={cn(
                "absolute inset-y-0 flex items-center rounded-lg px-2.5 text-xs font-semibold",
                i < 2 ? "bg-brand-green text-deep-700" : "bg-white/15 text-white",
              )}
              style={{ left: `${(start / 6) * 100}%`, width: `${(span / 6) * 100}%` }}
            >
              <span className="truncate">{mock.tasks[i + 1]}</span>
            </div>
          </div>
        ))}
        {/* Hito con su rombo. */}
        <div className="relative h-9">
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] bg-white"
            style={{ left: `${(5.5 / 6) * 100}%` }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-white/80"
            style={{ right: `${(1 - 5.2 / 6) * 100}%` }}
          >
            {mock.milestone}
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/[0.06] p-3 text-xs font-semibold text-white/80">
        <span className="h-2 w-2 rounded-full bg-brand-green" />
        {mock.portal}
      </div>
    </div>
  );
}

function HoursMock({ mock }: { mock: ProjectViewsMock }) {
  // Intensidad ilustrativa de horas por día (0–3), sin cifras.
  const grid = [
    [3, 2, 3, 1, 2],
    [1, 3, 2, 3, 0],
    [0, 1, 1, 2, 3],
  ];
  const shade = ["bg-white/[0.05]", "bg-brand-green/30", "bg-brand-green/60", "bg-brand-green"];
  return (
    <div>
      <div className="grid grid-cols-[1fr_repeat(5,1.75rem)_auto] items-center gap-1.5 text-[0.7rem] font-semibold text-white/50 sm:grid-cols-[1fr_repeat(5,2.25rem)_5.5rem] sm:gap-2">
        <span />
        {mock.days.map((d) => (
          <span key={d} className="text-center">
            {d}
          </span>
        ))}
        <span />
      </div>
      <div className="mt-2 space-y-2">
        {grid.map((row, r) => (
          <div
            key={r}
            className="grid grid-cols-[1fr_repeat(5,1.75rem)_auto] items-center gap-1.5 sm:grid-cols-[1fr_repeat(5,2.25rem)_5.5rem] sm:gap-2"
          >
            <span className="truncate text-xs font-semibold">{mock.tasks[r + 1]}</span>
            {row.map((v, d) => (
              <span key={d} className={cn("h-7 rounded-md sm:h-8", shade[v])} />
            ))}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-center text-[0.65rem] font-semibold",
                r < 2 ? "bg-action text-deep-700" : "bg-white/10 text-white/80",
              )}
            >
              {r < 2 ? mock.approved : mock.pending}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 rounded-2xl bg-white/[0.06] p-4">
        {[
          { label: mock.budget, w: "100%", cls: "bg-white/25" },
          { label: mock.actual, w: "72%", cls: "bg-brand-green" },
        ].map((bar) => (
          <div key={bar.label}>
            <p className="text-xs font-semibold text-white/70">{bar.label}</p>
            <div className="mt-1.5 h-2.5 rounded-full bg-white/[0.06]">
              <span className={cn("block h-full rounded-full", bar.cls)} style={{ width: bar.w }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
