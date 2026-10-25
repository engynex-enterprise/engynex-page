"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlugZap } from "lucide-react";
import { integrationsCopy } from "@/content/integrations";
import { integrationsHubCopy } from "@/content/integrationsHub";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** "Probar conexión": la prueba corre en el servidor con las claves guardadas. */
export function TestConnection({ locale, slug, sendsMessage = false }: { locale: Locale; slug: string; sendsMessage?: boolean }) {
  const t = integrationsHubCopy[locale].test;
  const fields = integrationsCopy[locale].fields;
  const serverKey = integrationsCopy[locale].serverKey.title;
  const router = useRouter();
  const [state, setState] = useState<{ status: "idle" | "busy" | "ok" | "fail"; text?: string }>({ status: "idle" });

  const run = async () => {
    setState({ status: "busy" });
    const res = await fetch("/api/integrations/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; detail?: string; missing?: string[] };
    if (data.missing?.length) {
      const names = data.missing.map((k) => (k === "SUPABASE_SECRET_KEY" ? serverKey : fields[k]?.label ?? k));
      setState({ status: "fail", text: t.missing.replace("{fields}", names.join(", ")) });
    } else if (data.ok) {
      setState({ status: "ok", text: `${t.ok}${data.detail ? `: ${data.detail}` : ""}` });
    } else {
      setState({ status: "fail", text: `${t.fail}: ${data.detail ?? res.status}` });
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={state.status === "busy"}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-60"
      >
        {state.status === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlugZap className="h-4 w-4" aria-hidden />}
        {state.status === "busy" ? t.testing : t.button}
      </button>
      {sendsMessage && state.status === "idle" && <span className="text-xs text-muted">{t.sendsMessage}</span>}
      {state.text && (
        <span role="status" className={cn("text-sm font-semibold", state.status === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {state.text}
        </span>
      )}
    </div>
  );
}
