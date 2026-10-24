"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timer, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { automationsProCopy, shortSpan } from "@/content/automationsPro";
import { ENTITY_LINK, type RuleEntity } from "@/content/rules";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type PendingRow = { id: number; rule_id: string; entity: string; entity_id: string; due_at: string; created_at: string };

/** Ejecuciones en espera (reglas con retraso), con opción de cancelar. */
export function AutomationsPending({
  locale,
  rows,
  rules,
  canEdit,
  now,
}: {
  locale: Locale;
  rows: PendingRow[];
  rules: { id: string; name: string }[];
  canEdit: boolean;
  now: string;
}) {
  const t = automationsProCopy[locale];
  const router = useRouter();
  const [gone, setGone] = useState<Set<number>>(new Set());
  const names = Object.fromEntries(rules.map((x) => [x.id, x.name]));
  const nowMs = new Date(now).getTime();
  const list = rows.filter((x) => !gone.has(x.id));
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  const cancel = async (row: PendingRow) => {
    if (!window.confirm(t.pending.confirmCancel)) return;
    const { error } = await createClient().from("automation_pending").delete().eq("id", row.id);
    if (!error) {
      setGone((g) => new Set(g).add(row.id));
      router.refresh();
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <p className="mb-4 max-w-3xl text-sm text-muted">{t.pending.hint}</p>
      {list.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--meta-active)] text-heading">
            <Timer className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-4 text-sm text-muted">{t.pending.empty}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {(["rule", "item", "due", "queued"] as const).map((k) => (
                  <th key={k} scope="col" className="px-4 py-2.5 font-medium">{t.pending.cols[k]}</th>
                ))}
                {canEdit && <th scope="col" className="px-4 py-2.5"><span className="sr-only">{t.pending.cancel}</span></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const left = new Date(row.due_at).getTime() - nowMs;
                const fn = ENTITY_LINK[row.entity as RuleEntity];
                return (
                  <tr key={row.id} className="border-b border-line last:border-0 hover:bg-[var(--meta-hover)]">
                    <td className="px-4 py-3">
                      <Link href={`/${locale}/portal/automatizaciones/${row.rule_id}`} className="font-semibold text-heading hover:underline">
                        {names[row.rule_id] ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-body">
                      {fn ? (
                        <Link href={`/${locale}/portal/${fn(row.entity_id)}`} className="hover:underline">
                          {t.history.entities[row.entity] ?? row.entity}
                        </Link>
                      ) : (
                        (t.history.entities[row.entity] ?? row.entity)
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={cn("font-medium tabular-nums", left <= 0 ? "text-amber-700 dark:text-amber-400" : "text-heading")}>
                        {left <= 0 ? t.pending.now : t.pending.in.replace("{t}", shortSpan(left))}
                      </span>
                      <span className="block text-xs text-muted">{fmt(row.due_at)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(row.created_at)}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => cancel(row)}
                          className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2.5 text-sm font-medium text-red-600 ring-1 ring-line hover:bg-[var(--meta-hover)] dark:text-red-400"
                        >
                          <X className="h-4 w-4" aria-hidden />
                          {t.pending.cancel}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
