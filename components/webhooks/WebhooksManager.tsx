"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { ToolsNav } from "@/components/webhooks/ToolsNav";
import { ToolDrawer } from "@/components/webhooks/ToolDrawer";
import { CodeBlock, CopyButton } from "@/components/webhooks/CopyButton";
import { integrationToolsCopy } from "@/content/integrationTools";
import { rulesCopy, TRIGGERS, type RuleGroup, type TriggerKey } from "@/content/rules";
import type { Locale } from "@/i18n/config";
import type { WebhookDelivery, WebhookEndpoint } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Delivery = Pick<WebhookDelivery, "id" | "endpoint_id" | "event" | "payload" | "status" | "status_code" | "error" | "created_at" | "completed_at">;
type Draft = { id?: string; name: string; url: string; events: string[] };

/** Eventos instantáneos, agrupados como en Automatizaciones. */
const EVENT_GROUPS = (Object.keys(TRIGGERS) as TriggerKey[])
  .filter((k) => TRIGGERS[k].instant)
  .reduce<Record<RuleGroup, TriggerKey[]>>((acc, k) => {
    (acc[TRIGGERS[k].group] ??= []).push(k);
    return acc;
  }, {} as Record<RuleGroup, TriggerKey[]>);

const SAMPLE = `{
  "id": 1042,
  "event": "lead_created",
  "created_at": "2026-10-24T15:30:00.000Z",
  "data": {
    "entity": "lead",
    "id": "8f0c…",
    "nombre": "Ana Gómez",
    "empresa": "ACME SAS",
    "correo": "ana@acme.com",
    "telefono": "3001234567",
    "tier": "green",
    "puntaje": 82,
    "fuente": "web",
    "enlace": "https://engynex.com/es/portal/crm/8f0c…"
  }
}`;

const VERIFY = `import crypto from "node:crypto";

// En tu servidor: lee el cuerpo SIN parsear (texto) y compáralo.
export function isFromEngynex(rawBody, signatureHeader, secret) {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Express: app.post("/webhook", express.text({ type: "*/*" }), (req, res) => {
//   if (!isFromEngynex(req.body, req.get("X-Engynex-Signature"), process.env.ENGYNEX_SECRET)) return res.sendStatus(401);
//   const event = JSON.parse(req.body); /* … */ res.sendStatus(200);
// });`;

/**
 * Webhooks salientes: endpoints (eventos, secreto, prueba), registro de
 * entregas con reenvío y una guía corta para recibirlos.
 */
