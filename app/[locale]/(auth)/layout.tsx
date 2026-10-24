import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { isLocale } from "@/i18n/config";
import { portalCopy } from "@/content/portal";

/** Marco de las páginas de acceso: logo, tarjeta centrada y nada más. */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = portalCopy[locale].auth;

  return (
    <div className="flex min-h-dvh flex-col bg-surface-soft">
      <header className="mx-auto flex w-full max-w-[90rem] items-center justify-between px-4 py-5 sm:px-8">
        <Link href={`/${locale}`} aria-label="Engynex">
          <Logo variant="adaptive" height={28} />
        </Link>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.backToSite}
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md rounded-[2rem] bg-surface p-7 shadow-[0_24px_70px_-30px_rgba(11,16,32,0.35)] ring-1 ring-line sm:p-10 dark:bg-card">
          {children}
        </div>
      </main>
    </div>
  );
}
