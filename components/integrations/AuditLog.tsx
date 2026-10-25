import type { IntegrationsHubCopy } from "@/content/integrationsHub";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type AuditRow = { id: number; key: string; action: string; detail: string | null; actor: string | null; created_at: string };

const TONE: Record<string, string> = {
  set: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  removed: "bg-[var(--meta-active)] text-muted",
  test_ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  test_failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

/** Quién guardó, quitó o probó cada clave (nunca muestra valores). */
export function AuditLog({
  locale,
  rows,
  names,
  labels,
  t,
}: {
  locale: Locale;
  rows: AuditRow[];
  names: Record<string, string>;
  labels: Record<string, string>;
  t: IntegrationsHubCopy;
}) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.log.title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t.log.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {(["when", "what", "who", "detail"] as const).map((c) => (
                  <th key={c} scope="col" className="py-2.5 pr-4 font-medium">{t.log.cols[c]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap py-2.5 pr-4 text-body">{fmt(r.created_at)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", TONE[r.action])}>{t.log.actions[r.action] ?? r.action}</span>
                    <span className="ml-2 text-heading">{labels[r.key] ?? r.key}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-body">{r.actor ? names[r.actor] ?? "—" : t.log.system}</td>
                  <td className="max-w-xs truncate py-2.5 text-muted" title={r.detail ?? undefined}>{r.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
