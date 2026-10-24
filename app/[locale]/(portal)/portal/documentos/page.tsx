import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { Documents } from "@/components/documents/Documents";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import type { PortalDocument } from "@/lib/supabase/types";

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider"]);
  const t = ticketsCopy[locale].docs;
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={t.title} subtitle={profile.kind === "provider" ? t.providerSubtitle : t.subtitle} />
      <Documents
        locale={locale}
        ownerId={profile.id}
        docs={(data ?? []) as PortalDocument[]}
        // Los proveedores envían facturas; los clientes, archivos de apoyo.
        kinds={profile.kind === "provider" ? ["invoice", "other"] : ["other"]}
        meId={profile.id}
        staff={false}
        names={{}}
      />
    </>
  );
}
