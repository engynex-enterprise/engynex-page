"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clientPortalCopy, type NotifyPrefKey } from "@/content/clientPortal";
import type { Locale } from "@/i18n/config";
import type { Json } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** Valor por defecto de cada aviso cuando el usuario aún no lo ha elegido. */
const DEFAULTS: Record<NotifyPrefKey, boolean> = { invoices: true, domains: true, projects: true, tickets: true, newsletter: false };

/** Preferencias de correo del usuario (profiles.notify_prefs, solo su fila). */
export function NotificationPrefs({ locale, profileId, initial }: { locale: Locale; profileId: string; initial: Json | null | undefined }) {
  const t = clientPortalCopy[locale].profile.notify;
  const stored = initial && typeof initial === "object" && !Array.isArray(initial) ? (initial as Record<string, Json>) : {};
  const [prefs, setPrefs] = useState<Record<string, Json>>(stored);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const value = (k: NotifyPrefKey) => (typeof prefs[k] === "boolean" ? (prefs[k] as boolean) : DEFAULTS[k]);

  const toggle = async (k: NotifyPrefKey) => {
    const prev = prefs;
    const next = { ...prefs, [k]: !value(k) };
    setPrefs(next);
    const { error } = await createClient().from("profiles").update({ notify_prefs: next }).eq("id", profileId);
    if (error) setPrefs(prev);
    setStatus(error ? "error" : "saved");
  };

  return (
    <div>
      <h2 className="text-lg text-heading">{t.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.desc}</p>
      <ul className="mt-4 divide-y divide-line">
        {(Object.keys(t.items) as NotifyPrefKey[]).map((k) => (
          <Row key={k} title={t.items[k].label} desc={t.items[k].desc} checked={value(k)} onChange={() => toggle(k)} />
        ))}
      </ul>
      <p role="status" className={cn("mt-3 min-h-5 text-sm", status === "error" ? "text-red-700 dark:text-red-400" : "text-muted")}>
        {status === "saved" ? t.saved : status === "error" ? t.error : ""}
      </p>
    </div>
  );
}

function Row({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: () => void }) {
  const id = useId();
  return (
    <li className="flex items-start gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-sm font-semibold text-heading">
          {title}
        </p>
        <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-muted">
          {desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={onChange}
        className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-deep-700 dark:bg-brand-green" : "bg-line-strong")}
      >
        <span aria-hidden className={cn("absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
    </li>
  );
}
