import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { ticketCategories } from "@/lib/ticketCategories";

export default async function NewTicketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireProfile(locale, ["client", "provider", "admin", "support", "sales"]);
  const t = ticketsCopy[locale];
  return (
    <>
      <Link href={`/${locale}/portal/soporte`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.thread.back}
      </Link>
      <PageHeader title={t.form.title} subtitle={t.form.subtitle} />
      <NewTicketForm locale={locale} categories={ticketCategories(locale)} />
    </>
  );
}
