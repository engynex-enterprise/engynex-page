import Link from "next/link";
import { automationsProCopy } from "@/content/automationsPro";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type AutomationsTab = "rules" | "history" | "stats" | "pending";

const QUERY: Record<AutomationsTab, string> = { rules: "", history: "?tab=historial", stats: "?tab=estadisticas", pending: "?tab=espera" };

/** Pestañas del centro de automatizaciones (?tab=). */
export function AutomationsNav({
  locale,
  tab,
  pending,
  children,
}: {
  locale: Locale;
  tab: AutomationsTab;
  pending: number;
  children?: React.ReactNode;
}) {
  const t = automationsProCopy[locale];
  const base = `/${locale}/portal/automatizaciones`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
      <nav aria-label={t.tabs.rules} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {(Object.keys(QUERY) as AutomationsTab[]).map((key) => (
          <Link
            key={key}
            href={base + QUERY[key]}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
              tab === key ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.tabs[key]}
            {key === "pending" && pending > 0 && (
              <span className="rounded-full bg-[var(--meta-active)] px-1.5 text-xs tabular-nums text-heading">{pending}</span>
            )}
          </Link>
        ))}
      </nav>
      {children && <div className="my-2 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
