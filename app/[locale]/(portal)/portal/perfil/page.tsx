import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { profile } = await requireProfile(locale);
  const t = portalCopy[locale].portal;

  return (
    <>
      <PageHeader
        title={t.profile.title}
        subtitle={`${t.kindLabel[profile.kind]} · ${t.roleLabel[profile.role]}`}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg bg-surface p-6 shadow-meta sm:p-8 dark:bg-card">
          <ProfileForm locale={locale} profile={profile} />
        </section>
        <section className="rounded-lg bg-surface p-6 shadow-meta sm:p-8 dark:bg-card">
          <h2 className="mb-6 text-lg text-heading">{t.profile.passwordTitle}</h2>
          <NewPasswordForm
            locale={locale}
            inline
            labels={{ submit: t.profile.passwordSave, done: t.profile.passwordSaved }}
          />
        </section>
      </div>
    </>
  );
}
