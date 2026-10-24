"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/components/portal/charts/theme";
import { chatReportsCopy, fmtDuration } from "@/content/chatReports";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Colores por canal validados con validate_palette.js (claro y oscuro):
 * web, WhatsApp y redes (Messenger + Instagram). Siempre con leyenda y tabla.
 */
const CHANNEL_COLORS = {
  light: { web: "#3b5bdb", whatsapp: "#1d8a73", social: "#c2410c" },
  dark: { web: "#5b7be8", whatsapp: "#1f9e78", social: "#d2691e" },
};
/** Rampa secuencial de un solo tono (verde Engynex), de claro a oscuro. */
const HEAT = {
  light: ["#f4f4f5", "#e3f2d0", "#bfe39a", "#8fca5c", "#5c9a2c", "#3a6a17"],
  dark: ["#232326", "#2a3a1d", "#3f5a24", "#5f8a2f", "#82b83e", "#a8e05a"],
};

export type ReportDaily = { day: string; web: number; whatsapp: number; social: number; first_response_s: number | null };
export type HeatCell = { dow: number; hour: number; n: number };

const useDark = () => useChartTheme().surface !== "#ffffff";

function TipBox({ title, rows, total }: { title: string; rows: { name: string; color: string; value: string }[]; total?: string }) {
  return (
    <div className="rounded-lg bg-[#18181b] px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-[#18181b]">
      <p className="mb-1 font-semibold">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
          <span className="opacity-80">{r.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{r.value}</span>
        </p>
      ))}
      {total && <p className="mt-1 border-t border-white/20 pt-1 font-semibold tabular-nums dark:border-black/10">Total: {total}</p>}
    </div>
  );
}

function TableToggle({ open, onToggle, locale }: { open: boolean; onToggle: () => void; locale: Locale }) {
  const t = chatReportsCopy[locale].reports;
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="mt-2 text-xs font-semibold text-muted hover:text-heading">
      {open ? t.hideTable : t.table}
    </button>
  );
}

const dayFmt = (locale: string) => (d: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));

/* ---------------- Conversaciones por día, apiladas por canal ---------------- */

