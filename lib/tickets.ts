import type { TicketPriority, TicketStatus } from "@/lib/supabase/types";

export const ticketStatuses: TicketStatus[] = ["open", "in_progress", "waiting", "resolved", "closed"];
export const ticketPriorities: TicketPriority[] = ["critical", "high", "medium", "low"];

export const ticketStatusTone: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  waiting: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  closed: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

export const ticketPriorityTone: Record<TicketPriority, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-heading",
  low: "text-muted",
};

/** Bytes legibles (1,2 MB). */
export function formatBytes(bytes: number, locale: string) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i ? 1 : 0 }).format(n)} ${units[i]}`;
}
