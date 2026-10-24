import type { Json } from "@/lib/supabase/types";

/** De dónde llegó un lead, en una palabra (para la tabla y la exportación). */
export function leadSourceKey(l: { source?: string | null; utm?: Json | null; gclid?: string | null; referrer?: string | null }) {
  const utm = (l.utm ?? {}) as Record<string, string>;
  if (l.source && l.source !== "web") return l.source;
  if (l.gclid) return "google_ads";
  if (utm.utm_source) return utm.utm_source.toLowerCase();
  const host = (() => {
    try {
      return l.referrer ? new URL(l.referrer).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  })();
  if (/google\./.test(host)) return "Google";
  if (/facebook|fb\./.test(host)) return "Facebook";
  if (/instagram/.test(host)) return "Instagram";
  if (/linkedin|lnkd/.test(host)) return "LinkedIn";
  if (/t\.co$|twitter|x\.com/.test(host)) return "X";
  if (/tiktok/.test(host)) return "TikTok";
  return "web";
}
