import Link from "next/link";
import { notFound } from "next/navigation";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { NotificationPrefs } from "@/components/clientPortal/NotificationPrefs";
import { clientPortalCopy } from "@/content/clientPortal";
import { portalCopy } from "@/content/portal";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

const TABS = ["datos", "seguridad", "notificaciones"] as const;
type Tab = (typeof TABS)[number];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { profile } = await requireProfile(locale);
  const { tab: raw } = await searchParams;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "datos";
  const t = portalCopy[locale].portal;
  const c = clientPortalCopy[locale].profile;
  const base = `/${locale}/portal/perfil`;
  const panel = "max-w-2xl rounded-xl border border-line bg-surface p-6 sm:p-8 dark:bg-card";

  return (
    <>
      <PageHeader
        title={t.profile.title}
        subtitle={`${t.kindLabel[profile.kind]} · ${t.roleLabel[profile.role]}`}
      />
      <div className="-mx-4 sm:-mx-6">
        <nav aria-label={t.profile.title} className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
          {TABS.map((k) => (
            <Link
              key={k}
              href={k === "datos" ? base : `${base}?tab=${k}`}
              aria-current={tab === k ? "page" : undefined}
              className={cn(
                "-mb-px flex shrink-0 items-center border-b-2 px-3 py-3.5 text-[0.94rem] transition-colors",
                tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
              )}
            >
              {c.tabs[k]}
            </Link>
          ))}
        </nav>
        <div className="grid gap-5 px-4 py-6 sm:px-6">
          {tab === "datos" && (
            <section className={panel}>
              <ProfileForm locale={locale} profile={profile} />
            </section>
          )}
          {tab === "seguridad" && (
            <>
              <section className={panel}>
                <h2 className="mb-6 text-lg text-heading">{t.profile.passwordTitle}</h2>
                <NewPasswordForm
                  locale={locale}
                  inline
                  labels={{ submit: t.profile.passwordSave, done: t.profile.passwordSaved }}
                />
              </section>
              <section className={cn(panel, "flex flex-wrap items-center justify-between gap-4")}>
                <div>
                  <h2 className="text-lg text-heading">{c.signOutTitle}</h2>
                  <p className="mt-1 text-sm text-muted">{c.signOutDesc}</p>
                </div>
                <form action={`/${locale}/auth/signout`} method="post">
                  <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-red-700 ring-1 ring-line hover:bg-[var(--meta-hover)] dark:text-red-400">
                    <LogOut className="h-4 w-4" aria-hidden />
                    {c.signOut}
                  </button>
                </form>
              </section>
            </>
          )}
          {tab === "notificaciones" && (
            <section className={panel}>
              <NotificationPrefs locale={locale} profileId={profile.id} initial={profile.notify_prefs} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
