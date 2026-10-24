"use client";

import { useState } from "react";
import { Mail, MessageCircle, MessagesSquare, Phone, TrendingDown } from "lucide-react";
import { HBarChart } from "@/components/portal/charts/HomeCharts";
import { analyticsAcquisitionCopy } from "@/content/analyticsAcquisition";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type FunnelData = {
  visitors: number;
  engaged: number;
  quote_page: number;
  form_start: number;
  leads: number;
  qualified: number;
  meetings: number;
  won: number;
  contacts: { whatsapp: number; phone: number; email: number; chat: number };
  form_steps: { step: string; visitors: number }[];
};

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
const STEPS = ["visitors", "engaged", "quote_page", "form_start", "leads", "qualified", "meetings", "won"] as const;
const contactIcon = { whatsapp: MessageCircle, phone: Phone, email: Mail, chat: MessagesSquare } as const;

const rate = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

/**
 * Conversiones: tasas clave, embudo del sitio a la venta (con la mayor fuga
 * resaltada), abandono por paso del formulario y acciones de contacto.
 */
export function ConversionsView({ locale, funnel: f }: { locale: Locale; funnel: FunnelData }) {
  const t = analyticsAcquisitionCopy[locale].conv;
  const [asTable, setAsTable] = useState(false);
  const num = (v: number) => v.toLocaleString(locale);

  const kpis = [
    { key: "leads", value: num(f.leads) },
    { key: "siteToLead", value: rate(f.leads, f.visitors) },
    { key: "leadToMeeting", value: rate(f.meetings, f.leads) },
    { key: "meetingToSale", value: rate(f.won, f.meetings) },
  ] as const;

  // Pasos del embudo. "Inició el formulario" depende de eventos: si aún no
  // hay ninguno, se omite para no mostrar una caída falsa.
  const steps = STEPS.filter((k) => k !== "form_start" || f.form_start > 0).map((k) => ({ key: k, value: f[k] }));
  const max = Math.max(f.visitors, 1);
  let leak: { key: string; drop: number } | null = null;
  steps.forEach((s, i) => {
    if (i === 0) return;
    const prev = steps[i - 1].value;
    if (!prev) return;
    const drop = Math.round(((prev - s.value) / prev) * 100);
    if (drop > 0 && (!leak || drop > leak.drop)) leak = { key: s.key, drop };
  });
  const biggest = leak as { key: string; drop: number } | null;

  const formRows = [...f.form_steps]
    .sort((a, b) => Number(a.step) - Number(b.step))
    .map((s) => ({ label: t.step.replace("{n}", s.step), value: s.visitors }));
  const hasEvents = f.form_start > 0 || formRows.length > 0 || Object.values(f.contacts).some((n) => n > 0);

  return (
    <div className="grid gap-6">
      {/* Tasas clave */}
      <div className="-mx-4 -mt-6 grid border-b border-line sm:-mx-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="border-line px-6 py-4 sm:border-r xl:last:border-r-0">
            <p className="text-sm text-muted">{t.kpis[k.key]}</p>
            <p className="mt-1 text-[1.7rem] font-semibold leading-none tabular-nums text-heading">
              {typeof k.value === "number" ? `${k.value}%` : k.value === null ? "—" : k.value}
            </p>
          </div>
        ))}
      </div>

      {!hasEvents && (
        <p className="rounded-xl bg-card-soft px-4 py-3 text-sm text-body dark:bg-white/[0.04]">{t.noEvents}</p>
      )}

      {/* Embudo */}
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[0.98rem] font-semibold text-heading">{t.funnel}</h2>
            <p className="text-xs text-muted">{t.funnelHint}</p>
          </div>
          <button type="button" onClick={() => setAsTable((v) => !v)} className="text-xs font-semibold text-accent hover:underline">
            {asTable ? t.hideTable : t.showTable}
          </button>
        </div>
        {f.visitors === 0 && f.leads === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
        ) : asTable ? (
          <table className="w-full text-left text-sm">
            <tbody>
              {steps.map((s, i) => (
                <tr key={s.key} className="h-11 border-b border-line">
                  <td className="text-heading">{t.steps[s.key]}</td>
                  <td className="text-right tabular-nums font-semibold text-heading">{num(s.value)}</td>
                  <td className="w-40 text-right tabular-nums text-muted">{i > 0 && steps[i - 1].value ? `${rate(s.value, steps[i - 1].value)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ol className="grid gap-3">
            {steps.map((s, i) => {
              const prev = i > 0 ? steps[i - 1].value : null;
              const isLeak = biggest?.key === s.key;
              const last = i === steps.length - 1;
              return (
                <li key={s.key} className="grid gap-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                  <span className="text-sm text-heading">{t.steps[s.key]}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 min-w-0 flex-1 overflow-hidden rounded bg-card-soft dark:bg-white/[0.06]">
                        <div
                          className={cn("h-full rounded", last ? "bg-brand-green-dark dark:bg-brand-green" : "bg-deep-700 dark:bg-[#9fb0d8]")}
                          style={{ width: `${Math.max((s.value / max) * 100, s.value ? 1.5 : 0)}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-heading">{num(s.value)}</span>
                    </div>
                    {prev !== null && (
                      <p className={cn("mt-0.5 text-xs", isLeak ? "font-semibold text-red-600 dark:text-red-400" : "text-muted")}>
                        {prev ? t.ofPrev.replace("{n}", String(rate(s.value, prev))) : "—"}
                        {" · "}
                        {t.ofTotal.replace("{n}", String(rate(s.value, f.visitors) ?? 0))}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {biggest && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
            <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
            {t.leak.replace("{step}", t.steps[biggest.key]).replace("{n}", String(biggest.drop))}
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Formulario por pasos */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.formSteps}</h2>
          <p className="mb-4 text-xs text-muted">{t.formStepsHint}</p>
          {formRows.length ? <HBarChart rows={formRows} valueLabel={t.visitorsLabel} /> : <p className="py-8 text-center text-sm text-muted">{t.empty}</p>}
        </section>

        {/* Acciones de contacto */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.contacts}</h2>
          <p className="mb-4 text-xs text-muted">{t.contactsHint}</p>
          <dl className="grid grid-cols-2 gap-3">
            {(Object.keys(contactIcon) as (keyof typeof contactIcon)[]).map((k) => {
              const Icon = contactIcon[k];
              return (
                <div key={k} className="flex items-center gap-3 rounded-xl bg-card-soft p-4 dark:bg-white/[0.04]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-heading ring-1 ring-line dark:bg-card">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <dt className="text-xs text-muted">{t.contactItems[k]}</dt>
                    <dd className="text-xl font-semibold tabular-nums text-heading">{num(f.contacts[k])}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </section>
      </div>
    </div>
  );
}
