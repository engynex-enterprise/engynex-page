import type { AccountStage } from "@/lib/supabase/types";

export const accountStages: AccountStage[] = ["onboarding", "active", "at_risk", "paused", "churned"];

export const accountStageTone: Record<AccountStage, string> = {
  onboarding: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  at_risk: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  churned: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

/** Salud: buena ≥ 75, regular 50-74, en riesgo < 50. */
export const healthLevel = (h: number) => (h >= 75 ? "good" : h >= 50 ? "fair" : "poor");

export const healthTone = {
  good: { text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  fair: { text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" },
  poor: { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
} as const;

/** Días hasta una fecha (YYYY-MM-DD) desde `today` (YYYY-MM-DD). */
export const daysUntil = (date: string, today: string) =>
  Math.round((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000);

export const money = (v: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "COP", notation: v >= 10_000_000 ? "compact" : "standard", maximumFractionDigits: v >= 10_000_000 ? 1 : 0 }).format(v);
