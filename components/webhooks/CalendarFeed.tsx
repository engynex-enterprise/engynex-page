"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { CopyButton } from "@/components/webhooks/CopyButton";
import { integrationToolsCopy } from "@/content/integrationTools";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Enlace ICS personal, botones para suscribirse y pasos por aplicación. */
export function CalendarFeed({ locale, feedUrl }: { locale: Locale; feedUrl: string }) {
  const t = integrationToolsCopy[locale];
  const c = t.calendar;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  const rotate = async () => {
    if (!window.confirm(c.rotateConfirm)) return;
    setBusy(true);
    await createClient().rpc("calendar_feed_token", { p_rotate: true });
    setBusy(false);
    router.refresh();
  };

  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const steps = [
    { key: "google", title: "Google Calendar", items: c.steps.google },
    { key: "outlook", title: "Outlook", items: c.steps.outlook },
    { key: "apple", title: "Apple (iPhone y Mac)", items: c.steps.apple },
  ];

  return (
    <div className="grid gap-5 px-4 py-6 sm:px-6">
      <p className="max-w-3xl text-[0.94rem] text-muted">{c.subtitle}</p>
      <section className={cn(card, "grid gap-3")}>
        <h2 className="text-[0.98rem] font-semibold text-heading">{c.yourUrl}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-[10px] bg-[var(--meta-hover)] px-3 py-2 font-mono text-[0.8rem] text-heading">{feedUrl}</code>
          <CopyButton value={feedUrl} label={t.copy} copiedLabel={t.copied} />
        </div>
        <p className="text-xs text-muted">{c.urlHint}</p>
        <div className="flex flex-wrap gap-2">
          <a href={google} target="_blank" rel="noopener noreferrer" className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {c.google}
          </a>
          <a href={webcal} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {c.apple}
          </a>
          <button type="button" onClick={rotate} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-muted hover:bg-[var(--meta-hover)] hover:text-heading disabled:opacity-60">
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} aria-hidden />
            {c.rotate}
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className={card}>
          <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{c.includes}</h2>
          <ul className="grid gap-2.5 text-sm text-body">
            {c.includesList.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">{c.note}</p>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{c.how}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.key}>
                <p className="mb-2 text-sm font-semibold text-heading">{s.title}</p>
                <ol className="grid list-decimal gap-1.5 pl-4 text-sm text-body">
                  {s.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
