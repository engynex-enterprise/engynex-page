"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generatableKeys, integrationsCopy, secretKeys, toggleKeys } from "@/content/integrations";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { CopyButton } from "./shared";

export type StoredSetting = {
  value: string | null;
  set: boolean;
  hint: string | null;
  updated_at: string;
  updated_by: string | null;
};

/** Texto aleatorio seguro (base64url) para tokens y contraseñas. */
function randomSecret(bytes = 24) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Campos de una integración. Los valores normales se editan en línea; los
 * secretos se guardan cifrados (Vault) y solo se ve su final; los
 * interruptores guardan al instante. Solo el administrador puede guardar.
 */
export function IntegrationFields({
  locale,
  keys,
  stored,
  envOnly,
}: {
  locale: Locale;
  keys: string[];
  stored: Record<string, StoredSetting>;
  envOnly: string[];
}) {
  const t = integrationsCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.filter((k) => !secretKeys.has(k)).map((k) => [k, stored[k]?.value ?? ""])),
  );
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const changed = (key: string) =>
    toggleKeys.has(key) ? false : secretKeys.has(key) ? !!editing[key] && draft[key] !== undefined : (draft[key] ?? "") !== (stored[key]?.value ?? "");
  const dirty = keys.some(changed);

  const save = async (only?: string, value?: string) => {
    const list = only ? [only] : keys.filter(changed);
    if (!list.length) return;
    setBusy(true);
    setSaved(false);
    const next: Record<string, string> = { ...errors };
    for (const key of list) {
      const v = value !== undefined ? value : (draft[key] ?? "");
      const { error } = await supabase.rpc("admin_set_integration", { p_key: key, p_value: v.trim() || null });
      if (error) {
        const code = Object.keys(t.errors).find((c) => error.message.includes(c)) ?? "generic";
        next[key] = t.errors[code];
      } else {
        delete next[key];
        if (secretKeys.has(key)) {
          setEditing((e) => ({ ...e, [key]: false }));
          setDraft((d) => {
            const copy = { ...d };
            delete copy[key];
            return copy;
          });
        }
      }
    }
    setErrors(next);
    setBusy(false);
    if (list.every((k) => !next[k])) setSaved(true);
    router.refresh();
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  const field = (key: string) => {
    const f = t.fields[key] ?? { label: key };
    if (toggleKeys.has(key)) {
      const on = toggled[key] ?? (stored[key]?.value ?? "on") !== "off";
      return (
        <div key={key} className="flex items-start justify-between gap-4 rounded-xl bg-[var(--meta-active)]/50 px-4 py-3 lg:col-span-2">
          <div>
            <p id={`int-${key}`} className="text-sm font-semibold text-heading">{f.label}</p>
            {f.help && <p className="mt-0.5 text-xs text-muted">{f.help}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby={`int-${key}`}
            disabled={busy}
            onClick={() => {
              setToggled((x) => ({ ...x, [key]: !on }));
              void save(key, on ? "off" : "on");
            }}
            className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong")}
          >
            <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      );
    }
    const secret = secretKeys.has(key);
    const meta = stored[key];
    const id = `int-${key}`;
    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
          {f.label}
        </label>
        {secret && meta?.set && !editing[key] ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-3.5 font-mono text-sm text-heading">
              <KeyRound className="h-4 w-4 text-accent" aria-hidden />
              {t.secretSet.replace("{hint}", meta.hint ?? "····")}
            </span>
            <button type="button" onClick={() => setEditing((e) => ({ ...e, [key]: true }))} className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              {t.change}
            </button>
            <button type="button" onClick={() => save(key, "")} className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
              {t.remove}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={id}
              type={secret && !revealed[key] ? "password" : "text"}
              value={draft[key] ?? ""}
              onChange={(event) => {
                setSaved(false);
                setDraft((d) => ({ ...d, [key]: event.target.value }));
                if (secret) setEditing((e) => ({ ...e, [key]: true }));
              }}
              placeholder={f.placeholder}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!errors[key] || undefined}
              aria-describedby={f.help ? `${id}-help` : undefined}
              className={cn(inputClass, "h-10 min-w-0 flex-1 font-mono text-sm", errors[key] && "border-red-500")}
            />
            {secret && generatableKeys.has(key) && (
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, [key]: randomSecret(key === "cron_secret" ? 32 : 24) }));
                  setEditing((e) => ({ ...e, [key]: true }));
                  setRevealed((r) => ({ ...r, [key]: true }));
                }}
                className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
              >
                {t.generate}
              </button>
            )}
            {secret && revealed[key] && draft[key] && <CopyButton value={draft[key]} label={t.copy} done={t.copied} className="h-9" />}
            {secret && meta?.set && (
              <button
                type="button"
                onClick={() => {
                  setEditing((e) => ({ ...e, [key]: false }));
                  setDraft((d) => {
                    const copy = { ...d };
                    delete copy[key];
                    return copy;
                  });
                }}
                className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-muted hover:text-heading"
              >
                {t.cancel}
              </button>
            )}
            {!secret && meta?.set && (
              <button type="button" onClick={() => save(key, "")} className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                {t.remove}
              </button>
            )}
          </div>
        )}
        {errors[key] && (
          <p role="alert" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
            {errors[key]}
          </p>
        )}
        {f.help && (
          <p id={`${id}-help`} className="mt-1 text-xs text-muted">
            {f.help}
          </p>
        )}
        {secret && (editing[key] || !meta?.set) && <p className="mt-1 text-xs text-muted">{t.secretHint}</p>}
        {envOnly.includes(key) && <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{t.fromEnv}</p>}
        {meta?.updated_by && <p className="mt-1 text-[0.7rem] text-muted">{t.updated.replace("{name}", meta.updated_by).replace("{date}", fmt(meta.updated_at))}</p>}
      </div>
    );
  };

  const hasText = keys.some((k) => !toggleKeys.has(k));
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">{keys.map(field)}</div>
      {hasText && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="button" onClick={() => save()} disabled={!dirty || busy} className={buttonClasses("primary", "md", "disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? t.saving : t.save}
          </button>
          {saved && !dirty && (
            <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-4 w-4" aria-hidden />
              {t.saved}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
