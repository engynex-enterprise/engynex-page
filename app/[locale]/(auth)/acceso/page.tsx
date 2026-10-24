import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { portalCopy } from "@/content/portal";
import { isLocale, type Locale } from "@/i18n/config";
import type { AccountKind } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Acceso",
  robots: { index: false, follow: false },
};

const KINDS: AccountKind[] = ["client", "provider", "employee"];

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ as?: string; next?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { as, next, error } = await searchParams;
  const kind = KINDS.includes(as as AccountKind) ? (as as AccountKind) : null;
  const t = portalCopy[locale as Locale].auth;

  return (
    <>
      <h1 className="text-[1.75rem] leading-tight text-heading">
        {t.loginTitle[kind ?? "any"]}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.loginSubtitle}</p>
      <div className="mt-8">
        <LoginForm
          locale={locale}
          as={kind}
          next={next ?? null}
          initialError={error ?? null}
        />
      </div>
    </>
  );
}
