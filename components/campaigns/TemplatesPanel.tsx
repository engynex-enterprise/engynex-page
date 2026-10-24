"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import type { WaTemplate } from "@/lib/supabase/types";
import { campaignsCopy } from "@/content/campaigns";
import { TemplatePreview } from "./TemplatePreview";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const stateTone: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

export function TemplatesPanel({
  locale,
  templates,
  ready,
}: {
  locale: Locale;
  templates: WaTemplate[];
  ready: boolean;
}) {
  const t = campaignsCopy[locale].templates;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/whatsapp/templates", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { count?: number; detail?: string; error?: string };
    setBusy(false);
    setMessage(res.ok ? t.synced.replace("{n}", String(data.count ?? 0)) : (data.detail ?? data.error ?? "error"));
    if (res.ok) router.refresh();
  };

  const last = templates.reduce<string | null>((max, x) => (!max || x.synced_at > max ? x.synced_at : max), null);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={sync} disabled={busy || !ready} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          {busy ? t.syncing : t.sync}
        </button>
        {last && (
          <span className="text-xs text-muted">
            {t.lastSync.replace(
              "{date}",
              new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(last)),
            )}
          </span>
        )}
        {message && (
          <span role="status" className="text-sm font-semibold text-heading">
            {message}
          </span>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">{t.empty}</p>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <li key={tpl.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 dark:bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-bold text-heading">{tpl.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {tpl.language} · {tpl.category?.toLowerCase() ?? "—"} · {t.variables.replace("{n}", String(tpl.variables))}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                    stateTone[tpl.status] ?? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
                  )}
                >
                  {t.states[tpl.status] ?? tpl.status}
                </span>
              </div>
              <div className="mt-4">
                <TemplatePreview template={tpl} values={[]} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
