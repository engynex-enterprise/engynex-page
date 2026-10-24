"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  tone = "dark",
  onNavigate,
}: {
  locale: Locale;
  tone?: "light" | "dark";
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || `/${locale}`;

  const hrefFor = (target: Locale) => {
    const segments = pathname.split("/");
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full p-1 text-xs font-bold",
        tone === "dark"
          ? "bg-white/5 ring-1 ring-white/15"
          : "bg-navy-900/5 ring-1 ring-navy-900/10 dark:bg-white/5 dark:ring-white/15",
      )}
      role="group"
      aria-label="Idioma / Language"
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            onClick={onNavigate}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 uppercase transition-colors",
              active
                ? "bg-brand-green text-navy-950"
                : tone === "dark"
                  ? "text-ink-300 hover:text-white"
                  : "text-slate-500 hover:text-navy-900 dark:text-ink-300 dark:hover:text-white",
            )}
          >
            {l}
          </Link>
        );
      })}
    </div>
  );
}
