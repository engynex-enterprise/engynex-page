"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CloudDownload, Plus, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HealthBadge } from "@/components/accounts/HealthBadge";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { accountsListCopy } from "@/content/accountsList";
import { accountsProCopy } from "@/content/accountsPro";
import type { Locale } from "@/i18n/config";
import { accountStages, accountStageTone, daysUntil, money } from "@/lib/accounts";
import type { AccountRow, AccountStage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Tab = "all" | "client" | "provider" | "risk" | "renewals" | "inactive";
type SortKey = "name" | "health" | "monthly" | "renewal" | "tickets" | "lastSeen";

const isRisk = (a: AccountRow) => a.stage === "at_risk" || a.health < 50;
const isInactive = (a: AccountRow) => !a.active || a.stage === "churned";

/**
 * Lista de cuentas con métricas arriba, pestañas, búsqueda, filtros, orden por
 * columna, acciones en lote (responsable, etapa, etiqueta) y exportación CSV.
 */
export function AccountsList({
  locale,
  rows,
  employees,
  today,
  admin,
}: {
  locale: Locale;
  rows: AccountRow[];
  employees: { id: string; name: string }[];
  today: string;
  admin: boolean;
}) {
  const t = accountsListCopy[locale];
  const p = accountsProCopy[locale];
  const router = useRouter();
  const base = `/${locale}/portal/clientes`;
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));

  const renewSoon = (a: AccountRow) => a.renewal_date != null && daysUntil(a.renewal_date, today) <= 30;
  const inTab: Record<Tab, (a: AccountRow) => boolean> = {
    all: (a) => !isInactive(a),
    client: (a) => a.kind === "client" && !isInactive(a),
    provider: (a) => a.kind === "provider" && !isInactive(a),
    risk: (a) => isRisk(a) && !isInactive(a),
    renewals: (a) => renewSoon(a) && !isInactive(a),
    inactive: isInactive,
  };
  const counts = Object.fromEntries((Object.keys(inTab) as Tab[]).map((k) => [k, rows.filter(inTab[k]).length])) as Record<Tab, number>;
  const tags = [...new Set(rows.flatMap((a) => a.tags))].sort();

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const val: Record<SortKey, (a: AccountRow) => number | string> = {
      name: (a) => a.name.toLowerCase(),
      health: (a) => a.health,
      monthly: (a) => a.monthly_value,
      renewal: (a) => a.renewal_date ?? "9999",
      tickets: (a) => a.open_tickets,
      lastSeen: (a) => a.last_seen_at ?? "",
    };
    return rows
      .filter(inTab[tab])
      .filter((a) => !owner || (owner === "none" ? !a.owner_id : a.owner_id === owner))
      .filter((a) => !stage || a.stage === stage)
      .filter((a) => !tag || a.tags.includes(tag))
      .filter((a) => !term || [a.name, a.company, a.email, a.city].some((v) => v?.toLowerCase().includes(term)))
      .sort((x, y) => {
        const a = val[sort.key](x);
        const b = val[sort.key](y);
        return (a < b ? -1 : a > b ? 1 : 0) * sort.dir;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tab, owner, stage, tag, q, sort, today]);

  const active = rows.filter((a) => !isInactive(a));
  const kpis = [
    { key: "accounts", value: active.length.toLocaleString(locale) },
    { key: "clients", value: active.filter((a) => a.kind === "client").length.toLocaleString(locale) },
    { key: "mrr", value: money(active.filter((a) => a.kind === "client").reduce((n, a) => n + a.monthly_value, 0), locale) },
    { key: "atRisk", value: counts.risk.toLocaleString(locale), alert: counts.risk > 0 },
    { key: "renewals", value: counts.renewals.toLocaleString(locale) },
    { key: "tickets", value: active.reduce((n, a) => n + a.open_tickets, 0).toLocaleString(locale) },
  ] as { key: keyof typeof t.kpis; value: string; alert?: boolean }[];

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allChecked = list.length > 0 && list.every((a) => selected.has(a.id));

  const bulk = async (patch: { owner_id?: string | null; stage?: AccountStage } | { tag: string }) => {
    const ids = [...selected];
    const supabase = createClient();
    let failed = false;
    if ("tag" in patch) {
      for (const id of ids) {
        const row = rows.find((a) => a.id === id);
        if (!row || row.tags.includes(patch.tag)) continue;
        const { error } = await supabase.from("account_details").update({ tags: [...row.tags, patch.tag] }).eq("profile_id", id);
        failed ||= !!error;
      }
    } else {
      const { error } = await supabase.from("account_details").update(patch).in("profile_id", ids);
      failed = !!error;
    }
    setStatus(failed ? t.error : t.saved);
    setTimeout(() => setStatus(null), 2500);
    if (!failed) setSelected(new Set());
    router.refresh();
  };

  const exportCsv = () => {
    const head = ["nombre", "correo", "telefono", "empresa", "tipo", "etapa", "salud", "responsable", "plan", "mensual", "renovacion", "ciudad", "etiquetas", "solicitudes_abiertas", "ultimo_acceso"];
    const lines = list.map((a) => [
      a.name, a.email, a.phone ?? "", a.company ?? "", p.kinds[a.kind], p.stages[a.stage], String(a.health), a.owner_id ? names[a.owner_id] ?? "" : "",
      a.plan ?? "", String(a.monthly_value), a.renewal_date ?? "", a.city ?? "", a.tags.join(" "), String(a.open_tickets), a.last_seen_at?.slice(0, 10) ?? "",
    ]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "clientes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const fmtSeen = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: iso.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric", timeZone: "America/Bogota" }).format(new Date(iso)) : p.never;
  const renewalLabel = (date: string) => {
    const d = daysUntil(date, today);
    return d < 0 ? p.renewOverdue.replace("{n}", String(-d)) : p.renewIn.replace("{n}", String(d));
  };
  const th = (key: SortKey | null, label: string, right = false) => (
    <th scope="col" className={cn("px-3 py-2.5 font-medium", right && "text-right")} aria-sort={key && sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
      {key ? (
        <button
          type="button"
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "name" || key === "renewal" ? 1 : -1 }))}
          className={cn("inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-heading", sort.key === key && "text-heading")}
          aria-label={t.sortBy.replace("{col}", label)}
        >
          {label}
          {sort.key === key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}
        </button>
      ) : (
        label
      )}
    </th>
  );
  const iconBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      {/* Métricas */}
      <div className="grid border-b border-line sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r xl:border-b-0 xl:[&:nth-child(6n)]:border-r-0">
            <p className="text-sm text-muted">{t.kpis[k.key]}</p>
            <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums", k.alert ? "text-red-600 dark:text-red-400" : "text-heading")}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav aria-label={p.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(Object.keys(t.tabs) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key);
                setSelected(new Set());
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[key]}
              <span className="rounded-full bg-[var(--meta-active)] px-1.5 text-xs tabular-nums text-heading">{counts[key]}</span>
            </button>
          ))}
        </nav>
        <div className="my-2 flex items-center gap-2">
          <button type="button" onClick={exportCsv} className={iconBtn}>
            <CloudDownload className="h-4 w-4" aria-hidden />
            {t.csv}
          </button>
          {admin && (
            <Link href={`/${locale}/portal/usuarios`} title={t.newHint} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.newAccount}
            </Link>
          )}
        </div>
      </div>

      {/* Filtros o acciones en lote */}
      <div className="flex min-h-[3.75rem] flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        {selected.size > 0 ? (
          <>
            <span className="text-sm font-semibold text-heading">{t.selected.replace("{n}", String(selected.size))}</span>
            <div className="w-52">
              <Select
                size="sm"
                label={t.bulk.owner}
                placeholder={t.bulk.owner}
                value=""
                onChange={(v) => bulk({ owner_id: v === "none" ? null : v })}
                options={[{ value: "none", label: p.noOwner }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
            </div>
            <div className="w-48">
              <Select
                size="sm"
                label={t.bulk.stage}
                placeholder={t.bulk.stage}
                value=""
                onChange={(v) => bulk({ stage: v as AccountStage })}
                options={accountStages.map((s) => ({ value: s, label: p.stages[s] }))}
              />
            </div>
            <button
              type="button"
              className={iconBtn}
              onClick={() => {
                const value = window.prompt(t.bulk.tagPrompt)?.trim().toLowerCase();
                if (value) bulk({ tag: value });
              }}
            >
              {t.bulk.tag}
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className={cn(iconBtn, "ring-0")}>
              <X className="h-4 w-4" aria-hidden />
              {t.bulk.clear}
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <label className="sr-only" htmlFor="account-search">{t.search}</label>
              <input
                ref={searchRef}
                id="account-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search}
                className="h-9 w-72 max-w-full rounded-[10px] bg-transparent pl-9 pr-8 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line px-1 text-[0.7rem] text-muted">/</kbd>
            </div>
            <div className="w-56">
              <Select
                size="sm"
                label={t.filters.owner}
                value={owner}
                onChange={setOwner}
                options={[{ value: "", label: `${t.filters.owner}: ${t.filters.any}` }, { value: "none", label: p.noOwner }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
            </div>
            <div className="w-40">
              <Select
                size="sm"
                label={t.filters.stage}
                value={stage}
                onChange={setStage}
                options={[{ value: "", label: `${t.filters.stage}: ${t.filters.any}` }, ...accountStages.map((s) => ({ value: s, label: p.stages[s] }))]}
              />
            </div>
            {tags.length > 0 && (
              <div className="w-40">
                <Select
                  size="sm"
                  label={t.filters.tag}
                  value={tag}
                  onChange={setTag}
                  options={[{ value: "", label: `${t.filters.tag}: ${t.filters.anyTag}` }, ...tags.map((x) => ({ value: x, label: x }))]}
                />
              </div>
            )}
          </>
        )}
        {status && (
          <p role="status" className="ml-auto text-sm text-muted">
            {status}
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="px-4 py-5 sm:px-6">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{t.emptyAll}</p>
        ) : list.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={t.selectAll}
                      checked={allChecked}
                      onChange={() => setSelected(allChecked ? new Set() : new Set(list.map((a) => a.id)))}
                      className="h-4 w-4 accent-[var(--color-brand-green-dark,#467316)]"
                    />
                  </th>
                  {th("name", t.cols.name)}
                  {th(null, t.cols.stage)}
                  {th("health", t.cols.health)}
                  {th(null, t.cols.owner)}
                  {th("monthly", t.cols.monthly, true)}
                  {th("renewal", t.cols.renewal)}
                  {th("tickets", t.cols.tickets, true)}
                  {th("lastSeen", t.cols.lastSeen)}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className={cn("border-b border-line last:border-0 hover:bg-[var(--meta-hover)]", selected.has(a.id) && "bg-[var(--meta-active)]")}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={t.selectRow.replace("{name}", a.name)}
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                        className="h-4 w-4 accent-[var(--color-brand-green-dark,#467316)]"
                      />
                    </td>
                    <td className="max-w-[18rem] px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--meta-active)] text-xs font-semibold text-heading" aria-hidden>
                          {a.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                        </span>
                        <span className="min-w-0">
                          <Link href={`${base}/${a.id}`} className="block truncate font-semibold text-heading hover:underline">
                            {a.name}
                          </Link>
                          <span className="block truncate text-xs text-muted">
                            {[a.company, p.kinds[a.kind], a.city].filter(Boolean).join(" · ")}
                            {!a.active && ` · ${t.inactiveTag}`}
                          </span>
                          {a.tags.length > 0 && (
                            <span className="mt-1 flex flex-wrap gap-1">
                              {a.tags.slice(0, 3).map((x) => (
                                <span key={x} className="rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.7rem] text-heading">{x}</span>
                              ))}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", accountStageTone[a.stage])}>{p.stages[a.stage]}</span>
                    </td>
                    <td className="px-3 py-3">
                      <HealthBadge value={a.health} labels={p.health} compact />
                    </td>
                    <td className="px-3 py-3 text-body">{a.owner_id ? names[a.owner_id] ?? "—" : <span className="text-muted">{p.noOwner}</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-heading">{a.monthly_value ? money(a.monthly_value, locale) : "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {a.renewal_date ? (
                        <span className={cn("tabular-nums", daysUntil(a.renewal_date, today) < 0 ? "text-red-600 dark:text-red-400" : daysUntil(a.renewal_date, today) <= 30 ? "text-amber-700 dark:text-amber-400" : "text-body")}>
                          {renewalLabel(a.renewal_date)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="tabular-nums text-heading">{a.open_tickets}</span>
                      {a.breached > 0 && <span className="block text-xs text-red-600 dark:text-red-400">{t.breached.replace("{n}", String(a.breached))}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-body">{fmtSeen(a.last_seen_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
