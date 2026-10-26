"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ChevronDown, Clock, Copy, Folder, Loader2, MoreHorizontal, Pause, Pencil, Play, Search, Timer, Trash2, X, Zap } from "lucide-react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import { ACTION_ICONS, GROUP_ICONS } from "@/components/automations/icons";
import { automationsProCopy, shortSpan } from "@/content/automationsPro";
import { rulesCopy, TRIGGERS, type RuleAction, type RuleGroup, type TriggerKey } from "@/content/rules";
import type { Locale } from "@/i18n/config";
import type { AutomationRule } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type State = "all" | "on" | "off" | "errors";

/** Orden de las carpetas de las reglas listas para usar; las demás van después. */
const FOLDER_ORDER = ["Ventas", "Reuniones", "Soporte", "Chat", "Tareas", "Clientes"];

const GROUP_TONE: Record<RuleGroup, string> = {
  sales: "bg-emerald-600",
  meetings: "bg-deep-600",
  service: "bg-violet-600",
  chat: "bg-sky-600",
  tasks: "bg-amber-600",
  deals: "bg-teal-700",
  accounts: "bg-rose-600",
};

/**
 * Reglas agrupadas por carpeta (secciones plegables), con búsqueda y filtros
 * por área, carpeta y estado; interruptor por regla, menú (editar, duplicar,
 * eliminar) y acciones en lote (activar, pausar, mover, eliminar).
 */
