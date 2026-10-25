"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Plus, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { ToolsNav } from "@/components/webhooks/ToolsNav";
import { ToolDrawer } from "@/components/webhooks/ToolDrawer";
import { CodeBlock, CopyButton } from "@/components/webhooks/CopyButton";
import { integrationToolsCopy } from "@/content/integrationTools";
import type { Locale } from "@/i18n/config";
import type { ApiKey, ApiScope } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const SCOPES: ApiScope[] = ["leads:read", "leads:write", "tickets:read", "tickets:write", "appointments:read"];

type Row = Omit<ApiKey, "key_hash">;

/** Endpoints documentados (los textos de método y ruta no se traducen). */
const ENDPOINTS = (base: string) => [
  {
    method: "POST",
    path: "/leads",
    scope: "leads:write",
    es: "Crea un lead. Calcula el puntaje y el color como el formulario, y dispara las automatizaciones (asignación, avisos, seguimiento).",
    en: "Creates a lead. Scores and colors it like the web form and fires automations (assignment, alerts, follow-up).",
    curl: `curl -X POST ${base}/leads \\
  -H "Authorization: Bearer egx_TU_CLAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ana Gómez",
    "email": "ana@acme.com",
    "phone": "3001234567",
    "company": "ACME SAS",
    "problem_category": "web",
    "message": "Necesitamos rehacer la página y conectar el CRM",
    "budget": "5to15",
    "timeline": "month",
    "source": "referral",
    "consent": true
  }'`,
  },
  {
    method: "GET",
    path: "/leads?since=2026-10-01T00:00:00Z&limit=50",
    scope: "leads:read",
    es: "Lista los leads más recientes. Filtros: since (fecha ISO), status (new, contacted, meeting, proposal, won, lost), limit (máx. 100).",
    en: "Lists the most recent leads. Filters: since (ISO date), status (new, contacted, meeting, proposal, won, lost), limit (max 100).",
    curl: `curl "${base}/leads?since=2026-10-01T00:00:00Z&limit=50" \\
  -H "Authorization: Bearer egx_TU_CLAVE"`,
  },
  {
    method: "POST",
    path: "/tickets",
    scope: "tickets:write",
    es: "Abre una solicitud de soporte (con su número y plazos de atención). category: web, email, platform, equipment, security, other-technical, billing, plan, access, other-account. priority: critical, high, medium, low.",
    en: "Opens a support request (with its number and SLA). category: web, email, platform, equipment, security, other-technical, billing, plan, access, other-account. priority: critical, high, medium, low.",
    curl: `curl -X POST ${base}/tickets \\
  -H "Authorization: Bearer egx_TU_CLAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Carlos Ruiz",
    "email": "carlos@acme.com",
    "category": "email",
    "priority": "high",
    "subject": "No llegan los correos de ventas",
    "description": "Desde esta mañana el buzón ventas@ no recibe correos."
  }'`,
  },
  {
    method: "GET",
    path: "/tickets?status=open",
    scope: "tickets:read",
    es: "Lista las solicitudes. Filtros: since, status (open, in_progress, waiting, resolved, closed), limit.",
    en: "Lists requests. Filters: since, status (open, in_progress, waiting, resolved, closed), limit.",
    curl: `curl "${base}/tickets?status=open" \\
  -H "Authorization: Bearer egx_TU_CLAVE"`,
  },
  {
    method: "GET",
    path: "/appointments?from=…&to=…",
    scope: "appointments:read",
    es: "Lista las reuniones entre dos fechas (ISO), con los datos del lead.",
    en: "Lists meetings between two dates (ISO), with the lead's details.",
    curl: `curl "${base}/appointments?from=2026-11-01T00:00:00Z&to=2026-11-30T23:59:59Z" \\
  -H "Authorization: Bearer egx_TU_CLAVE"`,
  },
];

