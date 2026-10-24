"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "./inputClass";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";

/**
 * Pide el enlace de recuperación. La respuesta es siempre la misma exista o
 * no el correo, para no revelar qué cuentas están registradas.
 */
export function RecoverForm({ locale }: { locale: Locale }) {
  const t = portalCopy[locale].auth;
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    const next = `/${locale}/acceso/nueva-clave`;
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
    });
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div role="status">
        <MailCheck className="h-9 w-9 text-accent" aria-hidden />
        <p className="mt-4 text-base leading-relaxed text-body">{t.recoverSent}</p>
        <Link
          href={`/${locale}/acceso`}
          className={buttonClasses("outline", "md", "mt-6")}
        >
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-semibold text-heading">
        {t.email}
      </label>
      <input
        id={`${id}-email`}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === "sending" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
        className={buttonClasses("primary", "lg", "mt-7 w-full disabled:opacity-50")}
      >
        {status === "sending" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {t.recoverSubmit}
      </button>
      <p className="mt-5 text-center">
        <Link href={`/${locale}/acceso`} className="text-sm font-semibold text-heading hover:underline">
          {t.backToLogin}
        </Link>
      </p>
    </form>
  );
}
