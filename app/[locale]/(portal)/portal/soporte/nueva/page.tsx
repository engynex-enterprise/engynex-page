import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";
import { ticketsCopy } from "@/content/tickets";
import { supportNewCopy } from "@/content/supportNew";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { ticketCategories } from "@/lib/ticketCategories";
import type { SupportConfig } from "@/lib/supabase/types";

export default async function NewTicketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale, ["client", "provider", "admin", "support", "sales"]);
  const t = ticketsCopy[locale];
  const n = supportNewCopy[locale];
  const staff = ["admin", "support", "sales"].includes(profile.role);

  // Los plazos los lee el equipo; al cliente se le muestran los de siempre.
  const [{ data: settings }, employees, { data: accounts }] = staff
    ? await Promise.all([
        supabase.from("support_settings").select("config").maybeSingle(),
        listEmployees(supabase),
        supabase.from("profiles").select("id, full_name, email, company").in("kind", ["client", "provider"]).eq("active", true).order("full_name"),
      ])
    : [{ data: null }, [], { data: [] }];
  const sla = (settings?.config as SupportConfig | undefined)?.sla;

  return (
    <>
      <Link href={`/${locale}/portal/soporte`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.thread.back}
      </Link>
      <PageHeader title={staff ? n.staffTitle : t.form.title} subtitle={staff ? n.staffSubtitle : t.form.subtitle} />
      <NewTicketForm
        locale={locale}
        categories={ticketCategories(locale)}
        sla={sla}
        staff={staff}
        meId={profile.id}
        employees={employees}
        accounts={(accounts ?? []).map((a) => ({ id: a.id, name: a.full_name ?? a.email, email: a.email, company: a.company }))}
      />
    </>
  );
}
