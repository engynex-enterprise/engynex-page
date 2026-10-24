import type { LeadTier } from "@/lib/supabase/types";

/** Color de cada nivel de lead (verde, amarillo, rojo) en el portal. */
export const tierStyles: Record<LeadTier, { dot: string; pill: string }> = {
  green: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  yellow: {
    dot: "bg-amber-400",
    pill: "bg-amber-400/15 text-amber-700 dark:text-amber-300",
  },
  red: {
    dot: "bg-red-500",
    pill: "bg-red-500/12 text-red-700 dark:text-red-300",
  },
};
