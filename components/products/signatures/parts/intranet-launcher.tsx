"use client";

import { useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  Megaphone,
  MessageSquareHeart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LauncherModule {
  /** Nombre real del módulo (content/products.ts). */
  name: string;
  kind: "feed" | "library" | "people" | "requests" | "calendar" | "survey";
  /** Beneficio real relacionado con el módulo. */
  note: string;
}

const icons: Record<LauncherModule["kind"], LucideIcon> = {
  feed: Megaphone,
  library: FolderOpen,
  people: UsersRound,
  requests: ClipboardCheck,
  calendar: CalendarDays,
  survey: MessageSquareHeart,
};

/** Nombre corto para la etiqueta bajo el icono: lo que va antes de " y " o ",". */
const shortName = (name: string) => name.split(/,| y | and | with | con /)[0].trim();

/**
 * Lanzador de módulos: una cuadrícula de iconos al estilo de la pantalla de
 * inicio de un teléfono. Cada icono es un botón (aria-pressed) y la vista
 * previa del módulo elegido se anuncia con aria-live.
 */
export function IntranetLauncher({
  modules,
  groupLabel,
  previewLabel,
}: {
  modules: LauncherModule[];
  groupLabel: string;
  previewLabel: string;
}) {
  const [active, setActive] = useState(0);
  const current = modules[active];
  const Icon = icons[current.kind];

  return (
    <div className="mx-auto grid max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
      {/* Pantalla de inicio */}
      <div className="rounded-[2.5rem] bg-deep-900 p-3 ring-1 ring-white/10 sm:p-4">
        <div className="flex h-full flex-col rounded-[2rem] bg-deep-800 px-4 pb-6 pt-4 sm:px-6">
          <div aria-hidden className="flex items-center justify-between px-1 text-[0.7rem] font-semibold text-white/60">
            <span>9:41</span>
            <span className="h-1.5 w-16 rounded-full bg-white/15" />
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </span>
          </div>
          <div role="group" aria-label={groupLabel} className="mt-8 grid grid-cols-3 gap-x-3 gap-y-6">
            {modules.map((m, i) => {
              const ModIcon = icons[m.kind];
              const on = i === active;
              return (
                <button
                  key={m.name}
                  type="button"
                  aria-pressed={on}
                  aria-label={m.name}
                  onClick={() => setActive(i)}
                  className="group flex flex-col items-center gap-2 rounded-2xl p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                >
                  <span
                    className={cn(
                      "grid h-16 w-16 place-items-center rounded-[1.25rem] transition-[background-color,transform] duration-200 motion-safe:group-hover:-translate-y-0.5 sm:h-[4.5rem] sm:w-[4.5rem]",
                      on ? "bg-action text-deep-700" : "bg-white/10 text-white group-hover:bg-white/15",
                    )}
                  >
                    <ModIcon className="h-7 w-7" aria-hidden />
                  </span>
                  <span
                    aria-hidden
                    className={cn("line-clamp-2 text-xs leading-tight", on ? "font-semibold text-white" : "text-white/70")}
                  >
                    {shortName(m.name)}
                  </span>
                </button>
              );
            })}
          </div>
          <div aria-hidden className="mx-auto mt-auto h-1 w-24 translate-y-2 rounded-full bg-white/30 pt-0" />
        </div>
      </div>

      {/* Vista previa */}
      <div className="flex flex-col rounded-3xl bg-card p-6 shadow-card ring-1 ring-line sm:p-8" aria-live="polite">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-deep-700 text-brand-green">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">{previewLabel}</p>
            <h3 className="mt-1 text-xl font-bold leading-snug text-heading sm:text-2xl">{current.name}</h3>
          </div>
        </div>
        <p className="mt-4 max-w-xl leading-relaxed text-body">{current.note}</p>
        <div aria-hidden className="mt-6 flex-1 rounded-2xl bg-surface-soft p-4 ring-1 ring-line sm:p-5">
          <Preview kind={current.kind} />
        </div>
      </div>
    </div>
  );
}

/** Mini maquetas sin texto: solo la forma de cada módulo. */
function Preview({ kind }: { kind: LauncherModule["kind"] }) {
  const bar = (w: string, cls = "bg-line") => <span className={cn("block h-2 rounded-full", cls)} style={{ width: w }} />;

  if (kind === "feed")
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-line">
            <span className={cn("h-10 w-14 shrink-0 rounded-lg", i === 0 ? "bg-deep-700" : "bg-accent-soft")} />
            <div className="flex-1 space-y-2">
              {bar("70%", "bg-line-strong")}
              {bar("45%")}
            </div>
            <span className={cn("h-5 w-12 rounded-full", i === 0 ? "bg-action" : "bg-line")} />
          </div>
        ))}
      </div>
    );

  if (kind === "library")
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-xl bg-card p-3 ring-1 ring-line">
            <span className={cn("block h-8 w-7 rounded-md", i % 3 === 0 ? "bg-deep-700" : "bg-accent-soft")} />
            <div className="mt-3 space-y-1.5">
              {bar("80%", "bg-line-strong")}
              {bar("50%")}
            </div>
          </div>
        ))}
      </div>
    );

  if (kind === "people")
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 rounded-full bg-deep-700 ring-4 ring-action/40" />
        <span className="h-4 w-px bg-line-strong" />
        <div className="flex w-full justify-center gap-4 border-t border-line-strong pt-4 sm:gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className={cn("h-9 w-9 rounded-full", i === 1 ? "bg-action" : "bg-accent-soft")} />
              {bar("3.5rem", "bg-line-strong")}
              <div className="flex gap-1.5">
                <span className="h-6 w-6 rounded-full bg-line" />
                <span className="h-6 w-6 rounded-full bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (kind === "requests")
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-line">
            <div className="flex-1 space-y-2">
              {bar("60%", "bg-line-strong")}
              {bar("35%")}
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((s) => (
                <span key={s} className={cn("h-2.5 w-2.5 rounded-full", s <= 2 - i ? "bg-action" : "bg-line-strong")} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );

  if (kind === "calendar")
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className="h-10 rounded-lg bg-card p-1.5 ring-1 ring-line sm:h-12">
            {[2, 6, 8, 12].includes(i) && (
              <span className={cn("block h-full rounded-md", i === 6 ? "bg-action" : "bg-deep-700/80 dark:bg-white/20")} />
            )}
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {[78, 52, 34].map((w, i) => (
        <div key={w} className="rounded-xl bg-card p-3 ring-1 ring-line">
          {bar("40%", "bg-line-strong")}
          <div className="mt-2.5 h-3 rounded-full bg-line">
            <span className={cn("block h-3 rounded-full", i === 0 ? "bg-action" : "bg-deep-700/70 dark:bg-white/30")} style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
