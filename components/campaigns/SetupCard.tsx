import { CheckCircle2, PlugZap } from "lucide-react";
import Link from "next/link";
import { campaignsCopy } from "@/content/campaigns";
import { integrationsCopy } from "@/content/integrations";
import type { Locale } from "@/i18n/config";

/** Estado de la conexión con WhatsApp Business y qué falta. */
export function SetupCard({ locale, missing }: { locale: Locale; missing: string[] }) {
  const t = campaignsCopy[locale].setup;
  if (missing.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-surface p-5 shadow-meta dark:bg-card">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div>
          <p className="text-sm font-bold text-heading">{t.ready}</p>
          <p className="mt-0.5 text-sm text-muted">{t.readyHint}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-surface p-6 shadow-meta dark:bg-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          <PlugZap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base text-heading">{t.title}</h2>
          <p className="mt-1 text-sm text-muted">{t.body}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m} className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-heading dark:bg-white/[0.06]">
                {integrationsCopy[locale].fields[m]?.label ?? m}
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/portal/integraciones`} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
            {integrationsCopy[locale].title} →
          </Link>
        </div>
      </div>
    </div>
  );
}
