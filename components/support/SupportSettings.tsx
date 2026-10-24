"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { supportSettingsCopy } from "@/content/supportSettings";
import { ticketsCopy } from "@/content/tickets";
import type { Locale } from "@/i18n/config";
import { ticketPriorities, ticketPriorityTone } from "@/lib/tickets";
import type { SupportConfig, SupportSla } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const PRESETS: Record<"strict" | "standard" | "relaxed", SupportSla> = {
  strict: { critical: { first_h: 1, resolve_h: 4 }, high: { first_h: 2, resolve_h: 12 }, medium: { first_h: 4, resolve_h: 48 }, low: { first_h: 8, resolve_h: 72 } },
  standard: { critical: { first_h: 1, resolve_h: 8 }, high: { first_h: 4, resolve_h: 24 }, medium: { first_h: 8, resolve_h: 72 }, low: { first_h: 24, resolve_h: 120 } },
  relaxed: { critical: { first_h: 2, resolve_h: 24 }, high: { first_h: 8, resolve_h: 48 }, medium: { first_h: 24, resolve_h: 120 }, low: { first_h: 48, resolve_h: 240 } },
};

/** SLA por prioridad, cierre automático y encuesta de satisfacción. */
export function SupportSettings({ locale, initial, updatedAt, meId }: { locale: Locale; initial: SupportConfig; updatedAt: string | null; meId: string }) {
  const t = supportSettingsCopy[locale];
  const tk = ticketsCopy[locale];
  const router = useRouter();
  const [cfg, setCfg] = useState<SupportConfig>({
    sla: { ...PRESETS.standard, ...initial.sla },
    auto_close_days: initial.auto_close_days ?? 5,
    csat: initial.csat ?? true,
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const setSla = (p: keyof SupportSla, k: "first_h" | "resolve_h", v: string) => {
    setState("idle");
    setCfg((c) => ({ ...c, sla: { ...c.sla, [p]: { ...c.sla[p], [k]: Math.max(1, Math.min(2000, Math.round(Number(v) || 1))) } } }));
  };

  const save = async () => {
    if (ticketPriorities.some((p) => cfg.sla[p].resolve_h < cfg.sla[p].first_h)) return setState("invalid");
    setState("saving");
    const { error } = await createClient()
      .from("support_settings")
      .update({ config: cfg, updated_at: new Date().toISOString(), updated_by: meId })
      .eq("id", true);
    if (error) return setState("error");
    setState("saved");
    router.refresh();
  };

  const card = "rounded-xl border border-line bg-surface p-5 sm:p-6 dark:bg-card";
  const num = "h-10 w-24 rounded-[10px] border border-line-strong bg-surface px-3 text-right text-sm tabular-nums text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green";

  return (
    <div className="grid max-w-4xl gap-5">
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <h2 className="text-[0.98rem] font-semibold text-heading">{t.slaTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.slaHint}</p>
          </div>
          <div className="flex items-center gap-1 rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]" role="group" aria-label={t.presets.label}>
            {(["strict", "standard", "relaxed"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setState("idle");
                  setCfg((c) => ({ ...c, sla: PRESETS[k] }));
                }}
                aria-pressed={JSON.stringify(cfg.sla) === JSON.stringify(PRESETS[k])}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm",
                  JSON.stringify(cfg.sla) === JSON.stringify(PRESETS[k]) ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading",
                )}
              >
                {t.presets[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-2.5 font-medium">{t.priority}</th>
                <th scope="col" className="py-2.5 text-right font-medium">{t.first}</th>
                <th scope="col" className="py-2.5 text-right font-medium">{t.resolve}</th>
              </tr>
            </thead>
            <tbody>
              {ticketPriorities.map((p) => (
                <tr key={p} className="border-b border-line last:border-0">
                  <th scope="row" className={cn("py-3 text-left font-semibold", ticketPriorityTone[p])}>{tk.priority[p]}</th>
                  {(["first_h", "resolve_h"] as const).map((k) => (
                    <td key={k} className="py-3 text-right">
                      <label className="inline-flex items-center gap-2">
                        <span className="sr-only">{`${tk.priority[p]} · ${k === "first_h" ? t.first : t.resolve}`}</span>
                        <input type="number" min={1} max={2000} value={cfg.sla[p][k]} onChange={(e) => setSla(p, k, e.target.value)} className={num} />
                        <span className="w-12 text-left text-muted">{t.hours}</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">{t.note}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.autoTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.autoHint}</p>
          <label className="mt-4 inline-flex items-center gap-2 text-sm">
            <span className="sr-only">{t.autoTitle}</span>
            <input
              type="number"
              min={0}
              max={90}
              value={cfg.auto_close_days}
              onChange={(e) => {
                setState("idle");
                setCfg((c) => ({ ...c, auto_close_days: Math.max(0, Math.min(90, Math.round(Number(e.target.value) || 0))) }));
              }}
              className={num}
            />
            <span className="text-muted">{t.days}</span>
          </label>
          <p className="mt-2 text-xs text-muted">{t.autoOff}</p>
        </section>

        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.csatTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.csatHint}</p>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-medium text-heading">
            <button
              type="button"
              role="switch"
              aria-checked={cfg.csat}
              onClick={() => {
                setState("idle");
                setCfg((c) => ({ ...c, csat: !c.csat }));
              }}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", cfg.csat ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong")}
            >
              <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", cfg.csat ? "translate-x-5" : "translate-x-0.5")} />
            </button>
            {t.csatOn}
          </label>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={state === "saving"} className={buttonClasses("primary", "md", "disabled:opacity-60")}>
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.save}
        </button>
        <p role="status" className={cn("text-sm", state === "saved" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {state === "saved" && (
            <span className="inline-flex items-center gap-1">
              <Check className="h-4 w-4" aria-hidden />
              {t.saved}
            </span>
          )}
          {state === "error" && t.error}
          {state === "invalid" && t.invalid}
        </p>
        {updatedAt && state === "idle" && (
          <p className="text-xs text-muted">
            {t.updated.replace("{date}", new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(updatedAt)))}
          </p>
        )}
      </div>
    </div>
  );
}
