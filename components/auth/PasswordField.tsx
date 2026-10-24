"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Campo de contraseña con botón para mostrarla. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showLabel,
  hideLabel,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-heading">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          required
          className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-4 pr-12 text-base text-heading outline-none transition-colors hover:border-muted focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-card-soft hover:text-heading"
        >
          {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}
