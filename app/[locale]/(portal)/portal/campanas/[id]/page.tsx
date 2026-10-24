import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { CampaignEditor } from "@/components/campaigns/CampaignEditor";
import { CampaignLive } from "@/components/campaigns/CampaignLive";
import { TemplatePreview } from "@/components/campaigns/TemplatePreview";
import { StatTile } from "@/components/analytics/Charts";
import { campaignsCopy } from "@/content/campaigns";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { whatsappMissingFrom } from "@/lib/whatsapp";
import { hasSecretKey, integrationStatus } from "@/lib/integrations";
import { campaignStatusTone } from "@/lib/campaigns";
import type { WaCampaign, WaMessage, WaTemplate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const LIMIT = 500;

export default async function CampaignPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing"]);
  const t = campaignsCopy[locale];

  const { data } = await supabase.from("wa_campaigns").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const campaign = data as WaCampaign;
  const back = (
    <Link href={`/${locale}/portal/campanas`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t.editor.back}
    </Link>
  );
  const pill = (
    <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", campaignStatusTone[campaign.status])}>{t.status[campaign.status]}</span>
  );

  // Antes de enviar: se edita.
  if (campaign.status === "draft" || campaign.status === "scheduled") {
    const { data: templates } = await supabase.from("wa_templates").select("*").eq("status", "APPROVED").order("name");
    return (
      <>
        {back}
        <PageHeader title={campaign.name} action={pill} />
        <CampaignEditor locale={locale} templates={(templates ?? []) as WaTemplate[]} campaign={campaign} ready={whatsappMissingFrom(await integrationStatus(supabase), hasSecretKey()).length === 0} />
      </>
    );
  }

  // Enviando o enviada: informe.
  const [{ data: messages }, { data: stats }, { data: template }] = await Promise.all([
    supabase.from("wa_messages").select("*").eq("campaign_id", id).order("id").limit(LIMIT),
    supabase.rpc("wa_campaign_stats"),
    campaign.template_id
      ? supabase.from("wa_templates").select("*").eq("id", campaign.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const s = stats?.find((x) => x.campaign_id === id);
  const total = campaign.total;
  const pct = (n = 0) => (total ? `${Math.round((n / total) * 100)}%` : "—");
  const rows = (messages ?? []) as WaMessage[];
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso)) : "—";

  return (
    <>
      <CampaignLive id={id} active={campaign.status === "sending"} />
      {back}
      <PageHeader
        title={campaign.name}
        subtitle={t.report.progress.replace("{sent}", String((s?.sent ?? 0) + (s?.failed ?? 0))).replace("{total}", String(total))}
        action={pill}
      />

      {campaign.status === "sending" && (
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-surface-soft dark:bg-white/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={(s?.sent ?? 0) + (s?.failed ?? 0)}>
          <div className="h-full rounded-full bg-brand-green-dark transition-[width] dark:bg-brand-green" style={{ width: pct((s?.sent ?? 0) + (s?.failed ?? 0)) }} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label={t.cols.total} value={total.toLocaleString(locale)} />
        <StatTile label={t.cols.delivered} value={(s?.delivered ?? 0).toLocaleString(locale)} hint={pct(s?.delivered)} />
        <StatTile label={t.cols.read} value={(s?.read ?? 0).toLocaleString(locale)} hint={pct(s?.read)} />
        <StatTile label={t.cols.replied} value={(s?.replied ?? 0).toLocaleString(locale)} hint={pct(s?.replied)} />
        <StatTile label={t.cols.failed} value={(s?.failed ?? 0).toLocaleString(locale)} hint={pct(s?.failed)} />
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          <h2 className="px-5 pt-5 text-base text-heading">{t.report.recipients}</h2>
          <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">{t.report.contact}</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">{t.report.phone}</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">{t.report.state}</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">{t.cols.when}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5">
                    {m.lead_id ? (
                      <Link href={`/${locale}/portal/crm/${m.lead_id}`} className="font-semibold text-heading hover:underline">
                        {m.name ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-heading">{m.name ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-body">+{m.phone}</td>
                  <td className="px-5 py-2.5">
                    <span className={cn("font-semibold", m.status === "failed" ? "text-red-600 dark:text-red-400" : "text-heading")}>
                      {t.report.msgStatus[m.status] ?? m.status}
                    </span>
                    {m.replied_at && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {t.report.repliedTag}
                      </span>
                    )}
                    {m.error && <p className="mt-0.5 max-w-sm truncate text-xs text-muted" title={m.error}>{m.error}</p>}
                  </td>
                  <td className="px-5 py-2.5 text-body">{fmt(m.read_at ?? m.delivered_at ?? m.sent_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= LIMIT && <p className="px-5 py-3 text-xs text-muted">{t.report.showing.replace("{n}", String(LIMIT))}</p>}
        </section>
        {template && (
          <aside>
            <TemplatePreview template={template as WaTemplate} values={[]} caption={(template as WaTemplate).name} />
          </aside>
        )}
      </div>
    </>
  );
}
