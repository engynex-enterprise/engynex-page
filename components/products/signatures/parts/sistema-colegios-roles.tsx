"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Backpack, Building2, Check, House, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SchoolRole {
  name: string;
  lead: string;
  /** Módulos y características reales que ve este rol. */
  sees: string[];
  /** Beneficio real asociado, si aplica. */
  note?: string;
}

const icons = [Building2, Presentation, House, Backpack];

/**
 * Selector de rol con pestañas accesibles (role="tablist", flechas para
 * moverse). El panel muestra qué ve cada rol y una pantalla ilustrativa.
 */
export function SchoolRoles({
  roles,
  tabsLabel,
  seesLabel,
  cardTone,
}: {
  roles: SchoolRole[];
  tabsLabel: string;
  seesLabel: string;
  cardTone: "light" | "muted";
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = roles[active];
  const Icon = icons[active % icons.length];

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = roles.length - 1;
    let next = active;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={tabsLabel}
        onKeyDown={onKey}
        className="mx-auto grid max-w-3xl grid-cols-2 gap-1.5 rounded-3xl bg-card p-1.5 ring-1 ring-line sm:flex sm:rounded-full"
      >
        {roles.map((r, i) => {
          const TabIcon = icons[i % icons.length];
          const on = i === active;
          return (
            <button
              key={r.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`school-tab-${i}`}
              aria-selected={on}
              aria-controls="school-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action",
                on
                  ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                  : "text-heading hover:bg-card-soft",
              )}
            >
              <TabIcon className="h-4 w-4" aria-hidden />
              {r.name}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="school-panel"
        aria-labelledby={`school-tab-${active}`}
        className="mx-auto mt-8 grid max-w-6xl items-stretch gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-8"
      >
        <div className={cn("flex flex-col rounded-3xl p-6 ring-1 ring-line sm:p-8", cardTone === "muted" ? "bg-card" : "bg-surface-soft")}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <h3 className="mt-5 text-2xl font-bold text-heading sm:text-3xl">{current.name}</h3>
          <p className="mt-3 text-lg leading-relaxed text-body">{current.lead}</p>
          <p className="mt-6 text-sm font-semibold text-muted">{seesLabel}</p>
          <ul className="mt-3 space-y-3">
            {current.sees.map((s) => (
              <li key={s} className="flex items-start gap-2.5 leading-relaxed text-body">
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
          {current.note && (
            <p className="mt-auto pt-6 text-sm leading-relaxed text-muted">
              <span className="block border-t border-line pt-4">{current.note}</span>
            </p>
          )}
        </div>

        {/* Pantalla ilustrativa del rol: tarjetas con los mismos módulos. */}
        <div aria-hidden className="rounded-3xl bg-deep-800 p-5 text-white ring-1 ring-white/10 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="ml-3 truncate text-sm font-semibold">{current.name}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {current.sees.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "rounded-2xl p-4",
                  i === 0 ? "bg-white/[0.1] ring-1 ring-brand-green/50 sm:col-span-2" : "bg-white/[0.06]",
                )}
              >
                <p className="line-clamp-2 text-sm font-semibold">{s}</p>
                {i === 0 ? (
                  <div className="mt-4 flex h-20 items-end gap-2">
                    {[60, 85, 45, 95, 70, 80, 55].map((h, k) => (
                      <span
                        key={k}
                        className={cn("flex-1 rounded-t-md", k === 3 ? "bg-brand-green" : "bg-white/20")}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <span className="block h-2 w-4/5 rounded-full bg-white/20" />
                    <span className="block h-2 w-1/2 rounded-full bg-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
