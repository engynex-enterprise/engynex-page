import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecoverForm } from "@/components/auth/RecoverForm";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default async function RecoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = portalCopy[locale].auth;
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight text-heading">{t.recoverTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.recoverSubtitle}</p>
      <div className="mt-8">
        <RecoverForm locale={locale} />
      </div>
    </>
  );
}
