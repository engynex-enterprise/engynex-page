"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Copy,
  Headset,
  ListChecks,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Play,
  Tag,
  Trash2,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AutomationRule } from "@/lib/supabase/types";
import { rulesCopy, TRIGGERS, type ActionType, type RuleAction, type TriggerKey } from "@/content/rules";
import { buttonClasses } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  assign: UserPlus,
  task: ListChecks,
  notify: Bell,
  email: Mail,
  whatsapp: MessageCircle,
  status: Zap,
  tag: Tag,
};

export const GROUP_ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  sales: { icon: Users, tone: "bg-emerald-500" },
  meetings: { icon: CalendarClock, tone: "bg-deep-600" },
  service: { icon: Headset, tone: "bg-violet-500" },
  chat: { icon: MessagesSquare, tone: "bg-sky-500" },
};

/** Lista de reglas con interruptor, como "Automatizaciones" de Meta Business Suite. */
export function RulesList({ locale, rules, canEdit }: { locale: Locale; rules: AutomationRule[]; canEdit: boolean }) {
  const t = rulesCopy;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rules.map((r) => [r.id, r.enabled])));
  const [menu, setMenu] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState<string | null>(null);
  const base = `/${locale}/portal/automatizaciones`;

  const toggle = async (rule: AutomationRule) => {
    const next = !enabled[rule.id];
    setEnabled((e) => ({ ...e, [rule.id]: next }));
    await supabase.from("automation_rules").update({ enabled: next }).eq("id", rule.id);
  };
  const duplicate = async (rule: AutomationRule) => {
    setMenu(null);
    const { data } = await supabase
      .from("automation_rules")
      .insert({
        name: `${rule.name} (copia)`,
        description: rule.description,
        trigger: rule.trigger,
        params: rule.params,
        conditions: rule.conditions,
        actions: rule.actions,
        enabled: false,
      })
      .select("id")
      .single();
    if (data) router.push(`${base}/${data.id}`);
  };
  const remove = async (rule: AutomationRule) => {
    setMenu(null);
    if (!window.confirm(t.confirmDelete)) return;
    await supabase.from("automation_rules").delete().eq("id", rule.id);
    router.refresh();
  };
  const runNow = async () => {
    setRunning(true);
    const { data } = await supabase.rpc("automations_run_now");
    setRunning(false);
    setRan(t.ranResult.replace("{n}", String(data ?? 0)));
    router.refresh();
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="grid gap-3">
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={runNow} disabled={running} className={buttonClasses("outline", "md", "h-10 disabled:opacity-60")}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {running ? t.running : t.runNow}
          </button>
          <span className="text-sm text-muted">{ran ?? t.scheduleNote}</span>
        </div>
      )}
      {rules.length === 0 && <p className="rounded-lg bg-surface p-10 text-center text-sm text-muted shadow-meta dark:bg-card">{t.empty}</p>}
      <ul className="grid min-w-0 gap-3">
        {rules.map((rule) => {
          const trig = TRIGGERS[rule.trigger as TriggerKey];
          const g = GROUP_ICONS[trig?.group ?? "sales"];
          const GIcon = g.icon;
          const actions = (rule.actions as RuleAction[]) ?? [];
          const on = enabled[rule.id];
          return (
            <li key={rule.id} className={cn("flex min-w-0 flex-wrap items-center gap-4 rounded-lg bg-surface p-4 shadow-meta sm:flex-nowrap dark:bg-card", !on && "opacity-70")}>
              <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-white", g.tone)}>
                <GIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`${base}/${rule.id}`} className="block truncate text-[0.95rem] font-semibold text-heading hover:underline">
                  {rule.name}
                </Link>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {t.triggers[rule.trigger as TriggerKey]?.label ?? rule.trigger}
                  {rule.description ? ` · ${rule.description}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {actions.map((a, i) => {
                    const Icon = ACTION_ICONS[a.type] ?? Zap;
                    return (
                      <span key={i} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-card-soft px-2.5 text-xs font-semibold text-heading">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {t.actions.types[a.type]?.label ?? a.type}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="hidden w-44 shrink-0 text-right text-xs text-muted md:block">
                <p className="font-semibold text-heading">{t.runs.replace("{n}", rule.runs.toLocaleString(locale))}</p>
                <p>{rule.last_run_at ? t.lastRun.replace("{date}", fmt(rule.last_run_at)) : t.never}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${rule.name}: ${on ? t.on : t.off}`}
                disabled={!canEdit}
                onClick={() => toggle(rule)}
                className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-emerald-500" : "bg-line-strong dark:bg-white/20")}
              >
                <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]", on ? "left-6" : "left-1")} />
              </button>
              {canEdit && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenu((m) => (m === rule.id ? null : rule.id))}
                    aria-label={`${t.edit}: ${rule.name}`}
                    aria-expanded={menu === rule.id}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)]"
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden />
                  </button>
                  {menu === rule.id && (
                    <div className="absolute right-0 top-10 z-20 w-48 rounded-lg bg-surface p-1.5 shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:bg-card">
                      <Link href={`${base}/${rule.id}`} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-heading hover:bg-[var(--meta-hover)]">
                        <Pencil className="h-4 w-4" aria-hidden />
                        {t.edit}
                      </Link>
                      <button type="button" onClick={() => duplicate(rule)} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-heading hover:bg-[var(--meta-hover)]">
                        <Copy className="h-4 w-4" aria-hidden />
                        {t.duplicate}
                      </button>
                      <button type="button" onClick={() => remove(rule)} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-600 hover:bg-[var(--meta-hover)]">
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {t.delete}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
