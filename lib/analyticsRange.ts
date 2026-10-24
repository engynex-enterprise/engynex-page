import { bogotaRange } from "@/lib/dates";

export const ANALYTICS_RANGES = ["7", "30", "90", "365"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

/** Periodo elegido (?r=) en días de Colombia: desde, hasta y su clave. */
export function analyticsRange(raw: string | undefined) {
  const r: AnalyticsRange = ANALYTICS_RANGES.includes(raw as AnalyticsRange) ? (raw as AnalyticsRange) : "30";
  return { r, ...bogotaRange(Number(r)) };
}
