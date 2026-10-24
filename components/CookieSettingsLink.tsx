"use client";

import { openCookieSettings } from "@/lib/cookieConsent";

/** Enlace del footer que reabre la configuración de cookies. */
export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="hover:text-heading hover:underline"
    >
      {label}
    </button>
  );
}
