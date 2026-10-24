"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Accessibility, RotateCcw, X } from "lucide-react";
import { A11Y_DEFAULTS, saveA11y, useA11y, type A11ySettings } from "@/lib/a11y";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Copy = Dictionary["a11y"];
type Toggle = "contrast" | "dyslexia" | "spacing" | "links" | "motion";

/**
 * Botón "Accesibilidad" de la barra de navegación (junto al de modo oscuro).
 *
 * Abre un panel desplegable bajo la barra, o una hoja inferior en celular, con el lenguaje de meta.com: tamaño del texto en tres pasos y
 * cinco interruptores (alto contraste, fuente para dislexia, más espacio,
 * subrayar enlaces y pausar animaciones). Los cambios se ven al instante y se
 * guardan en el navegador (lib/a11y.ts).
 */
export function AccessibilityWidget({ copy }: { copy: Copy }) {
  const [open, setOpen] = useState(false);
  const settings = useA11y();
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    tabRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // Clic fuera del panel y del botón: cierra.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || tabRef.current?.contains(target))
        return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const update = (patch: Partial<A11ySettings>) =>
    saveA11y({ ...settings, ...patch });

  const toggles: Toggle[] = ["contrast", "dyslexia", "spacing", "links", "motion"];
  const changed = JSON.stringify(settings) !== JSON.stringify(A11Y_DEFAULTS);

  return (
    // `relative`: en escritorio el panel cuelga justo debajo del botón.
    <div className="relative">
      {/* -------- Botón de la barra -------- */}
      <button
        ref={tabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label={copy.tab}
        title={copy.tab}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors",
          open
            ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700 dark:ring-white"
            : "bg-deep-900/5 text-deep-700 ring-deep-900/10 hover:bg-deep-900/10 hover:text-deep-900 dark:bg-white/5 dark:text-ink-200 dark:ring-white/15 dark:hover:bg-white/10",
        )}
      >
        <Accessibility className="h-5 w-5" aria-hidden />
        {changed && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-white dark:ring-deep-950"
          />
        )}
      </button>

      {/* -------- Panel -------- */}
      <div
        ref={panelRef}
        id="a11y-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        hidden={!open}
        className={cn(
          "fixed z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-3xl bg-surface text-heading shadow-[0_24px_70px_-20px_rgba(11,16,32,0.5)] ring-1 ring-line dark:bg-card",
          // Celular: hoja inferior. Escritorio: desplegable bajo la barra,
          // alineado a la derecha como el resto de utilidades.
          "inset-x-3 bottom-3 md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-3 md:w-[24rem]",
        )}
      >
        <div className="flex items-start gap-3 border-b border-line px-6 pb-5 pt-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-deep-700 text-white dark:bg-white dark:text-deep-700">
            <Accessibility className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg leading-tight text-heading">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-snug text-muted">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={copy.close}
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-card-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-5">
          {/* Tamaño del texto: control segmentado */}
          <fieldset>
            <legend className="text-sm font-bold text-heading">{copy.textSize}</legend>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-surface-soft p-1 dark:bg-white/[0.06]">
              {copy.sizes.map((label, i) => {
                const active = settings.textSize === i;
                return (
                  <button
                    key={label}
                    type="button"
                    data-autofocus={i === 0 ? "" : undefined}
                    aria-pressed={active}
                    onClick={() => update({ textSize: i as 0 | 1 | 2 })}
                    className={cn(
                      "h-10 rounded-full font-semibold transition-colors",
                      i === 0 ? "text-xs" : i === 1 ? "text-sm" : "text-base",
                      active
                        ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                        : "text-heading hover:bg-surface dark:hover:bg-white/10",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Interruptores */}
          <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
            {toggles.map((key) => (
              <ToggleRow
                key={key}
                title={copy[key]}
                desc={copy[`${key}Desc` as `${Toggle}Desc`]}
                checked={settings[key]}
                onChange={(value) => update({ [key]: value })}
              />
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-xs leading-relaxed text-muted">{copy.note}</p>
            <button
              type="button"
              onClick={() => saveA11y(A11Y_DEFAULTS)}
              disabled={!changed}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-heading ring-1 ring-line-strong transition-colors hover:bg-card-soft disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {copy.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fila con interruptor (role="switch"), como el panel de cookies. */
function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <li className="flex items-start gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-sm font-bold text-heading">
          {title}
        </p>
        <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-muted">
          {desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-deep-700 dark:bg-brand-green" : "bg-line-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </li>
  );
}
