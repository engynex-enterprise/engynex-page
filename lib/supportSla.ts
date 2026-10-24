import type { Ticket } from "@/lib/supabase/types";

export type SlaState = {
  /** Qué reloj manda: la primera respuesta (si aún no hay) o la resolución. */
  kind: "first" | "resolve";
  due: string;
  /** Milisegundos restantes (negativo = vencida). */
  left: number;
  breached: boolean;
  /** Vence pronto: < 2 h para la primera respuesta, < 4 h para resolver. */
  soon: boolean;
};

const ACTIVE = new Set(["open", "in_progress", "waiting"]);

/** Estado del SLA de una solicitud activa en el instante `now` (ms). */
export function slaState(t: Pick<Ticket, "status" | "first_response_at" | "first_response_due" | "resolve_due" | "merged_into">, now: number): SlaState | null {
  if (!ACTIVE.has(t.status) || t.merged_into) return null;
  const first = !t.first_response_at && t.first_response_due ? t.first_response_due : null;
  const due = first ?? t.resolve_due;
  if (!due) return null;
  const left = new Date(due).getTime() - now;
  const kind = first ? "first" : "resolve";
  return { kind, due, left, breached: left < 0, soon: left >= 0 && left < (kind === "first" ? 2 : 4) * 3_600_000 };
}

/** ¿Se cumplió el SLA de primera respuesta / resolución? (null = aún no aplica). */
export function slaMet(t: Pick<Ticket, "first_response_at" | "first_response_due" | "resolved_at" | "resolve_due">) {
  return {
    first: t.first_response_at && t.first_response_due ? t.first_response_at <= t.first_response_due : null,
    resolve: t.resolved_at && t.resolve_due ? t.resolved_at <= t.resolve_due : null,
  };
}

/** Duración corta: 45 min, 3 h, 2 d. */
export function shortDuration(ms: number, units: { m: string; h: string; d: string }) {
  const m = Math.max(1, Math.round(Math.abs(ms) / 60_000));
  if (m < 60) return units.m.replace("{n}", String(m));
  const h = Math.round(m / 60);
  if (h < 48) return units.h.replace("{n}", String(h));
  return units.d.replace("{n}", String(Math.round(h / 24)));
}

export const slaTone = (s: SlaState | null) =>
  !s
    ? "text-muted"
    : s.breached
      ? "text-red-600 dark:text-red-400"
      : s.soon
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-700 dark:text-emerald-400";
