import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, CircleAlert } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { Booking } from "@/components/lead/Booking";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agendar reunión", robots: { index: false } };

const copy = {
  es: {
    title: "Agenda tu reunión con Engynex",
    hello: "Hola {name}, elige el día y la hora que mejor te queden.",
    current: "Ya tienes una reunión el {when}. Si eliges otro horario, la cambiamos.",
    bad: "El enlace ya no es válido",
    badText: "Puede que haya vencido (dura 7 días). Escríbenos y te enviamos uno nuevo.",
    contact: "Contactarnos",
  },
  en: {
    title: "Book your meeting with Engynex",
    hello: "Hi {name}, pick the day and time that work best for you.",
    current: "You already have a meeting on {when}. Picking another time will move it.",
    bad: "The link is no longer valid",
    badText: "It may have expired (it lasts 7 days). Write to us and we'll send a new one.",
    contact: "Contact us",
  },
};

/** Página pública de agenda: el enlace que el equipo envía desde el portal. */
export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t: token } = await searchParams;
  const c = copy[locale];

  type BookingLead = { name: string; appointment: { starts_at: string } | null };
  let lead: BookingLead | null = null;
  if (token && /^[0-9a-f-]{36}$/i.test(token)) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("booking_lead", { p_token: token });
    if (!error && data) lead = data as unknown as BookingLead;
  }

  if (!lead || !token) {
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

  const when = lead.appointment
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(
        new Date(lead.appointment.starts_at),
      )
    : null;

  return (
    <Container className="max-w-3xl py-16 sm:py-24">
      <CalendarCheck className="h-12 w-12 text-accent" aria-hidden />
      <h1 className="mt-5 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight text-heading">{c.title}</h1>
      <p className="mt-3 text-lg text-muted">{c.hello.replace("{name}", lead.name)}</p>
      {when && <p className="mt-4 rounded-xl bg-[var(--meta-active,#eef7e3)] px-4 py-3 text-sm text-heading">{c.current.replace("{when}", when)}</p>}
      <div className="mt-10">
        <Booking locale={locale} token={token} name={lead.name} />
      </div>
    </Container>
  );
}
