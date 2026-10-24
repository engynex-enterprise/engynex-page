"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignSegment, LeadStatus, LeadTier, WaSegment } from "@/lib/supabase/types";
import { campaignsListCopy } from "@/content/campaignsList";
import { campaignsProCopy } from "@/content/campaignsPro";
import { crmCopy } from "@/content/crm";
import { crmPlus } from "@/content/crmPlus";
import { leadFormCopy, type ProblemKey } from "@/content/leadForm";
import type { Locale } from "@/i18n/config";

type Counts = Record<string, { wa: number; email: number }>;

/**
 * Segmentos guardados: resumen legible de los filtros, cuántas personas
 * alcanzan hoy por WhatsApp y por correo, y eliminar.
 */
export function SegmentsPanel({
  locale,
  segments,
  names,
}: {
  locale: Locale;
  segments: CampaignSegment[];
  names: Record<string, string>;
}) {
  const t = campaignsListCopy[locale].segments;
  const pro = campaignsProCopy[locale];
  const crm = crmCopy[locale];
  const problems = leadFormCopy[locale].steps.problem.options as Record<string, string>;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState(segments);
  const [counts, setCounts] = useState<Counts>({});
  const [busy, setBusy] = useState<string | null>(null);

  // Alcance actual de cada segmento (los dos canales).
  useEffect(() => {
    let alive = true;
    void Promise.all(
      segments.flatMap((s) =>
        (["whatsapp", "email"] as const).map(async (ch) => {
          const { data } = await supabase.rpc("campaign_audience", { p_segment: s.segment, p_channel: ch, p_limit: 0 });
          return [s.id, ch, Number((data as { count?: number } | null)?.count ?? 0)] as const;
        }),
      ),
    ).then((rows) => {
      if (!alive) return;
      const next: Counts = {};
      for (const [id, ch, n] of rows) {
        next[id] ??= { wa: 0, email: 0 };
        next[id][ch === "whatsapp" ? "wa" : "email"] = n;
      }
      setCounts(next);
    });
    return () => {
      alive = false;
    };
  }, [segments, supabase]);

  const summary = (raw: CampaignSegment["segment"]) => {
    const s = (raw ?? {}) as WaSegment;
    const parts = [
      ...(s.tiers ?? []).map((x) => crm.tier[x as LeadTier] ?? x),
      ...(s.statuses ?? []).map((x) => crm.status[x as LeadStatus] ?? x),
      ...(s.problems ?? []).map((x) => problems[x as ProblemKey] ?? x),
      ...(s.sources ?? []).map((x) => crmPlus.sources[x] ?? x),
      ...(s.owners?.length ? [t.owners.replace("{names}", s.owners.map((o) => names[o] ?? "—").join(", "))] : []),
      ...(s.days ? [t.days.replace("{n}", String(s.days))] : []),
      ...(s.exclude_days ? [t.exclude.replace("{n}", String(s.exclude_days))] : []),
    ];
    return parts.length ? parts : [t.all];
  };

  const remove = async (seg: CampaignSegment) => {
    if (!window.confirm(t.confirm.replace("{name}", seg.name))) return;
    setBusy(seg.id);
    const { error } = await supabase.from("campaign_segments").delete().eq("id", seg.id);
    setBusy(null);
    if (!error) {
      setList((l) => l.filter((x) => x.id !== seg.id));
      router.refresh();
    }
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <div>
      <p className="mb-5 max-w-3xl text-sm text-muted">{t.intro}</p>
      {list.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-line-strong py-14 text-center">
          <Users className="h-8 w-8 text-muted" aria-hidden />
          <p className="mt-3 text-sm text-muted">{t.empty}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-[0.92rem]">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.name}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.filters}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{pro.channels.whatsapp}</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">{pro.channels.email}</th>
                <th scope="col" className="px-3 py-3 font-medium">{t.cols.created}</th>
                <th scope="col" className="w-12"><span className="sr-only">{t.delete}</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((seg) => {
                const n = counts[seg.id];
                return (
                  <tr key={seg.id} className="border-b border-line">
                    <td className="px-3 py-3 font-medium text-heading">{seg.name}</td>
                    <td className="px-3 py-3">
                      <span className="flex flex-wrap gap-1">
                        {summary(seg.segment).map((p) => (
                          <span key={p} className="rounded-md bg-card-soft px-1.5 py-0.5 text-xs text-heading dark:bg-white/[0.08]">{p}</span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-heading">{n ? n.wa.toLocaleString(locale) : <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted" aria-hidden />}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-heading">{n ? n.email.toLocaleString(locale) : <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted" aria-hidden />}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmt(seg.created_at)}</td>
                    <td className="px-1 py-3">
                      <button
                        type="button"
                        onClick={() => void remove(seg)}
                        disabled={busy === seg.id}
                        aria-label={`${t.delete} ${seg.name}`}
                        className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        {busy === seg.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                      </button>
                    </td>
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
