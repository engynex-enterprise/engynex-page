import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default async function NewPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  // Solo con sesión (contraseña temporal o enlace de recuperación).
  const { user } = await getSession();
  if (!user) redirect(`/${locale}/acceso?error=expired`);
  const t = portalCopy[locale].auth;
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight text-heading">{t.newPasswordTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.newPasswordSubtitle}</p>
      <div className="mt-8">
        <NewPasswordForm locale={locale} next={next} />
      </div>
    </>
  );
}
