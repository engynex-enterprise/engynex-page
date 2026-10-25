"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";

/**
 * Abre la página de agendamiento con el enlace del cliente. Pide el token al
 * momento (renueva su vigencia); sirve para agendar y para reprogramar.
 */
export function BookMeetingButton({
  locale,
  className,
  children,
}: {
  locale: Locale;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const { data } = await createClient().rpc("my_booking_token");
    if (data) window.location.href = `/${locale}/agendar?t=${data}`;
    else setBusy(false);
  };
  return (
    <button type="button" onClick={go} disabled={busy} className={className}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
