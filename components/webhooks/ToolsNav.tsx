"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { integrationToolsCopy } from "@/content/integrationTools";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "webhooks", path: "/webhooks" },
  { key: "api", path: "/api" },
  { key: "calendar", path: "/calendario" },
] as const;

/** Volver a Integraciones y saltar entre Webhooks, API y Calendario. */
export function ToolsNav({ locale, admin, children }: { locale: Locale; admin: boolean; children?: React.ReactNode }) {
  const t = integrationToolsCopy[locale];
  const pathname = usePathname();
  const base = `/${locale}/portal/integraciones`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
      {/* Integraciones es solo de administración. */}
      {admin && (
        <>
          <Link href={base} className="my-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </Link>
          <span className="h-5 w-px bg-line" aria-hidden />
        </>
      )}
      <nav aria-label={t.back} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {TABS.filter((tab) => admin || tab.key === "calendar").map((tab) => {
          const active = pathname.startsWith(base + tab.path);
          return (
            <Link
              key={tab.key}
              href={base + tab.path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                active ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {t.nav[tab.key]}
            </Link>
          );
        })}
      </nav>
      {children && <div className="my-2 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
