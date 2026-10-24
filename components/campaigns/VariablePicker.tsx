"use client";

import { useEffect, useRef, useState } from "react";
import { Braces } from "lucide-react";
import { CAMPAIGN_VARS, varToken } from "@/lib/campaignVars";
import { campaignEditorCopy } from "@/content/campaignEditor";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Botón "Variable": lista de variables con ejemplo y un valor opcional por si
 * a alguien le falta el dato. Al elegir, entrega el texto a insertar.
 */
export function VariablePicker({
  locale,
  onPick,
  only,
  align = "right",
}: {
  locale: Locale;
  onPick: (token: string) => void;
  /** Limitar a algunas variables (p. ej. enlaces en el campo del botón). */
  only?: string[];
  align?: "left" | "right";
}) {
  const t = campaignEditorCopy[locale].vars;
  const [open, setOpen] = useState(false);
  const [fallbacks, setFallbacks] = useState<Record<string, string>>(() => Object.fromEntries(CAMPAIGN_VARS.map((v) => [v.key, v.fallback])));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const vars = CAMPAIGN_VARS.filter((v) => !only || only.includes(v.key));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-accent ring-1 ring-brand-green/40 hover:bg-[var(--meta-active)]"
      >
        <Braces className="h-3.5 w-3.5" aria-hidden />
        {t.button}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-1.5 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl bg-surface p-2 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <p className="px-2 pb-1 pt-1 text-sm font-semibold text-heading">{t.title}</p>
          <p className="px-2 pb-2 text-xs text-muted">{t.hint}</p>
          <ul className="max-h-80 overflow-y-auto">
            {vars.map((v) => (
              <li key={v.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--meta-hover)]">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(varToken(v.key, fallbacks[v.key]?.trim()));
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block text-sm font-medium text-heading">{locale === "en" ? v.en : v.es}</span>
                  <span className="block truncate text-xs text-muted">
                    <code className="font-mono text-accent">{`{${v.key}}`}</code> · {t.example.replace("{value}", v.sample)}
                  </span>
                </button>
                {!v.key.startsWith("enlace") && (
                  <input
                    value={fallbacks[v.key] ?? ""}
                    onChange={(e) => setFallbacks((f) => ({ ...f, [v.key]: e.target.value }))}
                    placeholder={t.fallbackPlaceholder}
                    title={t.fallback}
                    aria-label={`${t.fallback} (${v.key})`}
                    className="h-7 w-28 shrink-0 rounded-md bg-[#f4f4f5] px-2 text-xs text-heading outline-none ring-1 ring-transparent focus:ring-line-strong dark:bg-white/[0.06]"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
