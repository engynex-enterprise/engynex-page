import type { WaCampaignStatus } from "@/lib/supabase/types";

/** Color de la píldora de estado de una campaña. */
export const campaignStatusTone: Record<WaCampaignStatus, string> = {
  draft: "bg-surface-soft text-heading dark:bg-white/[0.08]",
  scheduled: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  sending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};
