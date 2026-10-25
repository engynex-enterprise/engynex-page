/** Formato de facturas (sirve en servidor y cliente). */
export const moneyCop = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

/** Fecha (YYYY-MM-DD o ISO) en la zona de Bogotá. */
export const fmtDay = (locale: string, v: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(v.length === 10 ? `${v}T12:00:00-05:00` : v));

export const INVOICE_TONE: Record<string, string> = {
  draft: "bg-surface-soft text-muted dark:bg-white/[0.06]",
  issued: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-surface-soft text-muted line-through dark:bg-white/[0.06]",
};

export type InvoiceReceipt = { transaction_id?: string; amount_cop?: number; method?: string | null; paid_at?: string; test?: boolean; manual?: boolean; note?: string };
