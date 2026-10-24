"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";
import type { Profile } from "@/lib/supabase/types";

/** Datos de contacto del propio usuario (RLS: solo su fila). */
export function ProfileForm({
  locale,
  profile,
}: {
  locale: Locale;
  profile: Pick<Profile, "id" | "full_name" | "phone" | "company" | "email">;
}) {
  const t = portalCopy[locale].portal.profile;
  const router = useRouter();
  const id = useId();
  const [values, setValues] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    company: profile.company ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    const { error } = await createClient()
      .from("profiles")
      .update({
        full_name: values.full_name.trim() || null,
        phone: values.phone.trim() || null,
        company: values.company.trim() || null,
      })
      .eq("id", profile.id);
    setStatus(error ? "error" : "saved");
    if (!error) router.refresh();
  };

  const field = (key: keyof typeof values, label: string, autoComplete: string) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-semibold text-heading">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        value={values[key]}
        onChange={(event) => {
          setValues((v) => ({ ...v, [key]: event.target.value }));
          setStatus("idle");
        }}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </div>
  );

  return (
    <form onSubmit={save} className="grid gap-5">
      {field("full_name", t.name, "name")}
      <div>
        <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-semibold text-heading">
          {t.email}
        </label>
        <input id={`${id}-email`} value={profile.email} disabled className={`${inputClass} opacity-60`} />
      </div>
      {field("phone", t.phone, "tel")}
      {field("company", t.company, "organization")}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === "saving"} className={buttonClasses("primary", "md")}>
          {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.save}
        </button>
        {status === "saved" && (
          <p role="status" className="text-sm text-accent">
            {t.saved}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {portalCopy[locale].portal.users.errors.generic}
          </p>
        )}
      </div>
    </form>
  );
}