export function WebhooksManager({
  locale,
  endpoints,
  deliveries,
  stats,
}: {
  locale: Locale;
  endpoints: WebhookEndpoint[];
  deliveries: Delivery[];
  stats: { total: number; ok: number; failed: number };
}) {
  const t = integrationToolsCopy[locale];
  const w = t.webhooks;
  const r = rulesCopy;
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [filter, setFilter] = useState({ endpoint: "", status: "" });
  const [open, setOpen] = useState<Delivery | null>(null);
  const names = Object.fromEntries(endpoints.map((e) => [e.id, e.name]));
  const editing = draft?.id ? endpoints.find((e) => e.id === draft.id) : undefined;

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));
  const label = (ev: string) => (ev === "*" ? w.allEvents : ev === "test" ? w.test : (r.triggers[ev as TriggerKey]?.label ?? ev));
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };
  const closeDraft = useCallback(() => {
    setDraft(null);
    setError(null);
    setReveal(false);
  }, []);
  const closeOpen = useCallback(() => setOpen(null), []);

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.url.trim() || !draft.events.length) return setError(w.form.required);
    if (!/^https:\/\/\S+$/.test(draft.url.trim())) return setError(w.form.invalidUrl);
    setBusy(true);
    const supabase = createClient();
    const values = { name: draft.name.trim(), url: draft.url.trim(), events: draft.events };
    const { error: e } = draft.id
      ? await supabase.from("webhook_endpoints").update(values).eq("id", draft.id)
      : await supabase.from("webhook_endpoints").insert(values);
    setBusy(false);
    if (e) return setError(t.error);
    closeDraft();
    router.refresh();
  };

  const toggle = async (e: WebhookEndpoint) => {
    // Al reactivar se reinicia el contador de fallos.
    await createClient().from("webhook_endpoints").update(e.active ? { active: false } : { active: true, failures: 0 }).eq("id", e.id);
    router.refresh();
  };
  const test = async (id: string) => {
    const { error: e } = await createClient().rpc("webhook_test", { p_endpoint: id });
    flash(e ? t.error : w.testSent);
    router.refresh();
  };
  const remove = async (id: string) => {
    if (!window.confirm(w.form.deleteConfirm)) return;
    await createClient().from("webhook_endpoints").delete().eq("id", id);
    closeDraft();
    router.refresh();
  };
  const rotate = async (id: string) => {
    if (!window.confirm(w.form.rotateConfirm)) return;
    await createClient().rpc("webhook_rotate_secret", { p_endpoint: id });
    setReveal(true);
    router.refresh();
  };
  const redeliver = async (id: number) => {
    const { error: e } = await createClient().rpc("webhook_redeliver", { p_delivery: id });
    flash(e ? t.error : w.log.redelivered);
    setOpen(null);
    router.refresh();
  };

  const list = useMemo(
    () => deliveries.filter((d) => (!filter.endpoint || d.endpoint_id === filter.endpoint) && (!filter.status || d.status === filter.status)),
    [deliveries, filter],
  );
  const pct = stats.total ? Math.round((stats.ok / stats.total) * 100) : null;
  const kpis = [
    { key: "active", value: `${endpoints.filter((e) => e.active).length} / ${endpoints.length}` },
    { key: "deliveries", value: stats.total.toLocaleString(locale) },
    { key: "success", value: pct == null ? "—" : `${pct}%` },
    { key: "failed", value: stats.failed.toLocaleString(locale), alert: stats.failed > 0 },
  ] as { key: keyof typeof w.kpis; value: string; alert?: boolean }[];

  const statusTone = (s: string) =>
    s === "ok"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
      : s === "failed"
        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
  const codeTone = (c: number | null) => (c == null ? "text-muted" : c >= 200 && c < 300 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400");
  const card = "rounded-xl border border-line bg-surface dark:bg-card";
  const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading";
  const input =
    "h-10 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green";

  return (
    <>
      <ToolsNav locale={locale} admin>
        <button type="button" onClick={() => setDraft({ name: "", url: "", events: ["lead_created"] })} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
          <Plus className="h-4 w-4" aria-hidden />
          {w.add}
        </button>
      </ToolsNav>

      <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r lg:border-b-0 lg:[&:nth-child(4n)]:border-r-0">
            <p className="text-sm text-muted">{w.kpis[k.key]}</p>
            <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums", k.alert ? "text-red-600 dark:text-red-400" : "text-heading")}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 px-4 py-6 sm:px-6">
        <p className="max-w-3xl text-[0.94rem] text-muted">{w.subtitle}</p>
        {notice && (
          <p role="status" className="rounded-xl bg-[var(--meta-active)] px-4 py-2.5 text-sm text-heading">
            {notice}
          </p>
        )}

        {/* Endpoints */}
        <section className={card}>
          {endpoints.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{w.empty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {endpoints.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-heading">{e.name}</p>
                    <p className="truncate font-mono text-xs text-muted">{e.url}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.events.includes("*") ? (
                        <span className="rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.72rem] text-heading">{w.allEvents}</span>
                      ) : (
                        <>
                          {e.events.slice(0, 4).map((ev) => (
                            <span key={ev} className="rounded-md bg-[var(--meta-active)] px-1.5 py-0.5 text-[0.72rem] text-heading">{label(ev)}</span>
                          ))}
                          {e.events.length > 4 && <span className="px-1 text-[0.72rem] text-muted">+{e.events.length - 4}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className={cn("font-semibold tabular-nums", codeTone(e.last_status))}>{e.last_status ? `HTTP ${e.last_status}` : w.never}</p>
                    {e.last_delivery_at && <p className="text-muted">{fmt(e.last_delivery_at)}</p>}
                    {e.failures > 0 && <p className="text-red-600 dark:text-red-400">{`${w.cols.failures}: ${e.failures}`}</p>}
                    {!e.active && e.failures >= 20 && <p className="text-red-600 dark:text-red-400">{w.paused}</p>}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={e.active}
                    aria-label={`${w.cols.active}: ${e.name}`}
                    onClick={() => toggle(e)}
                    className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", e.active ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong")}
                  >
                    <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", e.active ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                  <div className="flex items-center">
                    <button type="button" onClick={() => test(e.id)} aria-label={`${w.test}: ${e.name}`} title={w.test} className={iconBtn}>
                      <Send className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => setDraft({ id: e.id, name: e.name, url: e.url, events: e.events })} aria-label={`${w.edit}: ${e.name}`} title={w.edit} className={iconBtn}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Registro */}
        <section className={card}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[0.98rem] font-semibold text-heading">{w.log.title}</h2>
              <p className="text-xs text-muted">{w.log.hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="w-52">
                <Select
                  size="sm"
                  label={w.log.filterEndpoint}
                  value={filter.endpoint}
                  onChange={(v) => setFilter((f) => ({ ...f, endpoint: v }))}
                  options={[{ value: "", label: `${w.log.filterEndpoint}: ${w.log.any}` }, ...endpoints.map((e) => ({ value: e.id, label: e.name }))]}
                />
              </div>
              <div className="w-44">
                <Select
                  size="sm"
                  label={w.log.filterStatus}
                  value={filter.status}
                  onChange={(v) => setFilter((f) => ({ ...f, status: v }))}
                  options={[{ value: "", label: `${w.log.filterStatus}: ${w.log.any}` }, ...(["ok", "failed", "sent"] as const).map((s) => ({ value: s, label: w.log.status[s] }))]}
                />
              </div>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{w.log.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    {(["when", "endpoint", "event", "status", "code"] as const).map((c) => (
                      <th key={c} scope="col" className={cn("px-5 py-2.5 font-medium", c === "code" && "text-right")}>{w.log.cols[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((d) => (
                    <tr
                      key={d.id}
                      tabIndex={0}
                      onClick={() => setOpen(d)}
                      onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), setOpen(d))}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-[var(--meta-hover)] focus-visible:bg-[var(--meta-hover)] focus-visible:outline-none"
                    >
                      <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-body">{fmt(d.created_at)}</td>
                      <td className="px-5 py-2.5 text-heading">{names[d.endpoint_id] ?? "—"}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-heading">{label(d.event)}</span>
                        <span className="ml-2 font-mono text-[0.72rem] text-muted">{d.event}</span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusTone(d.status))}>{w.log.status[d.status]}</span>
                      </td>
                      <td className={cn("px-5 py-2.5 text-right font-mono tabular-nums", codeTone(d.status_code))}>{d.status_code ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Guía */}
        <section className={cn(card, "grid gap-4 p-5")}>
          <div>
            <h2 className="text-[0.98rem] font-semibold text-heading">{w.docs.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">{w.docs.intro}</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <CodeBlock
              title={w.docs.headers}
              copy={t.copy}
              copied={t.copied}
              code={`POST <tu URL>\nContent-Type: application/json\nUser-Agent: Engynex-Webhooks/1.0\nX-Engynex-Event: lead_created\nX-Engynex-Delivery: 1042\nX-Engynex-Signature: sha256=<HMAC-SHA256 del cuerpo con tu secreto>`}
            />
            <CodeBlock title={w.docs.sample} copy={t.copy} copied={t.copied} code={SAMPLE} />
          </div>
          <CodeBlock title={w.docs.verify} copy={t.copy} copied={t.copied} code={VERIFY} />
        </section>
      </div>

      {/* Crear / editar */}
      {draft && (
        <ToolDrawer
          title={draft.id ? w.form.editTitle : w.form.newTitle}
          closeLabel={t.close}
          onClose={closeDraft}
          footer={
            <>
              <button type="button" onClick={save} disabled={busy} className={cn(buttonClasses("primary", "md"), "h-9 px-4 disabled:opacity-60")}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {busy ? t.saving : t.save}
              </button>
              <button type="button" onClick={closeDraft} className="h-9 rounded-[10px] px-3 text-sm font-medium text-heading hover:bg-[var(--meta-hover)]">
                {t.cancel}
              </button>
              {draft.id && (
                <button type="button" onClick={() => remove(draft.id!)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t.delete}
                </button>
              )}
            </>
          }
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-heading">{w.form.name}</span>
            <input value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={w.form.namePlaceholder} className={input} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-heading">{w.form.url}</span>
            <input value={draft.url} maxLength={500} inputMode="url" onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://hooks.zapier.com/hooks/catch/…" className={cn(input, "font-mono text-[0.8rem]")} />
            <span className="text-xs text-muted">{w.form.urlHint}</span>
          </label>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-heading">{w.form.events}</legend>
            <p className="-mt-1 text-xs text-muted">{w.form.eventsHint}</p>
            <label className="flex items-center gap-2 text-sm text-heading">
              <input
                type="checkbox"
                checked={draft.events.includes("*")}
                onChange={(e) => setDraft({ ...draft, events: e.target.checked ? ["*"] : [] })}
                className="h-4 w-4 accent-[var(--color-brand-green-dark,#467316)]"
              />
              {w.form.all}
            </label>
            {!draft.events.includes("*") &&
              (Object.keys(EVENT_GROUPS) as RuleGroup[]).map((g) => (
                <div key={g}>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">{r.groups[g]}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EVENT_GROUPS[g].map((ev) => {
                      const on = draft.events.includes(ev);
                      return (
                        <button
                          key={ev}
                          type="button"
                          aria-pressed={on}
                          title={ev}
                          onClick={() => setDraft({ ...draft, events: on ? draft.events.filter((x) => x !== ev) : [...draft.events, ev] })}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs ring-1 transition-colors",
                            on ? "bg-deep-700 text-white ring-deep-700 dark:bg-brand-green dark:text-deep-700 dark:ring-brand-green" : "text-heading ring-line hover:bg-[var(--meta-hover)]",
                          )}
                        >
                          {r.triggers[ev].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </fieldset>

          {editing && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-heading">{w.form.secret}</span>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-[10px] bg-[var(--meta-hover)] px-3 py-2 font-mono text-[0.78rem] text-heading">
                  {reveal ? editing.secret : `whsec_${"•".repeat(24)}`}
                </code>
                <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? w.form.hide : w.form.reveal} className={iconBtn}>
                  {reveal ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
                <CopyButton value={editing.secret} label={t.copy} copiedLabel={t.copied} />
              </div>
              <span className="text-xs text-muted">{w.form.secretHint}</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => rotate(editing.id)} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  {w.form.rotate}
                </button>
                <button type="button" onClick={() => test(editing.id)} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {w.test}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </ToolDrawer>
      )}

      {/* Detalle de una entrega */}
      {open && (
        <ToolDrawer
          title={w.log.detail}
          closeLabel={t.close}
          onClose={closeOpen}
          footer={
            <button type="button" onClick={() => redeliver(open.id)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
              <RefreshCw className="h-4 w-4" aria-hidden />
              {w.log.redeliver}
            </button>
          }
        >
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted">{w.log.cols.endpoint}</dt>
              <dd className="font-semibold text-heading">{names[open.endpoint_id] ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{w.log.cols.when}</dt>
              <dd className="tabular-nums text-heading">{fmt(open.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{w.log.cols.event}</dt>
              <dd className="text-heading">
                {label(open.event)} <span className="font-mono text-xs text-muted">{open.event}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{w.log.cols.status}</dt>
              <dd>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusTone(open.status))}>{w.log.status[open.status]}</span>
                <span className={cn("ml-2 font-mono text-xs", codeTone(open.status_code))}>{open.status_code ?? ""}</span>
              </dd>
            </div>
          </dl>
          {open.error && (
            <div>
              <p className="text-xs text-muted">{w.log.error}</p>
              <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">{open.error}</p>
            </div>
          )}
          <CodeBlock title={w.log.payload} copy={t.copy} copied={t.copied} code={JSON.stringify(open.payload, null, 2)} />
        </ToolDrawer>
      )}
    </>
  );
}
