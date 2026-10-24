/** Instante de hace `days` días, en ISO (para filtros de consultas). */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

/** Instante actual en ISO. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Rango [desde, hasta) de los últimos `days` días completos en hora de
 * Colombia, incluido hoy.
 */
export function bogotaRange(days: number): { from: string; to: string } {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const end = new Date(`${today}T00:00:00-05:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  return { from: start.toISOString(), to: end.toISOString() };
}
