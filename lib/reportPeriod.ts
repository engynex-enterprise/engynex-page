/**
 * Periodos de los reportes (hora de Colombia, UTC−5 todo el año). Todo se
 * resuelve en el servidor con la fecha actual; el resultado es ISO.
 */
export const REPORT_PERIODS = ["this_week", "last_week", "this_month", "last_month", "this_quarter", "last_90", "this_year", "custom"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const atBogota = (day: string) => new Date(`${day}T00:00:00-05:00`);

/** Hoy en Colombia como fecha UTC a medianoche (para hacer cuentas de días). */
function todayBogota(now: Date) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
  return new Date(`${day}T00:00:00Z`);
}

export function reportPeriod(raw: { p?: string; from?: string; to?: string }, now = new Date()) {
  const p: ReportPeriod = REPORT_PERIODS.includes(raw.p as ReportPeriod) ? (raw.p as ReportPeriod) : "this_month";
  const t = todayBogota(now);
  const add = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
  const monday = add(t, -((t.getUTCDay() + 6) % 7));
  const monthStart = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  let from: Date;
  let to: Date;
  switch (p) {
    case "this_week":
      from = monday;
      to = add(t, 1);
      break;
    case "last_week":
      from = add(monday, -7);
      to = monday;
      break;
    case "last_month":
      from = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1));
      to = monthStart;
      break;
    case "this_quarter":
      from = new Date(Date.UTC(t.getUTCFullYear(), Math.floor(t.getUTCMonth() / 3) * 3, 1));
      to = add(t, 1);
      break;
    case "last_90":
      from = add(t, -89);
      to = add(t, 1);
      break;
    case "this_year":
      from = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      to = add(t, 1);
      break;
    case "custom": {
      const f = /^\d{4}-\d{2}-\d{2}$/.test(raw.from ?? "") ? new Date(`${raw.from}T00:00:00Z`) : monthStart;
      const e = /^\d{4}-\d{2}-\d{2}$/.test(raw.to ?? "") ? add(new Date(`${raw.to}T00:00:00Z`), 1) : add(t, 1);
      from = f;
      to = e > f ? e : add(f, 1);
      break;
    }
    default:
      from = monthStart;
      to = add(t, 1);
  }
  return {
    p,
    fromDay: ymd(from),
    toDay: ymd(add(to, -1)),
    from: atBogota(ymd(from)).toISOString(),
    to: atBogota(ymd(to)).toISOString(),
  };
}
