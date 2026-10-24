"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, Loader2, Play, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rulesCopy, type ActionType, type TriggerKey } from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import { Select } from "@/components/ui/Select";
import type { Json } from "@/lib/supabase/types";
import { ACTION_ICONS } from "./icons";
import { cn } from "@/lib/utils";

type Preview = {
  found: boolean;
  matches?: boolean;
  vars?: Record<string, unknown>;
  actions?: { type: ActionType; title: string; body: string }[];
};

/**
 * "Probar con un elemento real": vista previa sin ejecutar (automation_preview)
 * y, si la regla ya está guardada, ejecución real sobre ese elemento.
 * Se monta con key={trigger}: al cambiar el disparador se reinicia.
 */
export function RulePreview({
  trigger,
  rule,
  ruleId,
  canRun,
}: {
  trigger: TriggerKey;
  /** La regla tal como está en el editor (sin guardar). */
  rule: { trigger: string; conditions: Json; actions: Json };
  ruleId: string | null;
  canRun: boolean;
}) {
  const t = rulesCopy;
  const e = ruleEditorCopy;
  const supabase = useMemo(() => createClient(), []);
  const [samples, setSamples] = useState<{ id: string; label: string }[] | null>(null);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<false | "preview" | "run">(false);
  const [error, setError] = useState<string | null>(null);
  const [ran, setRan] = useState<null | { ran: boolean; status?: string }>(null);

  useEffect(() => {
    let alive = true;
    supabase.rpc("automation_samples", { p_trigger: trigger }).then(({ data }) => {
      if (!alive) return;
      const list = (data ?? []) as { id: string; label: string }[];
      setSamples(list);
      setSelected(list[0]?.id ?? "");
    });
    return () => {
      alive = false;
    };
  }, [supabase, trigger]);

  const preview = async () => {
    if (!selected) return;
    setBusy("preview");
    setError(null);
    setRan(null);
    const { data, error: rpcError } = await supabase.rpc("automation_preview", { p_rule: rule as unknown as Json, p_entity_id: selected });
    setBusy(false);
    if (rpcError) return setError(e.preview.error);
    setResult(data as unknown as Preview);
  };

  const run = async () => {
    if (!ruleId || !selected || !window.confirm(t.editor.runOnConfirm)) return;
    setBusy("run");
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("automation_run_manual", { p_rule: ruleId, p_entity_id: selected });
    setBusy(false);
    if (rpcError) return setError(e.preview.error);
    const out = data as unknown as { ran: boolean; run?: { status: string } | null };
    setRan({ ran: out.ran, status: out.run?.status });
  };

  const vars = Object.entries(result?.vars ?? {}).filter(([, v]) => v !== null && v !== "" && typeof v !== "object");

  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <h2 className="flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
        <FlaskConical className="h-4 w-4 text-accent" aria-hidden />
        {t.editor.preview}
      </h2>
      <p className="mt-1 text-xs text-muted">{t.editor.previewHint}</p>

      {samples === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        </p>
      ) : samples.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{e.preview.none}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          <Select
            size="md"
            label={e.preview.pick}
            value={selected}
            onChange={(v) => {
              setSelected(v);
              setResult(null);
              setRan(null);
            }}
            options={samples.map((s) => ({ value: s.id, label: s.label }))}
            placeholder={e.preview.pickPlaceholder}
          />
          <button
            type="button"
            onClick={preview}
            disabled={!selected || !!busy}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50"
          >
            {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FlaskConical className="h-4 w-4" aria-hidden />}
            {busy === "preview" ? e.preview.running : e.preview.run}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {result && !result.found && <p className="mt-3 text-sm text-muted">{e.preview.notFound}</p>}
      {result?.found && (
        <div className="mt-4 grid gap-3" aria-live="polite">
          <p
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              result.matches ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {result.matches ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <XCircle className="h-3.5 w-3.5" aria-hidden />}
            {result.matches ? t.editor.previewMatch : t.editor.previewNoMatch}
          </p>
          <ol className="grid gap-2">
            {(result.actions ?? []).map((a, i) => {
              const Icon = ACTION_ICONS[a.type] ?? FlaskConical;
              return (
                <li key={i} className="rounded-lg bg-[var(--meta-active)]/50 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-heading">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {t.actions.types[a.type]?.label ?? a.type}
                  </p>
                  {a.title && <p className="mt-1 font-semibold text-heading">{a.title}</p>}
                  {a.body && <p className="mt-1 whitespace-pre-wrap text-body">{a.body}</p>}
                </li>
              );
            })}
          </ol>
          {vars.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-heading">{e.preview.vars}</summary>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                {vars.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-mono text-muted">{`{${k}}`}</dt>
                    <dd className="truncate text-heading">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}

      {canRun && samples && samples.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          {ruleId ? (
            <button
              type="button"
              onClick={run}
              disabled={!selected || !!busy}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50"
            >
              {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {t.editor.runOn}
            </button>
          ) : (
            <p className="text-xs text-muted">{e.preview.saveFirst}</p>
          )}
          {ran && (
            <p role="status" className={cn("mt-2 text-sm", ran.ran && ran.status !== "failed" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
              {ran.ran ? (ran.status === "failed" ? e.runs.failed : t.editor.ran) : t.editor.notRan}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
