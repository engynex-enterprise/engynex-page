"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { crmPlus } from "@/content/crmPlus";

type Row = Record<string, string>;

/** CSV simple con comillas, comas o punto y coma. */
function parseCsv(text: string): string[][] {
  const sep = (text.split("\n")[0].match(/;/g) ?? []).length > (text.split("\n")[0].match(/,/g) ?? []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const ALIASES: Record<string, string[]> = {
  name: ["nombre", "name", "cliente", "contacto", "full name"],
  email: ["correo", "email", "e-mail", "correo electronico", "correo electrónico"],
  phone: ["telefono", "teléfono", "celular", "phone", "whatsapp", "movil", "móvil"],
  company: ["empresa", "company", "compañia", "compañía", "organizacion", "organización"],
  problem_text: ["notas", "necesidad", "descripcion", "descripción", "notes", "mensaje"],
  utm_source: ["origen", "fuente", "source"],
};

/** Importa leads desde un CSV (se califican con el mismo puntaje). */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const t = crmPlus.importDialog;
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: { row: number; email: string; reason: string }[] } | null>(null);

  const read = async (file: File) => {
    const text = (await file.text()).replace(/^﻿/, "");
    const [header, ...data] = parseCsv(text);
    const map = header.map((h) => {
      const k = h.trim().toLowerCase();
      return Object.entries(ALIASES).find(([, list]) => list.includes(k))?.[0] ?? null;
    });
    setCols(map.filter(Boolean) as string[]);
    setRows(data.map((r) => Object.fromEntries(map.map((k, i) => [k, (r[i] ?? "").trim()]).filter(([k]) => k)) as Row));
    setResult(null);
  };

  const run = async () => {
    setBusy(true);
    const { data } = await createClient().rpc("import_leads", { p_rows: rows });
    setBusy(false);
    setResult(data as typeof result);
  };

  const template = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿nombre,correo,telefono,empresa,notas\nAna Pérez,ana@empresa.com,3001234567,Empresa SAS,Quiere una tienda en línea\n"], { type: "text/csv" }));
    a.download = "plantilla-leads.csv";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t.title} className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl dark:bg-card">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-heading">{t.title}</h2>
          <button type="button" onClick={onClose} aria-label={t.close} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)]"><X className="h-4 w-4" aria-hidden /></button>
        </div>
        <p className="mt-1 text-sm text-muted">{t.hint}</p>
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong p-6 text-center hover:bg-[var(--meta-hover)]">
          <FileSpreadsheet className="h-8 w-8 text-accent" aria-hidden />
          <span className="text-sm font-semibold text-heading">{t.pick}</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const f = event.target.files?.[0]; if (f) void read(f); }} />
        </label>
        <button type="button" onClick={template} className="mt-2 text-sm font-semibold text-accent hover:underline">{t.template}</button>
        {rows.length > 0 && (
          <div className="mt-4 rounded-xl bg-card-soft p-3 text-sm">
            <p className="font-semibold text-heading">{t.preview.replace("{n}", String(rows.length))}</p>
            <p className="mt-0.5 text-muted">{t.detected.replace("{cols}", cols.join(", ") || "—")}</p>
          </div>
        )}
        {result && (
          <div role="status" className="mt-4 rounded-xl bg-[var(--meta-active)] p-3 text-sm">
            <p className="font-semibold text-heading">{t.result.replace("{inserted}", String(result.inserted)).replace("{skipped}", String(result.skipped))}</p>
            {result.errors.length > 0 && (
              <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-body">
                {result.errors.slice(0, 50).map((e) => (
                  <li key={e.row}>#{e.row} {e.email}: {t.reasons[e.reason] ?? e.reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-[10px] px-4 text-sm font-semibold text-heading hover:bg-[var(--meta-hover)]">{t.close}</button>
          <button type="button" onClick={run} disabled={!rows.length || busy || !!result} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-action px-4 text-sm font-semibold text-deep-700 disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? t.running : t.run}
          </button>
        </div>
      </div>
    </div>
  );
}
