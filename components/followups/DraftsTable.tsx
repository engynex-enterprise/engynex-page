"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2, Mail, MessageCircle, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LeadDraft } from "@/lib/supabase/types";
import { followupEditorCopy } from "@/content/followupEditor";
import { leadFormCopy } from "@/content/leadForm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type DraftsKpis = { drafts: number; reminded: number; recovered: number };
type Tab = "pending" | "reminded" | "all";

const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)] disabled:opacity-30 disabled:hover:bg-transparent";

/**
 * Formularios de cotización que quedaron a medias (con permiso para
 * escribirles): qué alcanzaron a contar y acciones para recuperarlos.
 */
export function DraftsTable({ locale, drafts, kpis }: { locale: Locale; drafts: LeadDraft[]; kpis: DraftsKpis }) {
  const t = followupEditorCopy[locale].drafts;
  const form = leadFormCopy[locale].steps;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const pending = drafts.filter((d) => !d.reminded_at).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts
      .filter((d) => (tab === "pending" ? !d.reminded_at : tab === "reminded" ? !!d.reminded_at : true))
      .filter((d) => !q || [d.name, d.email, d.company, d.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [drafts, tab, query]);

  const act = async (id: string, kind: "remind" | "delete") => {
    if (kind === "delete" && !window.confirm(t.confirmDelete)) return;
    setBusy(`${kind}:${id}`);
    setError(null);
    const { error: e } = kind === "remind" ? await supabase.rpc("draft_remind", { p_id: id }) : await supabase.rpc("draft_delete", { p_id: id });
    setBusy(null);
    if (e) return setError(t.error.replace("{detail}", e.message));
    router.refresh();
  };

  const ago = (iso: string) => {
    const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
    if (m < 1) return t.ago.now;
    if (m < 60) return t.ago.m.replace("{n}", String(m));
    if (m < 1440) return t.ago.h.replace("{n}", String(Math.round(m / 60)));
    return t.ago.d.replace("{n}", String(Math.round(m / 1440)));
  };
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  /** Resumen de lo que respondió (problema, presupuesto, plazo). */
  const answered = (d: LeadDraft) => {
    const a = (d.answers ?? {}) as Record<string, string>;
    return [
      (form.problem.options as Record<string, string>)[a.problem_category],
      (form.budget.options as Record<string, string>)[a.budget],
      (form.timeline.options as Record<string, string>)[a.timeline],
    ].filter(Boolean);
  };
  const waNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 ? `57${digits}` : digits;
  };

  const recoveredPct = kpis.reminded ? `${Math.round((kpis.recovered / kpis.reminded) * 100)}%` : "—";
  const strip = [
    { key: "pending", value: pending, hint: null },
    { key: "drafts", value: kpis.drafts, hint: null },
    { key: "reminded", value: kpis.reminded, hint: null },
    { key: "recovered", value: kpis.recovered, hint: t.recoveredHint.replace("{pct}", recoveredPct) },
  ] as const;

  return (
    <>
      <div className="grid border-b border-line sm:grid-cols-2 xl:grid-cols-4">
        {strip.map((k) => (
          <div key={k.key} className="border-line px-6 py-5 sm:border-r xl:last:border-r-0">
            <p className="text-sm text-muted">{t.kpis[k.key]}</p>
            <p className="mt-1 text-[2rem] font-semibold leading-none tabular-nums text-heading">{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-muted">{k.hint}</p>}
          </div>
        ))}
      </div>

      <div role="tablist" aria-label={t.cols.reminder} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
        {(Object.keys(t.tabs) as Tab[]).map((k) => {
          const n = k === "pending" ? pending : k === "reminded" ? drafts.length - pending : drafts.length;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[k]}
              {n > 0 && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
            />
          </label>
          <p className="text-sm text-muted">{t.hint}</p>
        </div>
        {error && (
          <p role="alert" className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {visible.length === 0 ? (
          <p className="rounded-xl border border-line py-16 text-center text-sm text-muted">{drafts.length === 0 ? t.empty : t.emptyFilter}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-[0.92rem]">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  {(["contact", "step", "answers", "page", "activity", "reminder"] as const).map((k) => (
                    <th key={k} scope="col" className="px-3 py-3 font-medium first:pl-1">
                      {t.cols[k]}
                    </th>
                  ))}
                  <th scope="col" className="w-40">
                    <span className="sr-only">{t.remind}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((d) => {
                  const steps = Math.min(d.step + 1, 5);
                  const answers = answered(d);
                  return (
                    <tr key={d.id} className="border-b border-line align-top transition-colors hover:bg-[#fafafa] dark:hover:bg-white/[0.03]">
                      <td className="py-3 pl-1 pr-3">
                        <span className="block font-medium text-heading">{d.name || "—"}</span>
                        <span className="block text-xs text-muted">{[d.email, d.phone].filter(Boolean).join(" · ") || t.noEmail}</span>
                        {d.company && <span className="block text-xs text-muted">{d.company}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm tabular-nums text-heading">{t.stepOf.replace("{n}", String(steps))}</span>
                        <span className="mt-1.5 block h-1.5 w-24 overflow-hidden rounded-full bg-card-soft dark:bg-white/10" aria-hidden>
                          <span className="block h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${(steps / 5) * 100}%` }} />
                        </span>
                      </td>
                      <td className="max-w-[18rem] px-3 py-3">
                        {answers.length ? (
                          <span className="flex flex-wrap gap-1">
                            {answers.map((x) => (
                              <span key={x} className="rounded-md bg-card-soft px-1.5 py-0.5 text-xs text-heading dark:bg-white/[0.08]">
                                {x}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-3 font-mono text-xs text-muted">{d.source_page ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-body" title={fmt(d.updated_at)}>
                        {ago(d.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {d.reminded_at ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {t.reminded.replace("{date}", fmt(d.reminded_at))}
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{t.notReminded}</span>
                        )}
                      </td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => void act(d.id, "remind")}
                            disabled={!!d.reminded_at || !d.email || busy !== null}
                            aria-label={t.remind}
                            title={t.remind}
                            className={iconBtn}
                          >
                            {busy === `remind:${d.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BellRing className="h-4 w-4" aria-hidden />}
                          </button>
                          {d.phone && (
                            <a href={`https://wa.me/${waNumber(d.phone)}`} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp} title={t.whatsapp} className={iconBtn}>
                              <MessageCircle className="h-4 w-4" aria-hidden />
                            </a>
                          )}
                          {d.email && (
                            <a href={`mailto:${d.email}`} aria-label={t.email} title={t.email} className={iconBtn}>
                              <Mail className="h-4 w-4" aria-hidden />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => void act(d.id, "delete")}
                            disabled={busy !== null}
                            aria-label={t.delete}
                            title={t.delete}
                            className={cn(iconBtn, "text-muted hover:text-red-600")}
                          >
                            {busy === `delete:${d.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                          </button>
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
    </>
  );
}
