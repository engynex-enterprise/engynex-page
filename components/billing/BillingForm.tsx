"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { billingCopy } from "@/content/billing";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { ClientBilling } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Values = Pick<ClientBilling, "legal_name" | "tax_id" | "email"> & { phone: string; address: string; city: string };

/** Datos de facturación del cliente (RLS: el titular guarda los suyos). */
export function BillingForm({ locale, userId, initial }: { locale: Locale; userId: string; initial: Values }) {
  const t = billingCopy[locale].details;
  const uid = useId();
  const [v, setV] = useState<Values>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.legal_name.trim().length < 2 || v.tax_id.trim().length < 4 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) return setState("invalid");
    setState("saving");
    const clean = (s: string) => s.trim() || null;
    const { error } = await createClient()
      .from("client_billing")
      .upsert({ user_id: userId, legal_name: v.legal_name.trim(), tax_id: v.tax_id.trim(), email: v.email.trim(), phone: clean(v.phone), address: clean(v.address), city: clean(v.city), updated_at: new Date().toISOString() });
    setState(error ? "error" : "saved");
  };

  const field = (k: keyof Values, opts: { type?: string; auto?: string; span?: boolean } = {}) => (
    <div className={cn(opts.span && "sm:col-span-2")}>
      <label htmlFor={`${uid}-${k}`} className="mb-1.5 block text-sm font-medium text-heading">{t[k]}</label>
      <input
        id={`${uid}-${k}`}
        type={opts.type ?? "text"}
        autoComplete={opts.auto}
        value={v[k]}
        onChange={(e) => {
          setState("idle");
          setV((p) => ({ ...p, [k]: e.target.value }));
        }}
        className={cn(inputClass, "h-11 text-[0.95rem]")}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <p className="text-sm text-muted">{t.intro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("legal_name", { auto: "organization", span: true })}
        {field("tax_id")}
        {field("phone", { type: "tel", auto: "tel" })}
        {field("email", { type: "email", auto: "email", span: true })}
        {field("address", { auto: "street-address" })}
        {field("city", { auto: "address-level2" })}
      </div>
      {state === "invalid" && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{t.invalid}</p>}
      {state === "error" && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{t.error}</p>}
      {state === "saved" && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.saved}</p>}
      <button type="submit" disabled={state === "saving"} className={cn(buttonClasses("primary", "lg"), "w-full disabled:opacity-60 sm:w-auto sm:justify-self-start")}>
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {state === "saving" ? t.saving : t.save}
      </button>
    </form>
  );
}
