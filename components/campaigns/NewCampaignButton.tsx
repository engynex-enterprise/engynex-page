"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { campaignsProCopy } from "@/content/campaignsPro";
import { campaignsListCopy } from "@/content/campaignsList";
import { ChannelIcon } from "./shared";
import type { Locale } from "@/i18n/config";

/** "Nueva campaña": primero se elige el canal (WhatsApp o correo). */
export function NewCampaignButton({ locale }: { locale: Locale }) {
  const t = campaignsProCopy[locale];
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-4 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t.newCampaign}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
            className="grid w-full max-w-md gap-4 rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
          >
            <div className="flex items-center justify-between">
              <h2 id={titleId} className="text-base font-semibold text-heading">{t.chooseChannel}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={campaignsListCopy[locale].newDialog.cancel} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-2">
              {(["whatsapp", "email"] as const).map((c) => (
                <Link
                  key={c}
                  href={`/${locale}/portal/campanas/nueva?canal=${c}`}
                  className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-line transition-colors hover:bg-[var(--meta-hover)] hover:ring-line-strong"
                >
                  <ChannelIcon channel={c} className="h-10 w-10" />
                  <span>
                    <span className="block font-semibold text-heading">{t.channels[c]}</span>
                    <span className="mt-0.5 block text-sm text-muted">{t.channelHints[c]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
