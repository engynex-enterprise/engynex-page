import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { UsersManager } from "@/components/portal/UsersManager";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin"]);
  const t = portalCopy[locale].portal.users;

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, kind, role, active, must_change_password, last_seen_at, company")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <UsersManager locale={locale} users={users ?? []} currentUserId={profile.id} />
    </>
  );
}
