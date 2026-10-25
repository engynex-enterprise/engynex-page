import Link from "next/link";
import { TestBadge } from "@/components/domains/OrderActions";
import { ExpiryText, StatusChip } from "@/components/clientDomains/shared";
import { clientDomainsCopy } from "@/content/clientDomains";
import type { Locale } from "@/i18n/config";
import type { ClientDomain } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** Vista del equipo: todos los dominios de clientes con su dueño y vencimiento. */
export function StaffClientDomains({
  locale,
  domains,
  owners,
  now,
}: {
  locale: Locale;
  domains: ClientDomain[];
  owners: Record<string, { name: string; email: string }>;
  now: number;
}) {
  const t = clientDomainsCopy[locale];
  if (!domains.length) return <p className="py-12 text-center text-sm text-muted">{t.staff.empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
            {(["domain", "owner", "status", "expires", "autoRenew", "actions"] as const).map((c) => (
              <th key={c} scope="col" className="px-4 py-2.5 font-medium">{t.staff.cols[c]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d.id} className="border-b border-line last:border-0 hover:bg-[var(--meta-hover)]">
              <td className="px-4 py-3 font-semibold text-heading">{d.domain}</td>
              <td className="px-4 py-3">
                <Link href={`/${locale}/portal/clientes/${d.owner_id}`} className="block text-heading hover:underline">{owners[d.owner_id]?.name ?? "—"}</Link>
                <span className="block text-xs text-muted">{owners[d.owner_id]?.email}</span>
              </td>
              <td className="px-4 py-3"><StatusChip locale={locale} status={d.status} />{d.is_test && <TestBadge locale={locale} />}</td>
              <td className="px-4 py-3"><ExpiryText locale={locale} iso={d.expires_at} now={now} /></td>
              <td className={cn("px-4 py-3", d.auto_renew ? "text-emerald-700 dark:text-emerald-400" : "text-muted")}>{d.auto_renew ? t.staff.on : t.staff.off}</td>
              <td className="px-4 py-3">
                <Link href={`/${locale}/portal/dominios/${d.id}`} className="font-medium text-heading hover:underline">{t.staff.open}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
