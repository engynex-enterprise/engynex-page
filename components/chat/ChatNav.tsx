"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chatProCopy } from "@/content/chatPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "inbox", path: "" },
  { key: "visitors", path: "/visitantes" },
  { key: "team", path: "/equipo" },
  { key: "reports", path: "/reportes" },
  { key: "replies", path: "/respuestas" },
  { key: "settings", path: "/ajustes", admin: true },
] as const;

/** Pestañas del módulo de chat (mismo estilo que el CRM). */
export function ChatNav({ locale, isAdmin }: { locale: Locale; isAdmin: boolean }) {
  const t = chatProCopy[locale].nav;
  const pathname = usePathname();
  const base = `/${locale}/portal/chat`;
  return (
    <nav aria-label="Chat" className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
      {TABS.filter((tab) => !("admin" in tab) || isAdmin).map((tab) => {
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
