"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useChartTheme } from "@/components/portal/charts/theme";
import { analyticsBehaviorCopy } from "@/content/analyticsBehavior";
import { analyticsProCopy } from "@/content/analyticsPro";
import type { Locale } from "@/i18n/config";

export type LiveData = {
  now: number;
  minutes: { m: number; n: number }[];
  pages: { path: string; visitors: number }[];
  recent: {
    created_at: string;
    path: string;
    device: string | null;
    country: string | null;
    browser: string | null;
    lead_id: string | null;
    lead_name: string | null;
    channel: string | null;
  }[];
  events: { created_at: string; name: string; label: string | null; path: string | null }[];
};

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

/** Bandera a partir del código de país (CO → 🇨🇴). */
const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";

/**
 * Analítica en vivo: visitantes de los últimos 5 minutos, actividad por
 * minuto, páginas abiertas y los últimos movimientos. Se actualiza cada 15 s.
 */
export function LiveView({ locale, initial }: { locale: Locale; initial: LiveData }) {
  const t = analyticsBehaviorCopy[locale].live;
  const p = analyticsProCopy[locale];
  const c = useChartTheme();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [updated, setUpdated] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(async () => {
      setNow(Date.now());
      if (document.visibilityState !== "visible") return;
      const { data: fresh } = await supabase.rpc("analytics_live");
      if (fresh) {
        setData(fresh as unknown as LiveData);
        setUpdated(Date.now());
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [supabase]);

  const ago = (iso: string | number) => {
    const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    if (s < 30) return t.justNow;
    const text = s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`;
    return t.ago.replace("{t}", text);
  };
  const minutes = data.minutes.map((x) => ({ ...x, label: 30 - x.m }));

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Ahora */}
        <section className={`${card} flex flex-col justify-between`}>
          <div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {t.now}
            </p>
            <p className="mt-2 text-6xl font-semibold leading-none tabular-nums text-heading" aria-live="polite">
              {data.now}
            </p>
            <p className="mt-2 text-xs text-muted">{t.nowHint}</p>
          </div>
          <div className="mt-5 grid gap-2">
            <Link
              href={`/${locale}/portal/chat/visitantes`}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-3 py-2 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.invite}
            </Link>
            <p className="text-[0.7rem] text-muted">{t.updated.replace("{t}", ago(updated))}</p>
          </div>
        </section>

        {/* Por minuto */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.minutes}</h2>
          <p className="mb-3 text-xs text-muted">{t.minutesHint}</p>
          <div className="h-48" role="img" aria-label={`${t.minutes}: ${minutes.map((x) => x.n).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={minutes} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="label" reversed tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={4} tickFormatter={(v: number) => `-${v}`} />
                <YAxis allowDecimals={false} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: c.grid, opacity: 0.6 }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg bg-[#18181b] px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-[#18181b]">
                        <p className="font-semibold">{t.minuteTip.replace("{n}", String((payload[0].payload as { label: number }).label))}</p>
                        <p className="tabular-nums">{String(payload[0].value)}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="n" fill={c.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Páginas abiertas */}
        <section className={card}>
          <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.pages}</h2>
          {data.pages.length === 0 ? (
            <p className="text-sm text-muted">{t.noPages}</p>
          ) : (
            <ul className="grid gap-2">
              {data.pages.map((x) => {
                const max = Math.max(...data.pages.map((y) => y.visitors), 1);
                return (
                  <li key={x.path}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-mono text-[0.82rem] text-heading">{x.path}</span>
                      <span className="font-semibold tabular-nums text-heading">{x.visitors}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-card-soft dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${(x.visitors / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <h2 className="mb-3 mt-6 text-[0.98rem] font-semibold text-heading">{t.events}</h2>
          {data.events.length === 0 ? (
            <p className="text-sm text-muted">{t.noEvents}</p>
          ) : (
            <ul className="grid gap-2">
              {data.events.map((e, i) => (
                <li key={`${e.created_at}-${i}`} className="flex items-baseline gap-3 text-sm">
                  <span className="w-20 shrink-0 text-xs text-muted">{ago(e.created_at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-heading">{p.events[e.name] ?? e.name}</span>
                    {e.label && <span className="text-muted"> · {e.label}</span>}
                    {e.path && <span className="block truncate font-mono text-[0.75rem] text-muted">{e.path}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Últimas páginas vistas */}
        <section className={card}>
          <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.recent}</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted">{t.noRecent}</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map((r, i) => (
                <li key={`${r.created_at}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-muted">{ago(r.created_at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[0.82rem] text-heading">{r.path}</span>
                    <span className="block truncate text-xs text-muted">
                      {[p.channels[r.channel ?? ""] ?? r.channel, p.devices[r.device ?? "unknown"], r.browser].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {r.country && (
                    <span className="text-base" title={r.country} aria-label={r.country}>
                      {flag(r.country)}
                    </span>
                  )}
                  {r.lead_id && r.lead_name && (
                    <Link href={`/${locale}/portal/crm/${r.lead_id}`} className="max-w-[9rem] shrink-0 truncate rounded-md bg-[var(--meta-active)] px-2 py-0.5 text-xs font-semibold text-accent hover:underline">
                      {r.lead_name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
