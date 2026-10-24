"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AccountKind } from "@/lib/supabase/types";
import { buttonClasses } from "@/components/ui/Button";
import { PasswordField } from "./PasswordField";
import { inputClass } from "./inputClass";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";

/**
 * Inicio de sesión con correo y contraseña. Después de entrar:
 * - si la contraseña es temporal, pide cambiarla;
 * - si no, va a `next` o al inicio del portal.
 * El tipo elegido en el menú ("as") solo cambia los textos: el portal que se
 * abre depende del tipo real de la cuenta.
 */
export function LoginForm({
  locale,
  as,
  next,
  initialError,
}: {
  locale: Locale;
  as: AccountKind | null;
  next: string | null;
  initialError: string | null;
}) {
  const t = portalCopy[locale].auth;
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(
    initialError === "expired" ? t.expired : null,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.user) {
      setStatus("idle");
      const message = signInError?.message ?? "";
      setError(
        /banned/i.test(message)
          ? t.errors.banned
          : /rate|too many/i.test(message)
            ? t.errors.tooMany
            : /invalid/i.test(message)
              ? t.errors.invalid
              : t.errors.generic,
      );
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("kind, must_change_password, active")
      .eq("id", data.user.id)
      .single();

    if (!profile?.active) {
      await supabase.auth.signOut();
      setStatus("idle");
      setError(t.errors.banned);
      return;
    }

    const destination =
      next && next.startsWith(`/${locale}/`) ? next : `/${locale}/portal`;
    if (profile.must_change_password) {
      router.replace(
        `/${locale}/acceso/nueva-clave?next=${encodeURIComponent(destination)}`,
      );
    } else {
      router.replace(destination);
    }
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5">
        <div>
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
        </div>
        <PasswordField
          id={`${id}-password`}
          label={t.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending" || !email || !password}
        className={buttonClasses("primary", "lg", "mt-7 w-full disabled:opacity-50")}
      >
        {status === "sending" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {status === "sending" ? t.submitting : t.submit}
      </button>

      <p className="mt-5 text-center">
        <Link
          href={`/${locale}/acceso/recuperar${as ? `?as=${as}` : ""}`}
          className="text-sm font-semibold text-heading hover:underline"
        >
          {t.forgot}
        </Link>
      </p>

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={`/${locale}/contacto`} className="font-semibold text-heading hover:underline">
          {t.contact}
        </Link>
      </p>
    </form>
  );
}