export function ConversationsByDay({ data, locale }: { data: ReportDaily[]; locale: Locale }) {
  const t = chatReportsCopy[locale].reports;
  const dark = useDark();
  const c = useChartTheme();
  const colors = dark ? CHANNEL_COLORS.dark : CHANNEL_COLORS.light;
  const [table, setTable] = useState(false);
  const fmtDay = dayFmt(locale);
  const keys = (["web", "whatsapp", "social"] as const).filter((k) => k === "web" || data.some((r) => r[k] > 0));
  const totals = Object.fromEntries(keys.map((k) => [k, data.reduce((s, r) => s + r[k], 0)])) as Record<string, number>;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {keys.map((k) => (
          <li key={k} className="flex items-center gap-2 text-body">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[k] }} aria-hidden />
            {t.channels[k]} <span className="font-semibold tabular-nums text-heading">{totals[k]}</span>
          </li>
        ))}
      </ul>
      <div className="h-60" role="img" aria-label={`${t.byDay}: ${keys.map((k) => `${t.channels[k]} ${totals[k]}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap={data.length > 40 ? 1 : 3}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(2, Math.ceil(max * 1.25))]} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: c.grid, opacity: 0.6 }}
              content={(p) => {
                if (!p.active || !p.payload?.length) return null;
                const row = p.payload[0].payload as ReportDaily;
                return (
                  <TipBox
                    title={fmtDay(String(p.label))}
                    rows={keys.map((k) => ({ name: t.channels[k], color: colors[k], value: String(row[k]) }))}
                    total={String(keys.reduce((s, k) => s + row[k], 0))}
                  />
                );
              }}
            />
            {keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={t.channels[k]}
                stackId="ch"
                fill={colors[k]}
                stroke={c.surface}
                strokeWidth={1}
                radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableToggle open={table} onToggle={() => setTable((v) => !v)} locale={locale} />
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{t.day}</th>
              {keys.map((k) => (
                <th key={k} scope="col" className="py-1 text-right font-semibold">{t.channels[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.filter((r) => keys.some((k) => r[k] > 0)).map((r) => (
              <tr key={r.day}>
                <td className="py-1 text-body">{fmtDay(r.day)}</td>
                {keys.map((k) => (
                  <td key={k} className="py-1 text-right tabular-nums text-heading">{r[k]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Primera respuesta por día (línea) ---------------- */

export function FirstResponseByDay({ data, locale }: { data: ReportDaily[]; locale: Locale }) {
  const t = chatReportsCopy[locale].reports;
  const c = useChartTheme();
  const [table, setTable] = useState(false);
  const fmtDay = dayFmt(locale);
  // En minutos para que el eje sea legible; los huecos (días sin datos) no se unen.
  const points = data.map((r) => ({ day: r.day, min: r.first_response_s == null ? null : Math.round((r.first_response_s / 60) * 10) / 10, s: r.first_response_s }));
  if (!points.some((p) => p.min !== null)) return <p className="text-sm text-muted">{t.noData}</p>;

  return (
    <div>
      <div className="h-60" role="img" aria-label={t.firstByDay}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v} min`} width={64} />
            <Tooltip
              cursor={{ stroke: c.axis, strokeDasharray: "3 3" }}
              content={(p) => {
                if (!p.active || !p.payload?.length) return null;
                const row = p.payload[0].payload as (typeof points)[number];
                return <TipBox title={fmtDay(String(p.label))} rows={[{ name: t.kpis.firstResponse, color: c.single, value: fmtDuration(locale, row.s) }]} />;
              }}
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke={c.single}
              strokeWidth={2}
              dot={{ r: 4, fill: c.single, stroke: c.surface, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TableToggle open={table} onToggle={() => setTable((v) => !v)} locale={locale} />
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{t.day}</th>
              <th scope="col" className="py-1 text-right font-semibold">{t.kpis.firstResponse}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {points.filter((p) => p.s != null).map((p) => (
              <tr key={p.day}>
                <td className="py-1 text-body">{fmtDay(p.day)}</td>
                <td className="py-1 text-right tabular-nums text-heading">{fmtDuration(locale, p.s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Mapa de calor: día × hora ---------------- */

export function HeatMap({ cells, locale }: { cells: HeatCell[]; locale: Locale }) {
  const t = chatReportsCopy[locale].reports;
  const ramp = useDark() ? HEAT.dark : HEAT.light;
  const [table, setTable] = useState(false);
  const grid = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.n]));
  const max = Math.max(0, ...cells.map((c) => c.n));
  if (max === 0) return <p className="text-sm text-muted">{t.noData}</p>;
  const step = (n: number) => (n === 0 ? 0 : Math.min(5, Math.ceil((n / max) * 5)));
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[40rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px]" role="img" aria-label={t.heat}>
          <span />
          {hours.map((h) => (
            <span key={h} className="pb-1 text-center text-[0.65rem] tabular-nums text-muted">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {t.days.map((day, i) => (
            <div key={day} className="contents">
              <span className="pr-2 text-right text-xs leading-6 text-muted">{day}</span>
              {hours.map((h) => {
                const n = grid.get(`${i + 1}-${h}`) ?? 0;
                return (
                  <span
                    key={h}
                    title={t.heatCell.replace("{day}", day).replace("{hour}", String(h)).replace("{n}", String(n))}
                    className="h-6 rounded-[4px]"
                    style={{ background: ramp[step(n)] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
        {t.heatLess}
        {ramp.map((color) => (
          <span key={color} className="h-3 w-3 rounded-[3px]" style={{ background: color }} aria-hidden />
        ))}
        {t.heatMore}
        <span className="ml-1 tabular-nums">({t.heatMax.replace("{n}", String(max))})</span>
      </div>
      <TableToggle open={table} onToggle={() => setTable((v) => !v)} locale={locale} />
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">{t.day}</th>
              <th scope="col" className="py-1 font-semibold">{t.hour}</th>
              <th scope="col" className="py-1 text-right font-semibold">{t.kpis.conversations}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...cells]
              .filter((c) => c.n > 0)
              .sort((a, b) => a.dow - b.dow || a.hour - b.hour)
              .map((c) => (
                <tr key={`${c.dow}-${c.hour}`}>
                  <td className="py-1 text-body">{t.days[c.dow - 1]}</td>
                  <td className="py-1 tabular-nums text-body">{c.hour}:00</td>
                  <td className={cn("py-1 text-right tabular-nums text-heading", c.n === max && "font-semibold")}>{c.n}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
