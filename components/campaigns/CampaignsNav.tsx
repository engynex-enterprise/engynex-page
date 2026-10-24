"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { campaignsProCopy } from "@/content/campaignsPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Pestañas del módulo de campañas (mismo estilo que el CRM). */
export function CampaignsNav({ locale }: { locale: Locale }) {
  const t = campaignsProCopy[locale].nav;
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const base = `/${locale}/portal/campanas`;
  const tabs = [
    { key: "campaigns", href: base, active: pathname === base && !tab },
    { key: "templates", href: `${base}?tab=plantillas`, active: tab === "plantillas" },
    { key: "segments", href: `${base}?tab=segmentos`, active: tab === "segmentos" },
  ] as const;
  return (
    <nav aria-label={t.campaigns} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
      {tabs.map((x) => (
        <Link
          key={x.key}
          href={x.href}
          aria-current={x.active ? "page" : undefined}
          className={cn(
            "-mb-px flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
            x.active ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
          )}
        >
          {t[x.key]}
        </Link>
      ))}
    </nav>
  );
}
