import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, MessageSquareHeart } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { CsatForm } from "@/components/support/CsatForm";
import { supportCsatCopy } from "@/content/supportCsat";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Encuesta de satisfacción", robots: { index: false } };

type Info = { number: number; subject: string; name: string; rated: boolean; rating: number | null };

/** Encuesta pública de satisfacción: el enlace del correo que llega al resolver una solicitud. */
export default async function CsatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t: token } = await searchParams;
  const c = supportCsatCopy[locale];

  let info: Info | null = null;
  if (token && /^[0-9a-f-]{36}$/i.test(token)) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("ticket_csat_info", { p_token: token });
    if (!error && data) info = data as unknown as Info;
  }

  if (!info || !token) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <CircleAlert className="h-14 w-14 text-amber-600" aria-hidden />
        <h1 className="mt-6 max-w-xl text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-heading">{c.bad}</h1>
        <p className="mt-3 max-w-lg text-muted">{c.badText}</p>
        <Link href={`/${locale}/contacto`} className={buttonClasses("outline", "md", "mt-8")}>
          {c.contact}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-16 sm:py-24">
      <MessageSquareHeart className="h-12 w-12 text-accent" aria-hidden />
      <h1 className="mt-5 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight text-heading">{info.rated ? c.already : c.title}</h1>
      <p className="mt-3 text-lg text-muted">
        {info.rated
          ? c.alreadyText.replace("{n}", String(info.rating))
          : c.hello.replace("{name}", info.name).replace("{number}", String(info.number)).replace("{subject}", info.subject)}
      </p>
      <div className="mt-10">
        <CsatForm locale={locale} token={token} initial={info.rating} />
      </div>
    </Container>
  );
}
