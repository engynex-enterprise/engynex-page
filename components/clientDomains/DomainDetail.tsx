"use client";

import { TestBadge } from "@/components/domains/OrderActions";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, KeyRound, Loader2, Pencil, Plus, RotateCw, Trash2, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { AutoRenewSwitch, ExpiryText, fmtDate, moneyCop, RenewButton, StatusChip, Switch } from "@/components/clientDomains/shared";
import { clientDomainsCopy } from "@/content/clientDomains";
import type { Locale } from "@/i18n/config";
import type { ClientDomain, DomainOrder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type DetailTab = "summary" | "dns" | "nameservers" | "transfer" | "history";

type Details = {
  status: string;
  is_privacy_protection_allowed: boolean;
  is_privacy_protected: boolean;
  is_lockable: boolean;
  is_locked: boolean;
  name_servers: Record<string, string> | null;
};
type Dns = { name: string; type: string; ttl: number; records: { content: string; is_disabled?: boolean }[] };
type Live = { details: Details; dns: Dns[]; expires_at: string | null };

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA"];
const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

/** Detalle del dominio: estado real del registrador y acciones del cliente. */
export function DomainDetail({
  locale,
  domain: d,
  orders,
  owner,
  tab,
  now,
  openRenew,
  canRenew,
}: {
  locale: Locale;
  domain: ClientDomain;
  orders: DomainOrder[];
  owner: string | null;
  tab: DetailTab;
  now: number;
  openRenew: boolean;
  canRenew: boolean;
}) {
  const t = clientDomainsCopy[locale];
  const td = t.detail;
  const base = `/${locale}/portal/dominios/${d.id}`;
  const [live, setLive] = useState<Live | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/domains/manage/${d.id}`).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Live & { error?: string }) | null;
    if (res?.ok && body?.details) {
      setLive(body);
      setLoadError(null);
    } else setLoadError(body?.error ?? "network");
    setLoading(false);
  }, [d.id]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/domains/manage/${d.id}`)
      .then(async (res) => ({ ok: res.ok, body: (await res.json().catch(() => null)) as (Live & { error?: string }) | null }))
      .catch(() => ({ ok: false, body: null }))
      .then(({ ok, body }) => {
        if (!alive) return;
        if (ok && body?.details) setLive(body);
        else setLoadError(body?.error ?? "network");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [d.id]);

  const act = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/domains/manage/${d.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { error?: string; auth_code?: string } | null;
    if (!res?.ok) {
      setFlash({ ok: false, text: td.error.replace("{error}", (body?.error ?? "network").replace(/^\[[^\]]+\]\s*/, "")) });
      return null;
    }
    setFlash({ ok: true, text: td.saved });
    setTimeout(() => setFlash(null), 2500);
    return body ?? {};
  };

  const expires = live?.expires_at ?? d.expires_at;
  const tabs = Object.keys(td.tabs) as DetailTab[];

  return (
    <div>
      {/* Cabecera */}
      <div className="border-b border-line px-4 pb-5 pt-2 sm:px-6">
        <Link href={`/${locale}/portal/dominios`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {td.back}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-tight text-heading [overflow-wrap:anywhere]">{d.domain}</h2>
              <StatusChip locale={locale} status={d.status} />
{d.is_test && <TestBadge locale={locale} />}
            </div>
            <p className="mt-1 text-sm">
              <ExpiryText locale={locale} iso={expires} now={now} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md")}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              {td.openSite}
            </a>
            {canRenew && <RenewButton locale={locale} domainId={d.id} domain={d.domain} price={d.renewal_price_cop} autoOpen={openRenew} primary />}
          </div>
        </div>
      </div>

      <nav aria-label={d.domain} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
        {tabs.map((k) => (
          <Link
            key={k}
            href={k === "summary" ? base : `${base}?tab=${k}`}
            aria-current={tab === k ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-3.5 text-[0.94rem]",
              tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {td.tabs[k]}
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 px-4 py-6 sm:px-6">
        {flash && (
          <p role="status" className={cn("text-sm font-medium", flash.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {flash.text}
          </p>
        )}
        {tab !== "history" && loading && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {td.loading}
          </p>
        )}
        {tab !== "history" && loadError && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{td.registrarError.replace("{error}", loadError.replace(/^\[[^\]]+\]\s*/, ""))}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
              {td.retry}
            </button>
          </div>
        )}

        {tab === "summary" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className={card}>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">{td.registered}</dt>
                  <dd className="mt-0.5 font-medium text-heading">{fmtDate(locale, d.registered_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted">{td.expires}</dt>
                  <dd className="mt-0.5 font-medium text-heading">{expires ? fmtDate(locale, expires) : "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted">{td.owner}</dt>
                  <dd className="mt-0.5 font-medium text-heading">{owner ?? "—"}</dd>
                </div>
              </dl>
            </section>
            <section className={cn(card, "grid gap-5")}>
              <Row title={t.autoRenew} hint={t.autoRenewHint}>
                <AutoRenewSwitch locale={locale} domainId={d.id} initial={d.auto_renew} />
              </Row>
              <Row title={td.privacy} hint={live && !live.details.is_privacy_protection_allowed ? td.privacyUnavailable : td.privacyHint}>
                <RegistrarSwitch
                  label={td.privacy}
                  value={live ? live.details.is_privacy_protected : d.privacy}
                  disabled={!live || !live.details.is_privacy_protection_allowed}
                  onChange={async (on) => !!(await act({ type: "privacy", on }))}
                />
              </Row>
              <Row title={td.lock} hint={td.lockHint}>
                <RegistrarSwitch
                  label={td.lock}
                  value={live ? live.details.is_locked : d.locked}
                  disabled={!live || !live.details.is_lockable}
                  onChange={async (on) => {
                    const ok = !!(await act({ type: "lock", on }));
                    if (ok) setLive((l) => (l ? { ...l, details: { ...l.details, is_locked: on } } : l));
                    return ok;
                  }}
                />
              </Row>
            </section>
          </div>
        )}

        {tab === "dns" && <DnsPanel locale={locale} records={live?.dns ?? []} ready={!!live} act={act} reload={load} />}

        {tab === "nameservers" && <NameserversPanel locale={locale} current={live?.details.name_servers ?? null} ready={!!live} act={act} />}

        {tab === "transfer" && <TransferPanel locale={locale} locked={live?.details.is_locked ?? d.locked} ready={!!live} act={act} />}

        {tab === "history" &&
          (orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{td.history.empty}</p>
          ) : (
            <ul className="grid gap-2">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface px-5 py-3.5 text-sm dark:bg-card">
                  <span className="w-28 text-muted">{fmtDate(locale, o.created_at)}</span>
                  <span className="font-semibold text-heading">{t.purchases.kinds[o.kind]}</span>
                  <span className="text-muted">{t.purchases.statuses[o.status] ?? o.status}</span>
                  <span className="ml-auto tabular-nums text-heading">{moneyCop(o.price_cop)}</span>
                  {o.paid_at && (
                    <Link href={`/${locale}/portal/dominios/compras/${o.reference}`} className="font-medium text-heading hover:underline">
                      {t.purchases.view}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-heading">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

/** Interruptor que espera la respuesta del registrador antes de quedarse. */
function RegistrarSwitch({ label, value, disabled, onChange }: { label: string; value: boolean; disabled: boolean; onChange: (on: boolean) => Promise<boolean> }) {
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setOn(value);
  }
  return (
    <span className="flex items-center gap-2">
      {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
      <Switch
        label={label}
        checked={on}
        disabled={disabled || busy}
        onChange={async (v) => {
          setBusy(true);
          setOn(v);
          if (!(await onChange(v))) setOn(!v);
          setBusy(false);
        }}
      />
    </span>
  );
}

type Act = (payload: Record<string, unknown>) => Promise<{ error?: string; auth_code?: string } | null>;

function DnsPanel({ locale, records, ready, act, reload }: { locale: Locale; records: Dns[]; ready: boolean; act: Act; reload: () => Promise<void> }) {
  const t = clientDomainsCopy[locale].detail.dns;
  const dialog = useRef<HTMLDialogElement>(null);
  const [edit, setEdit] = useState<{ name: string; type: string; ttl: number; values: string }>({ name: "@", type: "A", ttl: 14400, values: "" });
  const [busy, setBusy] = useState(false);
  const visible = records.filter((r) => r.type !== "SOA" && r.type !== "NS");

  const open = (r?: Partial<typeof edit>) => {
    setEdit({ name: "@", type: "A", ttl: 14400, values: "", ...r });
    dialog.current?.showModal();
  };
  const save = async (rec: { name: string; type: string; ttl?: number; values: string[] }) => {
    setBusy(true);
    const ok = await act({ type: "dns_upsert", record: rec });
    setBusy(false);
    if (ok) {
      dialog.current?.close();
      await reload();
    }
  };
  const preset = async (kind: "workspace" | "txt" | "ip") => {
    if (kind === "workspace") return save({ name: "@", type: "MX", ttl: 3600, values: ["1 smtp.google.com"] });
    if (kind === "txt") {
      const v = window.prompt(t.txtPrompt)?.trim();
      if (v) await save({ name: "@", type: "TXT", ttl: 3600, values: [v] });
      return;
    }
    const ip = window.prompt(t.ipPrompt)?.trim();
    if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return;
    await save({ name: "@", type: "A", ttl: 3600, values: [ip] });
    await save({ name: "www", type: "A", ttl: 3600, values: [ip] });
  };

  return (
    <section className={card}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.98rem] font-semibold text-heading">{t.title}</h3>
          <p className="mt-0.5 text-sm text-muted">{t.hint}</p>
        </div>
        <button type="button" disabled={!ready} onClick={() => open()} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5 disabled:opacity-50")}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.add}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{t.presets}:</span>
        {(
          [
            ["workspace", t.presetWorkspace],
            ["txt", t.presetGoogleTxt],
            ["ip", t.presetIp],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" disabled={!ready || busy} onClick={() => void preset(k)} className="rounded-full px-3 py-1 font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50">
            {label}
          </button>
        ))}
      </div>
      {ready && visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {(["type", "name", "value", "ttl", "actions"] as const).map((c) => (
                  <th key={c} scope="col" className="py-2.5 pr-3 font-medium">{t.cols[c]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={`${r.type}-${r.name}`} className="border-b border-line last:border-0 align-top">
                  <td className="py-3 pr-3 font-mono text-xs font-semibold text-heading">{r.type}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-heading">{r.name}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-body">
                    {r.records.map((x) => (
                      <span key={x.content} className="block max-w-[22rem] [overflow-wrap:anywhere]">{x.content}</span>
                    ))}
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-muted">{r.ttl}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label={t.edit} onClick={() => open({ name: r.name, type: r.type, ttl: r.ttl, values: r.records.map((x) => x.content).join("\n") })} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t.delete}
                        onClick={async () => {
                          if (!window.confirm(t.confirmDelete.replace("{type}", r.type).replace("{name}", r.name))) return;
                          if (await act({ type: "dns_delete", record: { name: r.name, type: r.type } })) await reload();
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog ref={dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()} className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-body shadow-2xl backdrop:bg-black/50 dark:bg-card">
        <form
          className="grid gap-4 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            void save({ name: edit.name.trim() || "@", type: edit.type, ttl: edit.ttl, values: edit.values.split("\n") });
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-heading">{t.dialogTitle}</h3>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-card-soft">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Select size="md" label={t.type} value={edit.type} onChange={(v) => setEdit((p) => ({ ...p, type: v }))} options={DNS_TYPES.map((x) => ({ value: x, label: x }))} />
          <label className="grid gap-1.5 text-sm font-medium text-heading">
            {t.name}
            <input value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} className={cn(inputClass, "h-11 font-mono text-sm")} />
            <span className="text-xs font-normal text-muted">{t.nameHint}</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-heading">
            {t.values}
            <textarea value={edit.values} onChange={(e) => setEdit((p) => ({ ...p, values: e.target.value }))} rows={3} className={cn(inputClass, "h-auto py-2.5 font-mono text-sm")} />
            <span className="text-xs font-normal text-muted">{t.valuesHint}</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-heading">
            {t.ttl}
            <input type="number" min={60} max={86400} value={edit.ttl} onChange={(e) => setEdit((p) => ({ ...p, ttl: Number(e.target.value) || 14400 }))} className={cn(inputClass, "h-11 w-40 text-sm tabular-nums")} />
          </label>
          <button type="submit" disabled={busy || !edit.values.trim()} className={cn(buttonClasses("primary", "md"), "disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.save}
          </button>
        </form>
      </dialog>
    </section>
  );
}

function NameserversPanel({ locale, current, ready, act }: { locale: Locale; current: Record<string, string> | null; ready: boolean; act: Act }) {
  const t = clientDomainsCopy[locale].detail.ns;
  const [ns, setNs] = useState<Record<string, string>>({ ns1: "", ns2: "", ns3: "", ns4: "" });
  const [prev, setPrev] = useState(current);
  if (prev !== current) {
    setPrev(current);
    setNs({ ns1: "", ns2: "", ns3: "", ns4: "", ...(current ?? {}) });
  }
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  return (
    <section className={cn(card, "max-w-2xl")}>
      <h3 className="text-[0.98rem] font-semibold text-heading">{t.title}</h3>
      <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t.hint}
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const clean = Object.fromEntries(Object.entries(ns).map(([k, v]) => [k, v.trim().toLowerCase()]).filter(([, v]) => v));
          if (!clean.ns1 || !clean.ns2) return setInvalid(true);
          setInvalid(false);
          setBusy(true);
          await act({ type: "nameservers", ns: clean });
          setBusy(false);
        }}
      >
        {(["ns1", "ns2", "ns3", "ns4"] as const).map((k) => (
          <label key={k} className="grid gap-1.5 text-sm font-medium text-heading">
            {k.toUpperCase()}
            <input value={ns[k] ?? ""} disabled={!ready} onChange={(e) => setNs((p) => ({ ...p, [k]: e.target.value }))} placeholder={`${k}.proveedor.com`} className={cn(inputClass, "h-11 font-mono text-sm")} />
          </label>
        ))}
        {invalid && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400 sm:col-span-2">{t.invalid}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={!ready || busy} className={cn(buttonClasses("primary", "md"), "disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.save}
          </button>
        </div>
      </form>
    </section>
  );
}

function TransferPanel({ locale, locked, ready, act }: { locale: Locale; locked: boolean; ready: boolean; act: Act }) {
  const t = clientDomainsCopy[locale].detail.transfer;
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <section className={cn(card, "max-w-2xl")}>
      <h3 className="flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
        <KeyRound className="h-4 w-4 text-accent" aria-hidden />
        {t.title}
      </h3>
      <p className="mt-2 text-sm text-muted">{t.body}</p>
      {locked && <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">{t.lockedNote}</p>}
      {code ? (
        <div className="mt-5">
          <p className="text-xs font-medium text-muted">{t.code}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-[10px] bg-[var(--meta-active)] px-3 py-2 font-mono text-sm text-heading [overflow-wrap:anywhere]">{code}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t.warning}</p>
        </div>
      ) : (
        <button
          type="button"
          disabled={!ready || busy}
          onClick={async () => {
            setBusy(true);
            const r = await act({ type: "auth_code" });
            setBusy(false);
            if (r?.auth_code) setCode(r.auth_code);
          }}
          className={cn(buttonClasses("outline", "md"), "mt-5 disabled:opacity-50")}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.show}
        </button>
      )}
    </section>
  );
}
