"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/supabase/types";
import { crmCopy } from "@/content/crm";
import type { Locale } from "@/i18n/config";

type Alert = Pick<Lead, "id" | "name" | "score">;

/**
 * Aviso en vivo cuando entra un lead verde (solo ventas y admin). Se queda
 * hasta que el asesor lo abre o lo cierra: un verde no debe pasar inadvertido.
 */
export function GreenLeadAlerts({ locale }: { locale: Locale }) {
  const t = crmCopy[locale].crm;
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("green-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads", filter: "tier=eq.green" },
        (payload) => {
          const lead = payload.new as Alert;
          setAlerts((list) => [lead, ...list].slice(0, 3));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (alerts.length === 0) return null;
  const dismiss = (id: string) => setAlerts((list) => list.filter((a) => a.id !== id));

  return (
    <div aria-live="assertive" className="fixed right-4 top-20 z-[70] grid w-[min(22rem,calc(100vw-2rem))] gap-2">
      {alerts.map((a) => (
        <div key={a.id} role="status" className="flex items-start gap-3 rounded-lg bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(11,16,32,0.45)] ring-2 ring-emerald-500 dark:bg-card">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <Flame className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-heading">{t.newGreen.replace("{name}", a.name)}</p>
            <Link
              href={`/${locale}/portal/crm/${a.id}`}
              onClick={() => dismiss(a.id)}
              className="mt-1 inline-block text-sm font-semibold text-accent hover:underline"
            >
              {t.open} · {a.score}/100
            </Link>
          </div>
          <button type="button" onClick={() => dismiss(a.id)} aria-label="×" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-soft">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
