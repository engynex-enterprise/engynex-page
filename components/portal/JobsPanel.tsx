"use client";

import { useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { integrationsCopy } from "@/content/integrations";
import { buttonClasses } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type JobsStatus = {
  enabled: boolean;
  url: string | null;
  last_runs: { at: string; status: number | null; error: string | null }[];
};

/**
 * Ejecución automática (pg_cron + pg_net llaman a /api/jobs/run cada 5
 * minutos con la clave guardada en Vault) y "Ejecutar ahora".
 */
export function JobsPanel({
  locale,
  siteUrl,
  initial,
  hasKey,
}: {
  locale: Locale;
  siteUrl: string;
  initial: JobsStatus | null;
  hasKey: boolean;
}) {
  const t = integrationsCopy[locale].sections.automation;
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState<"schedule" | "run" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const schedule = async (enabled: boolean) => {
    setBusy("schedule");
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("admin_jobs_schedule", {
      p_url: `${siteUrl}/api/jobs/run`,
      p_enabled: enabled,
    });
    setBusy(null);
    if (rpcError) {
      const code = Object.keys(t.errors).find((k) => rpcError.message.includes(k));
      return setError(code ? t.errors[code] : rpcError.message);
    }
    setStatus(data as unknown as JobsStatus);
  };

  const runNow = async () => {
    setBusy("run");
    setResult(null);
    const res = await fetch("/api/jobs/run", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    setResult(JSON.stringify(res.ok ? data.summary : data, null, 2));
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));

  return (
    <div className="rounded-lg bg-surface-soft p-4 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-heading">{t.schedule}</p>
          <p className={cn("text-xs font-bold", status?.enabled ? "text-emerald-700 dark:text-emerald-400" : "text-muted")}>
            {status?.enabled ? t.scheduleOn : t.scheduleOff}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => schedule(!status?.enabled)}
            disabled={busy !== null || (!status?.enabled && !hasKey)}
            className={buttonClasses("outline", "md", "h-10 disabled:opacity-50")}
          >
            {busy === "schedule" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {status?.enabled ? t.disable : t.enable}
          </button>
          <button type="button" onClick={runNow} disabled={busy !== null} className={buttonClasses("primary", "md", "h-10 disabled:opacity-60")}>
            {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {busy === "run" ? t.running : t.runNow}
          </button>
        </div>
      </div>
      {!hasKey && !status?.enabled && <p className="mt-2 text-xs text-muted">{t.needsKey}</p>}
      {!status?.enabled && <p className="mt-2 text-xs text-muted">{t.needsPublic}</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted">{t.result}</p>
          <pre className="mt-1 max-h-60 overflow-auto rounded-xl bg-surface p-3 font-mono text-xs text-heading dark:bg-card">{result}</pre>
        </div>
      )}
      <p className="mt-4 text-xs font-semibold text-muted">{t.lastRuns}</p>
      {!status?.last_runs.length ? (
        <p className="mt-1 text-xs text-muted">{t.noRuns}</p>
      ) : (
        <ul className="mt-1 grid gap-1 text-xs">
          {status.last_runs.map((r) => (
            <li key={r.at} className="flex gap-3">
              <span className="text-muted">{fmt(r.at)}</span>
              <span className={cn("font-semibold", r.status === 200 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {r.status ?? r.error ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
