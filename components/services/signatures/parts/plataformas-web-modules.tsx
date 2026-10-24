"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Module = { title: string; text: string };

/**
 * Pestañas de módulos de Plataformas Web. Sigue el patrón WAI-ARIA de
 * pestañas: flechas, Inicio y Fin mueven el foco y activan la pestaña.
 */
export function PlatformModules({
  modules,
  label,
  integrations,
  layers,
  tone,
  className,
}: {
  modules: Module[];
  label: string;
  integrations: { hub: string; nodes: string[] };
  layers: { name: string; tech: string[] }[];
  tone: "light" | "muted";
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const select = (index: number) => {
    const next = (index + modules.length) % modules.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: modules.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key]);
    }
  };

  const current = modules[active];

  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="flex flex-col gap-2"
      >
        {modules.map((module, i) => {
          const selected = i === active;
          return (
            <button
              key={module.title}
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
                "flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors",
                selected
                  ? "bg-deep-700 text-white dark:bg-card-soft"
                  : cn(
                      "text-heading hover:bg-card-soft",
                      tone === "muted" ? "bg-card" : "bg-surface-soft",
                    ),
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  selected
                    ? "bg-action text-deep-700"
                    : "bg-line text-heading dark:bg-white/10",
                )}
              >
                {i + 1}
              </span>
              <span className="text-base font-bold leading-snug">{module.title}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className="rounded-3xl bg-deep-900 p-5 text-white focus-visible:outline-offset-4 sm:p-8"
      >
        <h3 className="text-xl font-bold text-white sm:text-2xl">{current.title}</h3>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">
          {current.text}
        </p>
        <div
          aria-hidden
          key={active}
          className="mt-8 min-h-[16rem] rounded-2xl bg-deep-800 p-4 ring-1 ring-white/10 motion-safe:animate-slide-up sm:p-6"
        >
          {active === 0 && <AppMock />}
          {active === 1 && <DashboardMock />}
          {active === 2 && <IntegrationsMock {...integrations} />}
          {active === 3 && <CloudMock layers={layers} />}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Maquetas ilustrativas de cada módulo                                       */
/* -------------------------------------------------------------------------- */

/** Aplicación a la medida: tablero de flujo con columnas y tarjetas. */
function AppMock() {
  const columns = [3, 2, 2];
  return (
    <div className="grid grid-cols-3 gap-3">
      {columns.map((count, col) => (
        <div key={col} className="space-y-2.5 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                col === 2 ? "bg-brand-green" : "bg-white/40",
              )}
            />
            <span className="h-2 w-1/2 rounded-full bg-white/50" />
          </div>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="space-y-2 rounded-lg bg-deep-700 p-3 ring-1 ring-white/5">
              <span className="block h-2 w-4/5 rounded-full bg-white/70" />
              <span className="block h-1.5 w-3/5 rounded-full bg-white/30" />
              <span className="flex items-center justify-between pt-1">
                <span className="h-4 w-4 rounded-full bg-deep-400" />
                <span
                  className={cn(
                    "h-3 w-8 rounded-full",
                    col === 2 ? "bg-brand-green/40" : "bg-white/15",
                  )}
                />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dashboard: barras y una línea, sin cifras. */
function DashboardMock() {
  const bars = [40, 62, 48, 75, 58, 86, 70, 92];
  return (
    <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
      <div className="rounded-xl bg-white/5 p-4">
        <span className="block h-2 w-1/3 rounded-full bg-white/50" />
        <div className="mt-4 flex h-36 items-end gap-2">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={cn(
                "flex-1 rounded-t-md",
                i === bars.length - 1 ? "bg-brand-green" : "bg-white/25",
              )}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
          <svg viewBox="0 0 36 36" className="h-16 w-16 shrink-0 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#9fdb4f"
              strokeWidth="5"
              strokeDasharray="60 100"
              pathLength={100}
            />
          </svg>
          <span className="flex-1 space-y-2">
            <span className="block h-2 w-3/4 rounded-full bg-white/50" />
            <span className="block h-2 w-1/2 rounded-full bg-white/25" />
          </span>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <svg viewBox="0 0 120 40" className="h-14 w-full" preserveAspectRatio="none">
            <polyline
              points="0,34 15,30 30,32 45,22 60,24 75,14 90,18 105,8 120,10"
              fill="none"
              stroke="#9fdb4f"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Integraciones: la plataforma al centro conectada con ERP, CRM y pagos. */
function IntegrationsMock({ hub, nodes }: { hub: string; nodes: string[] }) {
  return (
    <div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 py-4">
      <div className="flex w-full justify-between gap-3">
        {nodes.map((node) => (
          <span
            key={node}
            className="flex-1 rounded-xl bg-white/5 px-3 py-3 text-center text-sm font-semibold text-white ring-1 ring-white/10"
          >
            {node}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 300 60" className="h-14 w-full" preserveAspectRatio="none">
        {[50, 150, 250].map((x) => (
          <path
            key={x}
            d={`M${x},0 C${x},30 150,30 150,60`}
            fill="none"
            stroke="rgba(159,219,79,0.7)"
            strokeWidth="2"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <span className="rounded-2xl bg-action px-6 py-4 text-base font-bold text-deep-700">
        {hub}
      </span>
    </div>
  );
}

/** Nube: capas de la arquitectura con las tecnologías reales del stack. */
function CloudMock({ layers }: { layers: { name: string; tech: string[] }[] }) {
  return (
    <div className="space-y-2.5">
      {layers.map((layer, i) => (
        <div
          key={layer.name}
          className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
          style={{ marginInline: `${(layers.length - 1 - i) * 3}%` }}
        >
          <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-white/50">
            {layer.name}
          </span>
          {layer.tech.map((tech) => (
            <span
              key={tech}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                i === layers.length - 1
                  ? "bg-action text-deep-700"
                  : "bg-white/10 text-white",
              )}
            >
              {tech}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
