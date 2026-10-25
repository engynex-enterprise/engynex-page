import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { CalendarFeed } from "@/components/webhooks/CalendarFeed";
import { ToolsNav } from "@/components/webhooks/ToolsNav";
import { integrationToolsCopy } from "@/content/integrationTools";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { siteConfig } from "@/lib/site";

export default async function CalendarFeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["admin", "sales", "marketing", "support"]);
  const t = integrationToolsCopy[locale].calendar;
  // Crea el enlace la primera vez que se abre la página.
  const { data: token } = await supabase.rpc("calendar_feed_token", { p_rotate: false });

  return (
    <>
      <PageHeader title={t.title} />
      <div className="-mx-4 -mt-6 sm:-mx-6">
        <ToolsNav locale={locale} admin={profile.role === "admin"} />
        <CalendarFeed locale={locale} feedUrl={`${siteConfig.url}/api/calendar/${token ?? ""}.ics`} />
      </div>
    </>
  );
}
