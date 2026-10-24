"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, CircleAlert, CircleDashed, Copy, KeyRound, Loader2, PlugZap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  generatableKeys,
  integrationSections,
  integrationsCopy,
  requiredBySection,
  secretKeys,
  toggleKeys,
} from "@/content/integrations";
import { JobsPanel, type JobsStatus } from "./JobsPanel";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type StoredSetting = {
  value: string | null;
  set: boolean;
  hint: string | null;
  updated_at: string;
  updated_by: string | null;
};
type Section = keyof typeof integrationSections;

/** Texto aleatorio seguro (base64url) para tokens y contraseñas. */
function randomSecret(bytes = 24) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function CopyButton({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft dark:hover:bg-white/[0.06]"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? done : label}
    </button>
  );
}

/**
 * Configuración de integraciones, por secciones. Los valores normales se
 * editan en línea; los secretos se guardan cifrados (Vault) y solo se ve su
 * final. Solo el administrador puede guardar (la base de datos lo impone).
 */
export function IntegrationsForm({
  locale,
  stored,
  envOnly,
  siteUrl,
  jobs,
}: {
  locale: Locale;
  stored: Record<string, StoredSetting>;
  envOnly: string[];
  siteUrl: string;
  jobs: JobsStatus | null;
}) {
  const t = integrationsCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(stored).filter(([k]) => !secretKeys.has(k)).map(([k, v]) => [k, v.value ?? ""])),
  );
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // Interruptores: cambian al instante; luego se confirma con la recarga.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Section | null>(null);
  const [savedAt, setSavedAt] = useState<Section | null>(null);
  const [test, setTest] = useState<{ state: "idle" | "busy" | "ok" | "fail"; text?: string }>({ state: "idle" });

  const isSet = (key: string) => !!stored[key]?.set || envOnly.includes(key);
  const changed = (key: string) =>
    toggleKeys.has(key)
      ? false
      : secretKeys.has(key) ? editing[key] && draft[key] !== undefined : (draft[key] ?? "") !== (stored[key]?.value ?? "");

  const sectionState = (section: Section): "connected" | "partial" | "missing" => {
    const keys = integrationSections[section] as readonly string[];
    if (section === "google") {
      return ["gtm_id", "ga4_id", "google_ads_id"].some(isSet) ? "connected" : "missing";
    }
    const required = requiredBySection[section];
    const n = required.filter(isSet).length;
    if (n === required.length) return "connected";
    return n > 0 || keys.some(isSet) ? "partial" : "missing";
  };

  const save = async (section: Section, only?: string, value?: string) => {
    const keys = (only ? [only] : (integrationSections[section] as readonly string[]).filter(changed)) as string[];
    if (keys.length === 0) return;
    setBusy(section);
    setSavedAt(null);
    const nextErrors: Record<string, string> = { ...errors };
    for (const key of keys) {
      const v = value !== undefined ? value : (draft[key] ?? "");
      const { error } = await supabase.rpc("admin_set_integration", { p_key: key, p_value: v.trim() || null });
      if (error) {
        const code = Object.keys(t.errors).find((c) => error.message.includes(c)) ?? "generic";
        nextErrors[key] = t.errors[code];
      } else {
        delete nextErrors[key];
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
    setErrors(nextErrors);
    setBusy(null);
    if (keys.every((k) => !nextErrors[k])) setSavedAt(section);
    router.refresh();
  };

  const testWhatsApp = async () => {
    setTest({ state: "busy" });
    const res = await fetch("/api/integrations/whatsapp-test", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { name?: string; phone?: string; error?: string; missing?: string[] };
    const missing = data.missing?.map((k) => (k === "SUPABASE_SECRET_KEY" ? t.serverKey.title : t.fields[k]?.label ?? k));
    setTest(
      res.ok
        ? { state: "ok", text: t.sections.whatsapp.testOk.replace("{name}", data.name ?? "—").replace("{phone}", data.phone ?? "—") }
        : {
            state: "fail",
            text: t.sections.whatsapp.testFail.replace(
              "{error}",
              missing?.length ? `${t.missingFields} ${missing.join(", ")}` : (data.error ?? String(res.status)),
            ),
          },
    );
  };

  const badge = {
    connected: { label: t.connected, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
    partial: { label: t.partial, icon: CircleAlert, tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
    missing: { label: t.missing, icon: CircleDashed, tone: "bg-surface-soft text-muted dark:bg-white/[0.06]" },
  };
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const field = (key: string) => {
    const f = t.fields[key];
    if (toggleKeys.has(key)) {
      const on = toggled[key] ?? (stored[key]?.value ?? "on") !== "off";
      return (
        <div key={key} className="flex items-start justify-between gap-4 rounded-lg bg-surface-soft px-4 py-3 lg:col-span-2 dark:bg-white/[0.04]">
          <div>
            <p id={`int-${key}`} className="text-sm font-semibold text-heading">{f.label}</p>
            {f.help && <p className="mt-0.5 text-xs text-muted">{f.help}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby={`int-${key}`}
            disabled={busy === sectionOf(key)}
            onClick={() => {
              setToggled((x) => ({ ...x, [key]: !on }));
              void save(sectionOf(key), key, on ? "off" : "on");
            }}
            className={cn(
              "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60",
              on ? "bg-emerald-500" : "bg-line-strong dark:bg-white/20",
            )}
          >
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]", on ? "left-6" : "left-1")} />
          </button>
        </div>
      );
    }
    const secret = secretKeys.has(key);
    const meta = stored[key];
    const id = `int-${key}`;
    const fromEnv = envOnly.includes(key);

    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-heading">
          {f.label}
        </label>
        {secret && meta?.set && !editing[key] ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-soft px-4 font-mono text-sm text-heading dark:bg-white/[0.06]">
              <KeyRound className="h-4 w-4 text-accent" aria-hidden />
              {t.secretSet.replace("{hint}", meta.hint ?? "····")}
            </span>
            <button type="button" onClick={() => setEditing((e) => ({ ...e, [key]: true }))} className={buttonClasses("outline", "md", "h-10")}>
              {t.change}
            </button>
            <button
              type="button"
              onClick={() => save(sectionOf(key), key, "")}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
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
                setDraft((d) => ({ ...d, [key]: event.target.value }));
                if (secret) setEditing((e) => ({ ...e, [key]: true }));
              }}
              placeholder={f.placeholder}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!errors[key] || undefined}
              className={cn(inputClass, "h-11 min-w-0 flex-1 font-mono text-sm", errors[key] && "border-red-500")}
            />
            {secret && generatableKeys.has(key) && (
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, [key]: randomSecret(key === "cron_secret" ? 32 : 24) }));
                  setEditing((e) => ({ ...e, [key]: true }));
                  setRevealed((r) => ({ ...r, [key]: true }));
                }}
                className={buttonClasses("outline", "md", "h-10")}
              >
                {t.generate}
              </button>
            )}
            {secret && revealed[key] && draft[key] && <CopyButton value={draft[key]} label={t.copy} done={t.copied} />}
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
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold text-muted hover:text-heading"
              >
                {t.cancel}
              </button>
            )}
          </div>
        )}
        {errors[key] && (
          <p role="alert" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
            {errors[key]}
          </p>
        )}
        {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
        {secret && (editing[key] || !meta?.set) && <p className="mt-1 text-xs text-muted">{t.secretHint}</p>}
        {fromEnv && <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{t.fromEnv}</p>}
        {meta?.updated_by && (
          <p className="mt-1 text-[0.7rem] text-muted">{t.updated.replace("{name}", meta.updated_by).replace("{date}", fmt(meta.updated_at))}</p>
        )}
      </div>
    );
  };

  const sectionOf = (key: string) =>
    (Object.keys(integrationSections) as Section[]).find((s) => (integrationSections[s] as readonly string[]).includes(key))!;

  const urlRow = (label: string, url: string) => (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl bg-surface-soft px-3 py-2.5 text-sm text-heading dark:bg-white/[0.06]">{url}</code>
        <CopyButton value={url} label={t.copy} done={t.copied} />
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      {(Object.keys(integrationSections) as Section[]).map((section) => {
        const s = t.sections[section];
        const b = badge[sectionState(section)];
        const Icon = b.icon;
        const dirty = (integrationSections[section] as readonly string[]).some(changed);
        return (
          <section key={section} className="rounded-lg bg-surface p-6 shadow-meta sm:p-8 dark:bg-card" aria-labelledby={`sec-${section}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <h2 id={`sec-${section}`} className="text-lg text-heading">{s.title}</h2>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </div>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", b.tone)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {b.label}
              </span>
            </div>

            {section === "whatsapp" && <div className="mt-5">{urlRow(t.sections.whatsapp.webhook, `${siteUrl}/api/whatsapp/webhook`)}</div>}
            {section === "feed" && (
              <div className="mt-5 grid gap-3">
                {urlRow(t.sections.feed.url, `${siteUrl}/api/ads/conversions`)}
                <ol className="grid list-decimal gap-1 pl-5 text-sm text-body">
                  {t.sections.feed.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {section === "automation" && (
              <div className="mt-5 grid gap-4">
                {urlRow(t.sections.automation.url, `${siteUrl}/api/jobs/run`)}
                <JobsPanel locale={locale} siteUrl={siteUrl} initial={jobs} hasKey={isSet("cron_secret")} />
              </div>
            )}

            <div className="mt-6 grid gap-5 lg:grid-cols-2">{(integrationSections[section] as readonly string[]).map(field)}</div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => save(section)}
                disabled={!dirty || busy === section}
                className={buttonClasses("primary", "md", "disabled:opacity-50")}
              >
                {busy === section && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {busy === section ? t.saving : t.save}
              </button>
              {savedAt === section && !dirty && (
                <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4" aria-hidden />
                  {t.saved}
                </span>
              )}
              {section === "whatsapp" && (
                <>
                  <button type="button" onClick={testWhatsApp} disabled={test.state === "busy"} className={buttonClasses("outline", "md")}>
                    {test.state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlugZap className="h-4 w-4" aria-hidden />}
                    {test.state === "busy" ? t.sections.whatsapp.testing : t.sections.whatsapp.test}
                  </button>
                  {test.text && (
                    <span
                      role="status"
                      className={cn("text-sm font-semibold", test.state === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                    >
                      {test.text}
                    </span>
                  )}
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
