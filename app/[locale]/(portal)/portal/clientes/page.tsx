import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { LiveRefresh } from "@/components/portal/LiveRefresh";
import { AccountsList } from "@/components/accounts/AccountsList";
import { accountsProCopy } from "@/content/accountsPro";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import type { AccountRow } from "@/lib/supabase/types";

export default async function AccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = accountsProCopy[locale];
  const [{ data }, employees] = await Promise.all([supabase.rpc("accounts_list"), listEmployees(supabase)]);
  const rows = (data ?? []) as unknown as AccountRow[];
  // "Hoy" en Bogotá, para contar los días a la renovación.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  return (
    <>
      <LiveRefresh tables={["account_details", "tickets"]} channel="accounts-list" />
      <PageHeader title={t.title} count={rows.length} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <AccountsList locale={locale} rows={rows} employees={employees} today={today} admin={profile.role === "admin"} />
      </div>
    </>
  );
}
