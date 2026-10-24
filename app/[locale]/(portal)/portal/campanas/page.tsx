import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { SetupCard } from "@/components/campaigns/SetupCard";
import { TemplatesPanel } from "@/components/campaigns/TemplatesPanel";
import { buttonClasses } from "@/components/ui/Button";
import { campaignsCopy } from "@/content/campaigns";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { whatsappMissingFrom } from "@/lib/whatsapp";
import { hasSecretKey, integrationStatus } from "@/lib/integrations";
import type { WaCampaign, WaTemplate } from "@/lib/supabase/types";
import { campaignStatusTone } from "@/lib/campaigns";
import { cn } from "@/lib/utils";


export default async function CampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const { tab } = await searchParams;
  const t = campaignsCopy[locale];
  const showTemplates = tab === "plantillas";
  const missing = whatsappMissingFrom(await integrationStatus(supabase), hasSecretKey());

  const [{ data: campaigns }, { data: templates }, { data: stats }] = await Promise.all([
    supabase.from("wa_campaigns").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("wa_templates").select("*").order("name"),
    supabase.rpc("wa_campaign_stats"),
  ]);
  const tplName = Object.fromEntries((templates ?? []).map((x) => [x.id, x.name]));
  const byCampaign = Object.fromEntries((stats ?? []).map((s) => [s.campaign_id, s]));
  const fmt = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso))
      : "—";
  const base = `/${locale}/portal/campanas`;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={
          <Link href={`${base}/nueva`} className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.newCampaign}
          </Link>
        }
      />
      <SetupCard locale={locale} missing={missing} />

      <nav aria-label={t.title} className="mt-8 flex gap-1 border-b border-line">
        {([["campaigns", base], ["templates", `${base}?tab=plantillas`]] as const).map(([key, href]) => {
          const active = (key === "templates") === showTemplates;
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                active ? "border-deep-700 text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.tabs[key]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {showTemplates ? (
          <TemplatesPanel locale={locale} templates={(templates ?? []) as WaTemplate[]} ready={missing.length === 0} />
        ) : !campaigns?.length ? (
          <p className="rounded-3xl bg-surface p-10 text-center text-sm text-muted ring-1 ring-line dark:bg-card">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-surface ring-1 ring-line dark:bg-card">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  {(["name", "template", "when", "total", "delivered", "read", "replied", "failed", "status"] as const).map((k) => (
                    <th
                      key={k}
                      scope="col"
                      className={cn("px-4 py-3 font-semibold", ["total", "delivered", "read", "replied", "failed"].includes(k) && "text-right")}
                    >
                      {t.cols[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(campaigns as WaCampaign[]).map((c) => {
                  const s = byCampaign[c.id];
                  const num = (n?: number) => (n ?? 0).toLocaleString(locale);
                  return (
                    <tr key={c.id} className="hover:bg-surface-soft/60 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Link href={`${base}/${c.id}`} className="font-bold text-heading hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-body">{c.template_id ? tplName[c.template_id] ?? "—" : "—"}</td>
                      <td className="px-4 py-3 text-body">{fmt(c.scheduled_at ?? c.started_at ?? c.created_at)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{num(c.total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{num(s?.delivered)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{num(s?.read)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{num(s?.replied)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-heading">{num(s?.failed)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", campaignStatusTone[c.status])}>{t.status[c.status]}</span>
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
