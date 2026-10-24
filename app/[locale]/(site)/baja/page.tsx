import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

const copy = {
  es: {
    ok: "Listo, ya no recibirás más correos de seguimiento",
    okText: "Si nos escribes, te seguimos atendiendo con gusto. Puedes volver a contactarnos cuando quieras.",
    bad: "El enlace no es válido",
    badText: "Puede que esté incompleto. Escríbenos a contacto@engynex.com y te quitamos de la lista.",
    home: "Ir al inicio",
  },
  en: {
    ok: "Done, you won't receive more follow-up emails",
    okText: "If you write to us, we'll gladly keep helping you. Reach out whenever you want.",
    bad: "The link isn't valid",
    badText: "It may be incomplete. Write to contacto@engynex.com and we'll remove you from the list.",
    home: "Go to home",
  },
};

/** Baja de los correos automáticos (enlace al pie de cada correo). */
export default async function UnsubscribePage({
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

  let ok = false;
  if (token && /^[0-9a-f-]{36}$/i.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("email_unsubscribe", { p_token: token });
    ok = data === true;
  }
  const Icon = ok ? CheckCircle2 : CircleAlert;

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Icon className={ok ? "h-14 w-14 text-accent" : "h-14 w-14 text-amber-600"} aria-hidden />
      <h1 className="mt-6 max-w-xl text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-heading">{ok ? c.ok : c.bad}</h1>
      <p className="mt-3 max-w-lg text-muted">{ok ? c.okText : c.badText}</p>
      <Link href={`/${locale}`} className={buttonClasses("outline", "md", "mt-8")}>
        {c.home}
      </Link>
    </Container>
  );
}
