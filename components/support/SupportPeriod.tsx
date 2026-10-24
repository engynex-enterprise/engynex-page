"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { supportReportsCopy } from "@/content/supportReports";
import type { Locale } from "@/i18n/config";

/** Selector de periodo de los reportes de soporte (?d=7|30|90). */
export function SupportPeriod({ locale, days }: { locale: Locale; days: number }) {
  const t = supportReportsCopy[locale];
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="w-48">
      <Select
        size="sm"
        label={t.period}
        value={String(days)}
        onChange={(v) => router.push(v === "30" ? pathname : `${pathname}?d=${v}`)}
        options={["7", "30", "90"].map((v) => ({ value: v, label: t.periods[v] }))}
      />
    </div>
  );
}
