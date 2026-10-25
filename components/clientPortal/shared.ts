import type { Locale } from "@/i18n/config";

export const TZ = "America/Bogota";

export const moneyCop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const fmtDay = (locale: Locale, iso: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(iso.length === 10 ? `${iso}T12:00:00-05:00` : iso));

export const fmtWhen = (locale: Locale, iso: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));

export const fmtShortWhen = (locale: Locale, iso: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));

export type Meeting = {
  id: string;
  starts_at: string;
  ends_at: string;
  channel: string;
  status: string;
  meeting_url: string | null;
  location: string | null;
  kind: string | null;
  host_name: string | null;
};

export const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
