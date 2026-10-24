"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { PasswordField } from "./PasswordField";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";

/** Mínimo 10 caracteres, con al menos una letra y un número. */
export const strongEnough = (value: string) =>
  value.length >= 10 && /[A-Za-z]/.test(value) && /\d/.test(value);

/**
 * Crear contraseña nueva: tras una contraseña temporal o un enlace de
 * recuperación (en ambos casos ya hay sesión). `inline` es la variante que
 * usa la página de perfil (sin redirigir al terminar).
 */
export function NewPasswordForm({
  locale,
  next,
  inline = false,
  labels,
}: {
  locale: Locale;
  next?: string;
  inline?: boolean;
  labels?: { submit: string; done: string };
}) {
  const t = portalCopy[locale].auth;
  const router = useRouter();
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!strongEnough(password)) return setError(t.weak);
    if (password !== confirm) return setError(t.mismatch);
    setError(null);
    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setStatus("idle");
      setError(
        /session|jwt|expired/i.test(updateError.message)
          ? t.expired
          : updateError.message.includes("different")
            ? t.weak
            : portalCopy[locale].auth.errors.generic,
      );
      return;
    }
    await supabase.rpc("mark_password_changed");
    if (inline) {
      setStatus("done");
      setPassword("");
      setConfirm("");
      return;
    }
    router.replace(next && next.startsWith(`/${locale}/`) ? next : `/${locale}/portal`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5">
        <PasswordField
          id={`${id}-new`}
          label={t.newPassword}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          describedBy={`${id}-rules`}
        />
        <PasswordField
          id={`${id}-confirm`}
          label={t.confirmPassword}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />
      </div>
      <p id={`${id}-rules`} className="mt-3 text-sm text-muted">
        {t.passwordRules}
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {status === "done" && labels && (
        <p role="status" className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-medium text-heading">
          {labels.done}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "saving" || !password || !confirm}
        className={buttonClasses("primary", "lg", `${inline ? "mt-6" : "mt-7 w-full"} disabled:opacity-50`)}
      >
        {status === "saving" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {status === "saving" ? t.saving : labels?.submit ?? t.save}
      </button>
    </form>
  );
}
