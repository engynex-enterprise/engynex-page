import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { RulesList } from "@/components/automations/RulesList";
import { StatTile } from "@/components/analytics/Charts";
import { buttonClasses } from "@/components/ui/Button";
import { rulesCopy } from "@/content/rules";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { daysAgoIso } from "@/lib/dates";
import type { AutomationRule, AutomationRun } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ENTITY_PATH: Record<string, string> = { lead: "crm", ticket: "soporte", chat: "chat?c=" };

export default async function AutomationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing"]);
  const t = rulesCopy;
  const { tab } = await searchParams;
  const history = tab === "historial";
  const canEdit = profile.role === "admin" || profile.role === "marketing";
  const since = daysAgoIso(30);

  const [{ data: rules }, { data: runs }, { count: runs30 }, { count: failed30 }] = await Promise.all([
    supabase.from("automation_rules").select("*").order("enabled", { ascending: false }).order("created_at"),
    history
      ? supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(150)
      : Promise.resolve({ data: [] as AutomationRun[] }),
    supabase.from("automation_runs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("automation_runs").select("id", { count: "exact", head: true }).gte("created_at", since).eq("status", "failed"),
  ]);
  const list = (rules ?? []) as AutomationRule[];
  const names = Object.fromEntries(list.map((r) => [r.id, r.name]));
  const last = list.reduce<string | null>((m, r) => (r.last_run_at && (!m || r.last_run_at > m) ? r.last_run_at : m), null);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const base = `/${locale}/portal/automatizaciones`;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={
          canEdit ? (
            <Link href={`${base}/nueva`} className={buttonClasses("primary", "md")}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.create}
            </Link>
          ) : undefined
        }
      />
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t.stats.active} value={`${list.filter((r) => r.enabled).length} / ${list.length}`} />
        <StatTile label={t.stats.runs} value={(runs30 ?? 0).toLocaleString(locale)} />
        <StatTile label={t.stats.failed} value={(failed30 ?? 0).toLocaleString(locale)} />
        <StatTile label={t.stats.last} value={last ? fmt(last) : "—"} />
      </dl>

      <nav aria-label={t.title} className="mb-4 flex gap-1 border-b border-line">
        {([["rules", base], ["history", `${base}?tab=historial`]] as const).map(([key, href]) => {
          const active = (key === "history") === history;
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-[3px] px-4 py-3 text-[0.94rem] font-semibold",
                active ? "border-deep-700 text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[key]}
            </Link>
          );
        })}
      </nav>

      {!canEdit && <p className="mb-3 text-sm text-muted">{t.readOnly}</p>}

      {!history ? (
        <RulesList locale={locale} rules={list} canEdit={canEdit} />
      ) : !runs?.length ? (
        <p className="rounded-lg bg-surface p-10 text-center text-sm text-muted shadow-meta dark:bg-card">{t.history.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {(["when", "rule", "item", "result"] as const).map((k) => (
                  <th key={k} scope="col" className="px-4 py-3 font-semibold">{t.history.cols[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(runs as AutomationRun[]).map((r) => {
                const detail = (r.detail ?? {}) as { actions?: { type: string }[]; error?: string };
                const path = ENTITY_PATH[r.entity];
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`${base}/${r.rule_id}`} className="font-semibold text-heading hover:underline">{names[r.rule_id] ?? "—"}</Link>
                    </td>
                    <td className="px-4 py-3 text-body">
                      {path ? (
                        <Link
                          href={`/${locale}/portal/${path}${path.endsWith("=") ? "" : "/"}${r.entity_id}`}
                          className="hover:underline"
                        >
                          {t.history.entities[r.entity] ?? r.entity}
                        </Link>
                      ) : (
                        (t.history.entities[r.entity] ?? r.entity)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", r.status === "done" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300")}>
                        {r.status === "done" ? t.history.done : t.history.failed}
                      </span>
                      <span className="ml-2 text-xs text-muted">
                        {detail.error ?? (detail.actions ?? []).map((a) => t.actions.types[a.type as keyof typeof t.actions.types]?.label ?? a.type).join(" · ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
