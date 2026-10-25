"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Departamentos de Colombia (el registrador los pide para .co y demás). */
export const CO_STATES = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
  "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];

const COPY = {
  es: {
    person: "Persona",
    company: "Empresa",
    firstName: "Nombres",
    lastName: "Apellidos",
    companyName: "Razón social",
    document: "Cédula o NIT",
    email: "Correo del titular",
    phone: "Celular",
    address: "Dirección",
    city: "Ciudad",
    state: "Departamento",
    zip: "Código postal",
    zipHint: "Si no lo sabes, búscalo en codigopostal.gov.co",
    save: "Guardar datos del titular",
    saving: "Guardando…",
    saved: "Datos guardados",
    invalid: "Completa todos los campos obligatorios.",
    error: "No se pudieron guardar los datos.",
    note: "El dominio queda registrado a nombre de este titular. Con la privacidad WHOIS activada, estos datos no se muestran públicamente.",
  },
  en: {
    person: "Individual",
    company: "Company",
    firstName: "First name",
    lastName: "Last name",
    companyName: "Company name",
    document: "ID or tax number",
    email: "Registrant email",
    phone: "Mobile",
    address: "Address",
    city: "City",
    state: "Department / state",
    zip: "Postal code",
    zipHint: "If you don't know it, look it up at codigopostal.gov.co",
    save: "Save registrant details",
    saving: "Saving…",
    saved: "Details saved",
    invalid: "Fill in all required fields.",
    error: "Couldn't save the details.",
    note: "The domain is registered in this registrant's name. With WHOIS privacy on, these details aren't shown publicly.",
  },
} as const;

export type WhoisValues = {
  entity_type: "individual" | "organization";
  first_name: string;
  last_name: string;
  company: string;
  document_id: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const EMPTY: WhoisValues = { entity_type: "individual", first_name: "", last_name: "", company: "", document_id: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "CO" };

/**
 * Datos del titular del dominio (WHOIS). Carga los guardados del cliente
 * (GET /api/domains/whois) y los guarda (PUT). Se usa en la compra y en el
 * portal ("Datos del titular").
 */
export function WhoisForm({ locale, onSaved, submitLabel, compact = false }: { locale: Locale; onSaved?: () => void; submitLabel?: string; compact?: boolean }) {
  const t = COPY[locale];
  const uid = useId();
  const [v, setV] = useState<WhoisValues>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  useEffect(() => {
    let alive = true;
    fetch("/api/domains/whois")
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { whois: Partial<WhoisValues> | null; email?: string; name?: string | null; phone?: string | null } | null) => {
        if (!alive || !b) return;
        if (b.whois) setV({ ...EMPTY, ...Object.fromEntries(Object.entries(b.whois).map(([k, x]) => [k, x ?? ""])) } as WhoisValues);
        else {
          const [first, ...rest] = (b.name ?? "").split(" ");
          setV((p) => ({ ...p, email: b.email ?? "", phone: b.phone ?? "", first_name: first ?? "", last_name: rest.join(" ") }));
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const set = (k: keyof WhoisValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setState("idle");
    setV((p) => ({ ...p, [k]: e.target.value }));
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof WhoisValues)[] = ["first_name", "last_name", "phone", "address", "city", "state", "zip"];
    if (required.some((k) => !v[k].trim()) || (v.entity_type === "organization" && !v.company.trim())) return setState("invalid");
    setState("saving");
    const res = await fetch("/api/domains/whois", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    if (!res.ok) return setState(res.status === 422 ? "invalid" : "error");
    setState("saved");
    onSaved?.();
  };

  const field = (k: keyof WhoisValues, label: string, opts: { type?: string; auto?: string; span?: boolean; hint?: string } = {}) => (
    <div className={cn(opts.span && "sm:col-span-2")}>
      <label htmlFor={`${uid}-${k}`} className="mb-1.5 block text-sm font-medium text-heading">{label}</label>
      <input id={`${uid}-${k}`} type={opts.type ?? "text"} autoComplete={opts.auto} value={v[k]} onChange={set(k)} className={cn(inputClass, "h-11 text-[0.95rem]")} />
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
    </div>
  );

  if (loading) return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted" aria-label="…" />;

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="flex gap-1 rounded-full bg-surface-soft p-1 dark:bg-white/[0.06]" role="radiogroup">
        {(["individual", "organization"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={v.entity_type === k}
            onClick={() => setV((p) => ({ ...p, entity_type: k }))}
            className={cn("flex-1 rounded-full px-4 py-2 text-sm", v.entity_type === k ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted")}
          >
            {k === "individual" ? t.person : t.company}
          </button>
        ))}
      </div>
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        {field("first_name", t.firstName, { auto: "given-name" })}
        {field("last_name", t.lastName, { auto: "family-name" })}
        {v.entity_type === "organization" && field("company", t.companyName, { auto: "organization", span: true })}
        {field("document_id", t.document)}
        {field("phone", t.phone, { type: "tel", auto: "tel" })}
        {field("email", t.email, { type: "email", auto: "email", span: true })}
        {field("address", t.address, { auto: "street-address", span: true })}
        {field("city", t.city, { auto: "address-level2" })}
        <Select
          size="md"
          label={t.state}
          value={v.state}
          onChange={(x) => setV((p) => ({ ...p, state: x }))}
          options={CO_STATES.map((s) => ({ value: s, label: s }))}
          placeholder="—"
        />
        {field("zip", t.zip, { auto: "postal-code", hint: t.zipHint })}
      </div>
      <p className="text-xs text-muted">{t.note}</p>
      {state === "invalid" && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{t.invalid}</p>}
      {state === "error" && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{t.error}</p>}
      {state === "saved" && !onSaved && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.saved}</p>}
      <button type="submit" disabled={state === "saving"} className={cn(buttonClasses("primary", "lg"), "w-full disabled:opacity-60 sm:w-auto")}>
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {state === "saving" ? t.saving : submitLabel ?? t.save}
      </button>
    </form>
  );
}
