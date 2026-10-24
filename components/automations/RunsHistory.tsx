"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, X, Zap } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { ACTION_ICONS } from "@/components/automations/icons";
import { automationsProCopy } from "@/content/automationsPro";
import { ENTITY_LINK, rulesCopy, type ActionType, type RuleEntity } from "@/content/rules";
import type { Locale } from "@/i18n/config";
import type { AutomationRun } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Detail = { actions?: { type: ActionType; to?: string; mode?: string }[]; error?: string };

const ENTITIES: RuleEntity[] = ["lead", "appointment", "ticket", "chat", "task", "deal", "account"];

/** Historial de ejecuciones con filtros (en la URL) y detalle en un panel lateral. */
export function RunsHistory({
  locale,
  runs,
  rules,
}: {
  locale: Locale;
  runs: AutomationRun[];
  rules: { id: string; name: string }[];
}) {
  const t = automationsProCopy[locale];
  const r = rulesCopy;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState<AutomationRun | null>(null);
  const names = Object.fromEntries(rules.map((x) => [x.id, x.name]));
  const base = `/${locale}/portal/`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const setFilter = (key: string, value: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("tab", "historial");
    if (value) q.set(key, value);
    else q.delete(key);
    router.push(`${pathname}?${q.toString()}`);
  };
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const link = (run: AutomationRun) => {
    const fn = ENTITY_LINK[run.entity as RuleEntity];
    return fn ? base + fn(run.entity_id) : null;
  };
  const detail = (run: AutomationRun) => (run.detail ?? {}) as Detail;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        <div className="w-72 max-w-full">
          <Select
            size="sm"
            label={t.history.rule}
            value={params.get("rule") ?? ""}
            onChange={(v) => setFilter("rule", v)}
            options={[{ value: "", label: t.history.anyRule }, ...rules.map((x) => ({ value: x.id, label: x.name }))]}
          />
        </div>
        <div className="w-44">
          <Select
            size="sm"
            label={t.history.result}
            value={params.get("r") ?? ""}
            onChange={(v) => setFilter("r", v)}
            options={[
              { value: "", label: `${t.history.result}: ${t.history.anyResult}` },
              { value: "done", label: r.history.done },
              { value: "failed", label: r.history.failed },
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            size="sm"
            label={t.history.entity}
            value={params.get("e") ?? ""}
            onChange={(v) => setFilter("e", v)}
            options={[{ value: "", label: `${t.history.entity}: ${t.history.anyEntity}` }, ...ENTITIES.map((e) => ({ value: e, label: t.history.entities[e] }))]}
          />
        </div>
        {runs.length > 0 && <p className="ml-auto text-xs text-muted">{t.history.showing.replace("{n}", String(runs.length))}</p>}
      </div>

      <div className="px-4 py-6 sm:px-6">
        {runs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{t.history.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  {(["when", "rule", "item", "result"] as const).map((k) => (
                    <th key={k} scope="col" className="px-4 py-2.5 font-medium">{r.history.cols[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const d = detail(run);
                  const href = link(run);
                  return (
                    <tr
                      key={run.id}
                      onClick={() => setOpen(run)}
                      className={cn("cursor-pointer border-b border-line last:border-0 hover:bg-[var(--meta-hover)]", open?.id === run.id && "bg-[var(--meta-active)]")}
                    >
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{fmt(run.created_at)}</td>
                      <td className="max-w-[16rem] px-4 py-3">
                        <button type="button" onClick={() => setOpen(run)} className="block max-w-full truncate text-left font-semibold text-heading hover:underline">
                          {names[run.rule_id] ?? "—"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-body">
                        {href ? (
                          <Link href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
                            {t.history.entities[run.entity] ?? run.entity}
                          </Link>
                        ) : (
                          (t.history.entities[run.entity] ?? run.entity)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {run.status === "done" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                              {r.history.done}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-300">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                              {r.history.failed}
                            </span>
                          )}
                          {d.error ? (
                            <span className="max-w-[18rem] truncate text-xs text-red-600 dark:text-red-400">{d.error}</span>
                          ) : (
                            (d.actions ?? []).map((a, i) => {
                              const Icon = ACTION_ICONS[a.type] ?? Zap;
                              return <Icon key={i} className="h-4 w-4 text-muted" aria-label={r.actions.types[a.type]?.label ?? a.type} />;
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(null)} aria-hidden />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t.history.detail}
            className="fixed inset-y-3 right-3 z-50 flex w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl dark:bg-card"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-[0.98rem] font-semibold text-heading">{t.history.detail}</h2>
              <button type="button" onClick={() => setOpen(null)} aria-label={t.history.close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)]">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid content-start gap-5 overflow-y-auto px-5 py-5 text-sm">
              <dl className="grid gap-3">
                <div>
                  <dt className="text-xs text-muted">{r.history.cols.rule}</dt>
                  <dd>
                    <Link href={`${base}automatizaciones/${open.rule_id}`} className="font-semibold text-heading hover:underline">
                      {names[open.rule_id] ?? "—"}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{r.history.cols.when}</dt>
                  <dd className="tabular-nums text-heading">{fmt(open.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{r.history.cols.item}</dt>
                  <dd className="flex items-center gap-2 text-heading">
                    {t.history.entities[open.entity] ?? open.entity}
                    {link(open) && (
                      <Link href={link(open)!} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                        {t.history.open}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t.history.runKey}</dt>
                  <dd className="break-all font-mono text-xs text-muted">{open.run_key}</dd>
                </div>
              </dl>

              {detail(open).error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-red-800 dark:bg-red-500/10 dark:text-red-300">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    {t.history.error}
                  </p>
                  <p className="break-words font-mono text-xs">{detail(open).error}</p>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">{t.history.actionsDone}</h3>
                {(detail(open).actions ?? []).length === 0 ? (
                  <p className="text-muted">{t.history.noActions}</p>
                ) : (
                  <ol className="grid gap-2">
                    {(detail(open).actions ?? []).map((a, i) => {
                      const Icon = ACTION_ICONS[a.type] ?? Zap;
                      return (
                        <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--meta-active)]/60 px-3 py-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-heading dark:bg-card">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span>
                            <span className="block font-medium text-heading">{r.actions.types[a.type]?.label ?? a.type}</span>
                            <span className="block text-xs text-muted">{r.actions.types[a.type]?.desc}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
