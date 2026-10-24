"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { followupsCopy } from "@/content/followups";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "queue", path: "" },
  { key: "sequence", path: "/secuencia" },
  { key: "drafts", path: "/abandonados" },
  { key: "reports", path: "/reportes" },
] as const;

/** Pestañas del módulo de seguimiento (mismo estilo que el CRM y el chat). */
export function FollowupNav({ locale }: { locale: Locale }) {
  const t = followupsCopy[locale].nav;
  const pathname = usePathname();
  const base = `/${locale}/portal/seguimiento`;
  return (
    <nav aria-label={t.queue} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
      {TABS.map((tab) => {
        const href = base + tab.path;
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
              active ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
