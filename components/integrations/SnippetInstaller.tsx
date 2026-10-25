"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardPaste, Code2, FlaskConical, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { snippetCopy } from "@/content/snippetInstaller";
import type { Locale } from "@/i18n/config";
import { detectIds, gtmBodySnippet, installedSnippet, isVerification, type SnippetKey } from "@/lib/tagSnippets";
import { cn } from "@/lib/utils";

const areaClass =
  "w-full resize-y rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 font-mono text-[0.8rem] leading-relaxed text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green";

/** Bloque de código instalado con su botón de copiar. */
function CodeBlock({ label, note, code, copyLabel, copiedLabel }: { label: string; note?: string; code: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {label}
        </span>
        {note && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {note}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
        >
          <Code2 className="h-3.5 w-3.5" aria-hidden />
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-[10px] bg-[var(--meta-active)] p-3 font-mono text-[0.75rem] leading-relaxed text-heading">{code}</pre>
    </div>
  );
}

/**
 * "Pega el código de instalación": reconoce el ID dentro del código que da el
 * proveedor, lo guarda y muestra el código que quedó activo en el sitio.
 * Tag Manager tiene dos campos, como el diálogo de Google (<head> y <body>).
 */
export function SnippetInstaller({
  locale,
  keys,
  current,
}: {
  locale: Locale;
  keys: SnippetKey[];
  /** Valor guardado de cada clave (null = sin instalar). */
  current: Partial<Record<SnippetKey, string | null>>;
}) {
  const t = snippetCopy[locale];
  const router = useRouter();
  const headId = useId();
  const bodyId = useId();
  const gtm = keys.includes("gtm_id");
  const [head, setHead] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const headFound = useMemo(() => (head.trim() ? detectIds(head, keys) : {}), [head, keys]);
  const bodyFound = useMemo(() => (gtm && body.trim() ? detectIds(body, keys) : {}), [body, keys, gtm]);
  const mismatch = gtm && headFound.gtm_id && bodyFound.gtm_id && headFound.gtm_id !== bodyFound.gtm_id;
  const found = { ...bodyFound, ...headFound };
  const foundKeys = Object.keys(found) as SnippetKey[];
  const typed = head.trim() || body.trim();
  const installed = keys.filter((k) => current[k]);

  const install = async () => {
    setState("saving");
    const supabase = createClient();
    for (const key of foundKeys) {
      const { error } = await supabase.rpc("admin_set_integration", { p_key: key, p_value: found[key]! });
      if (error) return setState("error");
    }
    // El sitio vuelve a leer las etiquetas sin esperar la caché.
    await fetch("/api/integrations/revalidate", { method: "POST" }).catch(() => null);
    setState("done");
    setHead("");
    setBody("");
    router.refresh();
  };

  const field = (id: string, label: string, hint: string, value: string, set: (v: string) => void, rows: number, placeholder?: string) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-heading">{label}</label>
      <p className="mb-1.5 text-xs text-muted">{hint}</p>
      <textarea
        id={id}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setState("idle");
        }}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className={areaClass}
      />
    </div>
  );

  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <h2 className="flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
        <ClipboardPaste className="h-4 w-4 text-accent" aria-hidden />
        {t.title}
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-muted">{t.hint}</p>

      <div className="mt-4 grid gap-4">
        {gtm ? (
          <>
            {field(headId, t.headLabel, t.headHint, head, setHead, 7, t.placeholder)}
            {field(bodyId, t.bodyLabel, t.bodyHint, body, setBody, 4, gtmBodySnippet("GTM-XXXXXXX"))}
          </>
        ) : (
          <>
            <label htmlFor={headId} className="sr-only">{t.title}</label>
            <textarea
              id={headId}
              value={head}
              onChange={(e) => {
                setHead(e.target.value);
                setState("idle");
              }}
              rows={6}
              spellCheck={false}
              className={areaClass}
            />
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {typed &&
          (mismatch ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {t.mismatch.replace("{a}", headFound.gtm_id!).replace("{b}", bodyFound.gtm_id!)}
            </p>
          ) : foundKeys.length ? (
            <p className="text-sm text-heading">
              {t.found}{" "}
              {foundKeys.map((k) => (
                <code key={k} className="mx-0.5 rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.8rem]">
                  {found[k]}
                </code>
              ))}
            </p>
          ) : (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t.notFound}</p>
          ))}
        <button
          type="button"
          onClick={install}
          disabled={!foundKeys.length || !!mismatch || state === "saving"}
          className={cn(buttonClasses("primary", "md"), "ml-auto h-9 px-3.5 disabled:opacity-50")}
        >
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.install}
        </button>
      </div>
      {state === "done" && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {t.done}
        </p>
      )}
      {state === "error" && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{t.error}</p>}

      {installed.map((k) => (
        <div key={k} className="mt-5 grid gap-4 border-t border-line pt-5">
          <p className="text-xs text-muted">{t.activeCode}</p>
          <CodeBlock
            label={k === "gtm_id" ? `${t.installedHead} · ${current[k]}` : t.installed.replace("{id}", current[k]!)}
            note={isVerification(k) ? t.alwaysOn : t.consent}
            code={installedSnippet(k, current[k]!)}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
          {k === "gtm_id" && (
            <>
              <CodeBlock label={t.installedBody} code={gtmBodySnippet(current[k]!)} copyLabel={t.copy} copiedLabel={t.copied} />
              <div className="rounded-[10px] bg-[var(--meta-active)]/60 p-3.5">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-heading">
                  <FlaskConical className="h-4 w-4 text-accent" aria-hidden />
                  {t.testTitle}
                </p>
                <p className="mt-1 text-sm text-body">{t.testHint}</p>
              </div>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
