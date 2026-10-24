import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { Journey } from "@/components/analytics/Journey";
import { analyticsCopy } from "@/content/analytics";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { PageView, Visitor } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default async function VisitorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "marketing", "sales"]);
  const { v: selected } = await searchParams;
  const t = analyticsCopy[locale];

  const [{ data: visitors }, { data: views }] = await Promise.all([
    supabase.from("visitors").select("*, lead:leads(id, name, tier)").order("last_seen", { ascending: false }).limit(100),
    selected
      ? supabase.from("page_views").select("id, path, title, created_at, duration_ms, max_scroll, session_id").eq("visitor_id", selected).order("created_at").limit(300)
      : Promise.resolve({ data: [] as PageView[] }),
  ]);

  const rows = (visitors ?? []) as unknown as (Visitor & { lead: { id: string; name: string } | null })[];
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
  const source = (v: Visitor) => {
    const utm = (v.first_utm ?? {}) as Record<string, string>;
    if (utm.utm_source) return utm.utm_source;
    if (v.first_gclid) return t.sourceNames["google-ads"];
    if (v.first_referrer) {
      try {
        return new URL(v.first_referrer).hostname.replace(/^www\./, "");
      } catch {
        return v.first_referrer;
      }
    }
    return t.sourceNames.direct;
  };

  return (
    <>
      <Link href={`/${locale}/portal/analitica`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-4">
        <PageHeader title={t.visitorsTitle} subtitle={t.visitorsSubtitle} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">{t.empty}</p>
          ) : (
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">{t.lead}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t.source}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t.landing}</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">{t.pages}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{t.lastSeen}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((v) => (
                  <tr key={v.id} className={cn(selected === v.id && "bg-accent-soft")}>
                    <td className="px-5 py-3">
                      {v.lead ? (
                        <Link href={`/${locale}/portal/crm/${v.lead.id}`} className="font-bold text-heading hover:underline">
                          {v.lead.name}
                        </Link>
                      ) : (
                        <Link href={`/${locale}/portal/analitica/visitantes?v=${v.id}`} className="font-semibold text-muted hover:text-heading hover:underline">
                          {t.anonymous} · {v.id.slice(0, 6)}
                        </Link>
                      )}
                      <p className="text-xs text-muted">{t.deviceNames[v.device ?? "unknown"]}{v.country ? ` · ${v.country}` : ""}</p>
                    </td>
                    <td className="px-5 py-3 text-body">{source(v)}</td>
                    <td className="max-w-48 truncate px-5 py-3 text-body">{v.first_landing ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-heading">
                      <Link href={`/${locale}/portal/analitica/visitantes?v=${v.id}`} className="hover:underline">
                        {v.page_views}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-body">{fmt.format(new Date(v.last_seen))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selected && (
          <section className="h-fit rounded-lg bg-surface p-6 shadow-meta dark:bg-card">
            <h2 className="text-lg text-heading">{t.journeyTitle}</h2>
            <div className="mt-4">
              <Journey locale={locale} views={(views ?? []) as PageView[]} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
