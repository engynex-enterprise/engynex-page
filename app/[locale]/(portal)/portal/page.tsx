import { notFound } from "next/navigation";
import { BusinessHome } from "@/components/portal/BusinessHome";
import { ClientHome } from "@/components/clientPortal/ClientHome";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function PortalHome({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { locale } = await params;
  const { r } = await searchParams;
  const days = r === "7" || r === "90" ? Number(r) : 30;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale);
  const t = portalCopy[locale].portal;
  const name = (profile.full_name ?? profile.email).split(/\s+/)[0];
  const hello = t.hello.replace("{name}", name);

  if (profile.kind === "client" || profile.kind === "provider") {
    return <ClientHome locale={locale} supabase={supabase} profile={profile} hello={hello} />;
  }

  // ---------------------- Empleados ----------------------
  return <BusinessHome locale={locale} supabase={supabase} profile={profile} hello={hello} days={days} />;
}