const ERRORS: { code: number; error: string; es: string; en: string }[] = [
  { code: 400, error: "invalid_json", es: "El cuerpo no es un JSON válido.", en: "The body isn't valid JSON." },
  { code: 401, error: "invalid_key", es: "Falta la clave, está mal escrita o fue revocada.", en: "The key is missing, mistyped or revoked." },
  { code: 403, error: "missing_scope", es: "La clave no tiene el permiso de ese endpoint.", en: "The key lacks that endpoint's permission." },
  { code: 422, error: "missing_fields / consent_required / invalid_*", es: "Faltan datos obligatorios o un valor no es válido.", en: "Required data is missing or a value is invalid." },
  { code: 429, error: "rate_limited", es: "Superaste el límite. Espera y reintenta.", en: "You hit the limit. Wait and retry." },
  { code: 500, error: "server_error", es: "Error nuestro. Reintenta en unos minutos.", en: "Our error. Retry in a few minutes." },
];

/** Claves de API (crear, ver una vez, revocar) y la referencia de la API. */
export function ApiKeysManager({ locale, keys, baseUrl }: { locale: Locale; keys: Row[]; baseUrl: string }) {
  const t = integrationToolsCopy[locale];
  const a = t.api;
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["leads:write"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const base = `${baseUrl}/api/v1`;

  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso)) : t.never;
  const close = useCallback(() => {
    setCreating(false);
    setCreated(null);
    setError(null);
    setName("");
    setScopes(["leads:write"]);
  }, []);

  const create = async () => {
    if (!name.trim() || !scopes.length) return setError(a.form.required);
    setBusy(true);
    const { data, error: e } = await createClient().rpc("api_key_create", { p_name: name.trim(), p_scopes: scopes });
    setBusy(false);
    if (e || !data) return setError(t.error);
    setCreated((data as { key: string }).key);
    router.refresh();
  };
  const revoke = async (k: Row) => {
    if (!window.confirm(a.revokeConfirm)) return;
    await createClient().from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", k.id);
    router.refresh();
  };

  const active = keys.filter((k) => !k.revoked_at);
  const lastUsed = active.reduce<string | null>((m, k) => (k.last_used_at && (!m || k.last_used_at > m) ? k.last_used_at : m), null);
  const kpis = [
    { key: "active", value: active.length.toLocaleString(locale) },
    { key: "uses", value: keys.reduce((n, k) => n + k.uses, 0).toLocaleString(locale) },
    { key: "lastUsed", value: lastUsed ? fmt(lastUsed) : "—" },
  ] as { key: keyof typeof a.kpis; value: string }[];
  const card = "rounded-xl border border-line bg-surface dark:bg-card";
  const methodTone = (m: string) => (m === "GET" ? "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300");

  return (
    <>
      <ToolsNav locale={locale} admin>
        <button type="button" onClick={() => setCreating(true)} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
          <Plus className="h-4 w-4" aria-hidden />
          {a.add}
        </button>
      </ToolsNav>

      <div className="grid border-b border-line sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.key} className="border-b border-line px-6 py-4 sm:border-b-0 sm:border-r sm:[&:nth-child(3n)]:border-r-0">
            <p className="text-sm text-muted">{a.kpis[k.key]}</p>
            <p className="mt-1 text-[1.6rem] font-semibold leading-none tabular-nums text-heading">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 px-4 py-6 sm:px-6">
        <p className="max-w-3xl text-[0.94rem] text-muted">{a.subtitle}</p>

        <section className={card}>
          {keys.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{a.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    {(["name", "key", "scopes", "created", "lastUsed", "uses"] as const).map((c) => (
                      <th key={c} scope="col" className={cn("px-5 py-2.5 font-medium", c === "uses" && "text-right")}>{a.cols[c]}</th>
                    ))}
                    <th scope="col" className="px-5 py-2.5">
                      <span className="sr-only">{a.revoke}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className={cn("border-b border-line last:border-0", k.revoked_at && "opacity-60")}>
                      <td className="px-5 py-3 font-semibold text-heading">{k.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">{k.prefix}…</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span key={s} className="rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.72rem] text-heading" title={s}>{a.scopes[s] ?? s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-body">{fmt(k.created_at)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-body">{fmt(k.last_used_at)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-heading">{k.uses.toLocaleString(locale)}</td>
                      <td className="px-5 py-3 text-right">
                        {k.revoked_at ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-300">{a.revoked}</span>
                        ) : (
                          <button type="button" onClick={() => revoke(k)} className="rounded-[10px] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                            {a.revoke}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Referencia */}
        <section className={cn(card, "grid gap-5 p-5")}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{a.docs.title}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-2">
              <p className="text-sm font-medium text-heading">{a.docs.base}</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-[10px] bg-[var(--meta-hover)] px-3 py-2 font-mono text-[0.8rem] text-heading">{base}</code>
                <CopyButton value={base} label={t.copy} copiedLabel={t.copied} />
              </div>
              <p className="text-xs text-muted">{a.docs.limit}</p>
            </div>
            <div className="grid content-start gap-2">
              <p className="text-sm font-medium text-heading">{a.docs.auth}</p>
              <code className="rounded-[10px] bg-[var(--meta-hover)] px-3 py-2 font-mono text-[0.8rem] text-heading">Authorization: Bearer egx_…</code>
              <p className="flex gap-2 text-xs text-muted">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                {a.docs.authBody}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <p className="text-sm font-medium text-heading">{a.docs.endpoints}</p>
            {ENDPOINTS(base).map((ep) => (
              <div key={ep.method + ep.path} className="grid gap-2">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-semibold", methodTone(ep.method))}>{ep.method}</span>
                  <code className="font-mono text-[0.82rem] text-heading">{ep.path}</code>
                  <span className="rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.72rem] text-heading">{a.scopes[ep.scope]}</span>
                </p>
                <p className="text-sm text-muted">{ep[locale]}</p>
                <CodeBlock title="curl" copy={t.copy} copied={t.copied} code={ep.curl} />
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-heading">{a.docs.errors}</p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="px-4 py-2 font-medium">{a.docs.errorCols.code}</th>
                    <th scope="col" className="px-4 py-2 font-medium">{a.docs.errorCols.error}</th>
                    <th scope="col" className="px-4 py-2 font-medium">{a.docs.errorCols.meaning}</th>
                  </tr>
                </thead>
                <tbody>
                  {ERRORS.map((e) => (
                    <tr key={e.code} className="border-b border-line last:border-0">
                      <td className="px-4 py-2 font-mono tabular-nums text-heading">{e.code}</td>
                      <td className="px-4 py-2 font-mono text-xs text-heading">{e.error}</td>
                      <td className="px-4 py-2 text-body">{e[locale]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {creating && (
        <ToolDrawer
          title={created ? a.created.title : a.form.title}
          closeLabel={t.close}
          onClose={close}
          footer={
            created ? (
              <button type="button" onClick={close} className={cn(buttonClasses("primary", "md"), "h-9 px-4")}>
                {a.created.done}
              </button>
            ) : (
              <>
                <button type="button" onClick={create} disabled={busy} className={cn(buttonClasses("primary", "md"), "h-9 px-4 disabled:opacity-60")}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {a.form.create}
                </button>
                <button type="button" onClick={close} className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading hover:bg-[var(--meta-hover)]">
                  {t.cancel}
                </button>
              </>
            )
          }
        >
          {created ? (
            <>
              <p className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {a.created.warning}
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-[10px] bg-[var(--meta-hover)] px-3 py-2 font-mono text-[0.78rem] text-heading">{created}</code>
                <CopyButton value={created} label={t.copy} copiedLabel={t.copied} />
              </div>
            </>
          ) : (
            <>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-heading">{a.form.name}</span>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={a.form.namePlaceholder}
                  className="h-10 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green"
                />
              </label>
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium text-heading">{a.form.scopes}</legend>
                {SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-heading">
                    <input
                      type="checkbox"
                      checked={scopes.includes(s)}
                      onChange={(e) => setScopes((v) => (e.target.checked ? [...v, s] : v.filter((x) => x !== s)))}
                      className="h-4 w-4 accent-[var(--color-brand-green-dark,#467316)]"
                    />
                    {a.scopes[s]}
                    <code className="font-mono text-[0.72rem] text-muted">{s}</code>
                  </label>
                ))}
              </fieldset>
              {error && (
                <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </>
          )}
        </ToolDrawer>
      )}
    </>
  );
}