export function RulesList({
  locale,
  rules,
  canEdit,
  errors7,
  now,
}: {
  locale: Locale;
  rules: AutomationRule[];
  canEdit: boolean;
  /** Ejecuciones con error en 7 días, por regla. */
  errors7: Record<string, number>;
  now: string;
}) {
  const t = automationsProCopy[locale];
  const r = rulesCopy;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const base = `/${locale}/portal/automatizaciones`;
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rules.map((x) => [x.id, x.enabled])));
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [folder, setFolder] = useState("");
  const [state, setState] = useState<State>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nowMs = new Date(now).getTime();

  const rank = (f: string) => (f === "" ? 99 : FOLDER_ORDER.indexOf(f) === -1 ? 50 : FOLDER_ORDER.indexOf(f));
  const folders = [...new Set(rules.map((x) => x.folder ?? ""))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const groups = [...new Set(rules.map((x) => TRIGGERS[x.trigger as TriggerKey]?.group).filter(Boolean))] as RuleGroup[];

  const term = q.trim().toLowerCase();
  const visible = rules.filter((x) => {
    const trig = TRIGGERS[x.trigger as TriggerKey];
    if (group && trig?.group !== group) return false;
    if (folder && (x.folder ?? "") !== (folder === "__none" ? "" : folder)) return false;
    if (state === "on" && !enabled[x.id]) return false;
    if (state === "off" && enabled[x.id]) return false;
    if (state === "errors" && !errors7[x.id]) return false;
    if (term && ![x.name, x.description, r.triggers[x.trigger as TriggerKey]?.label].some((v) => v?.toLowerCase().includes(term))) return false;
    return true;
  });
  const sections = folders
    .map((f) => ({ folder: f, rules: visible.filter((x) => (x.folder ?? "") === f) }))
    .filter((s) => s.rules.length > 0);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const toggle = async (rule: AutomationRule) => {
    const next = !enabled[rule.id];
    setEnabled((e) => ({ ...e, [rule.id]: next }));
    const { error } = await supabase.from("automation_rules").update({ enabled: next }).eq("id", rule.id);
    if (error) setEnabled((e) => ({ ...e, [rule.id]: !next }));
  };
  const duplicate = async (rule: AutomationRule) => {
    setMenu(null);
    const { data } = await supabase.rpc("automation_duplicate", { p_rule: rule.id });
    if (data) router.push(`${base}/${data}`);
  };
  const remove = async (rule: AutomationRule) => {
    setMenu(null);
    if (!window.confirm(r.confirmDelete)) return;
    await supabase.from("automation_rules").delete().eq("id", rule.id);
    router.refresh();
  };
  const runCheck = async () => {
    setBusy(true);
    const { data } = await supabase.rpc("automations_run_now");
    setBusy(false);
    flash(r.ranResult.replace("{n}", String(data ?? 0)));
    router.refresh();
  };

  const bulk = async (kind: "enable" | "disable" | "move" | "remove") => {
    const ids = [...selected];
    if (!ids.length) return;
    if (kind === "remove" && !window.confirm(t.bulk.confirmRemove.replace("{n}", String(ids.length)))) return;
    let folderName: string | null = null;
    if (kind === "move") {
      const value = window.prompt(t.bulk.movePrompt);
      if (value === null) return;
      folderName = value.trim().slice(0, 40) || null;
    }
    setBusy(true);
    const q =
      kind === "remove"
        ? supabase.from("automation_rules").delete().in("id", ids)
        : supabase
            .from("automation_rules")
            .update(kind === "move" ? { folder: folderName } : { enabled: kind === "enable" })
            .in("id", ids);
    const { error } = await q;
    setBusy(false);
    if (!error && (kind === "enable" || kind === "disable")) {
      setEnabled((e) => ({ ...e, ...Object.fromEntries(ids.map((id) => [id, kind === "enable"])) }));
    }
    flash(error ? r.editor.errors.generic : r.editor.saved);
    setSelected(new Set());
    router.refresh();
  };

  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSel = visible.length > 0 && visible.every((x) => selected.has(x.id));
  const fmt = (iso: string) => {
    const diff = nowMs - new Date(iso).getTime();
    return diff < 7 * 86_400_000
      ? t.ago.replace("{t}", shortSpan(diff))
      : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(iso));
  };
  const iconBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-60";
  const menuItem = "flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-heading hover:bg-[var(--meta-hover)]";

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      {/* Barra de filtros o de acciones en lote */}
      <div className="flex min-h-[3.75rem] flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        {selected.size > 0 ? (
          <>
            <span className="text-sm font-semibold text-heading">{t.selected.replace("{n}", String(selected.size))}</span>
            <button type="button" disabled={busy} onClick={() => bulk("enable")} className={iconBtn}>
              <Play className="h-4 w-4" aria-hidden />
              {t.bulk.enable}
            </button>
            <button type="button" disabled={busy} onClick={() => bulk("disable")} className={iconBtn}>
              <Pause className="h-4 w-4" aria-hidden />
              {t.bulk.disable}
            </button>
            <button type="button" disabled={busy} onClick={() => bulk("move")} className={iconBtn}>
              <Folder className="h-4 w-4" aria-hidden />
              {t.bulk.move}
            </button>
            <button type="button" disabled={busy} onClick={() => bulk("remove")} className={cn(iconBtn, "text-red-600 dark:text-red-400")}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.bulk.remove}
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
              <label className="sr-only" htmlFor="rule-search">{t.search}</label>
              <input
                ref={searchRef}
                id="rule-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search}
                className="h-9 w-64 max-w-full rounded-[10px] bg-transparent pl-9 pr-8 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line px-1 text-[0.7rem] text-muted">/</kbd>
            </div>
            <div className="w-48">
              <Select
                size="sm"
                label={t.filters.group}
                value={group}
                onChange={setGroup}
                options={[{ value: "", label: t.filters.anyGroup }, ...groups.map((g) => ({ value: g, label: r.groups[g] }))]}
              />
            </div>
            <div className="w-48">
              <Select
                size="sm"
                label={t.filters.folder}
                value={folder}
                onChange={setFolder}
                options={[{ value: "", label: t.filters.anyFolder }, ...folders.map((f) => ({ value: f || "__none", label: f || t.noFolder }))]}
              />
            </div>
            <div className="w-52">
              <Select
                size="sm"
                label={t.filters.state}
                value={state}
                onChange={(v) => setState(v as State)}
                options={(["all", "on", "off", "errors"] as const).map((s) => ({ value: s, label: t.filters.states[s] }))}
              />
            </div>
            {canEdit && (
              <button type="button" onClick={runCheck} disabled={busy} className={cn(iconBtn, "ml-auto")} title={r.scheduleNote}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Clock className="h-4 w-4" aria-hidden />}
                {t.runCheck}
              </button>
            )}
          </>
        )}
        {message && (
          <p role="status" className="text-sm text-muted">
            {message}
          </p>
        )}
      </div>

      <div className="grid gap-5 px-4 py-6 sm:px-6">
        {!canEdit && <p className="text-sm text-muted">{r.readOnly}</p>}
        {sections.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{rules.length ? t.empty : r.empty}</p>
        ) : (
          <>
            {canEdit && (
              <label className="flex w-fit items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={allSel}
                  onChange={() => setSelected(allSel ? new Set() : new Set(visible.map((x) => x.id)))}
                  className="h-4 w-4 accent-[#467316]"
                />
                {t.selectAll}
              </label>
            )}
            {sections.map((s) => {
              const name = s.folder || t.noFolder;
              const open = !collapsed.has(s.folder);
              const active = s.rules.filter((x) => enabled[x.id]).length;
              return (
                <section key={s.folder || "__none"} className="overflow-visible rounded-xl border border-line bg-surface dark:bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((c) => {
                        const n = new Set(c);
                        if (n.has(s.folder)) n.delete(s.folder);
                        else n.add(s.folder);
                        return n;
                      })
                    }
                    aria-expanded={open}
                    aria-label={(open ? t.collapse : t.expand).replace("{name}", name)}
                    className="flex w-full items-center gap-2 rounded-t-xl px-5 py-3.5 text-left hover:bg-[var(--meta-hover)]"
                  >
                    <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", !open && "-rotate-90")} aria-hidden />
                    <Folder className="h-4 w-4 text-muted" aria-hidden />
                    <span className="font-semibold text-heading">{name}</span>
                    <span className="text-sm tabular-nums text-muted">
                      {active} / {s.rules.length}
                    </span>
                  </button>
                  {open && (
                    <ul className="divide-y divide-line border-t border-line">
                      {s.rules.map((rule) => {
                        const trig = TRIGGERS[rule.trigger as TriggerKey];
                        const g = (trig?.group ?? "sales") as RuleGroup;
                        const GIcon = GROUP_ICONS[g] ?? Zap;
                        const actions = (rule.actions as RuleAction[]) ?? [];
                        const on = enabled[rule.id];
                        const errs = errors7[rule.id] ?? 0;
                        return (
                          <li key={rule.id} className={cn("flex min-w-0 items-start gap-3 px-5 py-4 hover:bg-[var(--meta-hover)]", selected.has(rule.id) && "bg-[var(--meta-active)]")}>
                            {canEdit && (
                              <input
                                type="checkbox"
                                aria-label={t.selectRule.replace("{name}", rule.name)}
                                checked={selected.has(rule.id)}
                                onChange={() => toggleSel(rule.id)}
                                className="mt-3 h-4 w-4 shrink-0 accent-[#467316]"
                              />
                            )}
                            <span className={cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white", GROUP_TONE[g], !on && "opacity-50")} title={r.groups[g]}>
                              <GIcon className="h-5 w-5" aria-hidden />
                            </span>
                            <div className={cn("min-w-0 flex-1", !on && "opacity-70")}>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <Link href={`${base}/${rule.id}`} className="truncate text-[0.95rem] font-semibold text-heading hover:underline">
                                  {rule.name}
                                </Link>
                                {errs > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.7rem] font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-300">
                                    <AlertTriangle className="h-3 w-3" aria-hidden />
                                    {t.errorsBadge.replace("{n}", String(errs))}
                                  </span>
                                )}
                              </div>
                              {rule.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{rule.description}</p>}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-muted">{t.when}</span>
                                <span className="rounded-md bg-[var(--meta-active)] px-2 py-1 font-medium text-heading">
                                  {r.triggers[rule.trigger as TriggerKey]?.label ?? rule.trigger}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted" aria-label={t.then} />
                                {actions.map((a, i) => {
                                  const Icon = ACTION_ICONS[a.type] ?? Zap;
                                  const label = r.actions.types[a.type]?.label ?? a.type;
                                  return (
                                    <span key={i} title={label} className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-heading ring-1 ring-line">
                                      <Icon className="h-3.5 w-3.5" aria-hidden />
                                      <span className="hidden sm:inline">{label}</span>
                                    </span>
                                  );
                                })}
                                {rule.delay_minutes > 0 && (
                                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-100 px-2 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                    <Timer className="h-3.5 w-3.5" aria-hidden />
                                    {t.delay.replace("{t}", shortSpan(rule.delay_minutes * 60_000))}
                                  </span>
                                )}
                                {rule.max_per_day && (
                                  <span className="inline-flex h-6 items-center rounded-full px-2 text-muted ring-1 ring-line">{t.maxPerDay.replace("{n}", String(rule.max_per_day))}</span>
                                )}
                              </div>
                            </div>
                            <div className="hidden w-36 shrink-0 text-right text-xs text-muted md:block">
                              <p className="font-semibold tabular-nums text-heading">{r.runs.replace("{n}", rule.runs.toLocaleString(locale))}</p>
                              <p>{rule.last_run_at ? fmt(rule.last_run_at) : r.never}</p>
                              <p>{trig?.instant ? t.instant : t.timed}</p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={on}
                              aria-label={`${rule.name}: ${on ? r.on : r.off}`}
                              disabled={!canEdit}
                              onClick={() => toggle(rule)}
                              className={cn("relative mt-2 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong dark:bg-white/20")}
                            >
                              <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
                            </button>
                            {canEdit && (
                              <div className="relative mt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setMenuAnchor(e.currentTarget);
                                    setMenu((m) => (m === rule.id ? null : rule.id));
                                  }}
                                  aria-label={`${r.edit}: ${rule.name}`}
                                  aria-expanded={menu === rule.id}
                                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)]"
                                >
                                  <MoreHorizontal className="h-5 w-5" aria-hidden />
                                </button>
                                {menu === rule.id && (
                                  <FloatingPanel anchor={menuAnchor} open onClose={() => setMenu(null)} role="menu" className="w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg dark:bg-card">
                                    <Link href={`${base}/${rule.id}`} className={menuItem}>
                                      <Pencil className="h-4 w-4" aria-hidden />
                                      {r.edit}
                                    </Link>
                                    <button type="button" onClick={() => duplicate(rule)} className={menuItem}>
                                      <Copy className="h-4 w-4" aria-hidden />
                                      {r.duplicate}
                                    </button>
                                    <button type="button" onClick={() => remove(rule)} className={cn(menuItem, "text-red-600 dark:text-red-400")}>
                                      <Trash2 className="h-4 w-4" aria-hidden />
                                      {r.delete}
                                    </button>
                                  </FloatingPanel>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
