"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supportProCopy } from "@/content/supportPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "inbox", path: "" },
  { key: "reports", path: "/reportes" },
  { key: "macros", path: "/respuestas" },
  { key: "settings", path: "/ajustes" },
] as const;

/** Pestañas de la mesa de ayuda (equipo). "Ajustes" solo para administración. */
export function SupportNav({ locale, admin, children }: { locale: Locale; admin: boolean; children?: React.ReactNode }) {
  const t = supportProCopy[locale];
  const pathname = usePathname();
  const base = `/${locale}/portal/soporte`;
  const current = TABS.find((x) => x.path && pathname.startsWith(base + x.path))?.key ?? "inbox";

  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
      <nav aria-label={t.title} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {TABS.filter((tab) => admin || tab.key !== "settings").map((tab) => (
          <Link
            key={tab.key}
            href={base + tab.path}
            aria-current={tab.key === current ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
              tab.key === current ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.nav[tab.key]}
          </Link>
        ))}
      </nav>
      {children && <div className="my-2 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
