"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { crmPlus } from "@/content/crmPlus";
import { budgetKeys, decisionKeys, leadFormCopy, problemKeys, timelineKeys } from "@/content/leadForm";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import type { Employee } from "@/components/crm/CrmBoard";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Lead creado a mano por el equipo (llamada, evento, recomendación…). */
export function AddLeadDialog({ locale, employees, me, onClose, onCreated }: { locale: Locale; employees: Employee[]; me: string; onClose: () => void; onCreated: (id: string) => void }) {
  const t = crmPlus.addDialog;
  const f = leadFormCopy[locale];
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", problem_category: "other", budget: "unknown", decision: "self", timeline: "month", problem_text: "", assigned_to: me });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((x) => ({ ...x, [k]: v }));

  const create = async () => {
    setBusy(true);
    const { data, error: rpcError } = await createClient().rpc("staff_create_lead", { p: form });
    setBusy(false);
    if (rpcError || !data) return setError(t.error);
    onCreated(data);
  };

  const field = (k: "name" | "email" | "phone" | "company", label: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <input value={form[k]} onChange={(event) => set(k)(event.target.value)} className={cn(inputClass, "h-10 text-sm")} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t.title} className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl dark:bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-heading">{t.title}</h2>
            <p className="text-sm text-muted">{t.hint}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)]"><X className="h-4 w-4" aria-hidden /></button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {field("name", f.steps.contact.name)}
          {field("email", f.steps.contact.email)}
          {field("phone", f.steps.contact.phone)}
          {field("company", f.steps.contact.company)}
          <Select size="md" label={f.steps.problem.title} value={form.problem_category} onChange={set("problem_category")} options={problemKeys.map((k) => ({ value: k, label: f.steps.problem.options[k] }))} />
          <Select size="md" label={f.steps.budget.title} value={form.budget} onChange={set("budget")} options={budgetKeys.map((k) => ({ value: k, label: f.steps.budget.options[k] }))} />
          <Select size="md" label={f.steps.decision.title} value={form.decision} onChange={set("decision")} options={decisionKeys.map((k) => ({ value: k, label: f.steps.decision.options[k] }))} />
          <Select size="md" label={f.steps.timeline.title} value={form.timeline} onChange={set("timeline")} options={timelineKeys.map((k) => ({ value: k, label: f.steps.timeline.options[k] }))} />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted">{t.notes}</span>
            <textarea value={form.problem_text} onChange={(event) => set("problem_text")(event.target.value)} rows={3} className={cn(inputClass, "h-auto py-2.5 text-sm")} />
          </label>
          <div className="sm:col-span-2">
            <Select size="md" label={crmPlus.cols.manager} value={form.assigned_to} onChange={set("assigned_to")} options={employees.map((e) => ({ value: e.id, label: e.name }))} />
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-[10px] px-4 text-sm font-semibold text-heading hover:bg-[var(--meta-hover)]">{crmPlus.drawer.cancel}</button>
          <button type="button" onClick={create} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-action px-4 text-sm font-semibold text-deep-700 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.create}
          </button>
        </div>
      </div>
    </div>
  );
}
