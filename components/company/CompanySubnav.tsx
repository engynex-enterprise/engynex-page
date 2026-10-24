"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aboutGroups } from "@/content/navigation";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Barra de secciones de la empresa: Quiénes somos, Misión y visión, Valores…
 * Se queda pegada bajo la barra principal (64 px) y se desplaza en horizontal
 * en pantallas estrechas. Solo enlaza las páginas de `nosotros`.
 */
export function CompanySubnav({
  locale,
  label,
}: {
  locale: Locale;
  /** Nombre accesible de la navegación ("La empresa"). */
  label: string;
}) {
  const pathname = usePathname();
  const items = aboutGroups
    .flatMap((group) => group.items)
    .filter((item) => item.path.startsWith("nosotros"));

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-30 border-b border-line bg-surface/90 backdrop-blur-md"
    >
      <ul className="no-scrollbar mx-auto flex max-w-[90rem] gap-1 overflow-x-auto px-4 py-2 sm:justify-center sm:px-8">
        {items.map((item) => {
          const href = localizedHref(locale, item.path);
          const active = pathname === href;
          return (
            <li key={item.path} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm transition-colors",
                  active
                    ? "bg-deep-700 font-semibold text-white dark:bg-white dark:text-deep-700"
                    : "text-heading hover:bg-surface-soft",
                )}
              >
                {item[locale].title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
